import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  name_ar: string;
  category?: string;
  category_ar?: string;
  weight: string;
  quantity?: number;
  price?: number;
  supplier?: string;
  supplier_id?: string;
  min_stock: number;
  inserted_at?: string;
  updated_at?: string;
}

export const useStocks = () => {
  const [stocksState, setStocksState] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch stocks:', error);
      setLoading(false);
      return;
    }

    setStocksState(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const addStock = async (product: Omit<Product, 'id' | 'inserted_at' | 'updated_at'>) => {
    const newId = String(Date.now());
    const { error } = await supabase.from('products').insert([{ ...product, id: newId }]);
    if (error) throw error;
    await fetchStocks();
  };

  const updateStock = async (id: string, update: Partial<Product>) => {
    const { error } = await supabase.from('products').update(update).eq('id', id);
    if (error) throw error;
    await fetchStocks();
  };

  const deleteStock = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await fetchStocks();
  };

  return { stocksState, loading, fetchStocks, addStock, updateStock, deleteStock };
};

