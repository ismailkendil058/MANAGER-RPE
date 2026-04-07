import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, FileText, Calendar, X, Check, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDA } from '@/data/mock-data';
import { usePurchases } from '@/data/use-purchases';
import { useStocks } from '@/data/use-stocks';
import { useSuppliers } from '@/data/use-suppliers';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const Achats = () => {
  const navigate = useNavigate();
  const { purchasesState: purchases, loading: purchasesLoading, fetchPurchases, addPurchase, returnPurchase } = usePurchases();
  const { stocksState, loading: stocksLoading, fetchStocks } = useStocks();
  const { suppliersState, loading: suppliersLoading, fetchSuppliers, addSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [isRetour, setIsRetour] = useState(false);

  // Form state
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

  const grouped = purchases.reduce<Record<string, typeof purchases>>((acc, purchase) => {
    (acc[purchase.date] = acc[purchase.date] || []).push(purchase);
    return acc;
  }, {});

  const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const product = stocksState.find(p => p.id === String(value));
        if (product) {
          line.productName = product.name;
        }
      }
      if (field === 'quantity' || field === 'unitPrice') {
        line.quantity = field === 'quantity' ? Number(value) : line.quantity;
        line.unitPrice = field === 'unitPrice' ? Number(value) : line.unitPrice;
        line.total = line.unitPrice * line.quantity;
      }
      updated[index] = line;
      return updated;
    });
  };

  const addLine = () =>
    setLines(prev => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const removeLine = (index: number) =>
    setLines(prev => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setSupplier('');
    setLines([{ productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setNewSupplierName('');
    setShowAddSupplier(false);
    setShowForm(false);
    setIsRetour(false);
  };

  const addNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      await addSupplier({ name: newSupplierName, phone: '', address: '' });
      await fetchSuppliers();
      const newSupp = suppliersState.find(s => s.name === newSupplierName);
      if (newSupp) setSupplier(newSupp.id);
      setNewSupplierName('');
      setShowAddSupplier(false);
    } catch (error) {
      console.error('Failed to add supplier:', error);
    }
  };

  const handleSubmit = async () => {
    if (!supplier.trim() || lines.some(l => !l.productId) || isSubmitting) return;
    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    const supplierRecord = suppliersState.find(s => s.id === supplier);

    const newPurchase = {
      date: today,
      supplier_id: supplier,
      supplier_name: supplierRecord?.name || supplier,
      products: lines.map(l => ({
        product_id: l.productId,
        product_name: l.productName,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        total: l.total,
      })),
      total: grandTotal,
      status: isRetour ? ('returned' as const) : ('completed' as const),
    };

    try {
      await addPurchase({
        ...newPurchase,
        supplier_name: suppliersState.find(s => s.id === supplier)?.name || 'Inconnu'
      });
      await fetchStocks();
      await fetchSuppliers();
      resetForm();
    } catch (error) {
      console.error('Failed to add purchase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  const canSubmit = supplier && lines.every(l => l.productId && l.quantity > 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 -mt-20">
      <motion.div variants={item} className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Approvisionnement</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Achats</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsRetour(true); setShowForm(true); }}
            className="h-12 w-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={() => { setIsRetour(false); setShowForm(true); }}
            className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-[#F9FBFF] flex flex-col"
            >
              <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 safe-area-top bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isRetour ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                    <ShoppingBag className={`w-5 h-5 ${isRetour ? 'text-red-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-black">{isRetour ? 'Nouveau retour' : 'Nouvel achat'}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isRetour ? 'text-red-500' : 'text-primary'}`}>{isRetour ? 'Sortie de stock' : 'Entrée de stock'}</p>
                  </div>
                </div>
                <button onClick={resetForm} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Fournisseur</label>
                    {!showAddSupplier && (
                      <button onClick={() => setShowAddSupplier(true)} className="text-[10px] font-black text-primary uppercase underline underline-offset-4 tracking-widest">Nouveau</button>
                    )}
                  </div>
                  {showAddSupplier ? (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-4 space-y-4 border-primary/20">
                      <input type="text" placeholder="Nom du fournisseur" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" />
                      <div className="flex gap-2">
                        <button onClick={addNewSupplier} className="flex-1 h-10 bg-primary text-white rounded-xl text-[10px] font-black uppercase">Créer</button>
                        <button onClick={() => setShowAddSupplier(false)} className="flex-1 h-10 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase">Annuler</button>
                      </div>
                    </motion.div>
                  ) : (
                    <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full h-14 bg-white border-2 border-slate-50 rounded-[1.25rem] px-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm appearance-none">
                      <option value="">Choisir fournisseur...</option>
                      {suppliersState.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Articles commandés</label>
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{lines.length} LIGNES</span>
                  </div>

                  <div className="space-y-6">
                    {lines.map((line, i) => (
                      <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="premium-card p-4 relative border-l-4 border-l-primary">
                        <div className="space-y-4">
                          <select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold appearance-none">
                            <option value="">Sélectionner produit...</option>
                            {stocksState.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          {line.productId && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 font-black uppercase ml-1">Qté (kg)</label>
                                <input type="number" value={line.quantity || ''} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 font-black uppercase ml-1">P.U (DA)</label>
                                <input type="number" value={line.unitPrice || ''} onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
                              </div>
                              <div className="col-span-2 pt-3 flex items-center justify-between border-t border-slate-50 mt-1">
                                <span className="text-[10px] text-slate-400 font-black uppercase">Total ligne</span>
                                <span className="text-sm font-black text-primary">{formatDA(line.total)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(i)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <button onClick={addLine} className="w-full h-16 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-xs text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-50">
                    <Plus className="w-4 h-4" /> Ajouter un produit
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                {grandTotal > 0 && (
                  <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">DÉPENSE TOTALE</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatDA(grandTotal)}</span>
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className={`w-full h-16 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl disabled:opacity-40 disabled:active:scale-100 ${isRetour ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'}`}
                >
                  <Check className="w-5 h-5" /> {isRetour ? 'VALIDER LE RETOUR' : "VALIDER L'ACHAT"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="space-y-8">
        {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayPurchases]) => (
          <motion.div key={date} variants={item} className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-0.5 flex-1 bg-slate-100" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
              <div className="h-0.5 flex-1 bg-slate-100" />
            </div>
            <div className="space-y-4">
                {dayPurchases.map(purchase => (
                  <motion.div 
                    key={purchase.id} 
                    whileTap={{ scale: 0.98 }} 
                    className="premium-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/achat/${purchase.id}`)}
                  >

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">#{purchase.id}</span>
                        <h3 className="text-sm font-black text-slate-900 -mt-0.5">{purchase.supplier_name}</h3>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5 mt-1">
                        <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{formatDA(purchase.total)}</p>
                        {purchase.status === 'returned' && (
                          <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-2.5 py-1 rounded-full tracking-wider">Retourné</span>
                        )}

                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-50 pt-3">
                    {purchase.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{p.product_name} × {p.quantity} kg</span>
                        <span className="text-slate-900 font-bold">{formatDA(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Achats;
