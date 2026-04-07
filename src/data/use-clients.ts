import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import { saveLocally, getAllTableRecords } from '../local-first/storage.js';

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
  const fetchingRef = useRef(false);

  const fetchClients = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    if (!navigator.onLine) {
      // Serve from IndexedDB cache
      const cached = await getAllTableRecords('clients');
      if (cached.length > 0) {
        setClientsState(cached);
      } else {
        // Fallback to localStorage simple cache
        const ls = localStorage.getItem('erp_clients');
        if (ls) setClientsState(JSON.parse(ls));
      }
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch clients:', error);
      const ls = localStorage.getItem('erp_clients');
      if (ls) setClientsState(JSON.parse(ls));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const clients = data ?? [];
    setClientsState(clients);
    localStorage.setItem('erp_clients', JSON.stringify(clients));

    // Seed IndexedDB for offline use
    for (const c of clients) {
      await saveLocally('clients', c.id, c, 'update');
    }

    setLoading(false);
    fetchingRef.current = false;
  };

  useEffect(() => {
    fetchClients();

    const handleOnline = () => setTimeout(fetchClients, 1500);
    const handleSwSync = () => setTimeout(fetchClients, 500);

    window.addEventListener('online', handleOnline);
    window.addEventListener('sw-sync-complete', handleSwSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('sw-sync-complete', handleSwSync);
    };
  }, []);

  const addClient = async (
    client: Omit<Client, 'id' | 'total_spent' | 'total_orders' | 'inserted_at' | 'updated_at'>
  ) => {
    const id = String(Date.now());
    const newClient: Client = { ...client, id, total_spent: 0, total_orders: 0 };

    // Optimistic UI update
    setClientsState(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    localStorage.setItem('erp_clients', JSON.stringify([...clientsState, newClient]));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('clients').insert([newClient]);
        if (error) throw error;
        // Keep local cache seeded
        await saveLocally('clients', id, newClient, 'create');
      } catch (err) {
        console.error('Direct addClient failed, queuing locally:', err);
        await saveLocally('clients', id, newClient, 'create');
      }
    } else {
      await saveLocally('clients', id, newClient, 'create');
    }

    await fetchClients();
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const current = clientsState.find(c => c.id === id);
    const updated = { ...(current as Client), ...updates };

    // Optimistic update
    setClientsState(prev => prev.map(c => c.id === id ? updated : c));

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from('clients').update(updates).eq('id', id);
        if (error) throw error;
        await saveLocally('clients', id, updated, 'update');
      } catch (err) {
        console.error('Direct updateClient failed, queuing locally:', err);
        await saveLocally('clients', id, updated, 'update');
      }
    } else {
      await saveLocally('clients', id, updated, 'update');
    }
  };

  return { clientsState, loading, fetchClients, addClient, updateClient };
};
