# ChayCards Theme System Documentation

## Overview

The ChayCards theme system is implemented as the `core-theme` plugin, providing a universal semantic variable system that works across all themes and enables consistent theming throughout the application.

## Architecture

### Plugin Structure
```
src/plugins/core-theme/
├── index.ts                 # Plugin definition and registration
├── components/
│   └── ThemeSelector.tsx    # Theme selection UI component
├── services/
│   └── ThemeService.ts      # Theme management service
└── themes/
    ├── index.ts             # Theme registry
    ├── catppuccin.ts        # Catppuccin variants (Latte, Frappé)
    ├── dracula.ts           # Dracula Dark theme
    ├── tokyonight.ts        # Tokyo Night variants (Storm, Light)
    └── gruvbox.ts           # Gruvbox variants (Dark, Light)
```

## Universal Semantic Variables

The theme system uses 24 standardized semantic variables, researched from shadcn/ui, Material Design 3, and Tailwind CSS standards:

### Base System (6 variables)
- `--background` - Primary background color
- `--foreground` - Primary text color
- `--border` - Border color for UI elements
- `--input` - Input field background
- `--ring` - Focus ring color
- `--radius` - Border radius value

### Core Hierarchy (6 variables)
- `--primary` / `--primary-foreground` - Main brand colors
- `--secondary` / `--secondary-foreground` - Secondary emphasis
- `--tertiary` / `--tertiary-foreground` - Accent colors

### State Semantics (8 variables)
- `--success` / `--success-foreground` - Success states
- `--warning` / `--warning-foreground` - Warning states
- `--destructive` / `--destructive-foreground` - Error/danger states
- `--info` / `--info-foreground` - Information states

### Neutral Variety (4 variables)
- `--muted` / `--muted-foreground` - Subdued content
- `--accent` / `--accent-foreground` - Highlighted content

### Surfaces (4 variables)
- `--card` / `--card-foreground` - Card backgrounds
- `--popover` / `--popover-foreground` - Overlay backgrounds

## Theme Definition Structure

```typescript
interface ThemeVariables {
  // All 24 semantic variables as key-value pairs
  '--background': string;
  '--foreground': string;
  // ... etc
}

interface Theme {
  id: string;           // Unique identifier
  name: string;         // Display name
  className?: string;   // Optional CSS class (e.g., 'dark')
  variables: ThemeVariables;
}
```

## Available Themes

### 1. Catppuccin (2 variants)
- **Latte** (Light) - Warm, light theme with excellent contrast
- **Frappé** (Dark) - Elegant dark variant with muted tones

### 2. Dracula (1 variant)
- **Dark** - High contrast dark theme with vibrant accent colors

### 3. Tokyo Night (2 variants)
- **Storm** (Dark) - Deep blue-based dark theme
- **Light** - Clean light variant with blue accents

### 4. Gruvbox (2 variants)
- **Dark** - Retro-inspired warm dark theme with earth tones
- **Light** - Warm light theme with natural colors

All themes use **authentic official colors** verified from their respective source repositories.

## Theme Service API

### Core Methods
```typescript
class ThemeService {
  // Get available themes
  getAvailableThemes(): Theme[]

  // Get current active theme
  getCurrentTheme(): Theme

  // Set new theme
  setTheme(themeId: string): void

  // Subscribe to theme changes
  onThemeChange(callback: (theme: Theme) => void): () => void

  // Get theme by ID
  getThemeById(themeId: string): Theme | undefined

  // Check if theme is active
  isThemeActive(themeId: string): boolean
}
```

### Automatic Features
- **CSS Variable Application**: Automatically applies theme variables to `:root`
- **LocalStorage Persistence**: Saves user's theme preference
- **Event Notifications**: Emits theme change events for components to react
- **Class Management**: Applies theme-specific CSS classes (e.g., `dark`)

## Plugin Integration

