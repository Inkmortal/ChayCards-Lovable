/**
 * ThemeService - Manages theme switching and CSS variable application
 * Stores theme preference in its own storage key: 'core-theme:preference'
 */

import type { Theme } from '../themes';
import { ALL_THEMES, DEFAULT_THEME } from '../themes';
import type { StorageAdapter } from '@/shared/storage';
import { STORAGE_KEYS } from '@/shared/constants';

const THEME_LOCALSTORAGE_KEY = 'chaycards-theme'; // Fallback for public pages

export class ThemeService {
  private currentTheme: Theme = DEFAULT_THEME;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private storage: StorageAdapter | null = null;

  constructor() {
    console.log('[ThemeService] Constructor called');

    // Read localStorage theme ID but DON'T apply it yet
    // This is just for fallback if storage initialization doesn't find anything
    const localThemeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
    console.log('[ThemeService] localStorage theme ID:', localThemeId);

    if (localThemeId) {
      const theme = ALL_THEMES.find(t => t.id === localThemeId);
      if (theme) {
        console.log('[ThemeService] Found theme in localStorage (not applying yet):', theme.name);
        this.currentTheme = theme;
      } else {
        console.warn('[ThemeService] Theme ID in localStorage not found in ALL_THEMES:', localThemeId);
      }
    } else {
      console.log('[ThemeService] No theme in localStorage, will use default:', DEFAULT_THEME.name);
    }

    // DON'T apply theme here - wait for initialize() to check storage first
    console.log('[ThemeService] Theme ready, waiting for initialize() to apply');
  }

  /**
   * Apply theme from localStorage (for public pages without storage)
   * This is called when no storage adapter is available
   */
  async applyLocalStorageTheme(): Promise<void> {
    // Theme is already loaded in constructor, just apply it
    console.log('[ThemeService] Applying localStorage theme:', this.currentTheme.name);
    this.applyTheme(this.currentTheme);
  }

  /**
   * Initialize with StorageAdapter for persistence
   * Should be called during plugin onLoad after storage is ready
   * Priority: User storage > localStorage > default
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;
    let themeToApply = this.currentTheme; // Default to what constructor loaded from localStorage

    // Try to load theme from user storage (cloud/local database)
    // This takes priority over localStorage
    try {
      const savedThemeId = await storage.get(STORAGE_KEYS.CORE_THEME);
      if (savedThemeId) {
        const theme = ALL_THEMES.find(t => t.id === savedThemeId);
        if (theme) {
          themeToApply = theme;
          this.currentTheme = theme;
          // Sync to localStorage as fallback
          localStorage.setItem(THEME_LOCALSTORAGE_KEY, savedThemeId);
          console.log('[ThemeService] Loaded theme from user storage:', savedThemeId);
        }
      } else {
        console.log('[ThemeService] No theme in user storage, checking localStorage fallback');
        // If no theme in storage but we have one in localStorage, migrate it
        if (this.currentTheme.id !== DEFAULT_THEME.id) {
          console.log('[ThemeService] Migrating localStorage theme to storage:', this.currentTheme.id);
          await storage.set(STORAGE_KEYS.CORE_THEME, this.currentTheme.id);
        }
      }
    } catch (error) {
      console.error('[ThemeService] Failed to load theme from storage:', error);
    }

    // NOW apply the theme (whether from storage, localStorage, or default)
    // Use setTheme to ensure listeners are notified (fixes UI state desync bug)
    console.log('[ThemeService] Applying final theme:', themeToApply.name);
    await this.setTheme(themeToApply.id);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    console.log('[ThemeService] getAvailableThemes called, returning', ALL_THEMES.length, 'themes');
    return [...ALL_THEMES];
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
    const theme = ALL_THEMES.find(t => t.id === themeId);
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