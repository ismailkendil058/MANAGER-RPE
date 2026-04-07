import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonthlyStats } from '@/data/use-monthly-stats';
import { formatDA } from '@/data/mock-data';


const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Rapports = () => {
  const { monthlyStats, loading } = useMonthlyStats();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="px-1">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Analytique</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports</h1>
      </motion.div>

      <motion.div variants={item} className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Performances Mensuelles</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ventes vs Achats</p>
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
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                  fontSize: '11px',
                  fontWeight: 800
                }}
                formatter={(value: number) => [formatDA(value)]}
              />
              <Bar dataKey="ventes" fill="#0066FF" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="achats" fill="#F97316" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </motion.div>
  );
};


export default Rapports;
