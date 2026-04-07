import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/register-sw.js";
import "./utils/network-monitor.js"; // self-initializes

registerServiceWorker();

window.addEventListener('online', async () => {
  console.log('[App] Back online — triggering sync...');

  try {
    // @ts-ignore
    const { syncToSupabase } = await import('./local-first/sync.js');
    setTimeout(() => syncToSupabase(), 1000);
  } catch (e) {
    console.warn('[App] Could not import syncToSupabase:', e);
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'MANUAL_SYNC' });
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        // @ts-ignore
        await reg.sync.register('sync-offline-mutations');
      }
    } catch (_) { /* not critical */ }
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_SYNC_COMPLETE') {
      console.log('[App] SW sync completed, dispatching refresh event');
      window.dispatchEvent(new CustomEvent('sw-sync-complete'));
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
