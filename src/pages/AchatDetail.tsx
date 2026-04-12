import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Calendar, Truck, Package, Printer } from 'lucide-react';
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

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Bon d'Achat</title>
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
          <div class="text-center bold">Bon d'Achat</div>
          <div class="divider"></div>
          <div>Ref: #${purchase.id.substring(0, 8)}</div>
          <div>Date: ${new Date(purchase.date).toLocaleDateString('fr-FR')}</div>
          <div>Frn: ${purchase.supplier_name.substring(0, 15)}</div>
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
              ${purchase.products?.map((p: any) => `
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
            <span>${formatDA(purchase.total)}</span>
          </div>
          <div class="divider"></div>
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
          onClick={() => navigate('/achats')}
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
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</p>
            <p className="text-sm font-black text-slate-900">#{purchase.id.substring(0, 8)}</p>
          </div>
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
            {purchase.products?.map((product, index) => (
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
