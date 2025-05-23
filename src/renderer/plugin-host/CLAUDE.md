# Plugin Host - AI Context

## What This Is
Component that dynamically renders plugin components by name.

## PluginHost.tsx Pattern
```typescript
interface PluginHostProps {
  componentName: string;  // e.g., "core.documents/DocumentList"
  props?: any;
}

export const PluginHost: React.FC<PluginHostProps> = ({ 
  componentName, 
  props = {} 
}) => {
  const pluginManager = PluginManager.getInstance();
  const Component = pluginManager.getComponent(componentName);
  
  if (!Component) {
    return (
      <div className="error">
        Component not found: {componentName}
      </div>
    );
  }
  
  return (
    <ErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
```

## Usage
```typescript
// In routes
<Route 
  path="/documents" 
  element={<PluginHost componentName="core.documents/DocumentList" />} 
/>

// In other components
<PluginHost 
  componentName="core.ui/Card" 
  props={{ title: "Hello" }} 
/>
```

## Key Features
- Resolves components from registry
- Error boundaries per component
- Graceful fallback for missing components
- Props pass-through

## Don't
- Cache components (registry handles that)
- Import components directly
- Assume components exist