import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Plus, X, Pencil, Check, PackagePlus, Edit3 } from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { useStocks, Product } from '@/data/use-stocks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const emptyForm = { name: '' };



const Stocks = () => {
  const { stocksState, loading, addStock, updateStock, deleteStock } = useStocks();
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState(0);



  const filtered = stocksState.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.name_ar.includes(search)
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return;
      const newProduct: Omit<Product, 'id' | 'inserted_at' | 'updated_at'> = {
      name: form.name,
      name_ar: '',
      min_stock: 0,
      weight: '',
      category: '',
      category_ar: '',
      quantity: 0,
      price: 0,
      supplier: '',
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

  const handleQuantitySave = async () => {
    if (!editingQuantityId || !editingProduct || newQuantity < 0) return;
    try {
      await updateStock(editingQuantityId, { quantity: newQuantity });
      setEditingQuantityId(null);
      setEditingProduct(null);
      setNewQuantity(0);
    } catch (error) {
      console.error('Update quantity failed:', error);
    }
  };

  const formFields = (
    <div className="space-y-2.5">
      <input type="text" placeholder="Nom du produit" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field w-full h-10" />
    </div>
  );



  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Stocks</h1>
          <p className="text-xs text-muted-foreground">المخزون — {stocksState.length} produits</p>
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
      <motion.div variants={item}>
        <div className="flex items-center gap-3 input-field h-11 px-3.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50 min-w-0"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-muted-foreground active:scale-90 transition-all shrink-0"
              aria-label="Effacer la recherche"
            >
              <X className="w-3 h-3" />
            </button>
          )}
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{product.quantity} kg</span>
                          <button
                            onClick={() => {
                              setEditingQuantityId(product.id);
                              setEditingProduct(product);
                              setNewQuantity(product.quantity || 0);
                            }}
                            className="p-1 -mr-1 text-primary/70 hover:text-primary hover:bg-accent/50 rounded transition-all"
                            title="Modifier quantité"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5" dir="rtl">{product.name_ar}</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}

        {/* Quantity Edit Modal */}
        <Dialog open={!!editingQuantityId} onOpenChange={() => {
          setEditingQuantityId(null);
          setEditingProduct(null);
          setNewQuantity(0);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la quantité</DialogTitle>
              <DialogDescription>
                Quantité actuelle: {editingProduct?.quantity} kg pour{' '}
                <span className="font-semibold">{editingProduct?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={newQuantity || ''}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              placeholder="Nouvelle quantité (kg)"
              className="w-full"
            />
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleQuantitySave}
                className="w-full sm:w-auto"
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
