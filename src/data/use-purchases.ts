import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';

export interface PurchaseItem {
  id?: number;
  purchase_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier_id: string | null;
  supplier_name: string;
  products: PurchaseItem[];
  total: number;
  status: 'completed' | 'pending' | 'returned';
}

export const usePurchases = () => {
  const [purchasesState, setPurchasesState] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  // Prevent multiple simultaneous fetches
  const fetchingRef = useRef(false);

  const fetchPurchases = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    if (!navigator.onLine) {
      const localCache = localStorage.getItem('erp_purchases');
      if (localCache) setPurchasesState(JSON.parse(localCache));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*, purchase_items(*)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch purchases:', error);
      const cached = localStorage.getItem('erp_purchases');
      if (cached) setPurchasesState(JSON.parse(cached));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const formatted = (data ?? []).map((p: any) => ({
      id: p.id,
      date: p.date,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      total: p.total,
      status: p.status,
      products: (p.purchase_items ?? []).map((item: any) => ({
        id: item.id,
        purchase_id: item.purchase_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
    }));

    setPurchasesState(formatted);
    localStorage.setItem('erp_purchases', JSON.stringify(formatted));
    setLoading(false);
    fetchingRef.current = false;
  };

  useEffect(() => {
    fetchPurchases();

    // Refresh when network is restored or SW completes sync
    const handleOnline = () => setTimeout(fetchPurchases, 1500);
    const handleSwSync = () => setTimeout(fetchPurchases, 500);

    window.addEventListener('online', handleOnline);
    window.addEventListener('sw-sync-complete', handleSwSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('sw-sync-complete', handleSwSync);
    };
  }, []);

  const addPurchase = async (purchase: Omit<PurchaseOrder, 'id'>) => {
    const purchaseId = `A-${String(Date.now())}`;
    const newPurchase = { ...purchase, id: purchaseId, status: purchase.status || 'completed' } as PurchaseOrder;

    // Optimistic UI update
    const newState = [newPurchase, ...purchasesState];
    setPurchasesState(newState);
    localStorage.setItem('erp_purchases', JSON.stringify(newState));

    if (navigator.onLine) {
      // ── Write directly to Supabase when online ──
      try {
        const { error: purchaseError } = await supabase.from('purchases').insert({
          id: purchaseId,
          date: newPurchase.date,
          supplier_id: newPurchase.supplier_id,
          supplier_name: newPurchase.supplier_name,
          total: newPurchase.total,
          status: newPurchase.status,
        });

        if (purchaseError) throw purchaseError;

        // Insert purchase items
        if (newPurchase.products.length > 0) {
          const { error: itemsError } = await supabase.from('purchase_items').insert(
            newPurchase.products.map(item => ({
              purchase_id: purchaseId,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
            }))
          );
          if (itemsError) console.error('Error inserting purchase items:', itemsError);
        }

        // Update stock quantities in Supabase
        for (const item of newPurchase.products) {
          try {
            const { data: productData } = await supabase
              .from('products').select('quantity').eq('id', item.product_id).single();

            const currentQty = productData?.quantity || 0;
            const quantityChange = newPurchase.status === 'returned' ? -item.quantity : item.quantity;
            const newQty = Math.max(0, currentQty + quantityChange);

            await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
          } catch (stockErr) {
            console.error(`Stock update failed for ${item.product_id}:`, stockErr);
          }
        }

        // Also mark local record as synced so it's not re-synced
        await saveLocally('purchases', purchaseId, {
          id: purchaseId, date: newPurchase.date, supplier_id: newPurchase.supplier_id,
          supplier_name: newPurchase.supplier_name, total: newPurchase.total, status: newPurchase.status
        }, 'create');

      } catch (err) {
        console.error('Direct Supabase write failed, falling back to local queue:', err);
        // Fall through to local-first save
        await _saveToLocalQueue(purchaseId, newPurchase);
      }
    } else {
      // ── Offline: save to local queue only ──
      await _saveToLocalQueue(purchaseId, newPurchase);
    }

    return newPurchase;
  };

  // Internal helper
  const _saveToLocalQueue = async (purchaseId: string, newPurchase: PurchaseOrder) => {
    await saveLocally('purchases', purchaseId, {
      id: purchaseId, date: newPurchase.date, supplier_id: newPurchase.supplier_id,
      supplier_name: newPurchase.supplier_name, total: newPurchase.total, status: newPurchase.status
    }, 'create');

    for (const item of newPurchase.products) {
      await saveLocally('purchase_items', `item-${Date.now()}-${Math.random()}`, {
        purchase_id: purchaseId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }, 'create');
    }

    // Update stock in local cache
    const localProducts = await getAllTableRecords('products');
    for (const item of newPurchase.products) {
      const prod = localProducts.find((p: any) => p.id === item.product_id);
      const currentQty = prod?.quantity || 0;
      const quantityChange = newPurchase.status === 'returned' ? -item.quantity : item.quantity;
      const newQty = Math.max(0, currentQty + quantityChange);
      await saveLocally('products', item.product_id, { quantity: newQty }, 'update');
    }
  };

  const returnPurchase = async (purchaseId: string) => {
    const purchase = purchasesState.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'returned') return;

    // Optimistic UI update
    const newState = purchasesState.map(p =>
      p.id === purchaseId ? { ...p, status: 'returned' as const } : p
    );
    setPurchasesState(newState);
    localStorage.setItem('erp_purchases', JSON.stringify(newState));

    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('purchases').update({ status: 'returned' }).eq('id', purchaseId);
        if (error) throw error;

        // Deduct stock
        for (const item of purchase.products) {
          const { data: productData } = await supabase
            .from('products').select('quantity').eq('id', item.product_id).single();
          const currentQty = productData?.quantity || 0;
          const newQty = Math.max(0, currentQty - item.quantity);
          await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
        }
      } catch (err) {
        console.error('Direct return failed, queuing locally:', err);
        await saveLocally('purchases', purchaseId, { status: 'returned' }, 'update');
      }
    } else {
      await saveLocally('purchases', purchaseId, { status: 'returned' }, 'update');
      const localProducts = await getAllTableRecords('products');
      for (const item of purchase.products) {
        const prod = localProducts.find((p: any) => p.id === item.product_id);
        const currentQty = prod?.quantity || 0;
        const newQty = Math.max(0, currentQty - item.quantity);
        await saveLocally('products', item.product_id, { quantity: newQty }, 'update');
      }
    }
  };

  return { purchasesState, loading, fetchPurchases, addPurchase, returnPurchase };
};
