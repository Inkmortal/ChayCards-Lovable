# Plugin System - AI Agent Context

## What This Is
Core plugin infrastructure that enables all ChayCards features. **Implementation complete and verified.**

Everything in ChayCards is a plugin - documents, tasks, themes, even knowledge management.

## Key Concept
Simple game-mod style system where plugins can replace/wrap ANY component or service. No restrictions, full freedom.

## PluginManager.ts - Actual Implementation
Located at: `src/shared/plugin-system/PluginManager.ts` (303 lines)

### Complete API
```typescript
class PluginManager {
  // Singleton
  static getInstance(): PluginManager

  // Component Registry (lines 40-48)
  getComponent(name: string): ComponentType<any> | undefined
  setComponent(name: string, component: ComponentType<any>): void

  // Service Registry (lines 50-58)
  getService(name: string): any
  setService(name: string, service: any): void

  // Route Management (lines 60-67)
  addRoute(route: Route): void
  getAllRoutes(): Route[]

  // Navigation Management (lines 69-77)
  addNavigationItem(item: NavigationItem): void
  getNavigationItems(): NavigationItem[]

  // Region Management (lines 79-90)
  addToRegion(region: string, component: RegionComponent): void
  getRegionComponents(region: string): RegionComponent[]

  // Event Bus (lines 92-95)
  getEventBus(): EventBus

  // Plugin Loading (lines 97-162)
  async loadPlugin(plugin: Plugin): Promise<void>
  async loadAllPlugins(): Promise<void>
  async unloadPlugin(pluginId: string): Promise<void>

  // Debug Methods (lines 291-302)
  getLoadedPlugins(): Plugin[]
  getRegisteredComponents(): string[]
  getRegisteredServices(): string[]
}
```

### Internal Storage (lines 19-30)
```typescript
private components = new Map<string, ComponentType<any>>()
private services = new Map<string, any>()
private routes = new Map<string, Route>()
private loadedPlugins = new Map<string, Plugin>()
private eventBus = new EventBus()
private navigationItems: NavigationItem[] = []
private regions = new Map<string, RegionComponent[]>()
```

## Plugin Loading Process

### loadAllPlugins() (lines 165-201)
1. Uses Vite glob import: `import.meta.glob('/src/plugins/*/index.ts')`
2. Dynamically imports all plugin modules
3. Extracts default export from each
4. Sorts by dependencies (topological sort)
5. Loads each plugin in order
6. Emits 'plugins:all-loaded' event

### loadPlugin() (lines 98-162)
1. Checks if already loaded (prevent duplicates)
2. Validates dependencies are loaded
3. Registers components with namespace (e.g., "core-theme/ThemeSelector")
4. Registers services with namespace
5. Registers routes and auto-creates navigation items
6. Calls plugin's onLoad hook
7. Marks plugin as loaded
8. Emits 'plugin:loaded' event

### Dependency Resolution (lines 243-278)
- Topological sort algorithm
- Detects circular dependencies
- Ensures plugins load in correct order
- Warns about missing dependencies

## Component Namespacing
Plugins use `pluginId/componentName` format:
```typescript
// Plugin manifest
components: {
  'ThemeSelector': ThemeSelector  // component name
}

// PluginManager registers as:
'core-theme/ThemeSelector'  // pluginId/componentName

// Access via:
manager.getComponent('core-theme/ThemeSelector')
```

## Route Auto-Registration (lines 133-145)
```typescript
if (plugin.routes) {
  plugin.routes.forEach(route => {
    this.addRoute(route);
    if (route.showInNav) {
      this.addNavigationItem({
        path: route.path,
        label: route.label || route.path,
        icon: route.icon,
        order: route.order || 50
      });
    }
  });
}
```

## Region Management (lines 79-90, 284-289)
```typescript
addToRegion(region: string, component: RegionComponent): void {
  if (!this.regions.has(region)) {
    this.regions.set(region, []);
  }
  this.regions.get(region)!.push(component);
  this.sortRegionComponents(region);  // sorts by order property
}
```

Regions: 'header', 'sidebar', 'main', 'footer'

## Event Bus Integration
Events emitted:
- `component:registered` - when component added
- `service:registered` - when service added
- `plugin:loaded` - when plugin finishes loading
- `plugins:all-loaded` - when all plugins loaded
- `plugin:unloaded` - when plugin removed

