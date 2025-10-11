/**
 * AppShell - Main application layout that hosts all plugins
 * Provides regions (header, sidebar, main, footer) where plugins can mount components
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { PanelLeft, PanelLeftClose, BookOpen, Loader2 } from 'lucide-react';
import { PluginManager } from '../../shared/plugin-system';
import { PluginHost } from '../plugin-host/PluginHost';
import { STORAGE_KEYS } from '@/shared/constants';
import { isElectron } from '@/utils/platform';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [pluginsLoading, setPluginsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const pluginManager = PluginManager.getInstance();

  // Get ThemeSelector from plugin
  const ThemeSelector = pluginManager.getComponent('core-theme/ThemeSelector');

  // Auth guard and plugin loading - runs ONCE on mount
  useEffect(() => {
    const checkAuthAndLoadPlugins = async () => {
      // Electron: Check for active local profile
      if (isElectron() && window.electronAPI) {
        const lastProfileId = localStorage.getItem(STORAGE_KEYS.LAST_PROFILE_ID);

        if (!lastProfileId) {
          // Load public-safe plugins before redirecting to profile selection
          console.log('[AppShell] No profile - loading public plugins before redirect');
          await pluginManager.loadPublicSafePlugins();
          navigate('/profile', { replace: true });
          return;
        }

        try {
          const profile = await window.electronAPI.user.get(lastProfileId);
          if (!profile) {
            localStorage.removeItem(STORAGE_KEYS.LAST_PROFILE_ID);
            // Load public-safe plugins before redirecting to profile selection
            console.log('[AppShell] Profile not found - loading public plugins before redirect');
            await pluginManager.loadPublicSafePlugins();
            navigate('/profile', { replace: true });
            return;
          }

          // Update last used timestamp
          await window.electronAPI.user.setActive(lastProfileId);
        } catch (error) {
          console.error('[AppShell] Failed to verify profile:', error);
          // Load public-safe plugins before redirecting to profile selection
          console.log('[AppShell] Profile error - loading public plugins before redirect');
          await pluginManager.loadPublicSafePlugins();
          navigate('/profile', { replace: true });
          return;
        }
      } else {
        // Web: Check for cloud auth token
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
          // Load public-safe plugins before redirecting to login
          // This ensures theme selector works on login page
          console.log('[AppShell] No auth - loading public plugins before redirect');
          await pluginManager.loadPublicSafePlugins();
          navigate('/login', { replace: true });
          return;
        }
      }

      // Check if plugins were loaded on public page (without storage context)
      // If so, reset them so they reload with proper authenticated storage
      const hasLoadedPlugins = pluginManager.getLoadedPlugins().length > 0;
      const hasStorage = pluginManager.getStorage() !== null;

      if (hasLoadedPlugins && !hasStorage) {
        console.log('[AppShell] Plugins were loaded without storage - resetting for authenticated context');
        pluginManager.resetPlugins();
      }

      // Load plugins with authenticated storage context
      setPluginsLoading(true);
      try {
        await pluginManager.loadAllPlugins();
        setPluginsLoaded(true);
      } catch (error) {
        console.error('[AppShell] Failed to load plugins:', error);
      } finally {
        setPluginsLoading(false);
      }
    };

    checkAuthAndLoadPlugins();
  }, []); // Empty dependency array - run ONCE on mount

  // Get plugin-driven content
  const navigation = pluginManager.getNavigationItems();
  const routes = pluginManager.getAllRoutes();
  const headerComponents = pluginManager.getRegionComponents('header');
  const sidebarComponents = pluginManager.getRegionComponents('sidebar');
  const footerComponents = pluginManager.getRegionComponents('footer');

  // Redirect to first plugin route when landing on /app
  useEffect(() => {
    if (!pluginsLoaded) return; // Wait for plugins to load first

    if (location.pathname === '/app' || location.pathname === '/app/') {
      const availableRoutes = pluginManager.getAllRoutes();
      if (availableRoutes.length > 0) {
        // Sort routes by order (if they have one) and navigate to first
        const firstRoute = availableRoutes.sort((a, b) => (a.order || 999) - (b.order || 999))[0];
        navigate(firstRoute.path, { replace: true });
      }
    }
  }, [location.pathname, navigate, pluginsLoaded]);

  // Show loading screen while plugins are loading (prevents theme flash)
  if (pluginsLoading || !pluginsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading ChayCards...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="app-shell h-full flex flex-col bg-background text-foreground">
      {/* Header Region */}
      <header className="app-header h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--primary-foreground))' }} />
          </div>
          <h1 className="text-lg font-bold">ChayCards</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Header Plugin Components */}
        <div className="flex items-center gap-2">
          {headerComponents.map((comp, index) => (
            <PluginHost key={`${comp.id}-${index}`} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
          ))}
          {/* Theme selector */}
          {ThemeSelector && <ThemeSelector />}
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-body flex-1 flex overflow-hidden">
        {/* Sidebar Region */}
        <aside
          className={`app-sidebar ${
            sidebarOpen ? 'w-64' : 'w-12'
          } border-r border-border bg-card/30 flex flex-col transition-all duration-300`}
        >
          {sidebarOpen ? (
            <>
              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ minHeight: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Navigation
                  </div>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Close sidebar"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                {navigation.length > 0 ? (
                  navigation.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'hover:bg-muted/50 text-foreground'
                        }`
                      }
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No navigation items registered
                  </div>
                )}
              </nav>

              {/* Sidebar Plugin Components */}
              {sidebarComponents.length > 0 && (
                <div className="border-t border-border p-3 space-y-2 flex-shrink-0 w-full min-w-0">
                  {sidebarComponents.map((comp, index) => (
                    <PluginHost key={`${comp.id}-${index}`} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Collapsed thin bar */
            <div className="flex-1 flex flex-col items-center p-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Open sidebar"
              >
                <PanelLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="app-main flex-1 overflow-auto bg-background relative">
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path.replace('/app', '')}
                element={<PluginHost componentName={typeof route.component === 'string' ? route.component : route.path} />}
              />
            ))}

            {/* Default route - shows loading or welcome message */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-full">
                  {pluginsLoading ? (
                    // Loading state - show spinner while plugins are loading
                    <div className="text-center space-y-4 max-w-md">
                      <div
                        className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Loading your workspace...</h2>
                      <p className="text-muted-foreground">
                        Setting up your plugins and preferences
                      </p>
                    </div>
                  ) : (
                    // No plugins loaded (after loading completed)
                    <div className="text-center space-y-4 max-w-md">
                      <div
                        className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(145deg, hsl(var(--muted)), hsl(var(--muted) / 0.5))',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Welcome to ChayCards</h2>
                      <p className="text-muted-foreground">
                        {routes.length === 0
                          ? 'No plugins are currently loaded.'
                          : 'Select a navigation item to get started.'}
                      </p>
                      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                        <p>Available routes:</p>
                        <ul className="space-y-1">
                          {routes.map((route) => (
                            <li key={route.path} className="font-mono">
                              {route.path}
                            </li>
                          ))}
                          {routes.length === 0 && <li className="italic">No plugin routes registered</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Footer Region */}
      {footerComponents.length > 0 && (
        <footer className="app-footer h-10 border-t border-border bg-card/50 flex items-center px-4 gap-2">
          {footerComponents.map((comp, index) => (
            <PluginHost key={`${comp.id}-${index}`} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
          ))}
        </footer>
      )}
    </div>
  );
};

export default AppShell;