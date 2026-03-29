import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PurchaseItem {
  id?: number;
  purchase_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier_id: string | null;
  supplier_name: string;
  products: PurchaseItem[];
  total: number;
  status: 'completed' | 'pending';
}

export const usePurchases = () => {
  const [purchasesState, setPurchasesState] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchases')
      .select('*, purchase_items(*)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch purchases:', error);
      setLoading(false);
      return;
    }

    const formatted = (data ?? []).map((p: any) => ({
      id: p.id,
      date: p.date,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      total: p.total,
      status: p.status,
      products: (p.purchase_items ?? []).map((item: any) => ({
        id: item.id,
        purchase_id: item.purchase_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      })),
    }));

    setPurchasesState(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const addPurchase = async (purchase: Omit<PurchaseOrder, 'id'>) => {
    const purchaseId = `A-${String(Date.now())}`;

    const { error: purchaseError } = await supabase.from('purchases').insert([{ id: purchaseId, date: purchase.date, supplier_id: purchase.supplier_id, supplier_name: purchase.supplier_name, total: purchase.total, status: purchase.status }]);
    if (purchaseError) throw purchaseError;

    const itemRows = purchase.products.map(item => ({
      purchase_id: purchaseId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    const { error: itemsError } = await supabase.from('purchase_items').insert(itemRows);
    if (itemsError) throw itemsError;

    // Update stock quantities for each product
    for (const item of purchase.products) {
      try {
        const { data: currentProduct } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        const currentQuantity = currentProduct?.quantity || 0;
        const newQuantity = currentQuantity + item.quantity;

        await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.product_id);
      } catch (stockError) {
        console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
        // Continue even if stock update fails
      }
    }

    await fetchPurchases();
    return { ...purchase, id: purchaseId };
  };

  return { purchasesState, loading, fetchPurchases, addPurchase };
};


