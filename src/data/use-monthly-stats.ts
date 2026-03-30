import { useEffect, useMemo, useState } from 'react';
import { useSales, Sale } from './use-sales';
import { usePurchases, PurchaseOrder } from './use-purchases';

export interface MonthlyStats {
  month: string;
  ventes: number;
  achats: number;
}

export interface ProductMonthlyStats {
  product_name: string;
  bought: number; // kg
  sold: number; // kg
}

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

export const useMonthlyStats = () => {
  const { salesState: sales, loading: salesLoading } = useSales();
  const { purchasesState: purchases, loading: purchasesLoading } = usePurchases();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  const computeMonthlyStats = (sales: Sale[], purchases: PurchaseOrder[]): MonthlyStats[] => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth() - 5, 1); // 6 months back

    // Group sales
    const salesByMonth = new Map<string, number>();
    sales
      .filter(s => s.status === 'completed')
      .forEach(s => {
        const date = new Date(s.date);
        if (date >= startDate && date <= endDate) {
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          salesByMonth.set(yearMonth, (salesByMonth.get(yearMonth) || 0) + s.total);
        }
      });

    // Group purchases
    const purchasesByMonth = new Map<string, number>();
    purchases
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const date = new Date(p.date);
        if (date >= startDate && date <= endDate) {
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          purchasesByMonth.set(yearMonth, (purchasesByMonth.get(yearMonth) || 0) + p.total);
        }
      });

    // Generate 6 months data points
    const stats: MonthlyStats[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats.push({
        month: MONTHS_FR[date.getMonth()],
        ventes: salesByMonth.get(yearMonth) || 0,
        achats: purchasesByMonth.get(yearMonth) || 0,
      });
    }
    return stats;
  };

  useEffect(() => {
    if (!salesLoading && !purchasesLoading) {
      const stats = computeMonthlyStats(sales, purchases);
      setMonthlyStats(stats);
    }
  }, [sales, purchases, salesLoading, purchasesLoading]);

  return { monthlyStats, loading: salesLoading || purchasesLoading };
};

export const useProductMonthlyStats = (selectedMonth?: string) => {
  const { salesState: sales, loading: salesLoading } = useSales();
  const { purchasesState: purchases, loading: purchasesLoading } = usePurchases();

  const productStats = useMemo(() => {
    let filteredSales = sales.filter(s => s.status === 'completed');
    let filteredPurchases = purchases.filter(p => p.status === 'completed');

    if (selectedMonth) {
      const year = selectedMonth.split('-')[0];
      const month = parseInt(selectedMonth.split('-')[1]) - 1;
      const startDate = new Date(parseInt(year), month, 1);
      const endDate = new Date(parseInt(year), month + 1, 0);

      filteredSales = filteredSales.filter(s => {
        const date = new Date(s.date);
        return date >= startDate && date <= endDate;
      });
      filteredPurchases = filteredPurchases.filter(p => {
        const date = new Date(p.date);
        return date >= startDate && date <= endDate;
      });
    }

    const boughtMap = new Map<string, number>();
    const soldMap = new Map<string, number>();

    filteredPurchases.forEach(p => {
      p.products.forEach(item => {
        boughtMap.set(item.product_name, (boughtMap.get(item.product_name) || 0) + item.quantity);
      });
    });

    filteredSales.forEach(s => {
      s.products.forEach(item => {
        soldMap.set(item.product_name, (soldMap.get(item.product_name) || 0) + item.quantity);
      });
    });

    const stats: ProductMonthlyStats[] = [];
    const allProducts = new Set([...Array.from(boughtMap.keys()), ...Array.from(soldMap.keys())]);

    allProducts.forEach(productName => {
      stats.push({
        product_name: productName,
        bought: boughtMap.get(productName) || 0,
        sold: soldMap.get(productName) || 0,
      });
    });

    // Sort by total movement desc, top 10
    return stats.sort((a, b) => (b.bought + b.sold) - (a.bought + a.sold)).slice(0, 10);
  }, [sales, purchases, selectedMonth]);

  return { productStats, loading: salesLoading || purchasesLoading };
};

