import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PluginManager } from './shared/plugin-system'
import { loadPublicTheme } from './utils/publicThemeLoader'

async function startApp() {
  try {
    // Check if we're on a public page (no plugins needed)
    const isPublicPage = ['/', '/login', '/register', '/setup'].some(path =>
      window.location.pathname === path || window.location.pathname.startsWith(path + '/')
    );

    if (isPublicPage) {
      console.log('Public page detected - skipping plugin initialization');
      // Load theme from localStorage for public pages
      loadPublicTheme();
      // Start React app directly without plugins
      createRoot(document.getElementById("root")!).render(<App />);
      return;
    }

    // Initialize plugin system before React (only for app pages)
    const pluginManager = PluginManager.getInstance();

    console.log('Loading ChayCards plugins...');
    // Note: loadAllPlugins() now handles storage initialization internally
    await pluginManager.loadAllPlugins();

    console.log('Plugins and storage initialized, starting React app...');

    // Start React app after plugins and storage are ready
    createRoot(document.getElementById("root")!).render(<App />);

  } catch (error) {
    console.error('Failed to initialize ChayCards:', error);

    // Show error message to user
    const root = document.getElementById("root")!;
    root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: system-ui, sans-serif;
        text-align: center;
        padding: 2rem;
        color: #dc2626;
      ">
        <h1 style="margin-bottom: 1rem;">Failed to Start ChayCards</h1>
        <p style="margin-bottom: 1rem; color: #6b7280;">There was an error loading the application plugins.</p>
        <details style="text-align: left; max-width: 500px;">
          <summary style="cursor: pointer; margin-bottom: 0.5rem;">Error Details</summary>
          <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.875rem;">${error}</pre>
        </details>
        <button onclick="location.reload()" style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        ">Reload App</button>
      </div>
    `;
  }
}

// Start the application
startApp();
