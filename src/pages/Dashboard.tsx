import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDA } from '@/data/mock-data';
import { useStocks } from '@/data/use-stocks';
import { useSales } from '@/data/use-sales';
import { monthlyRevenue } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date('2026-03-28'));
  const { stocksState: products } = useStocks();
  const { salesState: sales } = useSales();

  const totalProfit = monthlyRevenue.reduce((sum, m) => sum + m.profit, 0);
  const stockValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const todaySales = sales.filter(s => s.date === '2026-03-28');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const filteredSales = selectedDate ? sales.filter(s => s.date === dateStr) : sales;

  const kpis = [
    { title: 'Revenus', titleAr: 'إيرادات', value: formatDA(27800000), change: '+12.4%', icon: DollarSign, color: 'text-accent' },
    { title: 'Bénéfices', titleAr: 'أرباح', value: formatDA(totalProfit), change: '+8.2%', icon: TrendingUp, color: 'text-success' },
    { title: 'Stock', titleAr: 'مخزون', value: formatDA(stockValue), change: '', icon: Package, color: 'text-primary' },
    { title: "Aujourd'hui", titleAr: 'اليوم', value: formatDA(todayRevenue), change: `${todaySales.length}`, icon: ShoppingCart, color: 'text-warning' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="px-1">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Résumé d'activité</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div key={idx} variants={item} whileTap={{ scale: 0.98 }} className="premium-card relative overflow-hidden group">
            <div className={`w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{kpi.title}</p>
            <p className="text-lg font-black text-slate-900 mt-1 tracking-tighter">{kpi.value}</p>
            {kpi.change && (
              <div className="absolute top-4 right-4 flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-2.5 h-2.5 text-green-600" />
                <span className="text-[9px] font-black text-green-600">{kpi.change}</span>
              </div>
            )}
            <div className="absolute right-0 bottom-0 w-8 h-8 bg-slate-50 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* Mini Chart */}
      <motion.div variants={item} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold">Revenus (6 mois)</h3>
            <p className="text-[9px] text-muted-foreground/60" dir="rtl">الإيرادات</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '11px', padding: '6px 10px' }}
              formatter={(value: number) => [formatDA(value)]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>



      {/* Recent Activity List */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Activité</p>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Ventes récentes</h3>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-8 px-3 flex items-center gap-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest active:scale-95 transition-transform">
                <CalendarIcon className="w-3.5 h-3.5" strokeWidth={3} />
                {selectedDate ? format(selectedDate, 'dd MMM', { locale: fr }) : 'Tout'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Aucune activité<br />enregistrée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSales.map(sale => (
              <motion.div key={sale.id} whileTap={{ scale: 0.98 }} className="premium-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">#{sale.id}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${sale.status === 'completed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 truncate tracking-tight">{sale.client_name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tighter">{formatDA(sale.total)}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{sale.status === 'completed' ? 'Terminé' : 'Attente'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
