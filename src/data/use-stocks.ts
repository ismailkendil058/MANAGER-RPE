import { useState } from 'react';
import { products, Product } from './mock-data';

export const useStocks = () => {
  const [stocksState, setStocksState] = useState<Product[]>(products);

  const updateStocks = (updater: (current: Product[]) => Product[]) => {
    const newStocks = updater(stocksState);
    setStocksState(newStocks);
  };

  return [stocksState, updateStocks] as const;
};

