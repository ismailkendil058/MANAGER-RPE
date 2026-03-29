import { useState } from 'react';
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

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await addClient({ name: form.name, phone: form.phone, address: form.address });
      setForm({ name: '', phone: '', address: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add client:', error);
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
              <p className="text-sm font-bold">{selectedClient.total_orders}</p>
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Clients</h1>
          <p className="text-xs text-muted-foreground">العملاء — {clientList.length} clients</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      </motion.div>

      {/* Add Client Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-semibold">Nouveau client</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nom du client"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field w-full h-10"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input-field w-full h-10"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="input-field w-full h-10"
              />
              <button
                onClick={handleAdd}
                disabled={!form.name.trim()}
                className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg text-xs font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Ajouter le client
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {clientList.map(client => (
          <motion.div
            key={client.id}
            variants={item}
            className="glass-card p-4 active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => setSelectedClient(client)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{client.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3" />{client.address}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground">Dépensé</p>
                <p className="text-xs font-bold">{formatDA(client.total_spent)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Commandes</p>
                <p className="text-xs font-bold">{client.total_orders}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Clients;
