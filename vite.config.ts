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
    proxy: {
      '/api': {
        target: 'http://localhost:7243',
        changeOrigin: true
      }
    }
  },
  define: {
    // Make environment variables available at build time
    'import.meta.env.VITE_STORAGE_API_URL': JSON.stringify(
      process.env.VITE_STORAGE_API_URL || '/api/storage'
    )
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
}));
