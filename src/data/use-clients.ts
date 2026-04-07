import { useEffect, useState } from 'react';
// @ts-ignore
import { saveLocally, getAllTableRecords } from '../local-first/storage.js';
import { clients as mockClients } from './mock-data';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_spent: number;
  total_orders: number;
  credit_balance?: number;
  inserted_at?: string;
  updated_at?: string;
}

const normalizeSource = () => mockClients.map(client => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  address: client.address,
  total_spent: client.totalSpent,
  total_orders: client.totalOrders,
  credit_balance: 0,
}));

export const useClients = () => {
  const [clientsState, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const cached = await getAllTableRecords('clients');

    if (cached.length > 0) {
      setClientsState((cached as Client[]).sort((a, b) => a.name.localeCompare(b.name)));
      localStorage.setItem('erp_clients', JSON.stringify(cached));
      setLoading(false);
      return;
    }

    const seed = normalizeSource();
    await Promise.all(seed.map(c => saveLocally('clients', c.id, c, 'create')));
    setClientsState(seed);
    localStorage.setItem('erp_clients', JSON.stringify(seed));
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (
    client: Omit<Client, 'id' | 'total_spent' | 'total_orders' | 'inserted_at' | 'updated_at'>
  ) => {
    const id = String(Date.now());
    const newClient: Client = { ...client, id, total_spent: 0, total_orders: 0, credit_balance: 0 };

    setClientsState(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    localStorage.setItem('erp_clients', JSON.stringify([...clientsState, newClient]));
    await saveLocally('clients', id, newClient, 'create');
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const current = clientsState.find(c => c.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };

    setClientsState(prev => prev.map(c => (c.id === id ? updated : c)));
    await saveLocally('clients', id, updated, 'update');
  };

  return { clientsState, loading, fetchClients, addClient, updateClient };
};
