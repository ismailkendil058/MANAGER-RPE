import { motion } from 'framer-motion';
import { Truck, Phone, MapPin } from 'lucide-react';
import { suppliers, formatDA } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Fournisseurs = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item}>
        <h1 className="text-lg font-bold">Fournisseurs</h1>
        <p className="text-xs text-muted-foreground">الموردون — {suppliers.length} fournisseurs</p>
      </motion.div>

      <div className="space-y-3">
        {suppliers.map(supplier => (
          <motion.div key={supplier.id} variants={item} className="glass-card p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-primary" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{supplier.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" /><span>{supplier.address}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground">Total commandé</p>
                <p className="text-xs font-bold">{formatDA(supplier.totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Commandes</p>
                <p className="text-xs font-bold">{supplier.totalOrders}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Fournisseurs;
