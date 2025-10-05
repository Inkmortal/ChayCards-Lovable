/**
 * ThemeService - Manages theme switching and CSS variable application
 * Stores theme preference in its own storage key: 'core-theme:preference'
 */

import type { Theme } from '../themes';
import { DEFAULT_THEME } from '../themes';
import type { StorageAdapter } from '@/shared/storage';
import { STORAGE_KEYS } from '@/shared/constants';

const THEME_LOCALSTORAGE_KEY = 'chaycards-theme'; // Fallback for public pages
const ALL_THEMES_KEY = 'core-theme:all-themes'; // All themes (plugin + custom) - single source of truth
const CUSTOM_THEMES_KEY = 'core-theme:custom-themes'; // DEPRECATED: Migration only
const FAVORITES_KEY = 'core-theme:favorites';

export class ThemeService {
  private currentTheme: Theme = DEFAULT_THEME;
  private listeners: Set<(theme: Theme) => void> = new Set();
  private themeListListeners: Set<() => void> = new Set();
  private storage: StorageAdapter | null = null;
  private pendingThemeId: string | null = null; // Deferred theme application
  // Caches removed: All theme data now queried from storage (single source of truth)

  constructor() {
    // NOTE: No initialization needed here
    // Themes will be loaded from storage in initialize() or registered by plugins in registerTheme()
    // currentTheme starts as DEFAULT_THEME and will be updated after plugins load
  }

  /**
   * Apply theme from localStorage (for public pages without storage)
   * This is called AFTER all plugins have loaded
   */
  async applyLocalStorageTheme(): Promise<void> {
    // NOW we can safely read localStorage - all theme plugins have registered
    const localThemeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY);

