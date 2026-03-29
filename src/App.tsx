import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Stocks from "./pages/Stocks";
import Ventes from "./pages/Ventes";
import Clients from "./pages/Clients";
import Fournisseurs from "./pages/Fournisseurs";
import Rapports from "./pages/Rapports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/stocks" element={<AppLayout><Stocks /></AppLayout>} />
          <Route path="/ventes" element={<AppLayout><Ventes /></AppLayout>} />
          <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
          <Route path="/fournisseurs" element={<AppLayout><Fournisseurs /></AppLayout>} />
          <Route path="/rapports" element={<AppLayout><Rapports /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
