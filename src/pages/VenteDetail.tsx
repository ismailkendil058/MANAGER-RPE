import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Calendar, Users, Package } from 'lucide-react';
import { formatDA, Sale } from '@/data/mock-data';
import { useSales } from '@/data/use-sales';

const VenteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sales] = useSales();
  const [sale, setSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (id) {
      const foundSale = sales.find(s => s.id === id);
      setSale(foundSale || null);
    }
  }, [id, sales]);

  if (!sale) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4"
      >
        <ShoppingCart className="w-12 h-12 opacity-40 mb-3" />
        <p className="text-base font-semibold mb-2 text-center">Vente non trouvée</p>
        <button 
          onClick={() => navigate('/ventes')} 
          className="text-accent hover:underline flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux ventes
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3 pb-20 space-y-3 max-w-sm mx-auto"
    >
      {/* Header Card */}
      <div className="glass-card p-4 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={() => navigate('/ventes')} 
            className="flex items-center gap-1 p-1.5 rounded-lg bg-background/60 hover:bg-accent/10 text-muted-foreground hover:text-accent active:scale-95 transition-all"
            aria-label="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sale.status === 'completed' ? 'bg-emerald/10 text-emerald-600 border border-emerald/30' : 'bg-orange/10 text-orange-600 border border-orange/30'}`}>
            {sale.status === 'completed' ? 'Complétée' : 'En attente'}
          </span>
        </div>
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/60 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShoppingCart className="w-7 h-7 text-background" />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-1 leading-tight">
            Vente #{sale.id}
          </h1>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-background/60 rounded-lg">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium truncate max-w-[120px]">{sale.client}</span>
            </div>
            <div className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-background/60 rounded-lg">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="glass-card p-4 rounded-xl shadow-lg flex-1">
        <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-border/40">
          <Package className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-sm">Produits ({sale.products.length})</h2>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide -mr-2 pr-2">
          {sale.products.map((product, index) => (
            <div key={index} className="glass-card p-3 rounded-lg bg-surface/40 border-border/10">
              <div className="space-y-1">
                <div className="font-medium text-xs leading-tight mb-1 min-h-[32px]">{product.productName}</div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground items-center">
                  <span className="font-mono col-span-2 text-left">{product.quantity}kg × {formatDA(product.unitPrice)}</span>
                  <span className="font-bold text-accent text-right col-span-2">{formatDA(product.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total Card */}
      <div className="glass-card p-4 rounded-xl shadow-xl bg-gradient-to-b from-background via-surface/30 to-surface/50 border-accent/30">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-muted-foreground tracking-wide uppercase">Grand Total</span>
          <div className="text-right">
            <div className="text-2xl font-black bg-gradient-to-r from-accent via-primary to-accent/70 bg-clip-text text-transparent leading-tight">
              {formatDA(sale.total)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">DA</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VenteDetail;

