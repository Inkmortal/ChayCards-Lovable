# Core UI Plugin - AI Context

## What This Is
Optional shared UI components for visual consistency. Plugins can use these OR build their own.

## Purpose
- Provides common UI patterns
- Ensures consistent look when plugins want it
- Saves time (don't reinvent Card, List, etc.)
- NOT mandatory - plugins have full freedom

## Components Available
```typescript
components: {
  // Layout
  'PageHeader': PageHeader,        // Consistent page titles
  'SplitView': SplitView,         // Two-pane layouts
  'GridLayout': GridLayout,        // Responsive grids
  
  // Cards & Lists
  'Card': Card,                    // Base card component
  'Card.Header': CardHeader,
  'Card.Content': CardContent,
  'List': List,                    // Consistent lists
  'List.Item': ListItem,
  'EmptyState': EmptyState,        // "No data" states
  
  // Data Display
  'DataTable': DataTable,          // Tables with sorting/filtering
  'MetricCard': MetricCard,        // Stats/KPIs
  'Badge': Badge,                  // Status indicators
  
  // Forms
  'FormField': FormField,          // Label + Input + Error
  'FormSection': FormSection,      // Group related fields
  
  // Feedback
  'LoadingSpinner': LoadingSpinner,
  'ErrorMessage': ErrorMessage,
  'ProgressBar': ProgressBar
}
```

## Usage Example
```typescript
// Plugin can choose to use core.ui
const ui = usePlugin('core.ui');
const Card = ui.getComponent('Card');

// Or build their own
const MyCustomCard = () => <div className="my-card">...</div>;
```

## Implementation Notes
- Built on shadcn/ui primitives
- Uses theme CSS variables
- Supports light/dark themes
- Accessible by default

## Remember
This is a convenience, not a requirement. Plugins have full UI freedom.