import { motion } from 'framer-motion';
import { ShoppingBag, Truck, Calendar, Package, Plus, X, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDA } from '@/data/mock-data';
import { purchases, suppliers, products, PurchaseOrder, Supplier, Product } from '@/data/mock-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import type { PurchaseOrder } from '@/data/mock-data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

const formSchema = z.object({
  supplierId: z.string().min(1, 'Choisir un fournisseur'),
  date: z.string().default(new Date().toISOString().split('T')[0]),
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1),
});

type FormValues = z.infer<typeof formSchema>;

const Achats = () => {
  const [localPurchases, setLocalPurchases] = useState<PurchaseOrder[]>(purchases);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      date: new Date().toISOString().split('T')[0],
      lines: [{ productId: '', quantity: 1, price: 0 }],
    },
  });

  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name || '';
  const productName = (id: string) => products.find(p => p.id === id)?.name || '';

  const onSubmit = (values: FormValues) => {
    const supplier = suppliers.find(s => s.id === values.supplierId)!;
    const total = values.lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
    const newPurchase: PurchaseOrder = {
      id: `A-${Date.now().toString().slice(-4)}`,
      date: values.date,
      supplier: supplier.name,
      products: values.lines.map(line => ({
        productId: line.productId,
        productName: productName(line.productId),
        quantity: line.quantity,
        unitPrice: line.price,
        total: line.quantity * line.price,
      })),
      total,
      status: 'completed' as const,
    };
    setLocalPurchases(prev => [newPurchase, ...prev.slice(0, 9)]); // Keep top 10
    form.reset();
  };

  const addLine = () => {
    const current = form.getValues('lines');
    form.setValue('lines', [...current, { productId: '', quantity: 1, price: 0 }]);
  };

  const removeLine = (index: number) => {
    const current = form.getValues('lines');
    if (current.length > 1) {
      form.setValue('lines', current.filter((_, i) => i !== index));
    }
  };

  const updatePrice = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product?.price) {
      const current = form.getValues('lines');
      current[index].price = product.price;
      form.setValue('lines', current);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold">Achats</h1>
          <p className="text-xs text-muted-foreground">بونوات الشراء — {localPurchases.length} bons</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent/90 active:scale-95 transition-transform"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau bon d'achat</DialogTitle>
              <DialogDescription>
                Remplissez les détails du bon d'achat.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="text-sm font-medium">Lignes produits</Label>
                  {form.watch('lines')?.map((line, index) => (
                    <div key={index} className="flex gap-2 items-end p-3 border rounded-md mt-2 bg-muted/50">
                      <div className="flex-1">
                        <Select onValueChange={(val) => {
                          form.setValue(`lines.${index}.productId`, val);
                          updatePrice(val, index);
                        }}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        placeholder="Qté"
                        className="w-16 h-10"
                        value={line.quantity}
                        onChange={(e) => {
                          const current = form.getValues('lines');
                          current[index].quantity = Number(e.target.value);
                          form.setValue('lines', current);
                        }}
                        min={1}
                      />
                      <Input
                        type="number"
                        placeholder="Prix"
                        className="w-20 h-10"
                        value={line.price}
                        onChange={(e) => {
                          const current = form.getValues('lines');
                          current[index].price = Number(e.target.value);
                          form.setValue('lines', current);
                        }}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter ligne
                  </Button>
                </div>

                <div className="text-right pt-2 border-t">
                  <p className="text-sm">Total: {formatDA(form.watch('lines')?.reduce((sum, line) => sum + (line.quantity * line.price || 0), 0) || 0)} DA</p>
                </div>

                <DialogFooter>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer bon
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="space-y-3">
        {localPurchases.slice(0, 10).map((purchase) => (
          <motion.div key={purchase.id} variants={item} className="glass-card p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingBag className="w-5 h-5 text-primary" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">Bon #{purchase.id}</h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  <Truck className="w-3 h-3" />
                  {purchase.supplier}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(purchase.date).toLocaleDateString('fr-DZ')}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Package className="w-3 h-3" />
                  {purchase.products.length} produits
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/50">
              <div>
                <p className="text-xs font-bold">{formatDA(purchase.total)} DA</p>
              </div>
            </div>
          </motion.div>
        ))}
        {localPurchases.length === 0 && (
          <motion.div variants={item} className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun bon d'achat</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Achats;

