# Theme System Architecture

The theme system is implemented as a plugin that provides comprehensive theming capabilities while maintaining the simplicity and flexibility that made the original ChayCards theme system great.

## Core Design Principles

1. **CSS Custom Properties** - All theming through CSS variables
2. **HSL Color System** - Human-readable, easily adjustable colors  
3. **Plugin Architecture** - Theme system is just another plugin
4. **Natural Fallbacks** - CSS handles missing variables gracefully
5. **Storage Integration** - Custom themes sync across devices

## Theme Structure

Themes are defined as collections of CSS custom properties:

```typescript
interface Theme {
  id: string;
  name: string;
  className?: string; // e.g., 'dark' for dark mode
  variables: ThemeVariables;
}

interface ThemeVariables {
  // Core color system (HSL values)
  '--background': string;      // hsl(0, 0%, 100%)
  '--foreground': string;      // hsl(222, 47%, 11%)
  
  // Semantic colors
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--muted': string;
  '--muted-foreground': string;
  
  // UI element colors
  '--card': string;
  '--card-foreground': string;
  '--popover': string;
  '--popover-foreground': string;
  '--border': string;
  '--input': string;
  '--ring': string;
  
  // Status colors
  '--destructive': string;
  '--destructive-foreground': string;
  
  // Other
  '--radius': string;  // Border radius
}
```

## Default Themes

The theme plugin ships with three default themes:

### Light Theme
```css
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
  --primary: hsl(330, 81%, 60%);        /* Pink */
  --primary-foreground: hsl(0, 0%, 100%);
  --secondary: hsl(330, 81%, 95%);      /* Light pink */
  --secondary-foreground: hsl(330, 81%, 40%);
  /* ... */
}
```

### Dark Theme
```css
.dark {
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(0, 0%, 100%);
  --primary: hsl(330, 81%, 60%);        /* Pink stays vibrant */
  --primary-foreground: hsl(0, 0%, 100%);
  --secondary: hsl(330, 20%, 20%);      /* Muted pink */
  --secondary-foreground: hsl(330, 81%, 70%);
  /* ... */
}
```

### Pink Theme (Enhanced Light)
```css
.pink {
  /* All the light theme values plus pink-tinted surfaces */
  --background: hsl(330, 100%, 99%);    /* Slight pink tint */
  --card: hsl(330, 81%, 97%);           /* Pink cards */
  --muted: hsl(330, 81%, 92%);          /* Pink muted elements */
  /* ... */
}
```

## Plugin Implementation

```typescript
export const ThemePlugin: Plugin = {
  id: 'core.theme',
  name: 'Theme System',
  version: '1.0.0',
  
  components: {
    ThemeCustomizer,
    ThemeSwitcher
  },
  
  services: {
    themeService: {
      // Theme management
      current: Theme;
      available: Theme[];
      setTheme(themeId: string): Promise<void>;
      registerTheme(theme: Theme): void;
      
      // Customization
      createCustomTheme(base: string, overrides: Partial<ThemeVariables>): Promise<Theme>;
      updateCustomTheme(id: string, updates: Partial<ThemeVariables>): Promise<void>;
      deleteCustomTheme(id: string): Promise<void>;
      
      // Import/Export
      exportTheme(id: string): string; // Returns CSS
      importTheme(css: string): Promise<Theme>;
    }
  },
  
  onLoad: async (manager) => {
    const storage = manager.getService('core/storageService');
    const service = new ThemeServiceImpl(manager, storage);
    
    // Load user's theme preference
    const savedTheme = await storage.get('theme/active');
    if (savedTheme) {
      await service.setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      await service.setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!savedTheme) { // Only auto-switch if user hasn't chosen
          service.setTheme(e.matches ? 'dark' : 'light');
        }
      });
  }
};
```

## Theme Service Implementation

