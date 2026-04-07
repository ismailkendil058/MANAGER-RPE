import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { saveLocally, getAllTableRecords } from '../local-first/storage.js';
import { mergeUnsyncedRecords } from '@/local-first/merge-offline-data';

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

export const useSuppliers = () => {
  const [suppliersState, setSuppliersState] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const normalizeSupplier = (supplier: Supplier) => ({
    ...supplier,
    credit_balance: supplier.credit_balance ?? 0,
  });

  const fetchSuppliers = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    if (!navigator.onLine) {
      const cached = await getAllTableRecords('suppliers');
      if (cached.length > 0) {
        setSuppliersState((cached as Supplier[]).map(normalizeSupplier));
      } else {
        const ls = localStorage.getItem('erp_suppliers');
        if (ls) setSuppliersState(JSON.parse(ls));
      }
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch suppliers:', error);
      const ls = localStorage.getItem('erp_suppliers');
      if (ls) setSuppliersState(JSON.parse(ls));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const suppliers = (data ?? []).map(normalizeSupplier);
    const merged = await mergeUnsyncedRecords<Supplier>('suppliers', suppliers);
    setSuppliersState(merged);
    localStorage.setItem('erp_suppliers', JSON.stringify(merged));

    for (const s of suppliers) {
      await saveLocally('suppliers', s.id, s, 'update');
    }

    setLoading(false);
    fetchingRef.current = false;
  };

  useEffect(() => {
    fetchSuppliers();

    const handleOnline = () => setTimeout(fetchSuppliers, 1500);
    const handleSwSync = () => setTimeout(fetchSuppliers, 500);

    window.addEventListener('online', handleOnline);
    window.addEventListener('sw-sync-complete', handleSwSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('sw-sync-complete', handleSwSync);
    };
  }, []);

  const addSupplier = async (
    supplier: Omit<Supplier, 'id' | 'total_orders' | 'total_spent' | 'inserted_at' | 'updated_at'>
  ) => {
    const id = String(Date.now());
    const newSupplier: Supplier = { ...supplier, id, total_orders: 0, total_spent: 0, credit_balance: 0 };

    setSuppliersState(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    localStorage.setItem('erp_suppliers', JSON.stringify([...suppliersState, newSupplier]));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('suppliers').insert([newSupplier]);
        if (error) throw error;
        await saveLocally('suppliers', id, newSupplier, 'create');
      } catch (err) {
        console.error('Direct addSupplier failed, queuing locally:', err);
        await saveLocally('suppliers', id, newSupplier, 'create');
      }
    } else {
      await saveLocally('suppliers', id, newSupplier, 'create');
    }

    await fetchSuppliers();
    return newSupplier;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const current = suppliersState.find(s => s.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };

    setSuppliersState(prev => prev.map(s => (s.id === id ? updated : s)));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
        if (error) throw error;
        await saveLocally('suppliers', id, updated, 'update');
      } catch (err) {
        console.error('Direct updateSupplier failed, queuing locally:', err);
        await saveLocally('suppliers', id, updated, 'update');
      }
    } else {
      await saveLocally('suppliers', id, updated, 'update');
    }
  };

  return { suppliersState, loading, fetchSuppliers, addSupplier, updateSupplier };
};
