# PWA Performance Optimization TODO

## Plan Steps:

1. [x] Install dependencies: react-window @tanstack/react-virtual for list virtualization.

2. [x] Update src/App.tsx: Lazy load all pages with React.lazy/Suspense.


3. Migrate data hooks to React Query:
   - [x] src/data/use-sales.ts

   - [ ] src/data/use-purchases.ts
   - [ ] src/data/use-stocks.ts
   - [ ] src/data/use-clients.ts
   - [ ] src/data/use-suppliers.ts

4. Virtualize lists in pages:
   - [ ] src/pages/Ventes.tsx (use VirtualTable, infinite query)
   - [ ] src/pages/Achats.tsx
   - [ ] src/pages/Stocks.tsx
   - [ ] src/pages/Clients.tsx
   - [ ] src/pages/Rapports.tsx

5. Optimize Vite/PWA:
   - [ ] vite.config.ts (manualChunks, precache)
   - [ ] Compress public/Blue app icon design.jpg
   - [ ] index.html (preload)

6. Reduce motions: Update pages/components with CSS trans, reduced-motion.

7. Test: npm run build, Lighthouse audit, mobile emulation.

8. Update SW, final perf checks.


