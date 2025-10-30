# Frontend Architecture Guide

## Overview

ChayCards frontend is built on a plugin-first architecture where ALL features, including core functionality, are implemented as plugins. The frontend consists of a minimal shell that loads and orchestrates plugins.

## Core Principles

1. **Everything is a Plugin** - Documents, tasks, knowledge features are all plugins
2. **Registry-Based Components** - Components are registered and retrieved dynamically
3. **No Direct Imports Between Features** - Plugins communicate through the registry
4. **Progressive Enhancement** - Start simple, enhance through plugins
5. **Visual Consistency** - Shared core components ensure unified design

## Directory Structure

```
/src/
├── renderer/              # Minimal shell - just infrastructure
│   ├── App.tsx           # Root component with router
│   ├── components/       # ONLY base UI kit (shadcn/ui)
│   ├── layouts/         
│   │   └── AppShell.tsx  # Main layout reading from plugin registry
│   └── plugin-host/
│       └── PluginHost.tsx # Loads and renders plugin components
│
├── plugins/              # WHERE ALL FEATURES LIVE
│   ├── core-ui/          # Shared UI components for all plugins
│   │   ├── components/   # Card, List, DataTable, PageHeader, etc.
│   │   ├── hooks/        # useToast, useModal, etc.
│   │   └── patterns/     # Common UI patterns
│   │
│   ├── core-documents/   # Document management
│   ├── core-tasks/       # Task management  
│   └── core-knowledge/   # Learning features
│
└── main.tsx              # Entry point - loads plugins first
```

## Core UI Plugin

The `core-ui` plugin provides shared components that ensure visual consistency:

```typescript
// src/plugins/core-ui/index.ts
export const CoreUIPlugin: Plugin = {
  id: 'core-ui',
  name: 'Core UI Components',
  
  components: {
    // Layout Components
    'PageHeader': PageHeader,
    'SplitView': SplitView,
    'GridLayout': GridLayout,
    
    // Data Display
    'Card': Card,
    'Card.Header': CardHeader,
    'Card.Content': CardContent,
    'DataTable': DataTable,
    'List': List,
    'List.Item': ListItem,
    'EmptyState': EmptyState,
    'MetricCard': MetricCard,
    
    // Forms
    'FormField': FormField,
    'FormSection': FormSection,
    
    // Feedback
    'LoadingSpinner': LoadingSpinner,
    'ErrorMessage': ErrorMessage,
    'ProgressBar': ProgressBar
  }
};
```

### Using Core Components

```typescript
// In any plugin
export const DocumentList = () => {
  const { getComponent } = usePlugin('core.ui');
  const Card = getComponent('Card');
  const PageHeader = getComponent('PageHeader');
  const EmptyState = getComponent('EmptyState');
  
  return (
    <>
      <PageHeader 
        title="Documents" 
        actions={[{ label: 'New', onClick: handleNew }]}
      />
      {documents.length === 0 ? (
        <EmptyState 
          icon="FileText"
          title="No documents yet"
          action={{ label: 'Create First Document', onClick: handleNew }}
        />
      ) : (
        <div className="grid">
          {documents.map(doc => (
            <Card key={doc.id}>
              {/* Document content */}
            </Card>
          ))}
        </div>
      )}
    </>
  );
};
```

## Development Workflow

### 1. Starting a New Feature

Always create as a plugin from the start:

```bash
src/plugins/my-feature/
├── components/
│   ├── MyFeatureList.tsx
│   └── MyFeatureCard.tsx
├── services/
│   └── MyFeatureService.ts
├── types.ts
└── index.ts              # Plugin definition
```

### 2. Plugin Structure

```typescript
// src/plugins/my-feature/index.ts
import { Plugin } from '@/shared/plugin-system/types';
import { MyFeatureList } from './components/MyFeatureList';
import { MyFeatureService } from './services/MyFeatureService';

export const MyFeaturePlugin: Plugin = {
  id: 'my-feature',
  name: 'My Feature',
  version: '1.0.0',
  requires: ['core.ui'],  // Depend on core UI
  
  // Register all components with plugin prefix
  components: {
    'MyFeatureList': MyFeatureList,
    'MyFeatureCard': MyFeatureCard
  },
  
  // Register services
  services: {
    'myFeatureService': new MyFeatureService()
  },
  
  // Add routes
  routes: [
    { 
      path: '/my-feature', 
      component: 'my-feature/MyFeatureList',  // Namespaced!
      label: 'My Feature',
      icon: 'Star'
    }
  ]
};
```

### 3. Component Development

```typescript
// src/plugins/my-feature/components/MyFeatureList.tsx
import { usePlugin } from '@/renderer/hooks/usePlugin';

export const MyFeatureList = () => {
  // Get core UI components
  const ui = usePlugin('core.ui');
  const PageHeader = ui.getComponent('PageHeader');
  const Card = ui.getComponent('Card');
  
  // Get own service
  const { getService } = usePlugin('my-feature');
  const myService = getService('myFeatureService');
  
  // Get other plugin's components (namespaced)
  const DocumentCard = usePlugin().getComponent('core.documents/DocumentCard');
  
  return (
    <div>
      <PageHeader title="My Feature" />
      {/* Your UI here using core components */}
    </div>
  );
};
```

### 4. App Shell Integration

The AppShell automatically:
- Reads navigation items from all plugins
- Sets up routes from all plugins
- Provides the plugin context

