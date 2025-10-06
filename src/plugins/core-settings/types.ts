/**
 * Settings Types
 * App-wide settings and plugin settings registry
 */

/**
 * Storage mode (determined by platform, NOT a user preference)
 * - 'local': SQLite (Electron only)
 * - 'sync': SQLite + PostgreSQL (future feature)
 * - 'cloud': PostgreSQL (web always uses this)
 */
export type StorageMode = 'local' | 'sync' | 'cloud';

/**
 * App-wide settings stored in core-settings
 * These apply to the entire application, not specific plugins
 *
 * NOTE: User account data (username, email, enabled_plugins) is NOT here
 * That lives in the `users` table in the database
 */
export interface AppSettings {
  // Localization
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  timezone: string; // IANA timezone (e.g., 'America/Los_Angeles')

  // Privacy & Analytics
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableCrashReports: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Last updated timestamp
  updatedAt: number;
}

/**
 * Settings field schema for plugin registration
 * Defines how a setting should be rendered in the settings UI
 */
export interface SettingFieldSchema {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'range';
  defaultValue: any;

  // For select type
  options?: Array<{ value: string; label: string }>;

  // For range type
  min?: number;
  max?: number;
  step?: number;

  // Validation
  required?: boolean;
  validation?: (value: any) => boolean | string;
}

/**
 * Plugin settings section schema
 * Plugins register these to appear in settings page
 */
export interface PluginSettingsSchema {
  pluginId: string;
  pluginName: string;
  description?: string;
  icon?: string;
  fields: SettingFieldSchema[];
}

/**
 * Default app-wide settings
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  enableAnalytics: false,
  enableNotifications: true,
  enableCrashReports: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  updatedAt: Date.now()
};

/**
 * Get default settings (platform-agnostic)
 */
export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, updatedAt: Date.now() };
}