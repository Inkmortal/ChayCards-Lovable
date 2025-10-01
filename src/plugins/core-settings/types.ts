/**
 * Settings Types
 * User preferences and application settings
 */

export type StorageMode = 'local' | 'sync' | 'cloud';
export type Platform = 'electron' | 'web';

export interface UserSettings {
  // Storage configuration from setup
  storageMode: StorageMode;

  // Theme preference
  theme: string;

  // User profile
  userId?: string;
  email?: string;

  // Setup completion
  setupComplete: boolean;

  // Last updated timestamp
  updatedAt: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  storageMode: 'local',
  theme: 'catppuccin-latte',
  setupComplete: false,
  updatedAt: Date.now()
};