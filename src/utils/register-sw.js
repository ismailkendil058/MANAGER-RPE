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
    if (document.getElementById('sw-update-banner')) return;

    const style = document.createElement('style');
    style.textContent = `
        #sw-update-banner {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(19, 43, 110, 0.95);
            backdrop-filter: blur(12px);
            color: #fff;
            padding: 16px 20px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 9999;
            font-family: inherit;
            width: calc(100% - 40px);
            max-width: 400px;
            border: 1px solid rgba(255,255,255,0.1);
            animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
            to { transform: translateX(-50%) translateY(0); }
        }
        #sw-update-banner .content {
            flex: 1;
        }
        #sw-update-banner .title {
            font-weight: 800;
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
        }
        #sw-update-banner .subtitle {
            font-size: 11px;
            opacity: 0.8;
            display: block;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        #sw-update-banner button.update-btn {
            background: #fff;
            color: #132b6e;
            border: none;
            padding: 10px 18px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        #sw-update-banner button.update-btn:active {
            transform: scale(0.95);
        }
        .sw-update-close {
            background: transparent;
            color: #fff;
            border: none;
            padding: 4px;
            font-size: 18px;
            opacity: 0.5;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';

    const content = document.createElement('div');
    content.className = 'content';

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = 'Mise à jour disponible';

    const subtitle = document.createElement('span');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Nouvelle version prête';

    content.appendChild(subtitle);
    content.appendChild(title);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'update-btn';
    refreshBtn.textContent = 'Installer';
    refreshBtn.onclick = () => {
        banner.style.transform = 'translateX(-50%) translateY(100px)';
        banner.style.opacity = '0';
        setTimeout(() => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            banner.remove();
        }, 300);
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'sw-update-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => {
        banner.style.transform = 'translateX(-50%) translateY(100px)';
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 300);
    };

    banner.appendChild(content);
    banner.appendChild(refreshBtn);
    banner.appendChild(closeBtn);

    document.body.appendChild(banner);
}
