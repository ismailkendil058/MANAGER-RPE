import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  totalOrders: number;
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

  const addClient = async (client: Omit<Client, 'id' | 'totalSpent' | 'totalOrders'>) => {
    const id = String(Date.now());
    const { error } = await supabase.from('clients').insert([{ ...client, id, totalSpent: 0, totalOrders: 0 }]);
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


