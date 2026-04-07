import { useEffect, useState } from 'react';
// @ts-ignore
import { getAllTableRecords, saveLocally } from '../local-first/storage.js';
import { purchases as mockPurchases } from './mock-data';
import { persistLocalProductQuantity } from '@/local-first/product-cache';

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
  status: 'completed' | 'pending' | 'returned';
}

const sortByDateDesc = (items: PurchaseOrder[]) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));

const normalizeSeed = mockPurchases.map(purchase => ({
  id: purchase.id,
  date: purchase.date,
  supplier_id: null,
  supplier_name: purchase.supplier,
  products: purchase.products,
  total: purchase.total,
  status: (purchase.status as PurchaseOrder['status']) ?? 'completed',
}));

const persistStockImpact = async (products: PurchaseItem[], status: PurchaseOrder['status']) => {
  const cachedProducts = await getAllTableRecords('products');
  for (const item of products) {
    const existing = cachedProducts.find((p: any) => p.id === item.product_id);
    const currentQty = existing?.quantity || 0;
    const quantityChange = status === 'returned' ? -item.quantity : item.quantity;
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

export const usePurchases = () => {
  const [purchasesState, setPurchasesState] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    setLoading(true);
    const cached = await getAllTableRecords('purchases');

    if (cached.length > 0) {
      const sorted = sortByDateDesc(cached as PurchaseOrder[]);
      setPurchasesState(sorted);
      localStorage.setItem('erp_purchases', JSON.stringify(sorted));
      setLoading(false);
      return;
    }

    await Promise.all(normalizeSeed.map(p => saveLocally('purchases', p.id, p, 'create')));
    const sorted = sortByDateDesc(normalizeSeed);
    setPurchasesState(sorted);
    localStorage.setItem('erp_purchases', JSON.stringify(sorted));
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const addPurchase = async (purchase: Omit<PurchaseOrder, 'id'>) => {
    const purchaseId = `A-${String(Date.now())}`;
    const newPurchase: PurchaseOrder = {
      ...purchase,
      id: purchaseId,
      status: purchase.status ?? 'completed',
      supplier_id: purchase.supplier_id ?? null,
    };

    const updatedState = sortByDateDesc([newPurchase, ...purchasesState]);
    setPurchasesState(updatedState);
    localStorage.setItem('erp_purchases', JSON.stringify(updatedState));
    await saveLocally('purchases', purchaseId, newPurchase, 'create');
    await persistStockImpact(newPurchase.products, newPurchase.status);

    return newPurchase;
  };

  const returnPurchase = async (purchaseId: string) => {
    const purchase = purchasesState.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'returned') return;

    const updatedPurchase = { ...purchase, status: 'returned' as const };
    const updatedState = purchasesState.map(p => (p.id === purchaseId ? updatedPurchase : p));
    setPurchasesState(updatedState);
    localStorage.setItem('erp_purchases', JSON.stringify(updatedState));
    await saveLocally('purchases', purchaseId, updatedPurchase, 'update');
    await persistStockImpact(purchase.products, 'returned');
  };

  return { purchasesState, loading, fetchPurchases, addPurchase, returnPurchase };
};
