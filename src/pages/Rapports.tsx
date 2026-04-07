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
      s.products.forEach(p => addStat(p.product_id, p.product_name, 'ventes', p.quantity));
    });
    purchases.filter(p => p.status === 'completed' && p.date.startsWith(selectedMonth)).forEach(p => {
      p.products.forEach(p => addStat(p.product_id, p.product_name, 'achats', p.quantity));
    });
    return Array.from(statsMap.values());
  }, [sales, purchases, selectedMonth]);

  /* ── Client selector (new chart) ── */
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  // Build list of clients that actually have sales
  const clientsWithSales = useMemo(() => {
    const ids = new Set(sales.filter(s => s.client_id).map(s => s.client_id as string));
    return clients.filter(c => ids.has(c.id));
  }, [clients, sales]);

  // Auto-select first client
  useEffect(() => {
    if (!selectedClientId && clientsWithSales.length > 0) {
      setSelectedClientId(clientsWithSales[0].id);
    }
  }, [clientsWithSales, selectedClientId]);

  const selectedClientName = useMemo(() => {
    if (!selectedClientId) return '';
    const c = clients.find(c => c.id === selectedClientId);
    return c?.name ?? '';
  }, [clients, selectedClientId]);

  // All months present for this client, sorted ascending
  const clientMonths = useMemo(() => {
    if (!selectedClientId) return [];
    const months = new Set<string>();
    sales
      .filter(s => s.client_id === selectedClientId && s.status === 'completed')
      .forEach(s => s.date && months.add(s.date.substring(0, 7)));
    return Array.from(months).sort();
  }, [sales, selectedClientId]);

  // All products sold to this client
  const clientProducts = useMemo(() => {
    if (!selectedClientId) return [];
    const pids = new Set<string>();
    const pnames = new Map<string, string>();
    sales
      .filter(s => s.client_id === selectedClientId && s.status === 'completed')
      .forEach(s => s.products.forEach(p => {
        pids.add(p.product_id);
        pnames.set(p.product_id, p.product_name);
      }));
    return Array.from(pids).map(id => ({ id, name: pnames.get(id)! }));
  }, [sales, selectedClientId]);

  // Monthly data per product for this client
  const clientMonthlyData = useMemo(() => {
    if (!selectedClientId || clientMonths.length === 0) return [];
    return clientMonths.map(month => {
      const row: Record<string, any> = { month: formatMonthShort(month) };
      const monthSales = sales.filter(
        s => s.client_id === selectedClientId && s.status === 'completed' && s.date.startsWith(month)
      );
      clientProducts.forEach(prod => {
        let qty = 0;
        monthSales.forEach(s => {
          s.products.filter(p => p.product_id === prod.id).forEach(p => qty += p.quantity);
        });
        row[prod.id] = qty;
      });
      return row;
    });
  }, [sales, selectedClientId, clientMonths, clientProducts]);

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

      {/* ── Ventes par Client (new chart) ── */}
      <motion.div variants={item} className="premium-card p-6">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Produits Vendus / Mois par Client</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Quantités mensuelles par produit</p>
          </div>

          {/* Client picker button */}
          <div className="relative">
            <button
              onClick={() => setClientDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
            >
              <Users size={14} className="text-primary" />
              <span className="max-w-[120px] truncate">{selectedClientName || 'Choisir client'}</span>
              {clientDropdownOpen
                ? <X size={12} className="text-slate-400" />
                : <ChevronDown size={12} className="text-slate-400" />
              }
            </button>

            {clientDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
                {cLoading ? (
                  <div className="px-4 py-3 text-xs text-slate-400 font-semibold">Chargement…</div>
                ) : clientsWithSales.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 font-semibold">Aucun client</div>
                ) : (
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {clientsWithSales.map(c => (
                      <li key={c.id}>
                        <button
                          onClick={() => { setSelectedClientId(c.id); setClientDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors
                            ${c.id === selectedClientId
                              ? 'bg-primary/10 text-primary'
                              : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {clientProducts.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {clientProducts.map((prod, idx) => (
              <div key={prod.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[9px] font-black text-slate-400 uppercase">{prod.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {sLoading || cLoading ? (
          <Skeleton className="h-[240px] w-full rounded-2xl" />
        ) : !selectedClientId ? (
          <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-slate-400">
            <Users size={28} className="opacity-30" />
            <p className="text-sm font-medium">Sélectionnez un client</p>
          </div>
        ) : clientMonthlyData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-sm font-medium text-slate-400">
            Aucune vente pour ce client
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={clientMonthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
                formatter={(value: number, name: string) => {
                  const prod = clientProducts.find(p => p.id === name);
                  return [formatQty(value), prod?.name ?? name];
                }}
              />
              {clientProducts.map((prod, idx) => (
                <Line
                  key={prod.id}
                  type="monotone"
                  dataKey={prod.id}
                  name={prod.id}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

    </motion.div>
  );
};

export default Rapports;