```typescript
// src/renderer/layouts/AppShell.tsx
export const AppShell = () => {
  const { getNavigationItems, getRoutes } = usePluginManager();
  
  return (
    <div className="app-shell">
      <Sidebar items={getNavigationItems()} />
      <main>
        <Routes>
          {getRoutes().map(route => (
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

## Key Patterns

### 1. Component Registration

Components are namespaced by plugin ID to prevent collisions:

```typescript
// ❌ DON'T: Direct imports between plugins
import { TaskCard } from '../../tasks/components/TaskCard';

// ❌ DON'T: Global names (collision risk)
const TaskCard = getComponent('TaskCard');

// ✅ DO: Namespaced access
const TaskCard = getComponent('core.tasks/TaskCard');

// ✅ DO: Plugin-scoped helper
const { getComponent } = usePlugin('core.tasks');
const TaskCard = getComponent('TaskCard');  // Auto-prefixed with 'core.tasks/'
```

### 2. Service Access

```typescript
// ❌ DON'T: Direct service import
import { documentService } from '../services';

// ✅ DO: Get from registry (namespaced)
const docService = usePlugin().getService('core.documents/documentService');

// ✅ DO: Plugin-scoped
const { getService } = usePlugin('core.documents');
const docService = getService('documentService');
```

### 3. Cross-Plugin Communication

```typescript
// ❌ DON'T: Direct coupling
import { refreshDocuments } from '../../documents/actions';

// ✅ DO: Use events
const { emit } = usePlugin();
emit('core.documents:refresh');
```

### 4. Component Naming Convention

```typescript
// Internal components use flat names
components: {
  'DocumentList': DocumentList,
  'DocumentCard': DocumentCard
}

// Registry stores with plugin prefix
// 'core.documents/DocumentList'
// 'core.documents/DocumentCard'

// Hierarchical for sub-components
components: {
  'DocumentList': DocumentList,
  'DocumentList.Header': DocumentListHeader,
  'DocumentList.Item': DocumentListItem
}
// Becomes:
// 'core.documents/DocumentList'
// 'core.documents/DocumentList.Header'
// 'core.documents/DocumentList.Item'
```

## Plugin Loading Flow

```
1. main.tsx starts
   ↓
2. Load core.ui plugin first
   ↓
3. Load other core plugins
   ↓
4. Load user plugins
   ↓
5. Resolve dependencies
   ↓
6. Initialize plugins in order
   ↓
7. Register components/services/routes (with namespacing)
   ↓
8. Render AppShell
   ↓
9. Plugin components available
```

## Development Guidelines

### DO:
- Always use core UI components for consistency
- Namespace all component/service names
- Create every feature as a plugin
- Use the registry for all cross-plugin needs
- Keep plugins self-contained
- Export types for other plugins to use

### DON'T:
- Import directly between plugins
- Put feature code in `/renderer`
- Create custom UI that duplicates core components
- Use global component names
- Assume component names are unique

## Type Safety

Since we use dynamic component resolution:

```typescript
// Create typed hooks
export function useComponent<T = React.ComponentType>(
  pluginId: string,
  componentName: string
): T | null {
  const fullName = `${pluginId}/${componentName}`;
  return PluginManager.getInstance().getComponent(fullName) as T;
}

// Usage with types
interface DocumentCardProps {
  doc: Document;
  onEdit?: (id: string) => void;
}

const DocumentCard = useComponent<React.FC<DocumentCardProps>>(
  'core.documents',
  'DocumentCard'
);
```

## Visual Consistency Guidelines

All plugins should use core UI components to ensure consistency:

1. **Layout**: Use PageHeader, SplitView, GridLayout
2. **Cards**: Use Card with Header/Content structure
3. **Lists**: Use List/ListItem with consistent spacing
4. **Empty States**: Use EmptyState component
5. **Forms**: Use FormField and FormSection
6. **Feedback**: Use consistent loading/error states

## Testing Strategy

1. **Unit Tests**: Test plugin components in isolation
2. **Integration Tests**: Test plugin interactions through registry
3. **Visual Tests**: Ensure core components maintain consistency
4. **Plugin Tests**: Each plugin has its own test suite

## Common Patterns

### 1. Enhanced Components
```typescript
// Plugin enhances existing component
onLoad: (registry) => {
  const Original = registry.getComponent('core.documents/DocumentCard');
  const Enhanced = (props) => {
    const { getComponent } = usePlugin('core.ui');
    const Badge = getComponent('Badge');
    
    return (
      <>
        <Badge variant="ai">AI Enhanced</Badge>
        <Original {...props} />
      </>
    );
  };
  registry.setComponent('core.documents/DocumentCard', Enhanced);
}
```

### 2. Consistent Page Structure
```typescript
// All feature pages follow same pattern
const FeaturePage = () => {
  const ui = usePlugin('core.ui');
  const PageHeader = ui.getComponent('PageHeader');
  const Card = ui.getComponent('Card');
  
  return (
    <div className="page">
      <PageHeader 
        title="Feature"
        subtitle="Description"
        actions={[...]}
      />
      <div className="page-content">
        {/* Feature content using core components */}
      </div>
    </div>
  );
};
```

## Getting Started

1. First, explore `core.ui` plugin for available components
2. Build features using core components for consistency
3. Always namespace your components with plugin ID
4. Use typed helpers for better DX
5. Follow visual patterns established by core plugins

Remember: Visual consistency comes from shared components, not shared styles!