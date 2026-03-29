import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  status: 'completed' | 'pending';
}

export const useSales = () => {
  const [salesState, setSalesState] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch sales:', error);
      setLoading(false);
      return;
    }

    const formatted = (data ?? []).map((s: any) => ({
      id: s.id,
      date: s.date,
      client_id: s.client_id,
      client_name: s.client_name,
      total: s.total,
      status: s.status,
      products: (s.sale_items ?? []).map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
    }));

    setSalesState(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const saleId = sale.id || `V-${String(Date.now())}`;
    const newSale = { ...sale, id: saleId };

    const { error: saleError } = await supabase.from('sales').insert([{ id: saleId, date: sale.date, client_id: sale.client_id, client_name: sale.client_name, total: sale.total, status: sale.status }]);
    if (saleError) throw saleError;

    const itemRows = sale.products.map(item => ({
      sale_id: saleId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(itemRows);
    if (itemsError) throw itemsError;

    await fetchSales();
    return newSale;
  };

  return { salesState, loading, fetchSales, addSale };
};



