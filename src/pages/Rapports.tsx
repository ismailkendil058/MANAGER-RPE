import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthlyStats, useProductMonthlyStats, ProductMonthlyStats } from '@/data/use-monthly-stats';
import { useSales } from '@/data/use-sales';
import { usePurchases } from '@/data/use-purchases';
import { formatDA } from '@/data/mock-data';
import { useMemo, useState } from 'react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Rapports = () => {
  const { salesState: sales } = useSales();
  const { purchasesState: purchases } = usePurchases();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Extract unique months from data for selector
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    [...sales, ...purchases]
      .filter(t => t.status === 'completed')
      .forEach(t => {
        const date = new Date(t.date);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(yearMonth);
      });
    const monthOptions = Array.from(months).sort((a, b) => b.localeCompare(a));
    return ['all', ...monthOptions]; // 'all' first for "Tous les mois"
  }, [sales, purchases]);

  const { productStats, loading } = useProductMonthlyStats(selectedMonth || undefined);

  const formatKg = (value: number) => `${Math.round(value || 0)} kg`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h1 className="text-lg font-bold">Rapports</h1>
        <p className="text-xs text-muted-foreground">التقارير — Analytique</p>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs font-semibold mb-1 block">Sélectionner le mois</label>
            <Select value={selectedMonth || 'all'} onValueChange={(value) => setSelectedMonth(value === 'all' ? null : value)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.slice(1).map((ym) => {
                  const date = new Date(parseInt(ym.split('-')[0]), parseInt(ym.split('-')[1]) - 1, 1);
                  const monthAbbr = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                  return <SelectItem key={ym} value={ym}>{monthAbbr}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h3 className="text-xs font-semibold mb-1">Produits (acheté/vendu par kilo)</h3>
        <p className="text-[9px] text-muted-foreground/60 mb-3" dir="rtl">المنتجات — المشتريات/المبيعات بالكيلو</p>
        {loading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={productStats}>
              <XAxis 
                dataKey="product_name" 
                tick={{ fontSize: 10, fill: '#94A3B8', textAnchor: 'end', dominantBaseline: 'middle' }}
                height={50}
                angle={-45}
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tickFormatter={formatKg} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={formatKg} 
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '11px' }} 
              />
              <Bar dataKey="bought" fill="#10B981" radius={[3, 3, 0, 0]} name="Acheté" />
              <Bar dataKey="sold" fill="#2563EB" radius={[3, 3, 0, 0]} name="Vendu" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Rapports;

