import { useState } from 'react';
import { sales as initialSales, Sale } from './mock-data';

export const useSales = () => {
  const [salesState, setSalesState] = useState<Sale[]>(initialSales);

  const updateSales = (updater: (current: Sale[]) => Sale[]) => {
    const newSales = updater(salesState);
    setSalesState(newSales);
  };

  return [salesState, updateSales] as const;
};


