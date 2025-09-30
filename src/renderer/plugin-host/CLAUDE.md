# Plugin Host - AI Context

## What This Is
Component that dynamically renders plugin components by name with error boundaries. **Implementation complete.**

## PluginHost.tsx - Actual Implementation
Located at: `src/renderer/plugin-host/PluginHost.tsx` (74 lines)

### Component Structure
```typescript
interface PluginHostProps {
  componentName: string;  // e.g., "core-theme/ThemeSelector"
  props?: Record<string, any>;
}

export const PluginHost: React.FC<PluginHostProps> = ({
  componentName,
  props = {}
}) => {
  const pluginManager = PluginManager.getInstance();
  const Component = pluginManager.getComponent(componentName);

  if (!Component) {
    console.warn(`Plugin component not found: ${componentName}`);
    return (
      <div className="p-2 text-xs text-muted-foreground border border-dashed border-muted rounded">
        Component not found: {componentName}
      </div>
    );
  }

  return (
    <PluginHostErrorBoundary componentName={componentName}>
      <Component {...props} />
    </PluginHostErrorBoundary>
  );
};
```

## Error Boundary Implementation
**Class**: `PluginHostErrorBoundary` (lines 19-52)

### Features
- Catches component crashes during render
- Displays error details in styled error box
- Logs full error with componentDidCatch
- Shows component name in error UI
- Uses semantic theme variables (--destructive)

### Error UI
```typescript
// When plugin component crashes
<div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
  <h3>Plugin Error: {componentName}</h3>
  <p>{error.message}</p>
</div>
```

### Error States
1. **Component Not Found** (lines 59-64)
   - Console warning (not error)
   - Dashed border box with component name
   - Non-intrusive styling (muted colors)

2. **Component Crashed** (lines 37-47)
   - Red/destructive theme colors
   - Shows component name and error message
   - Logs full stack trace to console
   - Prevents entire app crash

## Usage Examples

### In AppShell Routes
```typescript
// AppShell.tsx line 123
<Route
  key={route.path}
  path={route.path.replace('/app', '')}
  element={<PluginHost componentName={route.component} />}
/>
```

### In AppShell Regions
```typescript
// AppShell.tsx lines 54-56
{headerComponents.map((comp) => (
  <PluginHost key={comp.id} componentName={comp.component} />
))}
```

### With Props
```typescript
// Pass data to plugin component
<PluginHost
  componentName="core.documents/DocumentCard"
  props={{ documentId: "123", editable: true }}
/>
```

## Component Resolution
1. Calls `pluginManager.getComponent(componentName)`
2. PluginManager looks up in components Map
3. Returns component or undefined
4. PluginHost handles undefined gracefully

## Error Handling Flow
```
Component crashes
    ↓
getDerivedStateFromError catches it
    ↓
Sets hasError: true state
    ↓
componentDidCatch logs details
    ↓
Error UI renders instead of component
    ↓
Other plugin components continue working
```

## Key Implementation Details
- **File**: `src/renderer/plugin-host/PluginHost.tsx`
- **Size**: 74 lines
- **Error Boundary**: React class component (required for error boundaries)
- **Host Component**: Functional component
- **Dependencies**: PluginManager singleton
- **Theme**: Uses semantic CSS variables for error styling

## Benefits
- **Isolation**: One plugin crash doesn't break others
- **Debugging**: Clear error messages with component names
- **Graceful**: Missing components show friendly message
- **Simple**: No complex error recovery, just display issue

## Don't
- Cache components (PluginManager handles that)
- Import components directly (breaks plugin system)
- Assume components exist (always check via PluginManager)
- Add retry logic (keep it simple)
- Suppress errors (always log to console)