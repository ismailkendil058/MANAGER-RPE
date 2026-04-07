import { getAllTableRecords, saveLocally } from './storage.js';

type ProductFallback = {
  name?: string;
  product_name?: string;
  price?: number;
  supplier?: string;
};

const mergeLocalProductRecord = (
  productId: string,
  quantity: number,
  fallback: ProductFallback,
  existing?: Record<string, any>
) => {
  const record: Record<string, any> = { ...(existing ?? {}) };
  record.id = existing?.id ?? productId;
  if (!record.name && fallback.name) record.name = fallback.name;
  if (!record.product_name && fallback.product_name) record.product_name = fallback.product_name;
  if (fallback.price !== undefined && record.price === undefined) record.price = fallback.price;
  if (fallback.supplier && !record.supplier) record.supplier = fallback.supplier;
  record.quantity = quantity;
  return record;
};

export const persistLocalProductQuantity = async (
  productId: string,
  quantity: number,
  fallback: ProductFallback,
  cachedProducts?: Record<string, any>[]
) => {
  const localProducts = cachedProducts ?? (await getAllTableRecords('products'));
  const existing = localProducts.find((p: any) => p.id === productId);
  const payload = mergeLocalProductRecord(productId, quantity, fallback, existing);
  await saveLocally('products', productId, payload, existing ? 'update' : 'create');
};
