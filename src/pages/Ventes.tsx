import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, FileText, Calendar, X, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { products, clients, formatDA, Sale } from '@/data/mock-data';
import { useSales } from '@/data/use-sales';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const Ventes = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useSales();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [client, setClient] = useState('');
  const [lines, setLines] = useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);

  const grouped = sales.reduce<Record<string, typeof sales>>((acc, sale) => {
    (acc[sale.date] = acc[sale.date] || []).push(sale);
    return acc;
  }, {});

  const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const product = products.find(p => p.id === String(value));
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
    setClient('');
    setLines([{ productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!client.trim() || lines.some(l => !l.productId)) return;
    const today = new Date().toISOString().split('T')[0];
    const newSale: Sale = {
      id: `V-${String(sales.length + 1).padStart(3, '0')}`,
      date: today,
      client,
      products: lines.map(l => ({
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: l.total,
      })),
      total: grandTotal,
      status: 'completed',
    };
    setSales(s => [newSale, ...s]);
    resetForm();
  };

  const canSubmit = client.trim() && lines.every(l => l.productId && l.quantity > 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Ventes</h1>
          <p className="text-xs text-muted-foreground">المبيعات — {formatDA(totalSales)}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle
        </button>
      </motion.div>

      {/* New Sale Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-semibold">Nouvelle vente</h3>
                </div>
                <button onClick={resetForm} className="text-muted-foreground active:scale-90 transition-transform">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Client</label>
                <select
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  className="input-field w-full h-10"
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

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
                        {products.map(p => (
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
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                Enregistrer la vente
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales List */}
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
                      <button 
                        onClick={() => navigate(`/vente/${sale.id}`)} 
                        className="text-muted-foreground hover:text-accent mt-1 active:scale-95 transition-all"
                        title="Voir détails"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {sale.products.map((p, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        {p.productName} × {p.quantity} kg — {formatDA(p.total)}
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
