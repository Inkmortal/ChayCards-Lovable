# AppShell Architecture Document

## Overview

The AppShell is a minimal layout component that lives in `/src/renderer/layouts/` and serves as the stage for all plugins. It provides the basic application structure with designated regions where plugins can render their content.

## Core Philosophy

- **AppShell is just a stage**: No features, no business logic, just structure
- **Everything is a plugin**: All functionality comes from plugins
- **Keep it minimal**: AppShell should be ~100-150 lines max

## Integration with Existing Project Structure

```
src/
├── renderer/                    # Minimal shell
│   ├── layouts/
│   │   └── AppShell.tsx        # This component
│   ├── plugin-host/
│   │   └── PluginHost.tsx      # Already exists - renders plugin components
│   └── hooks/
│       └── usePlugin.ts        # Plugin access helper
└── plugins/                    # ALL features live here
    └── [all plugins]
```

## AppShell Component Structure

```pseudo
function AppShell() {
  const pluginManager = PluginManager.getInstance()
  const navigation = pluginManager.getNavigationItems()
  const routes = pluginManager.getRoutes()
  
  // Get components registered for each region
  const headerComponents = pluginManager.getRegionComponents('header')
  const sidebarComponents = pluginManager.getRegionComponents('sidebar')
  const footerComponents = pluginManager.getRegionComponents('footer')
  
  return (
    <div className="app-shell">
      {/* Header Region */}
      <header className="app-header">
        {headerComponents.map(comp => 
          <PluginHost key={comp.id} componentName={comp.name} />
        )}
      </header>
      
      {/* Main Layout */}
      <div className="app-body">
        {/* Sidebar Region */}
        <aside className="app-sidebar">
          <nav>
            {navigation.map(item => (
              <NavLink to={item.path}>
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </NavLink>
            ))}
          </nav>
          {sidebarComponents.map(comp => 
            <PluginHost key={comp.id} componentName={comp.name} />
          )}
        </aside>
        
        {/* Main Content */}
        <main className="app-main">
          <Routes>
            {routes.map(route => 
              <Route 
                path={route.path}
                element={<PluginHost componentName={route.component} />} 
              />
            )}
          </Routes>
        </main>
      </div>
      
      {/* Footer Region */}
      <footer className="app-footer">
        {footerComponents.map(comp => 
          <PluginHost key={comp.id} componentName={comp.name} />
        )}
      </footer>
    </div>
  )
}
```

## Region System

AppShell defines four regions where plugins can mount components:

1. **Header** - Top bar for global actions, user info, etc.
2. **Sidebar** - Navigation and plugin-specific tools
3. **Main** - Primary content area (handled by routing)
4. **Footer** - Status bar, notifications, etc.

### Region Component Registration

Plugins register components for regions through PluginManager:

```pseudo
// In a plugin's onLoad
pluginManager.addToRegion('header', {
  id: 'my-header-widget',
  component: 'my-plugin/HeaderWidget',
  order: 50  // determines position
})
```

## Layout Structure

Basic CSS structure using Tailwind classes:

```pseudo
.app-shell {
  @apply h-screen flex flex-col;
}

.app-header {
  @apply h-14 border-b flex items-center px-4;
}

.app-body {
  @apply flex-1 flex overflow-hidden;
}

.app-sidebar {
  @apply w-64 border-r flex flex-col;
}

.app-main {
  @apply flex-1 overflow-auto;
}

.app-footer {
  @apply h-10 border-t flex items-center px-4;
}
```

## Plugin Manager Enhancement

The PluginManager needs these methods for AppShell:

```pseudo
class PluginManager {
  private regions = new Map<string, RegionComponent[]>()
  
  addToRegion(region: string, component: RegionComponent) {
    if (!this.regions.has(region)) {
      this.regions.set(region, [])
    }
    this.regions.get(region).push(component)
    this.sortRegion(region)
  }
  
  getRegionComponents(region: string): RegionComponent[] {
    return this.regions.get(region) || []
  }
  
  private sortRegion(region: string) {
    const components = this.regions.get(region)
    if (components) {
      components.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  }
}
```

## Error Handling

AppShell relies on the existing PluginHost component for error boundaries. Each plugin component is wrapped automatically, so AppShell doesn't need its own error handling.

## Implementation Steps

1. **Update AppShell.tsx**
   - Add region divs with proper CSS classes
   - Call `getRegionComponents` for each region
   - Render components using existing PluginHost

2. **Enhance PluginManager**
   - Add region management methods
   - Store region component registrations
   - Handle ordering/sorting

3. **Test with Sample Plugin**
   - Create a simple plugin that adds to header
   - Verify it renders in correct position

## Example Plugin Usage

```pseudo
// Example: Search plugin adds search bar to header
export const SearchPlugin: Plugin = {
  id: 'search',
  name: 'Global Search',
  
  onLoad: (manager) => {
    manager.addToRegion('header', {
      id: 'global-search',
      component: 'search/SearchBar',
      order: 10  // far left
    })
  }
}

// Example: Status plugin adds to footer
export const StatusPlugin: Plugin = {
  id: 'status',
  name: 'System Status',
  
  onLoad: (manager) => {
    manager.addToRegion('footer', {
      id: 'system-status',
      component: 'status/StatusIndicator',
      order: 90  // far right
    })
  }
}
```

## Key Benefits

1. **Minimal Code**: AppShell remains small and focused
2. **Maximum Flexibility**: Plugins control what appears where
3. **No Dependencies**: AppShell doesn't know about themes, features, etc.
4. **Clean Separation**: Layout is separate from functionality

## Testing Strategy

```pseudo
describe('AppShell', () => {
  test('renders all regions', () => {
    // Mock empty plugin manager
    // Verify header, sidebar, main, footer exist
  })
  
  test('renders navigation from plugins', () => {
    // Mock navigation items
    // Verify nav links render
  })
  
  test('renders region components', () => {
    // Mock region components
    // Verify PluginHost called for each
  })
})
```

## Future Considerations

- **Resizable Regions**: Could add resize handles between regions
- **Collapsible Sidebar**: Could add toggle button
- **Multiple Layouts**: Plugins could provide alternative layouts
- **Responsive Design**: Mobile-friendly layout adjustments

## Conclusion

AppShell provides the minimal structure needed for plugins to build upon. By keeping it simple and focused solely on layout, we enable maximum flexibility while maintaining clean architecture.