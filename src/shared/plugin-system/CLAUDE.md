# Plugin System - AI Agent Context

## What This Is
Core plugin infrastructure that enables all ChayCards features. Everything in ChayCards is a plugin - documents, tasks, knowledge management, etc.

## Key Concept
Simple game-mod style system where plugins can replace/wrap ANY component or service. No restrictions, full freedom.

## Core Components You'll Implement Here

### PluginRegistry.ts
```typescript
// Low-level storage - just Maps
class PluginRegistry {
  components = new Map<string, React.ComponentType>()
  services = new Map<string, any>()
  routes = new Map<string, Route>()
  
  getComponent(name: string) { return this.components.get(name) }
  setComponent(name: string, component: React.ComponentType) { this.components.set(name, component) }
  // ... same for services, routes
}
```

### PluginManager.ts
```typescript
// High-level API and orchestrator
class PluginManager {
  private registry = new PluginRegistry()
  private navigationItems: NavigationItem[] = []
  private regions = new Map<string, RegionComponent[]>()
  
  static getInstance() { /* singleton */ }
  
  // Navigation management
  addNavigationItem(item) { /* sort by order */ }
  getNavigationItems() { return [...this.navigationItems] }
  
  // Region management for AppShell
  addToRegion(region, component) { /* add and sort */ }
  getRegionComponents(region) { return this.regions.get(region) || [] }
  
  // Delegate to registry
  getComponent(name) { return this.registry.getComponent(name) }
  setComponent(name, comp) { this.registry.setComponent(name, comp) }
}
```

### PluginLoader.ts
```typescript
// Loads plugins in dependency order
function loadPlugins(plugins: Plugin[]): PluginRegistry {
  // 1. Resolve dependencies
  // 2. Load in order
  // 3. Call each plugin's onLoad(registry)
  // 4. Return populated registry
}
```

### Plugin.ts (types)
```typescript
interface Plugin {
  id: string
  requires?: string[]  // dependencies
  components?: Record<string, React.ComponentType>
  services?: Record<string, any>
  routes?: Route[]
  onLoad?: (registry: PluginRegistry) => void
}
```

## How Plugins Work
1. Plugin gets PluginManager in `onLoad`
2. Plugin can `getComponent('core.documents/DocumentCard')` to get original
3. Plugin can `setComponent('core.documents/DocumentCard', Enhanced)` to replace
4. Plugin can add navigation items, region components, etc.
5. Last plugin loaded wins

## Important Patterns
- **No safety rails** - plugins can break things (like game mods)
- **Everything public** - any plugin can access/modify anything
- **Simple over safe** - just Maps and functions, no magic
- **Dependencies only** - `requires: ['core.documents']` ensures load order

## Example Plugin Usage
```typescript
// In src/plugins/ai-enhance/index.ts
export const AIPlugin: Plugin = {
  id: 'ai-enhance',
  requires: ['core.documents'],
  onLoad: (manager) => {
    const Original = manager.getComponent('core.documents/DocumentCard')
    const Enhanced = (props) => (
      <>
        <AITags doc={props.doc} />
        <Original {...props} />
      </>
    )
    manager.setComponent('core.documents/DocumentCard', Enhanced)
  }
}
```

## File Structure Here
```
plugin-system/
  PluginRegistry.ts    # The Map-based registry
  PluginLoader.ts      # Dependency resolution & loading
  PluginManager.ts     # High-level API (singleton)
  types.ts             # Plugin interface & types
  index.ts             # Public exports
```

## Key Decisions
- No hooks/slots/extension points - just replace components
- No version checking in code - manifest handles compatibility  
- No plugin sandboxing - full trust model
- Global registry accessible everywhere via PluginManager.getInstance()

## Related
- Actual plugins live in `/src/plugins/`
- Full docs at `/memory-bank/docs/PLUGIN_SYSTEM.md`
- Core plugins: documents, tasks, knowledge