```typescript
class ThemeServiceImpl implements ThemeService {
  private themes = new Map<string, Theme>();
  private customThemes = new Map<string, Theme>();
  current: Theme;
  
  constructor(
    private manager: PluginManager,
    private storage: StorageService
  ) {
    // Register default themes
    this.registerTheme(lightTheme);
    this.registerTheme(darkTheme);
    this.registerTheme(pinkTheme);
    
    // Load custom themes
    this.loadCustomThemes();
  }
  
  async setTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId) || this.customThemes.get(themeId);
    if (!theme) throw new Error(`Theme not found: ${themeId}`);
    
    this.current = theme;
    this.applyTheme(theme);
    
    // Persist preference
    await this.storage.set('theme/active', themeId);
    
    // Notify other plugins
    const eventBus = this.manager.getEventBus();
    eventBus.emit('core.theme:changed', { theme });
  }
  
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark', 'pink');
    
    // Add theme class if specified
    if (theme.className) {
      root.classList.add(theme.className);
    }
    
    // Apply CSS variables
    Object.entries(theme.variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', theme.id);
  }
  
  async createCustomTheme(baseId: string, overrides: Partial<ThemeVariables>): Promise<Theme> {
    const base = this.themes.get(baseId) || this.customThemes.get(baseId);
    if (!base) throw new Error(`Base theme not found: ${baseId}`);
    
    const id = `custom-${Date.now()}`;
    const theme: Theme = {
      id,
      name: `Custom (based on ${base.name})`,
      variables: { ...base.variables, ...overrides }
    };
    
    // Save to storage
    await this.storage.set(`theme/custom/${id}`, theme);
    this.customThemes.set(id, theme);
    
    return theme;
  }
  
  private async loadCustomThemes(): Promise<void> {
    const themes = await this.storage.list('theme/custom/*');
    themes.forEach(theme => {
      this.customThemes.set(theme.id, theme);
    });
  }
}
```

## Theme Extension Pattern

Other plugins can enhance the theme system:

```typescript
// Syntax highlighting plugin adds code colors
export const CodeThemePlugin: Plugin = {
  id: 'code-theme',
  requires: ['core.theme'],
  
  onLoad: (manager) => {
    // Listen for theme changes
    const eventBus = manager.getEventBus();
    eventBus.on('core.theme:changed', ({ theme }) => {
      const root = document.documentElement;
      
      // Apply code-specific colors based on theme
      if (theme.id === 'dark' || theme.className === 'dark') {
        root.style.setProperty('--code-keyword', 'hsl(280, 70%, 70%)');
        root.style.setProperty('--code-string', 'hsl(120, 60%, 70%)');
        root.style.setProperty('--code-comment', 'hsl(0, 0%, 50%)');
      } else {
        root.style.setProperty('--code-keyword', 'hsl(280, 70%, 50%)');
        root.style.setProperty('--code-string', 'hsl(120, 60%, 40%)');
        root.style.setProperty('--code-comment', 'hsl(0, 0%, 60%)');
      }
    });
  }
};
```

## Using Theme Variables

### In CSS
```css
.button-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius);
}

/* With fallbacks for extended variables */
.code-block {
  color: var(--code-keyword, var(--foreground));
}
```

### With Tailwind
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... map all theme variables
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      }
    }
  }
}
```

### In React Components
```tsx
// Components automatically respond to theme changes
function Button({ variant = 'primary', ...props }) {
  return (
    <button 
      className={`bg-${variant} text-${variant}-foreground rounded`}
      {...props}
    />
  );
}
```

## Theme Customizer UI

The theme customizer allows users to:
- Preview themes in real-time
- Adjust individual colors
- Save custom themes
- Fork existing themes
- Import/export themes

```typescript
export function ThemeCustomizer() {
  const manager = PluginManager.getInstance();
  const themeService = manager.getService('core.theme/themeService');
  const [preview, setPreview] = useState(themeService.current);
  
  const handleColorChange = (property: string, value: string) => {
    // Update preview in real-time
    const updated = {
      ...preview,
      variables: {
        ...preview.variables,
        [property]: value
      }
    };
    setPreview(updated);
    
    // Apply preview (without saving)
    document.documentElement.style.setProperty(property, value);
  };
  
  const handleSave = async () => {
    const saved = await themeService.createCustomTheme(
      preview.id,
      preview.variables
    );
    await themeService.setTheme(saved.id);
  };
  
  // ... UI implementation
}
```

## Storage and Sync

Custom themes are stored using the standard storage service:

```
theme/
  active           # Currently active theme ID
  custom/
    custom-1234/   # User-created theme
    custom-5678/   # Another custom theme
```

In cloud mode, themes automatically sync across devices. In local mode, they're stored in SQLite.

## Import/Export Format

Themes can be exported as CSS files for sharing:

```css
/* My Cool Theme */
/* Based on: dark */
/* Created: 2024-01-15 */

:root {
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(0, 0%, 100%);
  --primary: hsl(280, 70%, 60%);
  /* ... all variables ... */
}
```

## Benefits

1. **Familiar** - Uses the same CSS variable system from ChayCards
2. **Flexible** - Plugins can extend with new variables
3. **Reliable** - CSS fallbacks handle missing variables
4. **Portable** - Themes can be shared as CSS files
5. **Integrated** - Uses standard storage, works with cloud sync
6. **Simple** - Just CSS variables, no complex systems