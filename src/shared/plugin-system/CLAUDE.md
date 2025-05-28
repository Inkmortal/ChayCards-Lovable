# Plugin System - AI Agent Context

## What This Is
Core plugin infrastructure that enables all ChayCards features. Everything in ChayCards is a plugin - documents, tasks, knowledge management, etc.

## Key Concept
Simple game-mod style system where plugins can replace/wrap ANY component or service. No restrictions, full freedom.

## Core Components You'll Implement Here

### PluginManager.ts
```typescript
// Single class handles everything - no separate Registry
class PluginManager {
  // Storage
  private components = new Map<string, React.ComponentType>()
  private services = new Map<string, any>()
  private routes = new Map<string, Route>()
  
  // Plugin management
  private eventBus = new EventBus()
  private navigationItems: NavigationItem[] = []
  private regions = new Map<string, RegionComponent[]>()
  
  static getInstance() { /* singleton */ }
  
  // Component/Service access
  getComponent(name) { return this.components.get(name) }
  setComponent(name, comp) { 
    this.components.set(name, comp)
    this.eventBus.emit('component:registered', { name })
  }
  
  // Navigation management
  addNavigationItem(item) { /* sort by order */ }
  getNavigationItems() { return [...this.navigationItems] }
  
  // Region management for AppShell
  addToRegion(region, component) { /* add and sort */ }
  getRegionComponents(region) { return this.regions.get(region) || [] }
  
  // Event bus access
  getEventBus() { return this.eventBus }
}
```

### PluginLoader.ts
```typescript
// Loads plugins in dependency order
function loadPlugins(plugins: Plugin[]): void {
  const manager = PluginManager.getInstance()
  // 1. Resolve dependencies
  // 2. Load in order
  // 3. Call each plugin's onLoad(manager)
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
  onLoad?: (manager: PluginManager) => void
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
  PluginManager.ts     # Everything - storage, loading, events (singleton)
  PluginLoader.ts      # Dependency resolution & dynamic imports
  EventBus.ts          # Simple pub/sub implementation
  types.ts             # Plugin interface & types
  index.ts             # Public exports
```

## Key Decisions
- No separate Registry class - PluginManager handles everything
- No hooks/slots/extension points - just replace components
- No version checking in code - manifest handles compatibility  
- No plugin sandboxing - full trust model
- Global access via PluginManager.getInstance()

## Related
- Actual plugins live in `/src/plugins/`
- Full docs at `/memory-bank/docs/PLUGIN_SYSTEM.md`
- Core plugins: documents, tasks, knowledge