### Plugin Definition
```typescript
export const CoreThemePlugin: Plugin = {
  id: 'core-theme',
  name: 'Core Theme System',
  requires: [], // No dependencies - foundational plugin

  components: {
    'ThemeSelector': ThemeSelector
  },

  services: {
    'themeService': new ThemeService()
  },

  onLoad: async (manager) => {
    // Set up event listeners and emit theme system ready event
  }
};
```

### Usage in Other Plugins
```typescript
// Get theme service from any plugin
const manager = PluginManager.getInstance();
const themeService = manager.getService('core-theme/themeService');

// Get theme selector component
const ThemeSelector = manager.getComponent('core-theme/ThemeSelector');

// Listen for theme changes
themeService.onThemeChange((theme) => {
  console.log('Theme changed to:', theme.name);
});
```

## CSS Variable Usage

### In Components
```css
.my-component {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}

.primary-button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.success-message {
  background-color: hsl(var(--success));
  color: hsl(var(--success-foreground));
}
```

### In React Components
```tsx
const MyComponent = () => (
  <div style={{
    backgroundColor: 'hsl(var(--card))',
    color: 'hsl(var(--card-foreground))',
    borderColor: 'hsl(var(--border))'
  }}>
    Content here
  </div>
);
```

## Plugin Extensibility

### Adding Custom Variables
Other plugins can extend the theme system by adding their own variables:

```typescript
// In plugin's onLoad
onLoad: (manager) => {
  const themeService = manager.getService('core-theme/themeService');

  // Add custom variables programmatically
  document.documentElement.style.setProperty('--my-plugin-special', '#ff6b6b');

  // Listen for theme changes to update custom variables
  themeService.onThemeChange((theme) => {
    // Update custom variables based on theme
    const isDark = theme.className === 'dark';
    document.documentElement.style.setProperty(
      '--my-plugin-special',
      isDark ? '#ff8787' : '#ff6b6b'
    );
  });
}
```

### Creating New Themes
```typescript
// Add to themes/custom.ts
export const customTheme: Theme = {
  id: 'custom-theme',
  name: 'Custom Theme',
  variables: {
    '--background': '0 0% 100%',
    '--foreground': '240 10% 3.9%',
    // ... all 24 required variables
  }
};

// Register in themes/index.ts
export const ALL_THEMES = [
  // existing themes...
  customTheme
];
```

## Event System

The theme system emits events through the plugin event bus:

### Events Emitted
- `theme:system-ready` - When theme system initializes
- `theme:changed` - When theme is switched (via ThemeService)

### Event Listeners
```typescript
// Listen for theme changes
manager.getEventBus().on('theme:changed', ({ theme }) => {
  console.log('Theme changed to:', theme.name);
});

// Request theme change from other plugins
manager.getEventBus().emit('theme:change-request', { themeId: 'dracula-dark' });
```

## Implementation History

### September 29, 2025 - Universal Semantic Variables
- **Research Phase**: Analyzed official theme sources and design system standards
- **Standardization**: Reduced from 14+ inconsistent palette colors to 24 semantic variables
- **Authentication**: Verified all colors from official sources (Catppuccin.com, Dracula, etc.)
- **Migration**: Updated all existing pages and components to use semantic variables
- **Build Verification**: Confirmed successful compilation and runtime functionality

### Key Benefits Achieved
1. **Consistency**: All themes now use identical semantic variable structure
2. **Authenticity**: Colors verified from official theme repositories
3. **Extensibility**: Plugin architecture allows custom variables without breaking core system
4. **Maintainability**: Single source of truth for theme definitions
5. **Developer Experience**: Clear semantic naming makes theming intuitive

## Future Enhancements

### Planned Features
- **Theme Editor**: Visual theme customization interface
- **Auto Theme Detection**: System preference-based theme switching
- **Theme Variants**: Support for theme density and accessibility variants
- **Animation System**: Theme transition animations
- **Theme Marketplace**: Community-contributed themes

### Plugin Opportunities
- **Accessibility Plugin**: High contrast theme variants
- **Seasonal Plugin**: Time-based theme switching
- **Brand Plugin**: Corporate theme templates
- **Mood Plugin**: Emotion-based color adaptation