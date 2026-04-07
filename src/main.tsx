import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/register-sw.js";
import "./utils/network-monitor.js"; // self-initializes

registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