## Plugin Structure Example
```typescript
// src/plugins/core-theme/index.ts
export const CoreThemePlugin: Plugin = {
  id: 'core-theme',
  name: 'Core Theme System',
  version: '1.0.0',
  requires: [],  // no dependencies

  components: {
    'ThemeSelector': ThemeSelector
  },

  services: {
    'themeService': new ThemeService()
  },

  onLoad: async (manager) => {
    const themeService = manager.getService('core-theme/themeService');
    manager.getEventBus().on('theme:change-request', ({ themeId }) => {
      themeService.setTheme(themeId);
    });
  }
}
```

## Component Enhancement Pattern
```typescript
// In plugin's onLoad
const Original = manager.getComponent('core.documents/DocumentCard')
const Enhanced = (props) => (
  <>
    <AITags doc={props.doc} />
    <Original {...props} />
  </>
)
manager.setComponent('core.documents/DocumentCard', Enhanced)
// Last plugin to set wins - full replacement
```

## Integration with App

### main.tsx (lines 6-17)
```typescript
async function startApp() {
  const pluginManager = PluginManager.getInstance();
  await pluginManager.loadAllPlugins();  // load BEFORE React
  createRoot(document.getElementById("root")!).render(<App />);
}
```

Plugins load before React starts, ensuring:
- Themes apply before first render
- All components registered before routes created
- Services available immediately

## Plugin Lifecycle Pattern (IMPORTANT!)

### Two Lifecycle Hooks for Clean Separation

ChayCards provides **two lifecycle hooks** to prevent race conditions:
- ✅ `onLoad` - Register components/services (90% of plugins)
- ✅ `onPluginsReady` - Use other plugins' registrations (10% of plugins)
- ✅ No manual event handling required
- ✅ Clear separation prevents timing bugs

### Race Condition Prevention

**Problem**: Plugin A loads before Plugin B registers definitions
```typescript
// ❌ BAD: theme-gruvbox hasn't registered yet!
onLoad: async (manager) => {
  const themeService = manager.getService('core-theme/themeService');
  await themeService.applyTheme('gruvbox-dark');  // FAILS - not found
}
```

**Solution**: Use `onPluginsReady` hook
```typescript
// ✅ GOOD: Load data in onLoad, apply in onPluginsReady
onLoad: async (manager) => {
  const themeService = manager.getService('core-theme/themeService');
  const storage = manager.getStorage();

  // Load theme ID from storage (safe - just data)
  await themeService.initialize(storage);
},

onPluginsReady: async (manager) => {
  const themeService = manager.getService('core-theme/themeService');

  // Apply theme now - all theme plugins registered
  await themeService.applyStoredTheme();  // Safe!
}
```

### Provider vs Consumer Pattern
- **Provider**: Registers definitions (themes, components, etc.) - only needs `onLoad`
- **Consumer**: Uses others' definitions - uses both `onLoad` and `onPluginsReady`

**See**: `/memory-bank/docs/PLUGIN_SYSTEM.md` (Plugin Lifecycle section) for full docs

## File Structure
```
plugin-system/
  PluginManager.ts     # Main singleton (303 lines) ✅
  EventBus.ts          # Pub/sub system ✅
  types.ts             # Plugin interface & types ✅
  index.ts             # Public exports ✅
```

## Key Features
- ✅ Singleton pattern (global access)
- ✅ Automatic plugin discovery (Vite glob)
- ✅ Dependency resolution (topological sort)
- ✅ Component namespacing (pluginId/name)
- ✅ Event-driven communication
- ✅ Region system for UI layout
- ✅ Auto-navigation generation
- ✅ Service registry
- ✅ Plugin unloading support
- ✅ Debug methods for inspection

## Philosophy
- **No safety rails** - plugins can break things (like game mods)
- **Everything public** - any plugin can access/modify anything
- **Simple over safe** - just Maps and functions, no magic
- **Last wins** - component replacement, not wrapping required
- **Dependencies only** - `requires: []` ensures load order
- **No sandboxing** - full trust model

## Current Status
✅ Complete implementation
✅ core-theme plugin loaded and working
✅ AppShell using all PluginManager APIs
✅ Event bus functional
✅ Ready for more plugins

## Related Files
- Plugins: `/src/plugins/`
- Full docs: `/memory-bank/docs/PLUGIN_SYSTEM.md`
- Types: `src/shared/plugin-system/types.ts`
- Example: `src/plugins/core-theme/index.ts`