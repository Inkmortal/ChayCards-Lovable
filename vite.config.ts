import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ['dev.chaycards.com'], // Allow Cloudflare tunnel domain
    strictPort: true, // Exit if port is already in use instead of trying another
    hmr: {
      overlay: true, // Show HMR errors in browser
    },
    watch: {
      usePolling: true, // Required for WSL2 when files are in /mnt/c (Windows filesystem)
      interval: 100, // Poll every 100ms (default is 100ms anyway)
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle plugin modules for faster HMR
    include: ['react', 'react-dom'],
    // Exclude plugins from pre-bundling so HMR can reload them individually
    exclude: ['src/plugins/*'],
  },
}));
