import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Plus, X, ChevronRight, ShoppingCart, ArrowLeft, UserPlus } from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { useClients } from '@/data/use-clients';
import { useSales } from '@/data/use-sales';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const Clients = () => {
  const { clientsState: clientList, loading: clientsLoading, fetchClients, addClient } = useClients();
  const { salesState: sharedSales, loading: salesLoading, fetchSales } = useSales();
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addClient({ name: form.name, phone: form.phone, address: form.address });
      setForm({ name: '', phone: '', address: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientSales = selectedClient
    ? sharedSales.filter(s => s.client_name === selectedClient.name)
    : [];

  // Client detail view
  if (selectedClient) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <button
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-base font-bold text-accent shrink-0">
              {selectedClient.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold truncate">{selectedClient.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                <Phone className="w-3 h-3" />{selectedClient.phone}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3" />{selectedClient.address}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground">Total dépensé</p>
              <p className="text-sm font-bold text-accent">{formatDA(selectedClient.total_spent)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Commandes</p>
              <p className="text-sm font-bold">{clientSales.length}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold mb-2">Historique des ventes</h3>
          {clientSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <ShoppingCart className="w-7 h-7 mb-2 opacity-40" />
              <p className="text-xs font-medium">Aucune vente</p>
              <p className="text-[10px] mt-0.5">لا توجد مبيعات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientSales.map(sale => (
                <div key={sale.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-accent">{sale.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sale.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                        {sale.status === 'completed' ? 'Complétée' : 'En attente'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {sale.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.product_name} × {p.quantity} kg</span>
                        <span className="font-medium">{formatDA(p.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Total</span>
                    <span className="text-xs font-bold">{formatDA(sale.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 -mt-20">
      <motion.div variants={item} className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Base de données</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm({ name: '', phone: '', address: '' }); }}
          className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </motion.div>

      {/* New Client Form Overlay */}
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
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Nouveau client</h3>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Fiche client</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Nom Complet</label>
                    <input
                      type="text"
                      placeholder="Ex: Ahmed Benali"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="05XXXXXXXX"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Adresse</label>
                    <textarea
                      rows={3}
                      placeholder="Cité ... Wilaya ..."
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 rounded-[1.25rem] p-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <button
                  onClick={handleAdd}
                  disabled={!form.name.trim() || isSubmitting}
                  className="w-full h-16 bg-primary text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl shadow-primary/20"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'CRÉATION...' : 'CRÉER LE COMPTE'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Clients List */}
      <div className="space-y-4">
        {clientList.map(client => (
          <motion.div
            key={client.id}
            variants={item}
            onClick={() => setSelectedClient(client)}
            className="premium-card group relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                  <span className="text-sm font-black text-slate-400">{client.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">{client.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-primary" />
                    <span className="text-[11px] text-slate-500 font-medium">{client.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Solde</p>
                <p className="text-sm font-black text-primary tracking-tighter">{formatDA(client.total_spent || 0)}</p>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-1.5 py-3 border-t border-slate-50">
                <MapPin className="w-3 h-3 text-slate-300 mt-0.5" />
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{client.address}</p>
              </div>
            )}

            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/5 group-hover:bg-primary transition-colors" />
          </motion.div>
        ))}
      </div>

      {clientList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-center mb-6">
            <UserPlus className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-sm font-black tracking-tight text-slate-400">Aucun client enregistré</p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Votre liste est vide</p>
        </div>
      )}
    </motion.div>
  );
};

export default Clients;
