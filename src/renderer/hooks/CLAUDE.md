# Hooks - AI Context

## What This Is
React hooks for plugin system interaction.

## usePlugin Hook
```typescript
// hooks/usePlugin.ts
export function usePlugin(pluginId?: string) {
  const manager = PluginManager.getInstance();
  
  return {
    // Get component (with optional plugin scope)
    getComponent: (name: string) => {
      const fullName = pluginId ? `${pluginId}/${name}` : name;
      return manager.getComponent(fullName);
    },
    
    // Get service
    getService: (name: string) => {
      const fullName = pluginId ? `${pluginId}/${name}` : name;
      return manager.getService(fullName);
    },
    
    // Emit events
    emit: (event: string, data?: any) => {
      manager.emit(event, data);
    },
    
    // Check if plugin exists
    hasPlugin: (id: string) => {
      return manager.hasPlugin(id);
    }
  };
}
```

## Usage Examples
```typescript
// Scoped to specific plugin
const ui = usePlugin('core.ui');
const Card = ui.getComponent('Card'); // Gets 'core.ui/Card'

// Global access
const { getComponent } = usePlugin();
const DocList = getComponent('core.documents/DocumentList');

// Events
const { emit } = usePlugin();
emit('document:created', { id: '123' });
```

## usePluginManager Hook
```typescript
// For AppShell and system components only
export function usePluginManager() {
  const manager = PluginManager.getInstance();
  
  return {
    getNavigationItems: () => manager.getNavigationItems(),
    getRoutes: () => manager.getRoutes(),
    loadPlugin: (plugin: Plugin) => manager.loadPlugin(plugin)
  };
}
```

## Other Hooks Here
- `use-toast.ts` - Toast notifications (existing)
- `use-mobile.tsx` - Responsive helpers (existing)