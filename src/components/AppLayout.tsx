import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { path: '/stocks', label: 'Stocks', icon: Package },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/fournisseurs', label: 'Achat.', icon: ShoppingCart },

  { path: '/rapports', label: 'Rapports', icon: BarChart3 },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
        <div>
          <h1 className="text-sm font-bold text-primary">SteelFlow</h1>
          <p className="text-[9px] text-muted-foreground -mt-0.5">صلب و حديد</p>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-4 pb-28"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
              >
                <item.icon
                  className={`w-6 h-6 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-xs font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
