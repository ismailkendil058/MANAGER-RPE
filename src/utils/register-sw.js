/**
 * Register Service Worker and handle updates
 */

export function registerServiceWorker() {
    // Only register if supported
    if ('serviceWorker' in navigator) {
        // iOS NOTE: iOS Safari (especially < 16.4) has aggressive caching and might not 
        // immediately show updates. Push notifications also require prompt permissions which 
        // are strictly user-gesture initiated on iOS.

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('SW registered with scope:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker == null) return;

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // A new version is ready to be used
                                promptUserToRefresh(newWorker);
                            }
                        });
                    });
                })
                .catch(err => {
                    console.error('SW registration failed:', err);
                });
        });

        // Listen for messages from the service worker
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

function promptUserToRefresh(worker) {
    // Create a beautiful update banner dynamically
    if (document.getElementById('sw-update-banner')) return;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #sw-update-banner {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #132b6e; /* Primary color */
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 9999;
            font-family: system-ui, sans-serif;
            font-size: 14px;
        }
        #sw-update-banner button {
            background: #fff;
            color: #132b6e;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        #sw-update-banner button:hover {
            background: #f1f5f9;
        }
        .sw-update-close {
            background: transparent !important;
            color: #fff !important;
            padding: 4px !important;
            opacity: 0.8;
        }
        .sw-update-close:hover {
            background: rgba(255,255,255,0.1) !important;
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';

    const text = document.createElement('span');
    text.textContent = 'Une nouvelle version est disponible !';

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Mettre à jour';
    refreshBtn.onclick = () => {
        banner.remove();
        // Send skipWaiting to the new worker to activate it immediately
        worker.postMessage({ type: 'SKIP_WAITING' });
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'sw-update-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => banner.remove();

    banner.appendChild(text);
    banner.appendChild(refreshBtn);
    banner.appendChild(closeBtn);

    document.body.appendChild(banner);
}
