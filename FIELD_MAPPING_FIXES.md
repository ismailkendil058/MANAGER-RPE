# Field Mapping Fixes - Database Schema Alignment

## Problem
The Supabase database uses `snake_case` column names while the TypeScript code was using `camelCase`. This mismatch caused the error:
```
Could not find the 'categoryAr' column of 'products' in the schema cache
```

## Solution
Updated all interfaces and component code to use `snake_case` field names that match the database schema exactly.

## Changes Made

### 1. Data Hooks - Interface Updates

#### `src/data/use-stocks.ts`
- Changed `nameAr` → `name_ar`
- Changed `categoryAr` → `category_ar`
- Changed `minStock` → `min_stock`
- Added optional `inserted_at` and `updated_at` fields
- Updated `addStock()` function signature to exclude auto-generated timestamp fields

#### `src/data/use-clients.ts`
- Changed `totalSpent` → `total_spent`
- Changed `totalOrders` → `total_orders`
- Added optional `inserted_at` and `updated_at` fields
- Updated `addClient()` to use snake_case

#### `src/data/use-suppliers.ts`
- Changed `totalOrders` → `total_orders`
- Changed `totalSpent` → `total_spent`
- Added optional `inserted_at` and `updated_at` fields
- Updated `addSupplier()` to use snake_case

#### `src/data/use-sales.ts`
- Fixed `addSale()` function - removed invalid `sale.id` reference

#### `src/data/use-purchases.ts`
- Fixed `addPurchase()` function - removed invalid `purchase.id` reference

### 2. Component Updates

#### `src/pages/Stocks.tsx`
- Updated `emptyForm` to use snake_case fields
- Updated form input binding for `name_ar`
- Updated product display to use `name_ar`
- Updated `handleAdd()` to use snake_case field names

#### `src/pages/Clients.tsx`
- Updated client detail view to use `total_spent`
- Updated client display to use `total_orders`

#### `src/pages/Ventes.tsx`
- Updated `updateClient()` call to use `total_spent` and `total_orders`

## Database Schema Reference

**Products Table:**
- `id`, `name`, `name_ar`, `category`, `category_ar`, `weight`
- `quantity`, `price`, `supplier`, `supplier_id`, `min_stock`
- `inserted_at`, `updated_at`

**Clients Table:**
- `id`, `name`, `phone`, `address`
- `total_spent`, `total_orders`
- `inserted_at`, `updated_at`

**Suppliers Table:**
- `id`, `name`, `phone`, `address`
- `total_orders`, `total_spent`
- `inserted_at`, `updated_at`

## Verification
All interfaces now match the SQL schema exactly. TypeScript interfaces use snake_case to align with Postgres column naming conventions.
