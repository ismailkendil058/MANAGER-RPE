import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="fixed top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)] left-0 right-0 z-[45] px-4 py-1.5 bg-red-500/90 text-white backdrop-blur-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_4px_20px_rgba(239,68,68,0.2)]"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <WifiOff className="w-3 h-3" />
                    <span>Mode Hors Ligne Activé</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
