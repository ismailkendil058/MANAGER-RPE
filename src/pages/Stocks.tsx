import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, X, Pencil, Trash2, Check, PackagePlus } from 'lucide-react';
import { products as initialProducts, formatDA, Product } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const emptyForm = { name: '', nameAr: '', category: '', categoryAr: '', weight: '', quantity: 0, price: 0, supplier: '', minStock: 0 };

const Stocks = () => {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const categories = [...new Set(productList.map(p => p.category))];

  const filtered = productList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.nameAr.includes(search);
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newProduct: Product = {
      id: String(Date.now()),
      ...form,
    };
    setProductList([newProduct, ...productList]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      nameAr: product.nameAr,
      category: product.category,
      categoryAr: product.categoryAr,
      weight: product.weight,
      quantity: product.quantity,
      price: product.price,
      supplier: product.supplier,
      minStock: product.minStock,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setProductList(productList.map(p =>
      p.id === editingId ? { ...p, ...form } : p
    ));
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setProductList(productList.filter(p => p.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const formFields = (
    <div className="space-y-2.5">
      <input type="text" placeholder="Nom du produit" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field w-full h-10" />
      <input type="text" placeholder="الاسم بالعربية" dir="rtl" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="input-field w-full h-10" />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Catégorie" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field w-full h-10" />
        <input type="text" placeholder="Poids / Unité" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-field w-full h-10" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Quantité (q)</label>
          <input type="number" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="input-field w-full h-10" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Prix (DA)</label>
          <input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="input-field w-full h-10" />
        </div>
      </div>
      <input type="text" placeholder="Fournisseur" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="input-field w-full h-10" />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Stocks</h1>
          <p className="text-xs text-muted-foreground">المخزون — {productList.length} produits</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      </motion.div>

      {/* Add Product Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-semibold">Nouveau produit</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              {formFields}
              <button
                onClick={handleAdd}
                disabled={!form.name.trim()}
                className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg text-xs font-semibold active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Ajouter le produit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <motion.div variants={item} className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Rechercher... البحث" value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-9 h-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button onClick={() => setCategoryFilter('all')} className={`text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${categoryFilter === 'all' ? 'bg-accent text-accent-foreground' : 'bg-surface text-muted-foreground'}`}>
            Tout ({productList.length})
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${categoryFilter === c ? 'bg-accent text-accent-foreground' : 'bg-surface text-muted-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Product Cards */}
      <div className="space-y-2">
        {filtered.map(product => {
          const isEditing = editingId === product.id;
          return (
            <motion.div key={product.id} variants={item} className="glass-card p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-accent">Modifier le produit</h3>
                    <button onClick={handleCancelEdit} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  {formFields}
                  <button
                    onClick={handleSaveEdit}
                    className="w-full bg-accent text-accent-foreground py-2.5 rounded-lg text-xs font-semibold active:scale-[0.98] transition-transform"
                  >
                    Enregistrer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-primary" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                        <span className="text-xs font-bold text-primary shrink-0">{product.quantity} q</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5" dir="rtl">{product.nameAr}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>{product.weight}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Prix unitaire</p>
                      <p className="text-xs font-bold">{formatDA(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Valeur totale</p>
                      <p className="text-xs font-bold">{formatDA(product.price * product.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 rounded-lg bg-surface text-muted-foreground active:scale-90 transition-transform">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive active:scale-90 transition-transform">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">Aucun produit trouvé</p>
          <p className="text-[10px] mt-0.5">لا توجد منتجات</p>
        </div>
      )}
    </motion.div>
  );
};

export default Stocks;
