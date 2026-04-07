import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Calendar, Truck, Package } from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { usePurchases } from '@/data/use-purchases';

const AchatDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchasesState: purchases } = usePurchases();
  const [purchase, setPurchase] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      const foundPurchase = purchases.find(p => p.id === id);
      setPurchase(foundPurchase || null);
    }
  }, [id, purchases]);

  if (!purchase) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4"
      >
        <ShoppingBag className="w-12 h-12 opacity-40 mb-3" />
        <p className="text-base font-semibold mb-2 text-center">Bon d'achat non trouvé</p>
        <button
          onClick={() => navigate('/achats')}
          className="text-accent hover:underline flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux achats
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate('/achats')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</p>
          <p className="text-sm font-black text-slate-900">#{purchase.id}</p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="premium-card p-6 relative overflow-hidden">
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Fournisseur</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{purchase.supplier_name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(purchase.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${purchase.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
            {purchase.status === 'completed' ? 'Stock Entré' : 'En attente'}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles achetés</h3>
          </div>
          <div className="space-y-3">
            {purchase.products.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-black text-slate-900 mb-0.5">{product.product_name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{product.quantity} kg × {formatDA(product.unit_price)}</p>
                </div>
                <p className="text-sm font-black text-slate-900">{formatDA(product.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Montant Total</span>
          <span className="text-2xl font-black text-primary tracking-tighter">{formatDA(purchase.total)}</span>
        </div>

        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
};

export default AchatDetail;
