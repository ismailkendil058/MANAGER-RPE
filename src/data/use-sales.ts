import { useEffect, useState } from 'react';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';
import { sales as mockSales } from './mock-data';
import { persistLocalProductQuantity } from '@/local-first/product-cache';

export interface SaleLineItem {
  id?: number;
  sale_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  client_id: string | null;
  client_name: string;
  products: SaleLineItem[];
  total: number;
  status: 'completed' | 'pending' | 'returned';
}

const sortByDateDesc = (items: Sale[]) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));

const normalizeSeed = mockSales.map(sale => ({
  id: sale.id,
  date: sale.date,
  client_id: null,
  client_name: sale.client,
  products: sale.products,
  total: sale.total,
  status: (sale.status as Sale['status']) ?? 'completed',
}));

const persistStockImpact = async (products: SaleLineItem[], status: Sale['status']) => {
  const cachedProducts = await getAllTableRecords('products');
  for (const item of products) {
    const existing = cachedProducts.find((p: any) => p.id === item.product_id);
    const currentQty = existing?.quantity || 0;
    const quantityChange = status === 'returned' ? item.quantity : -item.quantity;
    const newQty = Math.max(0, currentQty + quantityChange);
    await persistLocalProductQuantity(
      item.product_id,
      newQty,
      { name: item.product_name, product_name: item.product_name, price: item.unit_price },
      cachedProducts
    );
    if (existing) {
      existing.quantity = newQty;
    } else {
      cachedProducts.push({ id: item.product_id, quantity: newQty });
    }
  }
};

export const useSales = () => {
  const [salesState, setSalesState] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    const cached = await getAllTableRecords('sales');

    if (cached.length > 0) {
      const sorted = sortByDateDesc(cached as Sale[]);
      setSalesState(sorted);
      localStorage.setItem('erp_sales', JSON.stringify(sorted));
      setLoading(false);
      return;
    }

    await Promise.all(normalizeSeed.map(s => saveLocally('sales', s.id, s, 'create')));
    const sorted = sortByDateDesc(normalizeSeed);
    setSalesState(sorted);
    localStorage.setItem('erp_sales', JSON.stringify(sorted));
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const saleId = `V-${String(Date.now())}`;
    const newSale: Sale = {
      ...sale,
      id: saleId,
      status: sale.status ?? 'completed',
      client_id: sale.client_id ?? null,
    };

    const updatedState = sortByDateDesc([newSale, ...salesState]);
    setSalesState(updatedState);
    localStorage.setItem('erp_sales', JSON.stringify(updatedState));
    await saveLocally('sales', saleId, newSale, 'create');
    await persistStockImpact(newSale.products, newSale.status);

    return newSale;
  };

  const returnSale = async (saleId: string) => {
    const sale = salesState.find(s => s.id === saleId);
    if (!sale || sale.status === 'returned') return;

    const updatedSale = { ...sale, status: 'returned' as const };
    const updatedState = salesState.map(s => (s.id === saleId ? updatedSale : s));
    setSalesState(updatedState);
    localStorage.setItem('erp_sales', JSON.stringify(updatedState));
    await saveLocally('sales', saleId, updatedSale, 'update');
    await persistStockImpact(sale.products, 'returned');
  };

  return { salesState, loading, fetchSales, addSale, returnSale };
};
