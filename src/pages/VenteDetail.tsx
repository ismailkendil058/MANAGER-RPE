import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Calendar, Package, Printer, Trash2, Edit, X, Check, Plus } from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { useSales } from '@/data/use-sales';
import { useStocks } from '@/data/use-stocks';
import { useClients } from '@/data/use-clients';

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const VenteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { salesState: sales, deleteSale, updateSale } = useSales();
  const { stocksState } = useStocks();
  const { clientsState: clientsList } = useClients();
  const [sale, setSale] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingSale, setEditingSale] = useState(false);
  const [client, setClient] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    setLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };
      if (field === 'productId') {
        const product = stocksState.find(p => p.id === String(value));
        if (product) line.productName = product.name;
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

  const addLine = () => setLines(prev => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const removeLine = (index: number) => setLines(prev => prev.filter((_, i) => i !== index));

  const handleEditClick = () => {
    setClient(clientsList.find(c => c.name === sale.client_name)?.name || sale.client_name);
    setLines(sale.products.map((p: any) => ({
      productId: p.product_id,
      productName: p.product_name,
      quantity: p.quantity,
      unitPrice: p.unit_price,
      total: p.total
    })));
    setEditingSale(true);
  };

  const submitEdit = async () => {
    if (!client.trim() || lines.some(l => !l.productId) || isSubmitting) return;
    setIsSubmitting(true);
    const clientRecord = clientsList.find(c => c.name === client);
    try {
      await updateSale(sale.id, {
        client_id: clientRecord ? clientRecord.id : sale.client_id,
        client_name: client,
        total: grandTotal,
        products: lines.map(l => ({
          product_id: l.productId,
          product_name: l.productName,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          total: l.total
        }))
      });
      setEditingSale(false);
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

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

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Bon de Vente</title>
          <style>
            @page { margin: 0; size: 58mm auto; }
            body { font-family: monospace; width: 58mm; padding: 5px; margin: 0; color: #000; font-size: 12px; background: white; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            th, td { text-align: left; padding: 2px 0; font-size: 11px; }
            .qty { width: 15%; text-align: center; }
            .price { width: 25%; text-align: right; }
            .total { width: 30%; text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center bold" style="font-size: 16px; margin-bottom: 5px;">FER & ACIER PRO</div>
          <div class="text-center bold">Bon de Vente</div>
          <div class="divider"></div>
          <div>Ref: #${sale.id.substring(0, 8)}</div>
          <div>Date: ${new Date(sale.date).toLocaleDateString('fr-FR')}</div>
          <div>Client: ${sale.client_name}</div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Art</th>
                <th class="qty">Qt</th>
                <th class="price">PU</th>
                <th class="total">Tot</th>
              </tr>
            </thead>
            <tbody>
              ${sale.products?.map((p: any) => `
                <tr>
                  <td>${p.product_name.substring(0, 10)}.</td>
                  <td class="qty">${p.quantity}</td>
                  <td class="price">${p.unit_price}</td>
                  <td class="total">${p.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="flex-between bold">
            <span>TOTAL:</span>
            <span>${formatDA(sale.total)}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="margin-top: 5px;">Merci pour votre visite!</div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(printContent);
    iframe.contentDocument?.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate('/ventes')}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="w-10 h-10 rounded-full bg-slate-900 text-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleEditClick}
            className="w-10 h-10 rounded-full bg-primary/10 text-primary shadow-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Voulez-vous vraiment supprimer cette vente ?')) {
                setIsDeleting(true);
                await deleteSale(sale.id);
                navigate('/ventes');
              }
            }}
            disabled={isDeleting}
            className="w-10 h-10 rounded-full bg-red-50 text-red-600 shadow-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</p>
            <p className="text-sm font-black text-slate-900">#{sale.id.substring(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="premium-card p-6 relative overflow-hidden">
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Informations Client</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{sale.client_name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {sale.status === 'completed' ? 'Payé' : 'En attente'}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails de la commande</h3>
          </div>
          <div className="space-y-3">
            {sale.products?.map((product, index) => (
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
          <span className="text-2xl font-black text-primary tracking-tighter">{formatDA(sale.total)}</span>
        </div>

        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {createPortal(
        <AnimatePresence>
          {editingSale && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-[#F9FBFF] flex flex-col"
            >
              <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 safe-area-top bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Edit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Modifier vente</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">#{sale.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setEditingSale(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Client</label>
                  <select value={client} onChange={e => setClient(e.target.value)} className="w-full h-14 bg-white border-2 border-slate-50 rounded-[1.25rem] px-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm appearance-none">
                    <option value="">Choisir un client...</option>
                    {clientsList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Articles</label>
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
                                <input type="number" value={line.quantity || ''} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 font-black uppercase ml-1">Prix (DA)</label>
                                <input type="number" value={line.unitPrice || ''} onChange={e => updateLine(i, 'unitPrice', e.target.value)} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
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
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">TOTAL</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatDA(grandTotal)}</span>
                  </div>
                )}
                <button
                  onClick={submitEdit}
                  disabled={lines.some(l => !l.productId) || isSubmitting}
                  className={`w-full h-16 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl disabled:opacity-40 disabled:active:scale-100 bg-primary shadow-primary/20`}
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                  {isSubmitting ? 'ENREGISTREMENT...' : 'ENREGISTRER MODIFICATIONS'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default VenteDetail;
