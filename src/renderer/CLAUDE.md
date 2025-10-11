# Renderer - AI Context

## What This Is
Minimal shell that hosts plugins. Keep this directory LEAN - no features here.

## What Goes Here
- `App.tsx` - Root with router setup
- `layouts/AppShell.tsx` - Main layout that reads from plugin registry
- `plugin-host/PluginHost.tsx` - Renders plugin components by name
- `hooks/usePlugin.ts` - Helper to access plugin registry
- `components/ui/` - ONLY shadcn/ui base components

## What DOESN'T Go Here
- ❌ Feature code (goes in plugins)
- ❌ Business logic (goes in plugins)  
- ❌ Custom UI components (use core-ui plugin)
- ❌ Pages with actual features (plugins provide routes)

## Key Pattern
```typescript
// AppShell reads everything from plugins
const { getNavigationItems, getRoutes } = usePluginManager();
const navigation = getNavigationItems(); // From all plugins
const routes = getRoutes(); // From all plugins

// PluginHost resolves components dynamically
<PluginHost componentName="core.documents/DocumentList" />
```

## Critical Rule
**EVERYTHING IS A PLUGIN** - Even "core" features like documents, tasks, etc. This directory is just the stage, all actors (features) are plugins in `/src/plugins/`.

## Hooks You'll Use
```typescript
// Get components from any plugin
const { getComponent } = usePlugin('core-ui');
const PageHeader = getComponent('PageHeader');

// Get services
const docService = usePlugin().getService('core.documents/documentService');
```

## Remember
- Plugins handle ALL features
- This is just infrastructure
- Use core-ui plugin for visual consistency