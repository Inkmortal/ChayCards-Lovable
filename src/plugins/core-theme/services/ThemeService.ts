/**
 * ThemeService - Manages theme switching and CSS variable application
 * Stores theme preference in its own storage key: 'core-theme:preference'
 */

import type { Theme } from '../themes';
import { DEFAULT_THEME } from '../themes';
import type { StorageAdapter } from '@/shared/storage';
import { STORAGE_KEYS } from '@/shared/constants';

const THEME_LOCALSTORAGE_KEY = 'chaycards-theme'; // Fallback for public pages

export class ThemeService {
  private currentTheme: Theme = DEFAULT_THEME;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private themeListListeners: Set<() => void> = new Set();
  private storage: StorageAdapter | null = null;
  private themes: Map<string, Theme> = new Map();
  private pendingThemeId: string | null = null; // Deferred theme application

  constructor() {
    console.log('[ThemeService] Constructor called');

    // Register default theme (Catppuccin Latte)
    // Other themes will be registered by their respective plugins during onLoad
    this.themes.set(DEFAULT_THEME.id, DEFAULT_THEME);
    console.log('[ThemeService] Initialized with default theme:', DEFAULT_THEME.name);

    // NOTE: DON'T read localStorage here - theme plugins haven't loaded yet!
    // localStorage theme will be loaded in applyLocalStorageTheme() or initialize()
    // after all theme plugins have registered their themes
  }

  /**
   * Apply theme from localStorage (for public pages without storage)
   * This is called AFTER all plugins have loaded
   */
  async applyLocalStorageTheme(): Promise<void> {
    // NOW we can safely read localStorage - all theme plugins have registered
    const localThemeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    console.log('[ThemeService] Reading localStorage theme ID:', localThemeId);

    if (localThemeId) {
      const theme = this.themes.get(localThemeId);
      if (theme) {
        console.log('[ThemeService] Found theme in localStorage:', theme.name);
        this.currentTheme = theme;
        this.applyTheme(theme);
      } else {
        console.warn('[ThemeService] Theme ID in localStorage not found:', localThemeId);
        console.warn('[ThemeService] Available themes:', Array.from(this.themes.keys()));
        // Fall back to default
        this.applyTheme(this.currentTheme);
      }
    } else {
      console.log('[ThemeService] No theme in localStorage, using default:', this.currentTheme.name);
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * Initialize with StorageAdapter for persistence
   * Loads theme ID from storage but DOES NOT apply it yet
   * Theme will be applied later via applyStoredTheme() after all plugins loaded
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;

    // Load theme ID from user storage (cloud/local database)
    try {
      const savedThemeId = await storage.get(STORAGE_KEYS.CORE_THEME);
      if (savedThemeId) {
        console.log('[ThemeService] Loaded theme ID from user storage:', savedThemeId);
        this.pendingThemeId = savedThemeId;
        // Sync to localStorage as fallback
        localStorage.setItem(THEME_LOCALSTORAGE_KEY, savedThemeId);
      } else {
        console.log('[ThemeService] No theme in user storage, checking localStorage fallback');
        // If no theme in storage but we have one in localStorage, load it
        const localThemeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
        if (localThemeId && localThemeId !== DEFAULT_THEME.id) {
          console.log('[ThemeService] Found localStorage theme, will migrate to storage:', localThemeId);
          this.pendingThemeId = localThemeId;
          // Migrate to storage when we apply the theme
        }
      }
    } catch (error) {
      console.error('[ThemeService] Failed to load theme from storage:', error);
    }

    // DON'T apply theme yet - theme plugins might not have registered their themes
    // Application happens in applyStoredTheme() after plugins:all-loaded event
    console.log('[ThemeService] Initialization complete, theme application deferred');
  }

  /**
   * Register a new theme (called by theme plugins during onLoad)
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
    console.log(`[ThemeService] Registered theme: ${theme.name} (${theme.id})`);
    this.notifyThemeListListeners();
  }

  /**
   * Apply the stored theme after all theme plugins have registered
   * Called after plugins:all-loaded event or by PluginManager post-load
   */
  async applyStoredTheme(): Promise<void> {
    if (!this.pendingThemeId) {
      console.log('[ThemeService] No pending theme to apply, using default');
      return;
    }

    const theme = this.themes.get(this.pendingThemeId);
    if (theme) {
      console.log('[ThemeService] Applying stored theme:', theme.name);
      await this.setTheme(this.pendingThemeId);
      this.pendingThemeId = null; // Clear pending
    } else {
      console.warn('[ThemeService] Stored theme not found:', this.pendingThemeId);
      console.warn('[ThemeService] Available themes:', Array.from(this.themes.keys()));
      // Migrate to storage if we have one
      if (this.storage && this.pendingThemeId) {
        console.log('[ThemeService] Saving default theme to storage (migration)');
        await this.storage.set(STORAGE_KEYS.CORE_THEME, DEFAULT_THEME.id);
      }
      this.pendingThemeId = null; // Clear invalid pending
    }
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    console.log('[ThemeService] getAvailableThemes called, returning', this.themes.size, 'themes');
    return Array.from(this.themes.values());
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): Theme {
    console.log('[ThemeService] getCurrentTheme called, returning:', this.currentTheme.name);
    return this.currentTheme;
  }

  /**
   * Set new theme and apply it
   * Saves to both user storage (if available) and localStorage (always)
   */
  async setTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);

    // Always save to localStorage (works on all pages)
    localStorage.setItem(THEME_LOCALSTORAGE_KEY, themeId);

    // Also save to user storage if available (for syncing across devices)
    if (this.storage) {
      try {
        await this.storage.set(STORAGE_KEYS.CORE_THEME, themeId);
        console.log('[ThemeService] Saved theme to user storage:', themeId);
      } catch (error) {
        console.error('[ThemeService] Failed to save theme to user storage:', error);
      }
    }

    this.notifyListeners(theme);
  }

  /**
   * Subscribe to theme changes
   * Immediately invokes callback with current theme, then on future changes
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    // Immediately provide current state (solves late subscriber problem)
    callback(this.currentTheme);

    // Add to listeners for future changes
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to theme list changes (when new themes are registered)
   * Immediately invokes callback with current themes, then on future registrations
   */
  onThemeListChange(callback: (themes: Theme[]) => void): () => void {
    // Immediately provide current state (solves late subscriber problem)
    callback(this.getAvailableThemes());

    // Wrap callback to pass themes on future changes
    const listener = () => callback(this.getAvailableThemes());
    this.themeListListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.themeListListeners.delete(listener);
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
   * Notify all listeners of theme list change
   */
  private notifyThemeListListeners(): void {
    this.themeListListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in theme list change callback:', error);
      }
    });
  }

  /**
   * Get theme by ID
   */
  getThemeById(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Check if theme is currently active
   */
  isThemeActive(themeId: string): boolean {
    return this.currentTheme.id === themeId;
  }
}