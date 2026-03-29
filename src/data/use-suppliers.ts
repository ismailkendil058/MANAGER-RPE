import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
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

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'totalOrders' | 'totalSpent'>) => {
    const id = String(Date.now());
    const { error } = await supabase.from('suppliers').insert([{ ...supplier, id, totalOrders: 0, totalSpent: 0 }]);
    if (error) throw error;
    await fetchSuppliers();
  };

  return { suppliersState, loading, fetchSuppliers, addSupplier };
};
