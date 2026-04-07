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
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-14 left-0 right-0 z-40 px-4 py-2 bg-destructive/90 text-destructive-foreground backdrop-blur-md flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider shadow-lg"
                >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Hors ligne — Mode consultation seule</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
