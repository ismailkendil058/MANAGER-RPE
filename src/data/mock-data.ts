export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category?: string;
  categoryAr?: string;
  weight: string;
  quantity?: number;

  price?: number;
  supplier?: string;
  minStock: number;
}


export interface Sale {
  id: string;
  date: string;
  client: string;
  products: { productId: string; productName: string; quantity: number; unitPrice: number; total: number }[];
  total: number;
  status: 'completed' | 'pending';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  totalOrders: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  products: { productId: string; productName: string; quantity: number; unitPrice: number; total: number }[];
  total: number;
  status: 'completed' | 'pending';
}


export const products: Product[] = [
  { id: '1', name: 'Fer rond 10mm', nameAr: 'حديد مستدير 10مم', category: 'Fer rond', categoryAr: 'حديد مستدير', weight: '10mm - 12m', quantity: 450, price: 85000, supplier: 'ArcelorMittal', minStock: 50 },
  { id: '2', name: 'Fer rond 12mm', nameAr: 'حديد مستدير 12مم', category: 'Fer rond', categoryAr: 'حديد مستدير', weight: '12mm - 12m', quantity: 320, price: 95000, supplier: 'ArcelorMittal', minStock: 50 },
  { id: '3', name: 'Fer rond 16mm', nameAr: 'حديد مستدير 16مم', category: 'Fer rond', categoryAr: 'حديد مستدير', weight: '16mm - 12m', quantity: 18, price: 125000, supplier: 'TOSYALI', minStock: 30 },
  { id: '4', name: 'Tube carré 40x40', nameAr: 'أنبوب مربع 40×40', category: 'Tubes', categoryAr: 'أنابيب', weight: '40x40mm - 6m', quantity: 200, price: 45000, supplier: 'ALFAPIPE', minStock: 40 },
  { id: '5', name: 'Tube carré 60x60', nameAr: 'أنبوب مربع 60×60', category: 'Tubes', categoryAr: 'أنابيب', weight: '60x60mm - 6m', quantity: 150, price: 62000, supplier: 'ALFAPIPE', minStock: 30 },
  { id: '6', name: 'Cornière 40x40', nameAr: 'زاوية 40×40', category: 'Cornières', categoryAr: 'زوايا', weight: '40x40mm - 6m', quantity: 280, price: 38000, supplier: 'TOSYALI', minStock: 50 },
  { id: '7', name: 'Tôle 1.5mm', nameAr: 'صفيحة 1.5مم', category: 'Tôles', categoryAr: 'صفائح', weight: '1.5mm - 2x1m', quantity: 95, price: 52000, supplier: 'IMETAL', minStock: 20 },
  { id: '8', name: 'Tôle 2mm', nameAr: 'صفيحة 2مم', category: 'Tôles', categoryAr: 'صفائح', weight: '2mm - 2x1m', quantity: 8, price: 68000, supplier: 'IMETAL', minStock: 15 },
  { id: '9', name: 'IPN 100', nameAr: 'حديد IPN 100', category: 'Profilés', categoryAr: 'مقاطع', weight: 'IPN 100 - 6m', quantity: 45, price: 175000, supplier: 'ArcelorMittal', minStock: 10 },
  { id: '10', name: 'Grillage soudé', nameAr: 'شبك ملحوم', category: 'Grillage', categoryAr: 'شبك', weight: '5mm - 2x1m', quantity: 120, price: 32000, supplier: 'TOSYALI', minStock: 25 },
];

export const clients: Client[] = [
  { id: '1', name: 'SARL Bâtiment Plus', phone: '0555 12 34 56', address: 'Alger', totalSpent: 12500000, totalOrders: 34 },
  { id: '2', name: 'EURL Construction Moderne', phone: '0661 98 76 54', address: 'Oran', totalSpent: 8750000, totalOrders: 22 },
  { id: '3', name: 'ETS Benali', phone: '0770 45 67 89', address: 'Constantine', totalSpent: 5200000, totalOrders: 15 },
  { id: '4', name: 'SARL El Bourj', phone: '0550 33 22 11', address: 'Blida', totalSpent: 3800000, totalOrders: 11 },
  { id: '5', name: 'Ferronnerie Atlas', phone: '0660 11 22 33', address: 'Sétif', totalSpent: 2100000, totalOrders: 8 },
];

