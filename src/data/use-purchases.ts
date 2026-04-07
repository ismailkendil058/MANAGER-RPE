import { useEffect, useState } from 'react';
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

  const fetchPurchases = async () => {
    setLoading(true);

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('purchases');
      const localCache = localStorage.getItem('erp_purchases');
      if (localCache) setPurchasesState(JSON.parse(localCache));
      setLoading(false);
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
  };

  useEffect(() => {
    fetchPurchases();

    // Add network listener to refetch when coming online
    const handleOnline = () => fetchPurchases();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const addPurchase = async (purchase: Omit<PurchaseOrder, 'id'>) => {
    const purchaseId = `A-${String(Date.now())}`;
    const newPurchase = { ...purchase, id: purchaseId, status: purchase.status || 'completed' } as PurchaseOrder;

    // Optimistic Update
    const newState = [newPurchase, ...purchasesState];
    setPurchasesState(newState);
    localStorage.setItem('erp_purchases', JSON.stringify(newState));

    await saveLocally('purchases', purchaseId, { id: purchaseId, date: newPurchase.date, supplier_id: newPurchase.supplier_id, supplier_name: newPurchase.supplier_name, total: newPurchase.total, status: newPurchase.status }, 'create');

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

    // Update stock quantities for each product natively
    const localProducts = await getAllTableRecords('products');
    for (const item of newPurchase.products) {
      try {
        let currentQuantity = 0;

        if (navigator.onLine) {
          const { data } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
          currentQuantity = data?.quantity || 0;
        } else {
          const prod = localProducts.find((p: any) => p.id === item.product_id);
          currentQuantity = prod?.quantity || 0;
        }

        const quantityChange = newPurchase.status === 'returned' ? -item.quantity : item.quantity;
        const newQuantity = Math.max(0, currentQuantity + quantityChange);

        await saveLocally('products', item.product_id, { quantity: newQuantity }, 'update');
      } catch (stockError) {
        console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
      }
    }

    return newPurchase;
  };

  const returnPurchase = async (purchaseId: string) => {
    const purchase = purchasesState.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'returned') return;

    // Optimistic Update
    const newState = purchasesState.map(p => p.id === purchaseId ? { ...p, status: 'returned' as const } : p);
    setPurchasesState(newState);
    localStorage.setItem('erp_purchases', JSON.stringify(newState));

    // 1. Update status to returned locally
    await saveLocally('purchases', purchaseId, { status: 'returned' }, 'update');

    // 2. Remove quantity back from stock using local fallback
    const localProducts = await getAllTableRecords('products');
    for (const item of purchase.products) {
      try {
        let currentQuantity = 0;

        if (navigator.onLine) {
          const { data } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
          currentQuantity = data?.quantity || 0;
        } else {
          const prod = localProducts.find((p: any) => p.id === item.product_id);
          currentQuantity = prod?.quantity || 0;
        }

        const newQuantity = Math.max(0, currentQuantity - item.quantity);

        await saveLocally('products', item.product_id, { quantity: newQuantity }, 'update');
      } catch (stockError) {
        console.error(`Failed to deduct stock for product ${item.product_id}:`, stockError);
      }
    }
  };

  return { purchasesState, loading, fetchPurchases, addPurchase, returnPurchase };
};
