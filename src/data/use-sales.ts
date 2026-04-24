import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { getAllTableRecords, saveLocally, syncAndPruneLocalDB } from '../local-first/storage.js';
import { persistLocalProductQuantity } from '@/local-first/product-cache';
import { mergeUnsyncedRecords } from '@/local-first/merge-offline-data';

export interface SaleLineItem {
  id?: number;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  client_id: string | null;
  client_name: string;
  products: SaleLineItem[];
  total: number;
  paid_amount?: number;
  status: 'completed' | 'pending' | 'returned';
}

export const useSales = () => {
  const [salesState, setSalesState] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchSales = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('sales');
      if (cached && cached.length > 0) {
        setSalesState(cached as Sale[]);
      } else {
        const localCache = localStorage.getItem('erp_sales');
        if (localCache) setSalesState(JSON.parse(localCache));
      }
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch sales:', error);
      const cached = localStorage.getItem('erp_sales');
      if (cached) setSalesState(JSON.parse(cached));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const formatted = (data ?? []).map((s: any) => ({
      id: s.id,
      date: s.date,
      client_id: s.client_id,
      client_name: s.client_name,
      total: s.total,
      paid_amount: s.paid_amount,
      status: s.status,
      products: (s.sale_items ?? []).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
    }));

    await syncAndPruneLocalDB('sales', formatted.map((s: any) => s.id));

    const merged = await mergeUnsyncedRecords<Sale>('sales', formatted);
    setSalesState(merged);
    localStorage.setItem('erp_sales', JSON.stringify(merged));

    // Offline mirror: persist all sales into local IndexedDB
    for (const sale of merged) {
      await saveLocally('sales', sale.id, sale, 'update');
    }

    setLoading(false);
    fetchingRef.current = false;
  };

  useEffect(() => {
    fetchSales();

    const handleOnline = () => setTimeout(fetchSales, 1500);
    const handleSwSync = () => setTimeout(fetchSales, 500);

    window.addEventListener('online', handleOnline);
    window.addEventListener('sw-sync-complete', handleSwSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('sw-sync-complete', handleSwSync);
    };
  }, []);

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const saleId = `V-${String(Date.now())}`;
    const newSale = { ...sale, id: saleId, status: sale.status || 'completed' } as Sale;

    const newState = [newSale, ...salesState];
    setSalesState(newState);
    localStorage.setItem('erp_sales', JSON.stringify(newState));

    if (navigator.onLine) {
      try {
        const { error: saleError } = await supabase.from('sales').insert({
          id: saleId,
          date: newSale.date,
          client_id: newSale.client_id,
          client_name: newSale.client_name,
          total: newSale.total,
          status: newSale.status,
        });

        if (saleError) throw saleError;

        if (newSale.products.length > 0) {
          const { error: itemsError } = await supabase.from('sale_items').insert(
            newSale.products.map(item => ({
              id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              sale_id: saleId,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
            }))
          );
          if (itemsError) console.error('Error inserting sale items:', itemsError);
        }

        for (const item of newSale.products) {
          try {
            const { data: productData } = await supabase
              .from('products').select('quantity').eq('id', item.product_id).single();

            const currentQty = productData?.quantity || 0;
            const quantityChange = newSale.status === 'returned' ? item.quantity : -item.quantity;
            const newQty = currentQty + quantityChange;

            await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
          } catch (stockErr) {
            console.error(`Stock update failed for ${item.product_id}:`, stockErr);
          }
        }

        await saveLocally('sales', saleId, {
          id: saleId,
          date: newSale.date,
          client_id: newSale.client_id,
          client_name: newSale.client_name,
          total: newSale.total,
          paid_amount: newSale.paid_amount,
          status: newSale.status,
          products: newSale.products
        }, 'create');
      } catch (err) {
        console.error('Direct Supabase write failed, falling back to local queue:', err);
        await _saveToLocalQueue(saleId, newSale);
      }
    } else {
      await _saveToLocalQueue(saleId, newSale);
    }

    return newSale;
  };

  const _saveToLocalQueue = async (saleId: string, newSale: Sale) => {
    await saveLocally('sales', saleId, {
      id: saleId,
      date: newSale.date,
      client_id: newSale.client_id,
      client_name: newSale.client_name,
      total: newSale.total,
      paid_amount: newSale.paid_amount,
      status: newSale.status,
      products: newSale.products,
    }, 'create');

    for (const item of newSale.products) {
      await saveLocally('sale_items', `item-${Date.now()}-${Math.random()}`, {
        sale_id: saleId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }, 'create');
    }

    const localProducts = await getAllTableRecords('products');
    for (const item of newSale.products) {
      const prod = localProducts.find((p: any) => p.id === item.product_id);
      const currentQty = prod?.quantity || 0;
      const quantityChange = newSale.status === 'returned' ? item.quantity : -item.quantity;
      const newQty = currentQty + quantityChange;
      await persistLocalProductQuantity(
        item.product_id,
        newQty,
        { name: item.product_name, product_name: item.product_name, price: item.unit_price },
        localProducts
      );
    }
  };

  const returnSale = async (saleId: string) => {
    const sale = salesState.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned') return;

    const newState = salesState.map(s =>
      s.id === saleId ? { ...s, status: 'returned' as const } : s
    );
    setSalesState(newState);
    localStorage.setItem('erp_sales', JSON.stringify(newState));

    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('sales').update({ status: 'returned' }).eq('id', saleId);
        if (error) throw error;

        for (const item of sale.products) {
          const { data: productData } = await supabase
            .from('products').select('quantity').eq('id', item.product_id).single();
          const currentQty = productData?.quantity || 0;
          const newQty = currentQty + item.quantity;
          await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
        }
      } catch (err) {
        console.error('Direct return failed, queuing locally:', err);
        await saveLocally('sales', saleId, { status: 'returned' }, 'update');
      }
    } else {
      await saveLocally('sales', saleId, { status: 'returned' }, 'update');
      const localProducts = await getAllTableRecords('products');
      for (const item of sale.products) {
        const prod = localProducts.find((p: any) => p.id === item.product_id);
        const currentQty = prod?.quantity || 0;
        const newQty = currentQty + item.quantity;
        await persistLocalProductQuantity(
          item.product_id,
          newQty,
          { name: item.product_name, product_name: item.product_name, price: item.unit_price },
          localProducts
        );
      }
    }
  };

  const deleteSale = async (id: string) => {
    setSalesState(prev => prev.filter(s => s.id !== id));
    localStorage.setItem('erp_sales', JSON.stringify(salesState.filter(s => s.id !== id)));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Direct deleteSale failed, queuing locally:', err);
        await saveLocally('sales', id, null, 'delete');
      }
    } else {
      await saveLocally('sales', id, null, 'delete');
    }
  };

  const updateSale = async (id: string, updatedSale: Partial<Sale>) => {
    const oldSale = salesState.find(s => s.id === id);
    if (!oldSale) return;

    const newState = salesState.map(s => s.id === id ? { ...s, ...updatedSale } as Sale : s);
    setSalesState(newState);
    localStorage.setItem('erp_sales', JSON.stringify(newState));

    if (navigator.onLine) {
      try {
        // Update main sale record
        if (updatedSale.client_name || updatedSale.date || updatedSale.total !== undefined || updatedSale.paid_amount !== undefined) {
          await supabase.from('sales').update({
            date: updatedSale.date,
            client_name: updatedSale.client_name,
            total: updatedSale.total,
          }).eq('id', id);
        }

        // If products are updated, revert old stock and apply new stock
        if (updatedSale.products) {
          // Revert old stock
          for (const item of oldSale.products) {
            const { data: productData } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
            if (productData) {
              await supabase.from('products').update({ quantity: productData.quantity + item.quantity }).eq('id', item.product_id);
            }
          }
          // Delete old items
          await supabase.from('sale_items').delete().eq('sale_id', id);

          // Insert new items
          await supabase.from('sale_items').insert(
            updatedSale.products.map(item => ({
              id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              sale_id: id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
            }))
          );

          // Apply new stock
          for (const item of updatedSale.products) {
            const { data: productData } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
            if (productData) {
              const newQty = productData.quantity - item.quantity;
              await supabase.from('products').update({ quantity: newQty }).eq('id', item.product_id);
            }
          }
        }
      } catch (err) {
        console.error('Update failed, queuing locally:', err);
        await saveLocally('sales', id, updatedSale, 'update');
      }
    } else {
      await saveLocally('sales', id, updatedSale, 'update');
    }
  };

  return { salesState, loading, fetchSales, addSale, returnSale, deleteSale, updateSale };
};
