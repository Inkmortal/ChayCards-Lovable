/**
 * SettingsService - Manages application settings and user preferences
 *
 * Storage Strategy:
 * - Uses StorageAdapter (SQLite for Electron, PostgreSQL for cloud)
 * - Settings are stored under key: 'core-settings:app-settings'
 * - Falls back to localStorage ONLY during initial setup (before storage is initialized)
 */

import type { UserSettings, StorageMode } from '../types';
import { getDefaultSettings } from '../types';
import type { StorageAdapter } from '@/shared/storage';
import { isElectron } from '@/utils/platform';
import { STORAGE_KEYS } from '@/shared/constants';

export class SettingsService {
  private settings: UserSettings = getDefaultSettings();
  private listeners: Set<(settings: UserSettings) => void> = new Set();
  private storage: StorageAdapter | null = null;
  private isElectron: boolean;

  constructor(storage?: StorageAdapter) {
    this.isElectron = isElectron();
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
   * Get all settings
   */
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  /**
   * Get storage mode choice
   */
  getStorageMode(): StorageMode {
    return this.settings.storageMode;
  }

  /**
   * Check if setup is complete
   */
  isSetupComplete(): boolean {
    return this.settings.setupComplete;
  }

  /**
   * Update settings
   */
  async updateSettings(partial: Partial<UserSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...partial,
      updatedAt: Date.now()
    };

    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Complete setup with storage choice
   */
  async completeSetup(storageMode: StorageMode): Promise<void> {
    await this.updateSettings({
      storageMode,
      setupComplete: true
    });
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (settings: UserSettings) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      if (this.storage) {
        // Load from StorageAdapter (SQLite/PostgreSQL)
        const stored = await this.storage.get(STORAGE_KEYS.CORE_SETTINGS);
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