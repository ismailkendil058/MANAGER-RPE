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
        display_override: ["standalone", "browser"],
        start_url: "/",
        icons: [
          {
            src: "/Blue app icon design.jpg?v=2",
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: "/Blue app icon design.jpg?v=2",
            sizes: "512x512",
            type: "image/jpeg",
          },
          {
            src: "/Blue app icon design.jpg?v=2",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
