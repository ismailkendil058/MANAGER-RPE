import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { getAllTableRecords, saveLocally, syncAndPruneLocalDB } from '../local-first/storage.js';
import { mergeUnsyncedRecords } from '@/local-first/merge-offline-data';

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
  const fetchingRef = useRef(false);

  const fetchStocks = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('products');
      setStocksState(cached.length > 0 ? (cached as Product[]) : []);
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch stocks:', error);
      const cached = await getAllTableRecords('products');
      setStocksState(cached.length > 0 ? (cached as Product[]) : []);
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const products = data ?? [];

    await syncAndPruneLocalDB('products', products.map((p: any) => p.id));

    const merged = await mergeUnsyncedRecords<Product>('products', products as Product[]);
    setStocksState(merged);

    for (const p of merged) {
      await saveLocally('products', p.id, p, 'update');
    }

    setLoading(false);
    fetchingRef.current = false;
  };

  useEffect(() => {
    fetchStocks();

    const handleOnline = () => setTimeout(fetchStocks, 1500);
    const handleSwSync = () => setTimeout(fetchStocks, 500);

    window.addEventListener('online', handleOnline);
    window.addEventListener('sw-sync-complete', handleSwSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('sw-sync-complete', handleSwSync);
    };
  }, []);

  const addStock = async (product: Omit<Product, 'id' | 'inserted_at' | 'updated_at'>) => {
    const newId = String(Date.now());
    const newProduct = { ...product, id: newId };

    setStocksState(prev => [...prev, newProduct]);

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('products').insert(newProduct);
        if (error) throw error;
      } catch (err) {
        console.error('Direct addStock failed, queuing locally:', err);
        await saveLocally('products', newId, newProduct, 'create');
      }
    } else {
      await saveLocally('products', newId, newProduct, 'create');
    }
  };

  const updateStock = async (id: string, update: Partial<Product>) => {
    const current = stocksState.find(s => s.id === id);
    if (!current) return;
    const updatedProduct = { ...current, ...update };

    setStocksState(prev => prev.map(s => (s.id === id ? updatedProduct : s)));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('products').update(update).eq('id', id);
        if (error) throw error;
        await saveLocally('products', id, updatedProduct, 'update');
      } catch (err) {
        console.error('Direct updateStock failed, queuing locally:', err);
        await saveLocally('products', id, updatedProduct, 'update');
      }
    } else {
      await saveLocally('products', id, updatedProduct, 'update');
    }
  };

  const deleteStock = async (id: string) => {
    setStocksState(prev => prev.filter(s => s.id !== id));
    localStorage.setItem('erp_products', JSON.stringify(stocksState.filter(s => s.id !== id)));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Direct deleteStock failed, queuing locally:', err);
        await saveLocally('products', id, null, 'delete');
      }
    } else {
      await saveLocally('products', id, null, 'delete');
    }
  };

  return { stocksState, loading, fetchStocks, addStock, updateStock, deleteStock };
};