export const suppliers: Supplier[] = [
  { id: '1', name: 'ArcelorMittal Annaba', phone: '038 86 12 34', address: 'Annaba', totalOrders: 45, totalSpent: 35000000 },
  { id: '2', name: 'TOSYALI Algérie', phone: '038 87 56 78', address: 'Oran', totalOrders: 38, totalSpent: 28000000 },
  { id: '3', name: 'ALFAPIPE', phone: '029 71 23 45', address: 'Ghardaia', totalOrders: 22, totalSpent: 15000000 },
  { id: '4', name: 'IMETAL', phone: '021 63 45 67', address: 'Alger', totalOrders: 18, totalSpent: 12000000 },
];

export const purchases: PurchaseOrder[] = [
  { id: 'A-1234', date: '2026-03-28', supplier: 'ArcelorMittal Annaba', products: [{ productId: '1', productName: 'Fer rond 10mm', quantity: 100, unitPrice: 85000, total: 8500000 }], total: 8500000, status: 'completed' },
  { id: 'A-5678', date: '2026-03-27', supplier: 'TOSYALI Algérie', products: [{ productId: '3', productName: 'Fer rond 16mm', quantity: 50, unitPrice: 125000, total: 6250000 }, { productId: '6', productName: 'Cornière 40x40', quantity: 80, unitPrice: 38000, total: 3040000 }], total: 9290000, status: 'completed' },
  { id: 'A-9012', date: '2026-03-26', supplier: 'ALFAPIPE', products: [{ productId: '4', productName: 'Tube carré 40x40', quantity: 200, unitPrice: 45000, total: 9000000 }], total: 9000000, status: 'pending' },
];


export const sales: Sale[] = [
  { id: 'V-001', date: '2026-03-28', client: 'SARL Bâtiment Plus', products: [{ productId: '1', productName: 'Fer rond 10mm', quantity: 50, unitPrice: 85000, total: 4250000 }], total: 4250000, status: 'completed' },
  { id: 'V-002', date: '2026-03-28', client: 'ETS Benali', products: [{ productId: '4', productName: 'Tube carré 40x40', quantity: 30, unitPrice: 45000, total: 1350000 }], total: 1350000, status: 'completed' },
  { id: 'V-003', date: '2026-03-27', client: 'EURL Construction Moderne', products: [{ productId: '9', productName: 'IPN 100', quantity: 5, unitPrice: 175000, total: 875000 }, { productId: '6', productName: 'Cornière 40x40', quantity: 40, unitPrice: 38000, total: 1520000 }], total: 2395000, status: 'completed' },
  { id: 'V-004', date: '2026-03-27', client: 'SARL El Bourj', products: [{ productId: '7', productName: 'Tôle 1.5mm', quantity: 20, unitPrice: 52000, total: 1040000 }], total: 1040000, status: 'pending' },
  { id: 'V-005', date: '2026-03-26', client: 'Ferronnerie Atlas', products: [{ productId: '2', productName: 'Fer rond 12mm', quantity: 25, unitPrice: 95000, total: 2375000 }], total: 2375000, status: 'completed' },
];

export const monthlyRevenue = [
  { month: 'Oct', revenue: 18500000, profit: 3700000 },
  { month: 'Nov', revenue: 22000000, profit: 4400000 },
  { month: 'Déc', revenue: 19800000, profit: 3960000 },
  { month: 'Jan', revenue: 24500000, profit: 4900000 },
  { month: 'Fév', revenue: 21000000, profit: 4200000 },
  { month: 'Mar', revenue: 27800000, profit: 5560000 },
];

export const formatDA = (amount: number): string => {
  return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0 }).format(amount) + ' DA';
};

