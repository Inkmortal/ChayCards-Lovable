# Plugins - AI Context

## What This Is
ALL features live here as plugins. Every feature = a plugin. No exceptions.

## Plugin Structure
```
plugin-name/
├── components/       # UI components
├── services/        # Business logic
├── hooks/          # Custom hooks
├── types.ts        # TypeScript types
└── index.ts        # Plugin definition
```

## Core Plugins (Built-in)
- `core-ui/` - Shared UI components (Card, PageHeader, etc.)
- `core-documents/` - Document management
- `core-tasks/` - Task management
- `core-knowledge/` - Flashcards & learning

## Plugin Definition Pattern
```typescript
// index.ts
export const MyPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  requires: ['core.ui'],  // Dependencies
  
  components: {
    'MyList': MyList,  // Registry name: 'my-plugin/MyList'
    'MyCard': MyCard   // Registry name: 'my-plugin/MyCard'
  },
  
  services: {
    'myService': new MyService()
  },
  
  routes: [{
    path: '/my-feature',
    component: 'my-plugin/MyList',  // Full namespaced name!
    label: 'My Feature',
    icon: 'Star',
    showInNav: true,
    order: 50
  }]
}
```

## Using Other Plugins
```typescript
// Components are always namespaced as 'plugin-id/ComponentName'
const manager = PluginManager.getInstance();

// Get core UI components
const Card = manager.getComponent('core.ui/Card');
const PageHeader = manager.getComponent('core.ui/PageHeader');

// Get components from other plugins
const DocCard = manager.getComponent('core.documents/DocumentCard');

// Or use the usePlugin hook (wrapper around manager)
const { getComponent } = usePlugin();
const TaskList = getComponent('core.tasks/TaskList');
```

## Critical Rules
1. **RECOMMENDED** use core.ui components for consistency (but not required)
2. **NEVER** import directly from other plugins
3. Components auto-namespaced: 'plugin-id/ComponentName'
4. Declare dependencies in 'requires' array
5. Services also namespaced: 'plugin-id/serviceName'

## Component Pattern
```typescript
// components/MyList.tsx
export const MyList = () => {
  const manager = PluginManager.getInstance();
  
  // Get UI components (always use full namespace)
  const PageHeader = manager.getComponent('core.ui/PageHeader');
  const Card = manager.getComponent('core.ui/Card');
  const EmptyState = manager.getComponent('core.ui/EmptyState');
  
  // Get own service (also namespaced)
  const myService = manager.getService('my-plugin/myService');
  
  return (
    <>
      <PageHeader title="My Feature" />
      {items.length === 0 ? (
        <EmptyState title="No items yet" />
      ) : (
        items.map(item => <Card key={item.id}>{item.name}</Card>)
      )}
    </>
  );
};
```

## Quick Start New Plugin
1. Create: `src/plugins/my-feature/`
2. Add index.ts with Plugin export
3. Import & use core.ui components
4. Register in main.tsx plugin loader
5. Plugin auto-provides navigation & routes