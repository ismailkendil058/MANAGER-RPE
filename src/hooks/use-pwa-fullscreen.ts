import { useEffect } from 'react';

export const usePWAFullscreen = () => {
  useEffect(() => {
    if ('displayMode' in navigator && (navigator as any).displayMode === 'standalone') {
      const requestFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        }
      };

      // Request on load
      requestFullscreen();

      // Re-request on visibility change or focus (for nav)
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          requestFullscreen();
        }
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('focus', requestFullscreen);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', requestFullscreen);
      };
    }
  }, []);
};

