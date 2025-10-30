# Theme Plugin Architecture Refactor

## Current State
All themes are hardcoded in `core-theme` plugin with imports from `themes/` folder.

## Target Architecture
Each theme collection becomes its own plugin that registers themes with `core-theme`.

### Plugin Structure
```
plugins/
├── core-theme/                   # Theme registry and management
│   ├── services/
│   │   └── ThemeService.ts      # Registry for themes
│   ├── types/
│   │   └── Theme.ts             # Theme interface
│   └── index.ts
├── theme-catppuccin/            # Catppuccin theme pack
│   ├── themes/
│   │   ├── latte.ts
│   │   └── frappe.ts
│   └── index.ts
├── theme-dracula/               # Dracula theme pack
│   ├── themes/
│   │   └── dark.ts
│   └── index.ts
├── theme-tokyonight/            # Tokyo Night theme pack
│   ├── themes/
│   │   ├── storm.ts
│   │   └── light.ts
│   └── index.ts
└── theme-gruvbox/               # Gruvbox theme pack
    ├── themes/
    │   ├── dark.ts
    │   └── light.ts
    └── index.ts
```

## Implementation Steps

### Step 1: Update ThemeService to be a Registry
**File**: `src/plugins/core-theme/services/ThemeService.ts`

```typescript
export class ThemeService {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private storage: StorageAdapter | null = null;

  /**
   * Register a theme (called by theme plugins during onLoad)
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
    console.log(`[ThemeService] Registered theme: ${theme.name}`);

    // If no current theme, use the first registered one
    if (!this.currentTheme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }

  /**
   * Register multiple themes at once
   */
  registerThemes(themes: Theme[]): void {
    themes.forEach(theme => this.registerTheme(theme));
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Set theme by ID
   */
  async setTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);

    // Persist to storage
    if (this.storage) {
      await this.storage.set(THEME_KEY, themeId);
    }

    this.notifyListeners(theme);
  }

  /**
   * Initialize with storage - loads saved theme if available
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;

    try {
      const savedThemeId = await storage.get(THEME_KEY);
      if (savedThemeId) {
        const theme = this.themes.get(savedThemeId);
        if (theme) {
          this.currentTheme = theme;
          this.applyTheme(theme);
        }
      }
    } catch (error) {
      console.error('[ThemeService] Failed to load theme:', error);
    }
  }

  // Rest of the methods stay the same (applyTheme, onThemeChange, etc.)
}
```

### Step 2: Move Theme Type to Shared Location
**File**: `src/plugins/core-theme/types/Theme.ts`

```typescript
export interface ThemeVariables {
  '--background': string;
  '--foreground': string;
  '--primary': string;
  '--primary-foreground': string;
  // ... all other CSS variables
}

export interface Theme {
  id: string;
  name: string;
  variables: ThemeVariables;
  className?: string; // Optional class name for additional styling
}
```

### Step 3: Create Theme Plugin Template
**File**: `src/plugins/theme-catppuccin/index.ts`

```typescript
import type { Plugin } from '../../shared/plugin-system/types';
import { catppuccinLatte, catppuccinFrappe } from './themes';

export const ThemeCatppuccinPlugin: Plugin = {
  id: 'theme-catppuccin',
  name: 'Catppuccin Themes',
  version: '1.0.0',
  description: 'Catppuccin theme pack - Latte and Frappé variants',

  // Depends on core-theme to register themes
  requires: ['core-theme'],

  onLoad: async (manager) => {
    console.log('Catppuccin Theme Pack loaded');

    // Get theme service from core-theme
    const themeService = manager.getService('core-theme/themeService');

    if (themeService) {
      // Register our themes
      themeService.registerThemes([catppuccinLatte, catppuccinFrappe]);
    } else {
      console.error('[theme-catppuccin] ThemeService not found');
    }
  }
};

export default ThemeCatppuccinPlugin;
```

### Step 4: Update core-theme Plugin
**File**: `src/plugins/core-theme/index.ts`

```typescript
export const CoreThemePlugin: Plugin = {
  id: 'core-theme',
  name: 'Core Theme System',
  version: '1.0.0',
  description: 'Theme registry and management system',

  // No dependencies - loads first
  requires: [],

  services: {
    'themeService': new ThemeService()
  },

  onLoad: async (manager) => {
    console.log('Core Theme Plugin loaded');

    const themeService = manager.getService('core-theme/themeService');
    const storage = manager.getStorage();

    // Initialize with storage
    if (themeService && storage) {
      await themeService.initialize(storage);
    }

    // Emit theme system ready event
    manager.getEventBus().emit('theme:system-ready', {
      currentTheme: themeService?.getCurrentTheme(),
      availableThemes: themeService?.getAvailableThemes() || []
    });

    // Listen for theme change requests
    manager.getEventBus().on('theme:change-request', async ({ themeId }) => {
      if (themeService) {
        await themeService.setTheme(themeId);
      }
    });
  }
};
```

### Step 5: Plugin Loading Order
PluginManager should load plugins in this order:
1. `core-settings` (no deps)
2. `core-theme` (no deps)
3. `theme-*` plugins (depend on core-theme)
4. Other plugins

The dependency resolution in PluginManager already handles this automatically.

## Migration Strategy

### Phase 1: Update ThemeService (Non-Breaking)
- Add `registerTheme()` and `registerThemes()` methods
- Keep `ALL_THEMES` import for backward compatibility
- Test that existing code still works

### Phase 2: Create One Theme Plugin (Proof of Concept)
- Create `theme-catppuccin` plugin
- Test that it registers themes successfully
- Verify theme switching still works

### Phase 3: Migrate All Themes
- Create plugins for each theme family:
  - `theme-dracula`
  - `theme-tokyonight`
  - `theme-gruvbox`
- Remove hardcoded imports from core-theme

### Phase 4: Cleanup
- Remove old `themes/` folder from core-theme
- Update documentation
- Test thoroughly

## Benefits

1. **User-Installable Themes**: Users can install theme packs as plugins
2. **Smaller Core**: core-theme is lighter without bundled themes
3. **Theme Marketplace**: Easy to distribute custom themes
4. **Lazy Loading**: Themes only load if installed
5. **Version Independence**: Themes can update independently of core

## Testing Checklist

- [ ] Theme service registers themes correctly
- [ ] Theme switching works
- [ ] Theme persistence works (storage)
- [ ] Default theme applies if no saved preference
- [ ] Theme plugins load in correct order
- [ ] Missing theme plugin doesn't break app
- [ ] Theme selector shows all registered themes
- [ ] EventBus theme:change-request works

## Future Enhancements

1. **Theme Metadata**: Add author, description, preview image
2. **Theme Variants**: Dark/light mode variants
3. **Theme Customization**: Allow users to modify theme variables
4. **Theme Export**: Export custom themes as plugins
5. **Theme Store**: Browse and install themes from marketplace
