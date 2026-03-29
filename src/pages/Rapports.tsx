import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { monthlyRevenue, formatDA, products } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const categoryData = products.reduce<Record<string, { count: number; value: number }>>((acc, p) => {
  if (!acc[p.category]) acc[p.category] = { count: 0, value: 0 };
  acc[p.category].count += p.quantity;
  acc[p.category].value += p.price * p.quantity;
  return acc;
}, {});

const categoryChart = Object.entries(categoryData).map(([name, data]) => ({ name, ...data }));
const marginData = monthlyRevenue.map(m => ({ month: m.month, margin: ((m.profit / m.revenue) * 100).toFixed(1) }));

const Rapports = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Rapports</h1>
          <p className="text-xs text-muted-foreground">التقارير — Analytique</p>
        </div>
        <button className="flex items-center gap-1.5 bg-surface text-foreground px-3 py-2 rounded-lg text-xs font-medium border border-border active:scale-95 transition-transform">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4">
        <h3 className="text-xs font-semibold mb-1">Revenus mensuels</h3>
        <p className="text-[9px] text-muted-foreground/60 mb-3" dir="rtl">الإيرادات الشهرية</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyRevenue}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(value: number) => [formatDA(value)]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '11px' }} />
            <Bar dataKey="revenue" fill="#2563EB" radius={[3, 3, 0, 0]} name="Revenus" />
            <Bar dataKey="profit" fill="#16A34A" radius={[3, 3, 0, 0]} name="Bénéfices" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4">
        <h3 className="text-xs font-semibold mb-1">Marge bénéficiaire</h3>
        <p className="text-[9px] text-muted-foreground/60 mb-3" dir="rtl">هامش الربح</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={marginData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(value: string) => [`${value}%`]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '11px' }} />
            <Line type="monotone" dataKey="margin" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 3 }} name="Marge" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={item} className="glass-card p-4">
        <h3 className="text-xs font-semibold mb-1">Stock par catégorie</h3>
        <p className="text-[9px] text-muted-foreground/60 mb-3" dir="rtl">المخزون حسب الفئة</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryChart} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(value: number) => [formatDA(value)]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 32%, 91%)', fontSize: '11px' }} />
            <Bar dataKey="value" fill="#1E3A8A" radius={[0, 3, 3, 0]} name="Valeur" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default Rapports;
