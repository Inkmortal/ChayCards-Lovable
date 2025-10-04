import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PluginManager } from './shared/plugin-system'
import { isPublicPage } from './utils/routeUtils'
import { STORAGE_KEYS } from './shared/constants'
import { isElectron } from './utils/platform'

// Import public-safe plugins (no user-specific data)
import CoreUIPlugin from './plugins/core-ui'
import CoreThemePlugin from './plugins/core-theme'

async function startApp() {
  try {
    // Check if we're on a public page
    if (isPublicPage()) {
      // Check authentication status (works for both Electron and web)
      const hasAuth = isElectron()
        ? !!localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID)
        : !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (hasAuth) {
        // Authenticated user on public page (e.g., logged in but viewing landing page)
        // Let React render and AppShell will handle full plugin loading with user storage
        console.log('[main.tsx] Authenticated user on public page - AppShell will load full plugins');
        createRoot(document.getElementById("root")!).render(<App />);
        return;
      }

      // Anonymous user on public page - load minimal plugins with localStorage only
      console.log('[main.tsx] Anonymous user on public page - loading public-safe plugins only');

      // Get plugin manager (no initialization needed - plugins handle storage gracefully)
      const pluginManager = PluginManager.getInstance();

      // Load only UI and theme plugins (no user-specific settings for anonymous users)
      console.log('[main.tsx] Loading CoreUIPlugin...');
      await pluginManager.loadPlugin(CoreUIPlugin);

      console.log('[main.tsx] Loading CoreThemePlugin...');
      await pluginManager.loadPlugin(CoreThemePlugin);

      console.log('[main.tsx] Public-safe plugins loaded successfully:', ['core-ui', 'core-theme']);

      // Verify theme service is available
      const themeService = pluginManager.getService('core-theme/themeService');
      console.log('[main.tsx] ThemeService available:', !!themeService);
      if (themeService) {
        console.log('[main.tsx] Available themes:', themeService.getAvailableThemes());
        console.log('[main.tsx] Current theme:', themeService.getCurrentTheme());
      }

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
