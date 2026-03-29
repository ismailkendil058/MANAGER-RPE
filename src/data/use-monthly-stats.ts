import { useEffect, useMemo, useState } from 'react';
import { useSales, Sale } from './use-sales';
import { usePurchases, PurchaseOrder } from './use-purchases';

export interface MonthlyStats {
  month: string;
  ventes: number;
  achats: number;
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

