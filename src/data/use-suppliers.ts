import { useEffect, useState } from 'react';
// @ts-ignore
import { saveLocally, getAllTableRecords } from '../local-first/storage.js';
import { suppliers as mockSuppliers } from './mock-data';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  credit_balance?: number;
  inserted_at?: string;
  updated_at?: string;
}

const normalizeSource = () => mockSuppliers.map(supplier => ({
  id: supplier.id,
  name: supplier.name,
  phone: supplier.phone,
  address: supplier.address,
  total_orders: supplier.totalOrders,
  total_spent: supplier.totalSpent,
  credit_balance: 0,
}));

export const useSuppliers = () => {
  const [suppliersState, setSuppliersState] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    const cached = await getAllTableRecords('suppliers');

    if (cached.length > 0) {
      setSuppliersState((cached as Supplier[]).sort((a, b) => a.name.localeCompare(b.name)));
      localStorage.setItem('erp_suppliers', JSON.stringify(cached));
      setLoading(false);
      return;
    }

    const seed = normalizeSource();
    await Promise.all(seed.map(s => saveLocally('suppliers', s.id, s, 'create')));
    setSuppliersState(seed);
    localStorage.setItem('erp_suppliers', JSON.stringify(seed));
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const addSupplier = async (
    supplier: Omit<Supplier, 'id' | 'total_orders' | 'total_spent' | 'inserted_at' | 'updated_at'>
  ) => {
    const id = String(Date.now());
    const newSupplier: Supplier = { ...supplier, id, total_orders: 0, total_spent: 0, credit_balance: 0 };

    setSuppliersState(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    localStorage.setItem('erp_suppliers', JSON.stringify([...suppliersState, newSupplier]));
    await saveLocally('suppliers', id, newSupplier, 'create');
    return newSupplier;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const current = suppliersState.find(s => s.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };

    setSuppliersState(prev => prev.map(s => (s.id === id ? updated : s)));
    await saveLocally('suppliers', id, updated, 'update');
  };

  return { suppliersState, loading, fetchSuppliers, addSupplier, updateSupplier };
};
