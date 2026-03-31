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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "Blue app icon design.jpg"],
      manifest: {
        short_name: 'FerAcier',
        name: 'Fer Acier Pro - Gestionnaire',
        description: 'Application de gestion pour ferrailleur',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ["standalone", "fullscreen", "minimal-ui", "browser"],
        icons: [
          {
            src: "Blue app icon design.jpg",
            sizes: "192x192",
            type: "image/jpeg"
          },
          {
            src: "Blue app icon design.jpg",
            sizes: "512x512",
            type: "image/jpeg"
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,jpg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('react-dom')) return 'vendor-react';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('lucide-react') || id.includes('framer-motion')) return 'vendor-ui';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
        }
      },
      sourcemap: false,
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
        passes: 2,
      },
    },
    target: 'esnext',
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));

