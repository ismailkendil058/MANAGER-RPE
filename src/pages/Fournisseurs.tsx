import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, MapPin, Plus, X, ChevronRight, ShoppingBag,
    ArrowLeft, Building2, RotateCcw, Check, Trash2
} from 'lucide-react';
import { formatDA } from '@/data/mock-data';
import { useSuppliers } from '@/data/use-suppliers';
import { usePurchases } from '@/data/use-purchases';
import { useStocks } from '@/data/use-stocks';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

interface LineItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

const Fournisseurs = () => {
    const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
    const [editingSupplier, setEditingSupplier] = useState(false);
    const [showPayCredit, setShowPayCredit] = useState(false);
    const [payAmount, setPayAmount] = useState<number | ''>('');
    const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '' });
    const { suppliersState: supplierList, loading: suppliersLoading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
    const { purchasesState: sharedPurchases, loading: purchasesLoading, addPurchase, returnPurchase } = usePurchases();
    const { stocksState } = useStocks();

    // Purchase form modal (from supplier detail)
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [isRetour, setIsRetour] = useState(false);
    const [lines, setLines] = useState<LineItem[]>([
        { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [returningId, setReturningId] = useState<string | null>(null);

    // ── Supplier purchases ──────────────────────────────────────
    const supplierPurchases = selectedSupplier
        ? sharedPurchases.filter(p => p.supplier_name === selectedSupplier.name)
        : [];

    const totalSpent = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0);

    // ── Add supplier ────────────────────────────────────────────
    const handleAddSupplier = async () => {
        if (!supplierForm.name.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addSupplier({ name: supplierForm.name, phone: supplierForm.phone, address: supplierForm.address });
            setSupplierForm({ name: '', phone: '', address: '' });
            setShowAddSupplierForm(false);
        } catch (error) {
            console.error('Failed to add supplier:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Purchase form helpers ───────────────────────────────────
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

    const addLine = () =>
        setLines(prev => [...prev, { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);

    const removeLine = (index: number) =>
        setLines(prev => prev.filter((_, i) => i !== index));

    const grandTotal = lines.reduce((sum, l) => sum + l.total, 0);

    const resetPurchaseForm = () => {
        setLines([{ productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
        setShowPurchaseForm(false);
        setIsRetour(false);
    };

    const handleSubmitPurchase = async () => {
        if (!selectedSupplier || lines.some(l => !l.productId) || isSubmitting) return;
        setIsSubmitting(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            await addPurchase({
                date: today,
                supplier_id: selectedSupplier.id,
                supplier_name: selectedSupplier.name,
                products: lines.map(l => ({
                    product_id: l.productId,
                    product_name: l.productName,
                    quantity: l.quantity,
                    unit_price: l.unitPrice,
                    total: l.total,
                })),
                total: grandTotal,
                status: isRetour ? 'returned' : 'completed',
            });
            resetPurchaseForm();
        } catch (error) {
            console.error('Failed to add purchase:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturn = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (returningId) return;
        setReturningId(id);
        try {
            await returnPurchase(id);
        } catch (error) {
            console.error('Failed to return:', error);
        } finally {
            setReturningId(null);
        }
    };

    const canSubmit = lines.every(l => l.productId && l.quantity > 0);

    // ════════════════════════════════════════════════════════════
    // SUPPLIER DETAIL VIEW
    // ════════════════════════════════════════════════════════════
    if (selectedSupplier) {
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 -mt-20">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedSupplier(null)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <button
                        onClick={() => {
                            setSupplierForm({ name: selectedSupplier.name, phone: selectedSupplier.phone || '', address: selectedSupplier.address || '' });
                            setEditingSupplier(true);
                        }}
                        className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                        Modifier Frn
                    </button>
                </div>

                {/* Supplier card */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                            <span className="text-sm font-black text-orange-500">
                                {selectedSupplier.name.charAt(0)}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-black truncate">{selectedSupplier.name}</h2>
                            {selectedSupplier.phone && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                                    <Phone className="w-3 h-3" />{selectedSupplier.phone}
                                </div>
                            )}
                            {selectedSupplier.address && (
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <MapPin className="w-3 h-3" />{selectedSupplier.address}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div>
                            <p className="text-[10px] text-muted-foreground">Total achats</p>
                            <p className="text-sm font-black text-orange-500">{formatDA(totalSpent)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Crédit (Dette)</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-red-500">{formatDA(selectedSupplier.credit_balance || 0)}</p>
                                {(selectedSupplier.credit_balance || 0) > 0 && (
                                    <button onClick={() => setShowPayCredit(true)} className="text-[9px] font-black uppercase bg-green-50 text-green-600 px-2 py-1 rounded-full active:scale-95 transition-transform">
                                        Régler
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Commandes</p>
                            <p className="text-sm font-black">{supplierPurchases.length}</p>
                        </div>
                    </div>
                </div>

                {/* Purchase history */}
                <div>
                    <h3 className="text-xs font-black mb-2 uppercase tracking-widest text-slate-400">
                        Historique des achats
                    </h3>
                    {supplierPurchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <ShoppingBag className="w-7 h-7 mb-2 opacity-40" />
                            <p className="text-xs font-medium">Aucun achat</p>
                            <p className="text-[10px] mt-0.5">لا توجد مشتريات</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {supplierPurchases.map(purchase => (
                                <div key={purchase.id} className="glass-card p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-orange-500">{purchase.id}</span>
                                            {purchase.status === 'returned' ? (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-red-50 text-red-500">
                                                    Retourné
                                                </span>
                                            ) : (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                                                    Complété
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-muted-foreground">
                                                {new Date(purchase.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {/* Removed Retour button as requested */}
                                        </div>
                                    </div>
                                    <div className="space-y-1 mb-2">
                                        {purchase.products?.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground">{p.product_name} × {p.quantity} kg</span>
                                                <span className="font-medium">{formatDA(p.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">Total</span>
                                        <span className="text-xs font-black">{formatDA(purchase.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Purchase form portal */}
                {createPortal(
                    <AnimatePresence>
                        {showPurchaseForm && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-0 z-[100] bg-[#F9FBFF] flex flex-col"
                            >
                                <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 safe-area-top bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isRetour ? 'bg-red-500/10' : 'bg-orange-50'}`}>
                                            <ShoppingBag className={`w-5 h-5 ${isRetour ? 'text-red-500' : 'text-orange-500'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black">{isRetour ? 'Retour fournisseur' : 'Nouvel achat'}</h3>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isRetour ? 'text-red-500' : 'text-orange-500'}`}>
                                                {selectedSupplier.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={resetPurchaseForm} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Articles commandés</label>
                                            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{lines.length} LIGNES</span>
                                        </div>

                                        <div className="space-y-6">
                                            {lines.map((line, i) => (
                                                <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i}
                                                    className="premium-card p-4 relative border-l-4 border-l-orange-400">
                                                    <div className="space-y-4">
                                                        <select value={line.productId} onChange={e => updateLine(i, 'productId', e.target.value)}
                                                            className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold appearance-none">
                                                            <option value="">Sélectionner produit...</option>
                                                            {stocksState.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                        {line.productId && (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] text-slate-400 font-black uppercase ml-1">Qté (kg)</label>
                                                                    <input type="number" value={line.quantity || ''} onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                                                                        className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[10px] text-slate-400 font-black uppercase ml-1">P.U (DA)</label>
                                                                    <input type="number" value={line.unitPrice || ''} onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))}
                                                                        className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-black" />
                                                                </div>
                                                                <div className="col-span-2 pt-3 flex items-center justify-between border-t border-slate-50 mt-1">
                                                                    <span className="text-[10px] text-slate-400 font-black uppercase">Total ligne</span>
                                                                    <span className="text-sm font-black text-orange-500">{formatDA(line.total)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {lines.length > 1 && (
                                                        <button onClick={() => removeLine(i)}
                                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>

                                        <button onClick={addLine}
                                            className="w-full h-16 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-xs text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-50">
                                            <Plus className="w-4 h-4" /> Ajouter un produit
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                                    {grandTotal > 0 && (
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">TOTAL ACHAT</span>
                                            <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatDA(grandTotal)}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSubmitPurchase}
                                        disabled={!canSubmit || isSubmitting}
                                        className={`w-full h-16 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl disabled:opacity-40 disabled:active:scale-100 ${isRetour ? 'bg-red-500 shadow-red-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="w-5 h-5" />
                                        )}
                                        {isSubmitting ? (isRetour ? 'RETOUR EN COURS...' : 'VALIDATION...') : (isRetour ? 'VALIDER LE RETOUR' : "VALIDER L'ACHAT")}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

                {/* Edit supplier form portal */}
                {createPortal(
                    <AnimatePresence>
                        {editingSupplier && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-0 z-[100] bg-[#F9FBFF] flex flex-col"
                            >
                                <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 safe-area-top bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black">Modifier fournisseur</h3>
                                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{selectedSupplier.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingSupplier(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Nom du fournisseur</label>
                                            <input
                                                type="text"
                                                value={supplierForm.name}
                                                onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Téléphone</label>
                                            <input
                                                type="tel"
                                                value={supplierForm.phone}
                                                onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Adresse</label>
                                            <textarea
                                                rows={3}
                                                value={supplierForm.address}
                                                onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                                className="w-full bg-white border-2 border-slate-100 rounded-[1.25rem] p-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)] flex gap-3">
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) {
                                                setIsSubmitting(true);
                                                await deleteSupplier(selectedSupplier.id);
                                                setIsSubmitting(false);
                                                setEditingSupplier(false);
                                                setSelectedSupplier(null);
                                            }
                                        }}
                                        disabled={isSubmitting}
                                        className="w-16 h-16 bg-red-50 text-red-600 rounded-[1.5rem] flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-40"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!supplierForm.name.trim() || isSubmitting) return;
                                            setIsSubmitting(true);
                                            await updateSupplier(selectedSupplier.id, supplierForm);
                                            setSelectedSupplier({ ...selectedSupplier, ...supplierForm });
                                            setIsSubmitting(false);
                                            setEditingSupplier(false);
                                        }}
                                        disabled={!supplierForm.name.trim() || isSubmitting}
                                        className="flex-1 h-16 bg-orange-500 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl shadow-orange-500/20"
                                    >
                                        {isSubmitting ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

                {/* Pay Credit form portal */}
                {createPortal(
                    <AnimatePresence>
                        {showPayCredit && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[110] bg-slate-900/40 flex items-center justify-center p-4"
                            >
                                <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
                                    <h3 className="text-lg font-black mb-1">Régler le crédit</h3>
                                    <p className="text-xs text-slate-500 mb-6">Saisissez le montant réglé au fournisseur {selectedSupplier.name}.</p>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="text-[11px] text-slate-400 font-black uppercase">Montant (DA)</label>
                                            <input
                                                type="number"
                                                value={payAmount}
                                                onChange={e => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                                                disabled={isSubmitting}
                                                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-base font-bold text-slate-900 focus:ring-orange-500 focus:ring-2 mt-1"
                                                placeholder="Ex: 5000"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setShowPayCredit(false); setPayAmount(''); }}
                                            disabled={isSubmitting}
                                            className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase active:scale-95 transition-transform disabled:opacity-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!payAmount || Number(payAmount) <= 0) return;
                                                setIsSubmitting(true);
                                                const newCredit = Math.max(0, (selectedSupplier.credit_balance || 0) - Number(payAmount));
                                                await updateSupplier(selectedSupplier.id, { credit_balance: newCredit });
                                                setSelectedSupplier({ ...selectedSupplier, credit_balance: newCredit });
                                                setIsSubmitting(false);
                                                setShowPayCredit(false);
                                                setPayAmount('');
                                            }}
                                            disabled={!payAmount || Number(payAmount) <= 0 || isSubmitting}
                                            className="flex-1 h-12 bg-green-500 text-white rounded-xl text-xs font-black uppercase active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Traitement...' : 'Confirmer'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </motion.div>
        );
    }

    // ════════════════════════════════════════════════════════════
    // SUPPLIERS LIST VIEW
    // ════════════════════════════════════════════════════════════
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 -mt-20">
            <motion.div variants={item} className="flex items-end justify-between px-1">
                <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">Approvisionnement</p>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fournisseurs</h1>
                </div>
                <button
                    onClick={() => { setShowAddSupplierForm(true); setSupplierForm({ name: '', phone: '', address: '' }); }}
                    className="h-12 w-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-90 transition-transform"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </motion.div>

            {/* New Supplier Form Overlay */}
            {createPortal(
                <AnimatePresence>
                    {showAddSupplierForm && (
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[100] bg-[#F9FBFF] flex flex-col"
                        >
                            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 safe-area-top bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black">Nouveau fournisseur</h3>
                                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Fiche fournisseur</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddSupplierForm(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Nom du fournisseur</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Acier DZ"
                                            value={supplierForm.name}
                                            onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                            className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            placeholder="05XXXXXXXX"
                                            value={supplierForm.phone}
                                            onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                            className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider ml-1">Adresse</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Zone industrielle..."
                                            value={supplierForm.address}
                                            onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                            className="w-full bg-white border-2 border-slate-100 rounded-[1.25rem] p-5 text-base font-semibold focus:border-orange-200 focus:ring-0 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100 shrink-0 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                                <button
                                    onClick={handleAddSupplier}
                                    disabled={!supplierForm.name.trim() || isSubmitting}
                                    className="w-full h-16 bg-orange-500 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-40 shadow-xl shadow-orange-500/20"
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

            {/* Suppliers List */}
            <div className="space-y-4">
                {supplierList.map(supplier => {
                    const supplierTotal = sharedPurchases
                        .filter(p => p.supplier_name === supplier.name)
                        .reduce((sum, p) => sum + (p.total || 0), 0);
                    const orderCount = sharedPurchases.filter(p => p.supplier_name === supplier.name).length;

                    return (
                        <motion.div
                            key={supplier.id}
                            variants={item}
                            onClick={() => setSelectedSupplier(supplier)}
                            className="premium-card group relative overflow-hidden active:scale-95 cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-orange-50 flex items-center justify-center border border-orange-100">
                                        <span className="text-sm font-black text-orange-400">
                                            {supplier.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 tracking-tight">{supplier.name}</h3>
                                        {supplier.phone && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Phone className="w-3 h-3 text-orange-400" />
                                                <span className="text-[11px] text-slate-500 font-medium">{supplier.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Total achats</p>
                                    <p className="text-sm font-black text-orange-500 tracking-tighter">{formatDA(supplierTotal)}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{orderCount} commande{orderCount !== 1 ? 's' : ''}</p>
                                    {(supplier.credit_balance || 0) > 0 && (
                                        <p className="text-[10px] font-bold text-red-500 mt-1">Crédit: {formatDA(supplier.credit_balance)}</p>
                                    )}
                                </div>
                            </div>

                            {supplier.address && (
                                <div className="flex items-start gap-1.5 py-3 border-t border-slate-50">
                                    <MapPin className="w-3 h-3 text-slate-300 mt-0.5" />
                                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{supplier.address}</p>
                                </div>
                            )}

                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-100 group-hover:bg-orange-400 transition-colors" />
                        </motion.div>
                    );
                })}
            </div>

            {supplierList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-center mb-6">
                        <Building2 className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-black tracking-tight text-slate-400">Aucun fournisseur enregistré</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-50">Votre liste est vide</p>
                </div>
            )}
        </motion.div>
    );
};

export default Fournisseurs;
