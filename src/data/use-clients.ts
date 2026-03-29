import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_spent: number;
  total_orders: number;
  inserted_at?: string;
  updated_at?: string;
}

export const useClients = () => {
  const [clientsState, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Failed to fetch clients:', error);
      setLoading(false);
      return;
    }
    setClientsState(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'total_spent' | 'total_orders' | 'inserted_at' | 'updated_at'>) => {
    const id = String(Date.now());
    const { error } = await supabase.from('clients').insert([{ ...client, id, total_spent: 0, total_orders: 0 }]);
    if (error) throw error;
    await fetchClients();
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
    await fetchClients();
  };

  return { clientsState, loading, fetchClients, addClient, updateClient };
};


