import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PluginManager } from './shared/plugin-system'
import { isPublicPage } from './utils/routeUtils'

async function startApp() {
  try {
    // Check if we're on a public page
    if (isPublicPage()) {
      // Public pages always load public-safe plugins for all users
      // Pages handle their own auth redirects to /app
      console.log('[main.tsx] Public page - loading public-safe plugins for all users');

      // Get plugin manager and load public-safe plugins (UI + themes)
      const pluginManager = PluginManager.getInstance();
      await pluginManager.loadPublicSafePlugins();

      // Start React app with plugins available
      createRoot(document.getElementById("root")!).render(<App />);
      return;
    }

    // For app pages: check auth first, let AppShell handle redirect if needed
    // Don't load plugins yet - AppShell will load them after auth check
    console.log('App page detected - starting React, AppShell will handle auth and plugins');
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
