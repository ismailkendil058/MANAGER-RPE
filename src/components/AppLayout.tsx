import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  Building2,
  BarChart3,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { OfflineStatus } from './OfflineStatus';

const navItems = [
  { path: '/stocks', label: 'Stocks', icon: Package },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/achats', label: 'Achats', icon: ShoppingBag },
  { path: '/fournisseurs', label: 'Fournisseurs', icon: Building2 },
  { path: '/rapports', label: 'Rapports', icon: BarChart3 },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#F9FBFF] overflow-hidden relative font-sans">
      <OfflineStatus />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3 shrink-0 transition-all duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
            <span className="text-white font-black text-xs">ERP</span>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">ERP</h1>
            <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Acier & Fer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-white">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-[calc(max(1rem,env(safe-area-inset-top))+4rem)]">
        <div className="max-w-md mx-auto px-5 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[96%] max-w-[440px] z-[50]">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2rem] p-1 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  triggerHaptic('light');
                  navigate(item.path);
                }}
                className={`relative flex flex-col items-center justify-center h-10 w-10 rounded-[1.25rem] transition-all duration-300 ${isActive ? 'text-primary' : 'text-slate-400'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navGlow"
                    className="absolute inset-0 bg-primary/5 rounded-[1.5rem]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 group-active:scale-90'}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
