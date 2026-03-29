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
        name: "Recyclage",
        short_name: "Recyclage",
        description: "Recyclage project",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
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
            name: "Stocks",
            short_name: "Stocks",
            description: "Voir les stocks",
            url: "/stocks",
            icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }]
          },
          {
            name: "Ventes",
            short_name: "Ventes",
            description: "Voir les ventes",
            url: "/ventes",
            icons: [{ src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" }]
          },
          {
            name: "Clients",
            short_name: "Clients",
            description: "Voir les clients",
            url: "/clients",
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
