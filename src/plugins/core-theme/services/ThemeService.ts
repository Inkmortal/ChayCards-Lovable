/**
 * ThemeService - Manages theme switching and CSS variable application
 * Persists theme choice via SettingsService (not direct storage)
 */

import type { Theme } from '../themes';
import { ALL_THEMES, DEFAULT_THEME } from '../themes';

export class ThemeService {
  private currentTheme: Theme = DEFAULT_THEME;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private settingsService: any = null;

  constructor() {
    // Apply default theme immediately
    this.applyTheme(DEFAULT_THEME);
  }

  /**
   * Initialize with SettingsService for persistence
   * Should be called during plugin onLoad after core-settings is available
   */
  initialize(settingsService: any): void {
    this.settingsService = settingsService;

    // Load saved theme from settings
    const savedThemeId = settingsService.getTheme();
    if (savedThemeId) {
      const theme = ALL_THEMES.find(t => t.id === savedThemeId);
      if (theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
      }
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
  setTheme(themeId: string): void {
    const theme = ALL_THEMES.find(t => t.id === themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);

    // Persist via settings service
    if (this.settingsService) {
      this.settingsService.setTheme(themeId);
    } else {
      console.warn('SettingsService not initialized - theme preference not saved');
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