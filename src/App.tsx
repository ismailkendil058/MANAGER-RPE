import { lazy, Suspense, useEffect, useCallback, useState } from "react";
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Enhanced touch handler with RAF for smooth feedback
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      target.focus();
    }
    // Visual feedback
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      target.classList.add('active:scale-[0.97]');
      requestAnimationFrame(() => target.classList.remove('active:scale-[0.97]'));
    }
  }, []);

  // Keyboard resize handler for visual viewport (fixes iOS/Android lag)
  useEffect(() => {
    const handleFocusIn = () => {
      setKeyboardOpen(true);
      document.body.classList.add('keyboard-open');
    };

    const handleFocusOut = () => {
      setKeyboardOpen(false);
      document.body.classList.remove('keyboard-open');
    };

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height / window.innerHeight;
        if (vh < 0.9) {
          document.body.style.paddingBottom = `${window.innerHeight - window.visualViewport.height}px`;
        } else {
          document.body.style.paddingBottom = '';
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize, { passive: true });
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Prevent iOS bounce
    document.addEventListener('touchmove', (e) => { }, { passive: false });

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', (e) => { });
    };
  }, [handleTouchStart]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-[200px] text-muted-foreground safe-area-top safe-area-bottom">Chargement...</div>}>
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

