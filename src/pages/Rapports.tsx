import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { useSales } from '@/data/use-sales';
import { usePurchases } from '@/data/use-purchases';
import { useClients } from '@/data/use-clients';
import { Users, ChevronDown, X } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const formatQty = (qty: number) => new Intl.NumberFormat('fr-DZ').format(qty);

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

const MONTHS_FR_FULL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const formatMonthLabel = (yyyyMm: string) => {
  if (!yyyyMm) return '';
  const [y, m] = yyyyMm.split('-');
  return `${MONTHS_FR_FULL[parseInt(m, 10) - 1]} ${y}`;
};

const formatMonthShort = (yyyyMm: string) => {
  if (!yyyyMm) return '';
  const [, m] = yyyyMm.split('-');
  return MONTHS_FR[parseInt(m, 10) - 1];
};

// Colour palette for product lines in the monthly chart
const COLORS = [
  '#0066FF', '#F97316', '#10B981', '#8B5CF6', '#EF4444',
  '#06B6D4', '#F59E0B', '#EC4899', '#84CC16', '#6366F1',
];

const Rapports = () => {
  const { salesState: sales, loading: sLoading } = useSales();
  const { purchasesState: purchases, loading: pLoading } = usePurchases();
  const { clientsState: clients, loading: cLoading } = useClients();
  const loading = sLoading || pLoading;

  /* ── Month selector (existing chart) ── */
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sales.forEach(s => s.date && months.add(s.date.substring(0, 7)));
    purchases.forEach(p => p.date && months.add(p.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [sales, purchases]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const productStats = useMemo(() => {
    if (!selectedMonth) return [];
    const statsMap = new Map<string, { product: string; ventes: number; achats: number }>();
    const addStat = (id: string, name: string, type: 'ventes' | 'achats', qty: number) => {
      if (!statsMap.has(id)) statsMap.set(id, { product: name, ventes: 0, achats: 0 });
      statsMap.get(id)![type] += qty;
    };
    sales.filter(s => s.status === 'completed' && s.date.startsWith(selectedMonth)).forEach(s => {
      s.products?.forEach(p => addStat(p.product_id, p.product_name, 'ventes', p.quantity));
    });
    purchases.filter(p => p.status === 'completed' && p.date.startsWith(selectedMonth)).forEach(p => {
      p.products?.forEach(p => addStat(p.product_id, p.product_name, 'achats', p.quantity));
    });
    return Array.from(statsMap.values());
  }, [sales, purchases, selectedMonth]);



  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={item} className="px-1 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Analytique</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports</h1>
        </div>

        {availableMonths.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* ── Performances par Produit (existing) ── */}
      <motion.div variants={item} className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Performances par Produit</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Quantités (Ventes vs Achats)</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Ventes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Achats</span>
            </div>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        ) : productStats.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm font-medium text-slate-400">
            Aucune donnée pour ce mois
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productStats}>
              <XAxis
                dataKey="product"
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  fontWeight: 800
                }}
                formatter={(value: number) => [formatQty(value)]}
              />
              <Bar dataKey="ventes" name="Ventes" fill="#0066FF" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="achats" name="Achats" fill="#F97316" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>



    </motion.div>
  );
};

export default Rapports;
