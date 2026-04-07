import { useEffect, useState } from 'react';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';
import { products as mockProducts } from './mock-data';

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

const persistCache = async (items: Product[]) => {
  await Promise.all(items.map(item => saveLocally('products', item.id, item, 'create')));
  localStorage.setItem('erp_products', JSON.stringify(items));
};

export const useStocks = () => {
  const [stocksState, setStocksState] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    setLoading(true);
    const cached = await getAllTableRecords('products');

    if (cached.length > 0) {
      setStocksState(cached as Product[]);
      localStorage.setItem('erp_products', JSON.stringify(cached));
      setLoading(false);
      return;
    }

    await persistCache(mockProducts);
    setStocksState(mockProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const addStock = async (product: Omit<Product, 'id' | 'inserted_at' | 'updated_at'>) => {
    const newId = String(Date.now());
    const newProduct = { ...product, id: newId };
    setStocksState(prev => [...prev, newProduct]);
    await saveLocally('products', newId, newProduct, 'create');
  };

  const updateStock = async (id: string, update: Partial<Product>) => {
    const current = stocksState.find(s => s.id === id);
    if (!current) return;
    const updatedProduct = { ...current, ...update };
    setStocksState(prev => prev.map(s => (s.id === id ? updatedProduct : s)));
    await saveLocally('products', id, updatedProduct, 'update');
  };

  const deleteStock = async (id: string) => {
    setStocksState(prev => prev.filter(s => s.id !== id));
    await saveLocally('products', id, null, 'delete');
  };

  return { stocksState, loading, fetchStocks, addStock, updateStock, deleteStock };
};
