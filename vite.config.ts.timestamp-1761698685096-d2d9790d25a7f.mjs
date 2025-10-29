// vite.config.ts
import { defineConfig } from "file:///mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/mnt/c/Users/danhc/Documents/Projects/ChayCards-Lovable";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    // Exit if port is already in use instead of trying another
    hmr: {
      overlay: true
      // Show HMR errors in browser
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    // Force Vite to pre-bundle plugin modules for faster HMR
    include: ["react", "react-dom"],
    // Exclude plugins from pre-bundling so HMR can reload them individually
    exclude: ["src/plugins/*"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvZGFuaGMvRG9jdW1lbnRzL1Byb2plY3RzL0NoYXlDYXJkcy1Mb3ZhYmxlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2MvVXNlcnMvZGFuaGMvRG9jdW1lbnRzL1Byb2plY3RzL0NoYXlDYXJkcy1Mb3ZhYmxlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvYy9Vc2Vycy9kYW5oYy9Eb2N1bWVudHMvUHJvamVjdHMvQ2hheUNhcmRzLUxvdmFibGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSwgLy8gRXhpdCBpZiBwb3J0IGlzIGFscmVhZHkgaW4gdXNlIGluc3RlYWQgb2YgdHJ5aW5nIGFub3RoZXJcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiB0cnVlLCAvLyBTaG93IEhNUiBlcnJvcnMgaW4gYnJvd3NlclxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIC8vIEZvcmNlIFZpdGUgdG8gcHJlLWJ1bmRsZSBwbHVnaW4gbW9kdWxlcyBmb3IgZmFzdGVyIEhNUlxyXG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcclxuICAgIC8vIEV4Y2x1ZGUgcGx1Z2lucyBmcm9tIHByZS1idW5kbGluZyBzbyBITVIgY2FuIHJlbG9hZCB0aGVtIGluZGl2aWR1YWxseVxyXG4gICAgZXhjbHVkZTogWydzcmMvcGx1Z2lucy8qJ10sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVWLFNBQVMsb0JBQW9CO0FBQ3BYLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQTtBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLEVBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBO0FBQUEsSUFFWixTQUFTLENBQUMsU0FBUyxXQUFXO0FBQUE7QUFBQSxJQUU5QixTQUFTLENBQUMsZUFBZTtBQUFBLEVBQzNCO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
