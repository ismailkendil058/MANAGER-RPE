# Task: Auto-update stock quantities when achat (purchase) is added

## Plan Steps:
- [ ] 1. Create `src/data/use-stocks.ts` hook for shared product/stock state management.
- [ ] 2. Update `src/pages/Stocks.tsx` to use `useStocks` hook instead of local useState.
- [ ] 3. Update `src/pages/Achats.tsx` handleSubmit to increment stock quantities for purchased products.
- [ ] 4. Update `src/pages/Ventes.tsx` handleSubmit to decrement stock quantities for sold products (bonus for consistency).
- [ ] 5. Test: Add achat → verify Stocks quantities increase; add vente → quantities decrease.
- [ ] 6. attempt_completion

**Current progress: Starting step 1**

