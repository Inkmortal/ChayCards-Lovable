/**
 * SettingsService - Manages app-wide settings and plugin settings registry
 *
 * Architecture:
 * - App-wide settings: Stored in storage table under 'core-settings:app-settings'
 * - Plugin settings: Each plugin stores its own settings under 'pluginId:settings'
 * - Settings registry: Plugins register their schemas for settings UI
 *
 * Storage Strategy:
 * - Uses StorageAdapter (SQLite for Electron, PostgreSQL for cloud)
 * - NO user account data (that's in users table)
 * - NO plugin enablement (that's in users.enabled_plugins)
 */

import type { AppSettings, PluginSettingsSchema } from '../types';
import { getDefaultSettings } from '../types';
import type { StorageAdapter } from '@/shared/storage';
import { STORAGE_KEYS } from '@/shared/constants';

export class SettingsService {
  private settings: AppSettings = getDefaultSettings();
  private listeners: Set<(settings: AppSettings) => void> = new Set();
  private storage: StorageAdapter | null = null;

  // Plugin settings registry (for settings UI page)
  private pluginSchemas = new Map<string, PluginSettingsSchema>();

  constructor(storage?: StorageAdapter) {
    this.storage = storage || null;
    this.loadSettings();
  }

  /**
   * Initialize storage adapter (called after storage is set up)
   */
  async setStorage(storage: StorageAdapter): Promise<void> {
    this.storage = storage;
    // Reload settings from storage now that it's available
    await this.loadSettings();
  }

  /**
   * Get all app-wide settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific setting value
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Update app-wide settings
   */
  async updateSettings(partial: Partial<AppSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...partial,
      updatedAt: Date.now()
    };

    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (settings: AppSettings) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Register plugin settings schema (for settings UI)
   * Plugins call this in their onLoad hook to register their settings
   */
  registerPluginSettings(schema: PluginSettingsSchema): void {
    this.pluginSchemas.set(schema.pluginId, schema);
    console.log(`[SettingsService] Registered settings schema for ${schema.pluginId}`);
  }

  /**
   * Get all registered plugin settings schemas
   * Used by settings page to render plugin settings sections
   */
  getPluginSchemas(): PluginSettingsSchema[] {
    return Array.from(this.pluginSchemas.values());
  }

  /**
   * Get a specific plugin's settings schema
   */
  getPluginSchema(pluginId: string): PluginSettingsSchema | undefined {
    return this.pluginSchemas.get(pluginId);
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      if (this.storage) {
        // Load from StorageAdapter (SQLite/PostgreSQL)
        const result = await this.storage.get(STORAGE_KEYS.CORE_SETTINGS);
        const stored = result?.data;
        if (stored) {
          this.settings = { ...getDefaultSettings(), ...stored };
          console.log('[SettingsService] Loaded settings from storage:', this.settings);
        } else {
          console.log('[SettingsService] No settings found, using defaults');
        }
      } else {
        console.log('[SettingsService] Storage not initialized yet, using defaults');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = getDefaultSettings();
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      if (this.storage) {
        // Save to StorageAdapter (SQLite/PostgreSQL)
        await this.storage.set(STORAGE_KEYS.CORE_SETTINGS, this.settings);
        console.log('[SettingsService] Saved settings to storage');
      } else {
        console.warn('[SettingsService] Cannot save - storage not initialized yet');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Notify all listeners of settings change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error('Error in settings change callback:', error);
      }
    });
  }

  /**
   * Reset settings to defaults (for testing/debugging)
   */
  async reset(): Promise<void> {
    this.settings = getDefaultSettings();
    await this.saveSettings();
    this.notifyListeners();
  }
}