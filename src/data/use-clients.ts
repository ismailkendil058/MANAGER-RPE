import { useState, useEffect } from 'react';
import { clients as initialClients, Client, Sale } from './mock-data';
import { useSales } from './use-sales';

export const useClients = () => {
  const [clientsState, updateClientsInternal] = useState<Client[]>(initialClients);
  const [sales] = useSales();

  // Recompute client totals based on sales when sales change
  useEffect(() => {
    const newTotals = clientsState.map(client => {
      const clientSales = sales.filter(s => s.client === client.name);
      const totalSpent = clientSales.reduce((sum, s) => sum + s.total, 0);
      const totalOrders = clientSales.length;
      return { totalSpent, totalOrders };
    });

    // Only update if totals actually changed
    const hasChanges = clientsState.some((client, index) => 
      client.totalSpent !== newTotals[index].totalSpent || 
      client.totalOrders !== newTotals[index].totalOrders
    );

    if (hasChanges) {
      const updatedClients = clientsState.map((client, index) => ({
        ...client,
        totalSpent: newTotals[index].totalSpent,
        totalOrders: newTotals[index].totalOrders
      }));
      updateClientsInternal(updatedClients);
    }
  }, [sales]);

  const updateClients = (updater: (current: Client[]) => Client[]) => {
    const newClients = updater(clientsState);
    updateClientsInternal(newClients);
  };

  return [clientsState, updateClients] as const;
};


