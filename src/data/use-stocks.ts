import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';

export interface Product {
  id: string;
  name: string;
  name_ar: string;
  category?: string;
  category_ar?: string;
  weight?: string;
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

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('products');
      setStocksState(cached.length > 0 ? cached : []);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch stocks:', error);
      const cached = await getAllTableRecords('products');
      setStocksState(cached.length > 0 ? cached : []);
      setLoading(false);
      return;
    }

    const products = data ?? [];
    setStocksState(products);

    // Seed the local-first indexedDB if empty
    for (const p of products) {
      await saveLocally('products', p.id, p, 'update');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();

    // Add network listener to refetch when coming online
    const handleOnline = () => fetchStocks();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const addStock = async (product: Omit<Product, 'id' | 'inserted_at' | 'updated_at'>) => {
    const newId = String(Date.now());
    const newProduct = { ...product, id: newId };

    // Optimistic Update & Local-First save
    const newState = [...stocksState, newProduct];
    setStocksState(newState);
    await saveLocally('products', newId, newProduct, 'create');
  };

  const updateStock = async (id: string, update: Partial<Product>) => {
    // Optimistic Update
    const current = stocksState.find(s => s.id === id);
    const updatedProduct = { ...(current as Product), ...update };

    const newState = stocksState.map(s => s.id === id ? updatedProduct : s);
    setStocksState(newState);
    await saveLocally('products', id, updatedProduct, 'update');
  };

  const deleteStock = async (id: string) => {
    // Optimistic Update
    const newState = stocksState.filter(s => s.id !== id);
    setStocksState(newState);
    await saveLocally('products', id, null, 'delete');
  };

  return { stocksState, loading, fetchStocks, addStock, updateStock, deleteStock };
};
