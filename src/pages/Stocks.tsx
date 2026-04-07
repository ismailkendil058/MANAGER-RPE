import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, X, Pencil, Trash2, Check, PackagePlus } from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { useStocks, Product } from '@/data/use-stocks';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const emptyForm = { name: '', name_ar: '', quantity: 0, min_stock: 0 };



const Stocks = () => {
  const { stocksState, loading, addStock, updateStock, deleteStock } = useStocks();
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);



  const filtered = stocksState.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.name_ar.includes(search)
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const newProduct: Omit<Product, 'id' | 'inserted_at' | 'updated_at'> = {
      ...form,
      weight: '',
      category: '',
      category_ar: '',
      price: 0,
      supplier: '',
      name_ar: '',
    };

    try {
      await addStock(newProduct);
      setForm(emptyForm);
      setShowForm(false);
    } catch (error) {
      console.error('Add product failed:', error);
    }
  };


  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateStock(editingId, form);
      setEditingId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error('Update product failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStock(id);
    } catch (error) {
      console.error('Delete product failed:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const formFields = (
    <div className="space-y-2.5">
      <input type="text" placeholder="Nom du produit" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field w-full h-10" />
      <input type="text" placeholder="الاسم بالعربية" dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="input-field w-full h-10" />

    </div>
  );



  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 -mt-20">
      <motion.div variants={item} className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Inventaire</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stocks</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </motion.div>

      {/* New Product Form Overlay */}
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
                    <PackagePlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Nouveau produit</h3>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Ajout catalogue</p>
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
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Désignation (FR)</label>
                    <input
                      type="text"
                      placeholder="Ex: Fer à béton 12mm"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full h-14 bg-white border-2 border-slate-50 rounded-[1.25rem] px-5 text-base font-semibold focus:border-primary/20 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Quantité (kg)</label>
                    <input
                      type="number"
                      placeholder="Ex: 500"
                      value={form.quantity || ''}
                      onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full h-14 bg-white border-2 border-slate-50 rounded-[1.25rem] px-5 text-base font-bold focus:border-primary/20 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Package className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Informations</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Les produits sont ajoutés avec un stock nul par défaut. Utilisez la section <span className="font-bold text-slate-900 underline decoration-primary/30">Achats</span> pour alimenter votre stock.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <button
                  onClick={handleAdd}
                  disabled={!form.name.trim()}
                  className="w-full h-16 bg-primary text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  CONFIRMER L'AJOUT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Search Bar */}
      <motion.div variants={item} className="px-1">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-14 bg-white border-none rounded-2xl pl-11 pr-4 text-sm font-semibold shadow-[0_4px_15px_rgba(0,0,0,0.03)] focus:shadow-[0_8px_25px_rgba(37,99,235,0.08)] transition-all"
          />
        </div>
      </motion.div>

      {/* Product List */}
      <div className="space-y-4">
        {filtered.map(product => {
          const isEditing = editingId === product.id;
          return (
            <motion.div key={product.id} variants={item} className="premium-card relative overflow-hidden group">
              {isEditing ? (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Modification</h3>
                    <button onClick={handleCancelEdit} className="p-2 -mr-2 text-slate-400"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" placeholder="Désignation" />
                    <input type="number" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold" placeholder="Quantité (kg)" />
                  </div>
                  <button onClick={handleSaveEdit} className="w-full h-12 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform">
                    Enregistrer les modifications
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-primary/5 transition-colors">
                    <Package className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-900 truncate tracking-tight">{product.name}</h3>
                      <span className="text-sm font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg shrink-0">
                        {product.quantity} <span className="text-[10px] uppercase ml-0.5">kg</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-end mt-1">
                      <button
                        onClick={() => { setEditingId(product.id); setForm({ name: product.name, name_ar: product.name_ar, quantity: product.quantity, min_stock: product.min_stock }); }}
                        className="p-1 px-2 text-[10px] font-black text-slate-300 hover:text-primary transition-colors uppercase tracking-widest"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Status Indicator Bar */}
              <div className="absolute left-0 bottom-0 top-0 w-1 bg-primary/10" />
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-center mb-6">
            <Package className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-sm font-black tracking-tight text-slate-400">Aucun produit trouvé</p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Catalogue vide</p>
        </div>
      )}
    </motion.div>
  );
};

export default Stocks;
