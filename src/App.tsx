import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";

const LazyStocks = lazy(() => import("./pages/Stocks"));
const LazyVentes = lazy(() => import("./pages/Ventes"));
const LazyVenteDetail = lazy(() => import("./pages/VenteDetail"));
const LazyClients = lazy(() => import("./pages/Clients"));
const LazyAchats = lazy(() => import("./pages/Achats"));
const LazyAchatDetail = lazy(() => import("./pages/AchatDetail"));
const LazyRapports = lazy(() => import("./pages/Rapports"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();



const App = () => {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        target.focus();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Chargement...</div>}>
            <Routes>
              <Route path="/" element={<AppLayout><LazyStocks /></AppLayout>} />
              <Route path="/stocks" element={<AppLayout><LazyStocks /></AppLayout>} />
              <Route path="/ventes" element={<AppLayout><LazyVentes /></AppLayout>} />
              <Route path="/clients" element={<AppLayout><LazyClients /></AppLayout>} />
              <Route path="/fournisseurs" element={<AppLayout><LazyAchats /></AppLayout>} />
              <Route path="/vente/:id" element={<AppLayout><LazyVenteDetail /></AppLayout>} />
              <Route path="/achat/:id" element={<AppLayout><LazyAchatDetail /></AppLayout>} />
              <Route path="/rapports" element={<AppLayout><LazyRapports /></AppLayout>} />
              <Route path="*" element={<LazyNotFound />} />
            </Routes>

          </Suspense>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
