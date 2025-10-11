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
  // Buttons
  'Button': Button,                // 3D button (default style)

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

  // Dialogs & Overlays
  'Dialog': Dialog,                // Modal dialogs
  'Tabs': Tabs,                    // Tab navigation
  'Tooltip': Tooltip,              // Tooltips
  'Popover': Popover,              // Popovers
  'DropdownMenu': DropdownMenu,    // Dropdown menus

  // Form Controls
  'Select': Select,                // Select dropdowns
  'Switch': Switch,                // Toggle switches
  'Checkbox': Checkbox,            // Checkboxes
  'RadioGroup': RadioGroup,        // Radio button groups

  // Feedback
  'LoadingSpinner': LoadingSpinner,
  'ErrorMessage': ErrorMessage,
  'ProgressBar': ProgressBar,
  'Alert': Alert                   // Alert messages
}
```

## Usage Example
```typescript
// Plugin can choose to use core-ui
const manager = PluginManager.getInstance();
const Button = manager.getComponent('core-ui/Button');
const Card = manager.getComponent('core-ui/Card');

// Button defaults to 3D variant
<Button onClick={handleClick}>Click Me</Button>

// Use different 3D variants
<Button variant="3d-primary">Save</Button>
<Button variant="3d-outline">Cancel</Button>

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