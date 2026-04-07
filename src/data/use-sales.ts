import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';

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
  status: 'completed' | 'pending' | 'returned';
}

export const useSales = () => {
  const [salesState, setSalesState] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('sales');
      // Reconstruct nested structure from cached flat data if needed, or if saved nested, just use it 
      // Note: we can just use the local UI cache here for full structure
      const localCache = localStorage.getItem('erp_sales');
      if (localCache) setSalesState(JSON.parse(localCache));
      setLoading(false);
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
      return;
    }

    const formatted = (data ?? []).map((s: any) => ({
      id: s.id,
      date: s.date,
      client_id: s.client_id,
      client_name: s.client_name,
      total: s.total,
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

    setSalesState(formatted);
    localStorage.setItem('erp_sales', JSON.stringify(formatted));
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();

    // Add network listener to refetch when coming online
    const handleOnline = () => fetchSales();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const saleId = `V-${String(Date.now())}`;
    const newSale = { ...sale, id: saleId, status: sale.status || 'completed' } as Sale;

    // Optimistic Update
    const newState = [newSale, ...salesState];
    setSalesState(newState);
    localStorage.setItem('erp_sales', JSON.stringify(newState));

    // Save strictly to local Vanilla JS layer
    await saveLocally('sales', saleId, { id: saleId, date: newSale.date, client_id: newSale.client_id, client_name: newSale.client_name, total: newSale.total, status: newSale.status }, 'create');

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

    // Update stock quantities natively via local records when offline
    const localProducts = await getAllTableRecords('products');
    for (const item of newSale.products) {
      try {
        let currentQuantity = 0;

        if (navigator.onLine) {
          const { data } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
          currentQuantity = data?.quantity || 0;
        } else {
          const prod = localProducts.find((p: any) => p.id === item.product_id);
          currentQuantity = prod?.quantity || 0;
        }

        const quantityChange = newSale.status === 'returned' ? item.quantity : -item.quantity;
        const newQuantity = Math.max(0, currentQuantity + quantityChange);

        await saveLocally('products', item.product_id, { quantity: newQuantity }, 'update');
      } catch (stockError) {
        console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
      }
    }

    return newSale;
  };

  const returnSale = async (saleId: string) => {
    const sale = salesState.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned') return;

    // Optimistic Update
    const newState = salesState.map(s => s.id === saleId ? { ...s, status: 'returned' as const } : s);
    setSalesState(newState);
    localStorage.setItem('erp_sales', JSON.stringify(newState));

    // 1. Update status to returned locally
    await saveLocally('sales', saleId, { status: 'returned' }, 'update');

    // 2. Add quantity back to stock using local fallback
    const localProducts = await getAllTableRecords('products');
    for (const item of sale.products) {
      try {
        let currentQuantity = 0;
        if (navigator.onLine) {
          const { data } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
          currentQuantity = data?.quantity || 0;
        } else {
          const prod = localProducts.find((p: any) => p.id === item.product_id);
          currentQuantity = prod?.quantity || 0;
        }

        const newQuantity = currentQuantity + item.quantity;
        await saveLocally('products', item.product_id, { quantity: newQuantity }, 'update');
      } catch (stockError) {
        console.error(`Failed to restock product ${item.product_id}:`, stockError);
      }
    }
  };

  return { salesState, loading, fetchSales, addSale, returnSale };
};



