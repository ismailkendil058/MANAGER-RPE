import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, FileText, Calendar, X, Check, Trash2 } from 'lucide-react';
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
  const { purchasesState: purchases, loading: purchasesLoading, fetchPurchases, addPurchase } = usePurchases();
  const { stocksState, loading: stocksLoading, fetchStocks } = useStocks();
  const { suppliersState, loading: suppliersLoading, fetchSuppliers, addSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  // Form state
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  // Auto-focus first field
  useEffect(() => {
    if (showForm && firstFieldRef.current) {
      firstFieldRef.current.focus();
      firstFieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showForm]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || !supplier.trim() || lines.some(l => !l.productId)) return;
    
    setIsSubmitting(true);
    try {
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
        status: 'completed' as const,
      };

      await addPurchase(newPurchase);
      await fetchStocks();
      await fetchSuppliers();
      resetForm();
    } catch (error) {
      console.error('Failed to add purchase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = supplier.trim() && lines.every(l => l.productId && l.quantity > 0) && !isSubmitting;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Achats</h1>
          <p className="text-xs text-muted-foreground">بونوات الشراء — {formatDA(totalPurchases)}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      </motion.div>

      {/* New Purchase Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="glass-card p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-semibold">Nouveau bon d'achat</h3>
                </div>
                <button type="button" onClick={resetForm} className="text-muted-foreground active:scale-90 transition-transform" aria-label="Fermer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Supplier */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Fournisseur</label>
                <div className="relative">
                  <select
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    className="input-field w-full h-10"
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {suppliersState.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddSupplier(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-accent hover:underline"
                  >
                    + Nouveau
                  </button>
                </div>
              </div>

              {/* Add New Supplier Inline */}
              {showAddSupplier && (
                <div className="pt-2 pb-3 border-t border-border/60">
                  <input
                    type="text"
                    placeholder="Nom du nouveau fournisseur"
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    className="input-field w-full text-sm pr-20"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={addNewSupplier}
                      disabled={!newSupplierName.trim()}
                      className="flex-1 bg-accent text-accent-foreground py-1.5 px-3 rounded-lg text-xs font-medium active:scale-95 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowAddSupplier(false)}
                      className="flex-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border active:scale-95"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-3">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block">Produits</label>
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <select
                        value={line.productId}
                        onChange={e => updateLine(i, 'productId', e.target.value)}
                        className="input-field w-full h-10 text-xs"
                      >
                        <option value="">Produit...</option>
                        {stocksState.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {line.productId && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="md:col-span-1">
                            <label className="text-[10px] text-muted-foreground mb-1 block">Quantité (kg)</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity || ''}
                              onChange={e => updateLine(i, 'quantity', e.target.value)}
                              className="input-field w-full h-9 text-sm"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-[10px] text-muted-foreground mb-1 block">Prix unitaire</label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={line.unitPrice || ''}
                              onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                              className="input-field w-full h-9 text-sm"
                              placeholder="DA"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-[10px] text-muted-foreground mb-1 block">Sous-total</label>
                            <div className="input-field h-9 flex items-center text-xs font-semibold text-accent bg-accent/5">
                              {formatDA(line.total)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {lines.length > 1 && (
                      <button
                        onClick={() => removeLine(i)}
                        className="mt-1.5 p-2 rounded-lg bg-destructive/10 text-destructive active:scale-90 transition-transform shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLine}
                  className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform hover:border-accent/40 hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un produit
                </button>
              </div>

              {/* Total */}
              {grandTotal > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="text-xs text-muted-foreground font-medium">Total</span>
                  <span className="text-base font-bold text-accent">{formatDA(grandTotal)}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le bon d\'achat'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchases List */}
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayPurchases]) => (
          <motion.div key={date} variants={item} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-[10px]">({dayPurchases.length})</span>
            </div>
            <div className="space-y-2">
              {dayPurchases.map(purchase => (
                <div key={purchase.id} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-accent">{purchase.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${purchase.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                          {purchase.status === 'completed' ? 'Complété' : 'En attente'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{purchase.supplier_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{formatDA(purchase.total)}</p>
                      <button 
                        onClick={() => navigate(`/achat/${purchase.id}`)} 
                        className="text-muted-foreground hover:text-accent mt-1 active:scale-95 transition-all cursor-pointer"
                        title="Voir détails"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {purchase.products.map((p, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        {p.product_name} × {p.quantity} kg — {formatDA(p.total)}
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

export default Achats;

