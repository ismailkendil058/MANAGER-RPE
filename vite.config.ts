import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "Blue app icon design.jpg"],
      manifest: {
        name: "Recyclage Pro",
        short_name: "Recyclage",
        description: "Gestion de recyclage et stocks",
        theme_color: "#132b6e",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        display_override: ["standalone", "fullscreen", "minimal-ui", "browser"],
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
            purpose: "any"
          },
          {
            src: "/Blue app icon design.jpg?v=2",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any maskable"
          },
          {
            src: "/Blue app icon design.jpg?v=2",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Tableau de Bord",
            short_name: "Dashboard",
            description: "Voir les statistiques",
            url: "/rapports",
            icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }]
          },
          {
            name: "Stocks",
            short_name: "Stocks",
            description: "Gérer le stock",
            url: "/stocks",
            icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }]
          },
          {
            name: "Nouvelle Vente",
            short_name: "Vente",
            description: "Ajouter une vente",
            url: "/ventes",
            icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
