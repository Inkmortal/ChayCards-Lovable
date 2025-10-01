/**
 * Settings Types
 * User preferences and application settings
 */

export type StorageMode = 'local' | 'sync' | 'cloud';
export type Platform = 'electron' | 'web';

export interface UserSettings {
  // Storage configuration from setup
  storageMode: StorageMode;

  // User profile (optional, for cloud sync)
  userId?: string;
  email?: string;

  // Setup completion
  setupComplete: boolean;

  // Last updated timestamp
  updatedAt: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  storageMode: 'local',
  setupComplete: false,
  updatedAt: Date.now()
};

/**
 * Get platform-aware default settings
 * Web → cloud storage (PostgreSQL via API)
 * Electron → local storage (SQLite via IPC)
 */
export function getDefaultSettings(): UserSettings {
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
  return {
    storageMode: isElectron ? 'local' : 'cloud',
    setupComplete: false,
    updatedAt: Date.now()
  };
}