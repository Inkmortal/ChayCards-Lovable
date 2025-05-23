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
    icon: 'Star'
  }]
}
```

## Using Other Plugins
```typescript
// Always use core.ui for visual consistency
const ui = usePlugin('core.ui');
const Card = ui.getComponent('Card');
const PageHeader = ui.getComponent('PageHeader');

// Access other plugins (namespaced)
const DocCard = usePlugin().getComponent('core.documents/DocumentCard');
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
  // Get UI components
  const ui = usePlugin('core.ui');
  const PageHeader = ui.getComponent('PageHeader');
  const Card = ui.getComponent('Card');
  const EmptyState = ui.getComponent('EmptyState');
  
  // Get own service
  const { getService } = usePlugin('my-plugin');
  const myService = getService('myService');
  
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