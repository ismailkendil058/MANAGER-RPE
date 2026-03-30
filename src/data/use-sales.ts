import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const {
    data: salesState = [],
    isPending: loading,
  } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch sales:', error);
        return [];
      }

      return (data ?? []).map((s: any) => ({
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });



  const addSaleMutation = useMutation({
    mutationFn: async (sale: Omit<Sale, 'id'>) => {
      const saleId = `V-${String(Date.now())}`;
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

      // Update stock quantities for each product (deduct sold quantity)
      for (const item of sale.products) {
        try {
          const { data: currentProduct } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .single();

          const currentQuantity = currentProduct?.quantity || 0;
          const newQuantity = currentQuantity - item.quantity;

          if (newQuantity < 0) {
            console.warn(`Insufficient stock for product ${item.product_id}: ${currentQuantity} - ${item.quantity} = ${newQuantity}`);
          }

          await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', item.product_id);
        } catch (stockError) {
          console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
          // Continue even if stock update fails
        }
      }

      return newSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  const addSale = addSaleMutation.mutateAsync;

  return { salesState, loading, addSale };
};