    if (localThemeId) {
      const theme = await this.getThemeById(localThemeId);
      if (theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
      } else {
        console.warn('[ThemeService] Theme ID in localStorage not found:', localThemeId);
        const availableThemes = await this.getAvailableThemes();
        console.warn('[ThemeService] Available themes:', availableThemes.map(t => t.id));
        // Fall back to default
        this.applyTheme(this.currentTheme);
      }
    } else {
      this.applyTheme(this.currentTheme);
    }
  }

  /**
   * Initialize with StorageAdapter for persistence
   * Loads theme ID, favorites, and custom themes from storage but DOES NOT apply theme yet
   * Theme will be applied later via applyStoredTheme() after all plugins loaded
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;

    try {
      // Load theme ID from user storage (cloud/local database)
      const savedThemeId = await storage.get(STORAGE_KEYS.CORE_THEME);
      if (savedThemeId) {
        this.pendingThemeId = savedThemeId;
        // Sync to localStorage as fallback
        localStorage.setItem(THEME_LOCALSTORAGE_KEY, savedThemeId);
      } else {
        // If no theme in storage but we have one in localStorage, load it
        const localThemeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY);
        if (localThemeId && localThemeId !== DEFAULT_THEME.id) {
          this.pendingThemeId = localThemeId;
          // We'll migrate to storage when we apply the theme
        }
      }
    } catch (error) {
      console.error('[ThemeService] Failed to load theme preference from storage:', error);
    }

    // DON'T apply theme yet - theme plugins might not have registered their themes
    // Application happens in applyStoredTheme() after plugins:all-loaded event
  }

  /**
   * Register a new theme (called by theme plugins during onLoad)
   * Checks storage first to avoid overwriting existing themes
   */
  async registerTheme(theme: Theme): Promise<void> {
    // No storage = public page, just set current theme (no persistence)
    if (!this.storage) {
      if (this.currentTheme.id === DEFAULT_THEME.id) {
        this.currentTheme = theme;
      }
      return;
    }

    // Check if theme already exists in storage
    const existingThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    if (existingThemes.some(t => t.id === theme.id)) {
      console.log(`[ThemeService] Theme ${theme.id} already in storage - skipping registration`);
      return;
    }

    // Add to storage
    existingThemes.push(theme);
    await this.storage.set(ALL_THEMES_KEY, existingThemes);

    this.notifyThemeListListeners();
  }

  /**
   * Apply the stored theme after all theme plugins have registered
   * Called after plugins:all-loaded event or by PluginManager post-load
   */
  async applyStoredTheme(): Promise<void> {
    if (!this.pendingThemeId) {
      return;
    }

    const theme = await this.getThemeById(this.pendingThemeId);
    if (theme) {
      await this.setTheme(this.pendingThemeId);
      this.pendingThemeId = null; // Clear pending
    } else {
      console.warn('[ThemeService] Stored theme not found:', this.pendingThemeId);
      const availableThemes = await this.getAvailableThemes();
      console.warn('[ThemeService] Available themes:', availableThemes.map(t => t.id));
      // Reset to default theme
      if (this.storage && this.pendingThemeId) {
        await this.storage.set(STORAGE_KEYS.CORE_THEME, DEFAULT_THEME.id);
      }
      this.pendingThemeId = null; // Clear invalid pending
    }
  }

  /**
   * Get all available themes (pure DB query)
   */
  async getAvailableThemes(): Promise<Theme[]> {
    if (!this.storage) {
      return [DEFAULT_THEME];
    }

    const themes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    return themes.length > 0 ? themes : [DEFAULT_THEME];
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set new theme and apply it
   * Saves to both user storage (if available) and localStorage (always)
   */
  async setTheme(themeId: string): Promise<void> {
    const theme = await this.getThemeById(themeId);
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
      } catch (error) {
        console.error('[ThemeService] Failed to save theme to user storage:', error);
      }
    }

    this.notifyListeners(theme);
  }

  /**
   * Preview theme without persisting (for modal preview)
   * Updates currentTheme to reflect preview, but doesn't save to storage
   */
  async previewTheme(themeId: string): Promise<void> {
    const theme = await this.getThemeById(themeId);
    if (!theme) {
      console.warn(`[ThemeService] Theme ${themeId} not found for preview`);
      return;
    }

    // Update currentTheme to reflect the preview, but don't persist
    this.currentTheme = theme;
    this.applyTheme(theme);

    // Notify listeners so UI shows preview state
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
    // Note: This is async but we don't await to maintain backward compatibility
    this.getAvailableThemes().then(themes => callback(themes));

    // Wrap callback to pass themes on future changes
    const listener = () => {
      this.getAvailableThemes().then(themes => callback(themes));
    };
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
   * Check if persistent storage is available
   * UI components should use this to disable create/edit/delete actions on public pages
   */
  hasStorage(): boolean {
    return this.storage !== null;
  }

  /**
   * Get theme by ID (pure DB query)
   */
  async getThemeById(themeId: string): Promise<Theme | undefined> {
    if (!this.storage) {
      return themeId === DEFAULT_THEME.id ? DEFAULT_THEME : undefined;
    }

    const themes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    return themes.find(t => t.id === themeId);
  }

  /**
   * Check if theme is currently active
   */
  isThemeActive(themeId: string): boolean {
    return this.currentTheme.id === themeId;
  }

  // ============================================================================
  // Favorites Management
  // ============================================================================

  /**
   * Toggle favorite status for a theme
   */
  async toggleFavorite(themeId: string): Promise<void> {
    if (!this.storage) return;

    // Read current favorites from DB
    const favorites = await this.storage.get<string[]>(FAVORITES_KEY) || [];

    // Toggle in array
    const index = favorites.indexOf(themeId);
    if (index !== -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(themeId);
    }

    // Save back to DB
    try {
      await this.storage.set(FAVORITES_KEY, favorites);
    } catch (error) {
      console.error('[ThemeService] Failed to save favorites:', error);
    }

    // Notify listeners that theme list may need refresh (to show/hide favorite stars)
    this.notifyThemeListListeners();
  }

  /**
   * Get all favorite theme IDs
   */
  async getFavorites(): Promise<string[]> {
    if (!this.storage) return [];
    return await this.storage.get<string[]>(FAVORITES_KEY) || [];
  }

  /**
   * Check if theme is favorited
   */
  async isFavorite(themeId: string): Promise<boolean> {
    if (!this.storage) return false;
    const favorites = await this.storage.get<string[]>(FAVORITES_KEY) || [];
    return favorites.includes(themeId);
  }

  // ============================================================================
  // Custom Themes Management
  // ============================================================================

  /**
   * Create a new custom theme
   * @throws Error if storage is not available (public page) or theme name exists
   */
  async createCustomTheme(themeData: Omit<Theme, 'id' | 'source'>): Promise<Theme> {
    // CRITICAL: Block custom theme creation on public pages
    if (!this.storage) {
      throw new Error('Please log in to create custom themes. Custom themes require persistent storage.');
    }

    // Check for duplicate name (query DB)
    const existingThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    const duplicateName = existingThemes.find(
      t => t.name.toLowerCase() === themeData.name.toLowerCase()
    );
    if (duplicateName) {
      throw new Error(`Theme name "${themeData.name}" already exists. Please choose a different name.`);
    }

    // Generate unique ID with custom- prefix
    const id = `custom-${Date.now()}`;
    const theme: Theme = {
      id,
      ...themeData,
      source: 'custom', // Explicit source field
    };

    // Validate theme has all required CSS variables
    this.validateTheme(theme);

    // Add to DB (pure storage, no cache)
    existingThemes.push(theme);
    await this.storage.set(ALL_THEMES_KEY, existingThemes);

    // Notify listeners
    this.notifyThemeListListeners();

    return theme;
  }

  /**
   * Update an existing custom theme
   * @throws Error if storage is not available (public page) or theme not found
   */
  async updateCustomTheme(themeId: string, updates: Partial<Theme>): Promise<void> {
    // CRITICAL: Block theme editing on public pages
    if (!this.storage) {
      throw new Error('Please log in to edit custom themes. Theme editing requires persistent storage.');
    }

    if (!themeId.startsWith('custom-')) {
      throw new Error('Can only update custom themes');
    }

    // Get all themes from DB
    const allThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    const existingIndex = allThemes.findIndex(t => t.id === themeId);

    if (existingIndex === -1) {
      throw new Error('Custom theme not found');
    }

    const existing = allThemes[existingIndex];
    const updated: Theme = {
      ...existing,
      ...updates,
      id: themeId, // Ensure ID doesn't change
      source: 'custom' // Ensure source stays custom
    };

    // Check for duplicate name (but allow keeping the same name)
    if (updates.name && updates.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = allThemes.find(
        t => t.id !== themeId && t.name.toLowerCase() === updates.name.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Theme name "${updates.name}" already exists. Please choose a different name.`);
      }
    }

    // Validate updated theme
    this.validateTheme(updated);

    // Update in array
    allThemes[existingIndex] = updated;
    await this.storage.set(ALL_THEMES_KEY, allThemes);

    // If this theme is currently active, re-apply it
    if (this.currentTheme.id === themeId) {
      this.currentTheme = updated;
      this.applyTheme(updated);
      this.notifyListeners(updated);
    }

    // Notify listeners
    this.notifyThemeListListeners();
  }

  /**
   * Delete a custom theme
   * @throws Error if storage is not available (public page) or theme not found
   */
  async deleteCustomTheme(themeId: string): Promise<void> {
    // CRITICAL: Block theme deletion on public pages
    if (!this.storage) {
      throw new Error('Please log in to delete custom themes. Theme deletion requires persistent storage.');
    }

    if (!themeId.startsWith('custom-')) {
      throw new Error('Can only delete custom themes');
    }

    // Get all themes from DB
    const allThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    const themeExists = allThemes.some(t => t.id === themeId);

    if (!themeExists) {
      throw new Error('Custom theme not found');
    }

    // If this theme is currently active, switch to default
    if (this.currentTheme.id === themeId) {
      await this.setTheme(DEFAULT_THEME.id);
    }

    // Remove from themes array
    const filtered = allThemes.filter(t => t.id !== themeId);
    await this.storage.set(ALL_THEMES_KEY, filtered);

    // Remove from favorites if present
    const favorites = await this.storage.get<string[]>(FAVORITES_KEY) || [];
    if (favorites.includes(themeId)) {
      const filteredFavorites = favorites.filter(id => id !== themeId);
      await this.storage.set(FAVORITES_KEY, filteredFavorites);
    }

    // Notify listeners
    this.notifyThemeListListeners();
  }

  /**
   * Get all custom themes
   */
  async getCustomThemes(): Promise<Theme[]> {
    if (!this.storage) return [];
    const allThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    return allThemes.filter(t => t.source === 'custom');
  }

  /**
   * Check if theme is custom (user-created)
   */
  isCustomTheme(themeId: string): boolean {
    return themeId.startsWith('custom-');
  }

  // ============================================================================
  // Filtering & Search
  // ============================================================================

  /**
   * Get themes by category (light or dark)
   */
  async getThemesByCategory(category: 'light' | 'dark'): Promise<Theme[]> {
    if (!this.storage) return [];
    const allThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];
    return allThemes.filter(theme => theme.category === category);
  }

  /**
   * Search themes by name or tags
   */
  async searchThemes(query: string, tags?: string[]): Promise<Theme[]> {
    if (!this.storage) return [];
    const lowerQuery = query.toLowerCase();
    const allThemes = await this.storage.get<Theme[]>(ALL_THEMES_KEY) || [];

    return allThemes.filter(theme => {
      // Match by name
      const nameMatch = theme.name.toLowerCase().includes(lowerQuery);

      // Match by description
      const descMatch = theme.description?.toLowerCase().includes(lowerQuery);

      // Match by tags
      const tagMatch = tags && tags.length > 0
        ? tags.some(tag => theme.tags.includes(tag))
        : theme.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

      return nameMatch || descMatch || tagMatch;
    });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Validate theme has all required CSS variables
   */
  private validateTheme(theme: Theme): void {
    const requiredVars = [
      '--background',
      '--foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
    ];

    const missing = requiredVars.filter(v => !theme.variables[v as keyof typeof theme.variables]);

    if (missing.length > 0) {
      throw new Error(`Theme validation failed: missing variables: ${missing.join(', ')}`);
    }

    // Validate HSL format for each variable (basic check)
    Object.entries(theme.variables).forEach(([key, value]) => {
      if (key !== '--radius' && typeof value === 'string') {
        // HSL format check: should be "H S% L%" without hsl() wrapper
        const hslPattern = /^\d+\s+\d+%\s+\d+%$/;
        if (!hslPattern.test(value) && !value.includes('rem')) {
          console.warn(`[ThemeService] Variable ${key} may have invalid HSL format:`, value);
        }
      }
    });
  }

  // saveCustomThemes() method removed - all operations now write directly to ALL_THEMES_KEY
}