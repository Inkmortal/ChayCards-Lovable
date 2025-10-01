/**
 * SettingsService - Manages application settings and user preferences
 *
 * Storage Strategy:
 * - Electron: JSON file in app data folder (~/.chaycards/settings.json)
 * - Web: localStorage (just for settings metadata, not user data)
 *
 * This is the ONLY place where localStorage is acceptable (settings only)
 */

import type { UserSettings, StorageMode } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export class SettingsService {
  private settings: UserSettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<(settings: UserSettings) => void> = new Set();
  private isElectron: boolean;

  constructor() {
    this.isElectron = window.electronAPI !== undefined;
    this.loadSettings();
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
   * Get theme preference
   */
  getTheme(): string {
    return this.settings.theme;
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
  updateSettings(partial: Partial<UserSettings>): void {
    this.settings = {
      ...this.settings,
      ...partial,
      updatedAt: Date.now()
    };

    this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Complete setup with storage choice
   */
  completeSetup(storageMode: StorageMode): void {
    this.updateSettings({
      storageMode,
      setupComplete: true
    });
  }

  /**
   * Set theme preference
   */
  setTheme(themeId: string): void {
    this.updateSettings({ theme: themeId });
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
  private loadSettings(): void {
    try {
      if (this.isElectron) {
        // TODO: Load from Electron app data folder via IPC
        // For now, fallback to localStorage
        const stored = localStorage.getItem('chaycards-settings');
        if (stored) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } else {
        // Web: use localStorage for settings metadata
        const stored = localStorage.getItem('chaycards-settings');
        if (stored) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    try {
      const data = JSON.stringify(this.settings);

      if (this.isElectron) {
        // TODO: Save to Electron app data folder via IPC
        // For now, fallback to localStorage
        localStorage.setItem('chaycards-settings', data);
      } else {
        // Web: use localStorage for settings metadata
        localStorage.setItem('chaycards-settings', data);
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
  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.notifyListeners();
  }
}