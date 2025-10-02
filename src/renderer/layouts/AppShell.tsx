/**
 * AppShell - Main application layout that hosts all plugins
 * Provides regions (header, sidebar, main, footer) where plugins can mount components
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import { PluginManager } from '../../shared/plugin-system';
import { PluginHost } from '../plugin-host/PluginHost';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pluginManager = PluginManager.getInstance();

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('[AppShell] No auth token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // If authenticated, initialize plugins
    const initPlugins = async () => {
      const routes = pluginManager.getAllRoutes();
      if (routes.length === 0) {
        console.log('[AppShell] Loading plugins...');
        await pluginManager.loadAllPlugins();
        setPluginsLoaded(true);
      } else {
        setPluginsLoaded(true);
      }
    };

    initPlugins();
  }, [navigate]);

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
      if (routes.length > 0) {
        // Sort routes by order (if they have one) and navigate to first
        const firstRoute = routes.sort((a, b) => (a.order || 999) - (b.order || 999))[0];
        navigate(firstRoute.path, { replace: true });
      }
    }
  }, [location.pathname, routes, navigate, pluginsLoaded]);

    return (
    <div className="app-shell h-full flex flex-col bg-background text-foreground">
      {/* Header Region */}
      <header className="app-header h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4">
        {/* Logo and App Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
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
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Header Plugin Components */}
        <div className="flex items-center gap-2">
          {headerComponents.map((comp) => (
            <PluginHost key={comp.id} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
          ))}
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-body flex-1 flex overflow-hidden">
        {/* Sidebar Region */}
        <aside
          className={`app-sidebar ${
            sidebarOpen ? 'w-64' : 'w-0'
          } border-r border-border bg-card/30 flex flex-col transition-all duration-300 overflow-hidden`}
        >
          {sidebarOpen && (
            <>
              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ minHeight: 0 }}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Navigation
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
                      {item.icon && (
                        <span className="w-4 h-4 flex items-center justify-center">
                          {/* Icon rendering would need icon component system */}
                          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                        </span>
                      )}
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
                  {sidebarComponents.map((comp) => (
                    <PluginHost key={comp.id} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="app-main flex-1 overflow-auto bg-background">
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path.replace('/app', '')}
                element={<PluginHost componentName={typeof route.component === 'string' ? route.component : route.path} />}
              />
            ))}

            {/* Default route - shows when no plugins have routes */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-full">
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
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Footer Region */}
      {footerComponents.length > 0 && (
        <footer className="app-footer h-10 border-t border-border bg-card/50 flex items-center px-4 gap-2">
          {footerComponents.map((comp) => (
            <PluginHost key={comp.id} componentName={typeof comp.component === 'string' ? comp.component : comp.id} />
          ))}
        </footer>
      )}
    </div>
  );
};

export default AppShell;