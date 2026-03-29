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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-md bg-surface ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              {kpi.change && (
                <div className="flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="text-[10px] font-medium text-success">{kpi.change}</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.title}</p>
            <p className="text-base font-bold tracking-tight mt-0.5">{kpi.value}</p>
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



      {/* Recent Sales */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold">Ventes récentes</h3>
            <p className="text-[9px] text-muted-foreground/60" dir="rtl">المبيعات الأخيرة</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-surface px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform">
                <CalendarIcon className="w-3.5 h-3.5" />
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
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ShoppingCart className="w-6 h-6 mb-1.5 opacity-40" />
            <p className="text-[11px] font-medium">Aucune vente ce jour</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredSales.map(sale => (
              <div key={sale.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-accent">{sale.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sale.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                      {sale.status === 'completed' ? '✓' : '⏳'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{sale.client}</p>
                </div>
                <p className="text-xs font-bold whitespace-nowrap">{formatDA(sale.total)}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
