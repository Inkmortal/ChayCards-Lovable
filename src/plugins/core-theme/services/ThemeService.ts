/**
 * ThemeService - Manages theme switching and CSS variable application
 * Stores theme preference in its own storage key: 'core-theme:preference'
 */

import type { Theme } from '../themes';
import { ALL_THEMES, DEFAULT_THEME } from '../themes';
import type { StorageAdapter } from '@/shared/storage';

const THEME_KEY = 'core-theme:preference';

export class ThemeService {
  private currentTheme: Theme = DEFAULT_THEME;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private storage: StorageAdapter | null = null;

  constructor() {
    // Apply default theme immediately
    this.applyTheme(DEFAULT_THEME);
  }

  /**
   * Initialize with StorageAdapter for persistence
   * Should be called during plugin onLoad after storage is ready
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;

    // Load saved theme from storage
    try {
      const savedThemeId = await storage.get(THEME_KEY);
      if (savedThemeId) {
        const theme = ALL_THEMES.find(t => t.id === savedThemeId);
        if (theme) {
          this.currentTheme = theme;
          this.applyTheme(theme);
          console.log('[ThemeService] Loaded theme from storage:', savedThemeId);
        }
      }
    } catch (error) {
      console.error('[ThemeService] Failed to load theme from storage:', error);
    }
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    return [...ALL_THEMES];
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set new theme and apply it
   */
  async setTheme(themeId: string): Promise<void> {
    const theme = ALL_THEMES.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);

    // Persist to storage
    if (this.storage) {
      try {
        await this.storage.set(THEME_KEY, themeId);
        console.log('[ThemeService] Saved theme to storage:', themeId);
      } catch (error) {
        console.error('[ThemeService] Failed to save theme:', error);
      }
    } else {
      console.warn('[ThemeService] Storage not initialized - theme preference not saved');
    }

    this.notifyListeners(theme);
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Apply theme by setting CSS custom properties on :root
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    // Apply theme variables
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply theme class name for additional styling
    if (theme.className) {
      root.className = theme.className;
    } else {
      root.className = '';
    }

    console.log(`Applied theme: ${theme.name}`);
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    });
  }

  /**
   * Get theme by ID
   */
  getThemeById(themeId: string): Theme | undefined {
    return ALL_THEMES.find(t => t.id === themeId);
  }

  /**
   * Check if theme is currently active
   */
  isThemeActive(themeId: string): boolean {
    return this.currentTheme.id === themeId;
  }
}