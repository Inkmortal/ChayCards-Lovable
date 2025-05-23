# Layouts - AI Context

## What This Is
App-level layouts that host plugins. Keep minimal.

## AppShell.tsx Pattern
```typescript
export const AppShell = () => {
  const pluginManager = PluginManager.getInstance();
  const navigation = pluginManager.getNavigationItems();
  const routes = pluginManager.getRoutes();
  
  return (
    <div className="flex h-screen">
      <Sidebar>
        {navigation.map(item => (
          <NavLink key={item.path} to={item.path}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </Sidebar>
      
      <main className="flex-1">
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
  );
};
```

## Key Points
- Gets ALL navigation from plugins
- Gets ALL routes from plugins  
- Uses PluginHost to render components
- No hardcoded features

## Don't Add
- Feature-specific layouts
- Business logic
- Direct plugin imports