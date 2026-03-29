import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  inserted_at?: string;
  updated_at?: string;
}

export const useSuppliers = () => {
  const [suppliersState, setSuppliersState] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Failed to fetch suppliers:', error);
      setLoading(false);
      return;
    }
    setSuppliersState(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'total_orders' | 'total_spent' | 'inserted_at' | 'updated_at'>) => {
    const id = String(Date.now());
    const { error } = await supabase.from('suppliers').insert([{ ...supplier, id, total_orders: 0, total_spent: 0 }]);
    if (error) throw error;
    await fetchSuppliers();
  };

  return { suppliersState, loading, fetchSuppliers, addSupplier };
};
