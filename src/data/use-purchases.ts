import { useState } from 'react';
import { purchases as initialPurchases, PurchaseOrder } from './mock-data';

export const usePurchases = () => {
  const [purchasesState, setPurchasesState] = useState<PurchaseOrder[]>(initialPurchases);

  const updatePurchases = (updater: (current: PurchaseOrder[]) => PurchaseOrder[]) => {
    const newPurchases = updater(purchasesState);
    setPurchasesState(newPurchases);
  };

  return [purchasesState, updatePurchases] as const;
};

