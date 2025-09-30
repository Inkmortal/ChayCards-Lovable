# Layouts - AI Context

## What This Is
App-level layouts that host plugins. Keep minimal. **Implementation complete and verified.**

## AppShell.tsx - Actual Implementation
Located at: `src/renderer/layouts/AppShell.tsx` (179 lines)

### Structure
```typescript
export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Collapsible sidebar
  const pluginManager = PluginManager.getInstance();

  // Plugin-driven content
  const navigation = pluginManager.getNavigationItems();
  const routes = pluginManager.getAllRoutes();
  const headerComponents = pluginManager.getRegionComponents('header');
  const sidebarComponents = pluginManager.getRegionComponents('sidebar');
  const footerComponents = pluginManager.getRegionComponents('footer');

  // Four regions: header, sidebar, main, footer
}
```

### Features Implemented
1. **Collapsible Sidebar** (lines 13, 29-33, 63-66)
   - Toggle button with Menu/X icons
   - Smooth width transition (300ms)
   - State managed with useState

2. **Header Region** (lines 26-58)
   - Logo and app name with gradient background
   - Sidebar toggle button
   - Plugin components rendered via PluginHost
   - Semantic theme variables for colors

3. **Sidebar Region** (lines 63-114)
   - Navigation section with plugin-driven links
   - Active state highlighting with primary color
   - Plugin components in separate section below nav
   - Smooth collapse animation

4. **Main Region** (lines 117-164)
   - React Router Routes from plugins
   - PluginHost renders route components
   - Default fallback route with welcome message
   - Shows available routes when no match

5. **Footer Region** (lines 168-174)
   - Conditional rendering (only if components exist)
   - Plugin components rendered via PluginHost

### Routing
- Accessed via `/app/*` route in App.tsx
- AppShell strips `/app` prefix from routes (line 122)
- Example: plugin route `/app/documents` becomes `path="/documents"` inside Routes

### Default Route Behavior
When no routes match (line 129-161):
- Shows ChayCards logo
- Welcome message
- Lists all available plugin routes
- Indicates if no plugins loaded

## Key Implementation Details
- **File**: `src/renderer/layouts/AppShell.tsx`
- **Size**: 179 lines (within 150-200 target)
- **Dependencies**: PluginManager (singleton), PluginHost, React Router
- **State**: Only sidebar toggle (no other state needed)
- **Theme**: Uses semantic CSS variables (--background, --foreground, --primary, etc.)
- **Error Handling**: Delegated to PluginHost error boundaries

## Regions System
- **header**: Global actions, user info (plugins can add here)
- **sidebar**: Navigation (auto-generated) + plugin tools
- **main**: Routes (auto-generated from plugin routes)
- **footer**: Status indicators (only shows if components registered)

## Plugin Integration Examples
```typescript
// Plugin adds to header region
manager.addToRegion('header', {
  id: 'search-bar',
  component: 'core.search/SearchBar',
  order: 10  // determines position (lower = left)
})

// Plugin adds to sidebar region
manager.addToRegion('sidebar', {
  id: 'quick-stats',
  component: 'core.stats/QuickView',
  order: 50
})

// Plugin adds route (automatically appears in main)
manager.addRoute({
  path: '/app/documents',
  component: 'core.documents/DocumentList',
  label: 'Documents',
  showInNav: true  // adds to navigation automatically
})
```

## Don't Add
- Feature-specific code (belongs in plugins)
- Business logic (belongs in plugins)
- Direct plugin imports (use PluginManager)
- Theme handling (theme is a plugin)
- Any actual functionality (this is just a stage)

## Current Status
✅ Complete and matches documentation
✅ Collapsible sidebar bonus feature
✅ Semantic theme variables throughout
✅ Clean, maintainable code
✅ Ready for plugins to use all regions