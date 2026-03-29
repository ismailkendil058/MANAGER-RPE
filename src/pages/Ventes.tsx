import { motion } from 'framer-motion';
import { ShoppingCart, Plus, FileText, Calendar } from 'lucide-react';
import { sales, formatDA } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Ventes = () => {
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  const grouped = sales.reduce<Record<string, typeof sales>>((acc, sale) => {
    (acc[sale.date] = acc[sale.date] || []).push(sale);
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Ventes</h1>
          <p className="text-xs text-muted-foreground">المبيعات — {formatDA(totalSales)}</p>
        </div>
        <button className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform">
          <Plus className="w-3.5 h-3.5" />
          Nouvelle
        </button>
      </motion.div>

      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, daySales]) => (
          <motion.div key={date} variants={item} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-[10px]">({daySales.length})</span>
            </div>
            <div className="space-y-2">
              {daySales.map(sale => (
                <div key={sale.id} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-accent">{sale.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sale.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                          {sale.status === 'completed' ? 'Complétée' : 'En attente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{sale.client}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{formatDA(sale.total)}</p>
                      <button className="text-muted-foreground hover:text-foreground mt-1">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {sale.products.map((p, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        {p.productName} × {p.quantity} — {formatDA(p.total)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
    </motion.div>
  );
};

export default Ventes;
