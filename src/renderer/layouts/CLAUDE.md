# Layouts - AI Context

## What This Is
App-level layouts that host plugins. Keep minimal.

## AppShell.tsx Pattern
```typescript
export const AppShell = () => {
  const pluginManager = PluginManager.getInstance();
  const navigation = pluginManager.getNavigationItems();
  const routes = pluginManager.getRoutes();
  
  // NEW: Get region components
  const headerComponents = pluginManager.getRegionComponents('header');
  const sidebarComponents = pluginManager.getRegionComponents('sidebar');
  const footerComponents = pluginManager.getRegionComponents('footer');
  
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-4">
        {headerComponents.map(comp => (
          <PluginHost key={comp.id} componentName={comp.component} />
        ))}
      </header>
      
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r flex flex-col">
          <nav className="flex-1 p-4">
            {navigation.map(item => (
              <NavLink key={item.path} to={item.path}>
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          {sidebarComponents.map(comp => (
            <PluginHost key={comp.id} componentName={comp.component} />
          ))}
        </aside>
        
        {/* Main */}
        <main className="flex-1 overflow-auto">
          <Routes>
            {routes.map(route => (
              <Route 
                key={route.path}
                path={route.path}
                element={<PluginHost componentName={route.component} />}
              />
            ))}
          </Routes>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="h-10 border-t flex items-center px-4">
        {footerComponents.map(comp => (
          <PluginHost key={comp.id} componentName={comp.component} />
        ))}
      </footer>
    </div>
  );
};
```

## Key Points
- Gets ALL navigation from plugins
- Gets ALL routes from plugins  
- Gets ALL region components from plugins
- Uses PluginHost to render everything
- No hardcoded features
- Just provides layout structure

## Regions
- **header**: Top bar for global actions
- **sidebar**: Navigation + plugin tools  
- **main**: Content area (via routes)
- **footer**: Status bar

## Don't Add
- Feature-specific code
- Business logic
- Direct plugin imports
- Theme handling (that's a plugin!)
- Any actual functionality

## Remember
This is JUST the stage. All actors (features, themes, etc.) are plugins.