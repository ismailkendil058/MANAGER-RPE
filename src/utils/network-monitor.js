/**
 * Network monitor to track online/offline status and alert the user.
 */

class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this.toastTimeout = null;

        // CSS for our subtle toast
        this.injectStyles();

        // Listen to native events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // Optional: periodic fetch ping could be added here to detect "lie-fi"
        // where navigator.onLine is true but actual connection is dead.
        // We will keep it simple using the native events for now.
    }

    injectStyles() {
        if (document.getElementById('network-monitor-styles')) return;
        const style = document.createElement('style');
        style.id = 'network-monitor-styles';
        style.textContent = `
            #network-status-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: #333;
                color: #fff;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: system-ui, sans-serif;
                font-size: 14px;
                font-weight: 500;
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #network-status-toast.show {
                transform: translateX(-50%) translateY(0);
            }
            #network-status-toast.offline {
                background: #ef4444; /* red-500 */
            }
            #network-status-toast.online {
                background: #22c55e; /* green-500 */
            }
        `;
        document.head.appendChild(style);

        const toast = document.createElement('div');
        toast.id = 'network-status-toast';
        document.body.appendChild(toast);
        this.toastEl = toast;
    }

    showToast(message, isOffline) {
        this.toastEl.textContent = message;
        this.toastEl.className = isOffline ? 'show offline' : 'show online';

        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        // Hide after 4 seconds
        this.toastTimeout = setTimeout(() => {
            this.toastEl.className = '';
        }, 4000);
    }

    handleOnline() {
        this.isOnline = true;
        this.showToast('📶 Connexion rétablie', false);
        this.notifyListeners();

        // Trigger generic custom event for any component to react
        window.dispatchEvent(new CustomEvent('network-change', { detail: { isOnline: true } }));
    }

    handleOffline() {
        this.isOnline = false;
        this.showToast('📡 Mode hors ligne activé', true);
        this.notifyListeners();

        // Trigger generic custom event for any component to react
        window.dispatchEvent(new CustomEvent('network-change', { detail: { isOnline: false } }));
    }

    // Expose hook subscription
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.isOnline));
    }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();
