import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/register-sw.js";
import "./utils/network-monitor.js"; // This self-initializes the singleton instance

// Register SW
registerServiceWorker();

// Trigger sync on online manually for iOS workaround
window.addEventListener('online', () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'MANUAL_SYNC' });
    }
});

createRoot(document.getElementById("root")!).render(<App />);
