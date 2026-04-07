import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/register-sw.js";
import "./utils/network-monitor.js"; // self-initializes

// Register Service Worker
registerServiceWorker();

// ────────────────────────────────────────────────────────────────────────────
// When the app comes back online, trigger both sync layers:
//  1. The app-level local-first sync (IndexedDB → Supabase via sync.js)
//  2. Tell the SW to flush its own queue (iOS workaround for Background Sync)
// ────────────────────────────────────────────────────────────────────────────
window.addEventListener('online', async () => {
    console.log('[App] Back online — triggering sync...');

    // 1. Trigger app-level sync (sync.js listens to this already, but be explicit)
    // The import is dynamic to avoid blocking the initial render
    try {
        // @ts-ignore
        const { syncToSupabase } = await import('./local-first/sync.js');
        setTimeout(() => syncToSupabase(), 1000);
    } catch (e) {
        console.warn('[App] Could not import syncToSupabase:', e);
    }

    // 2. Tell SW to also replay its own mutation queue (Android BG sync + iOS polyfill)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'MANUAL_SYNC' });

        // Also register background sync tag (Android Chrome)
        try {
            const reg = await navigator.serviceWorker.ready;
            if ('sync' in reg) {
                // @ts-ignore
                await reg.sync.register('sync-offline-mutations');
            }
        } catch (_) { /* not critical */ }
    }
});

// Listen for SW telling us sync completed, so we can refresh data
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_SYNC_COMPLETE') {
            console.log('[App] SW sync completed, dispatching refresh event');
            window.dispatchEvent(new CustomEvent('sw-sync-complete'));
        }
    });
}

createRoot(document.getElementById("root")!).render(<App />);
