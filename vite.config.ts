import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true, // Exit if port is already in use instead of trying another
    hmr: {
      overlay: true, // Show HMR errors in browser
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
