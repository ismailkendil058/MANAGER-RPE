import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyRevenue, formatDA, products } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Rapports = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h1 className="text-lg font-bold">Rapports</h1>
        <p className="text-xs text-muted-foreground">التقارير — Analytique</p>
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

    </motion.div>
  );
};

export default Rapports;
