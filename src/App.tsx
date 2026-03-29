import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";

import Stocks from "./pages/Stocks";
import Ventes from "./pages/Ventes";
import VenteDetail from "./pages/VenteDetail";
import Clients from "./pages/Clients";
import Achats from "./pages/Achats";
import AchatDetail from "./pages/AchatDetail";
import Rapports from "./pages/Rapports";
import NotFound from "./pages/NotFound";

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
          <Routes>
            <Route path="/" element={<AppLayout><Stocks /></AppLayout>} />
            <Route path="/stocks" element={<AppLayout><Stocks /></AppLayout>} />
            <Route path="/ventes" element={<AppLayout><Ventes /></AppLayout>} />
            <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
            <Route path="/fournisseurs" element={<AppLayout><Achats /></AppLayout>} />
            <Route path="/vente/:id" element={<AppLayout><VenteDetail /></AppLayout>} />
            <Route path="/achat/:id" element={<AppLayout><AchatDetail /></AppLayout>} />
            <Route path="/rapports" element={<AppLayout><Rapports /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
