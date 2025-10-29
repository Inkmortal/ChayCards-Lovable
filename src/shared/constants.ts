// Application constants

export const APP_NAME = 'ChayCards';
export const APP_VERSION = '0.0.1';

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_TIMEOUT = 30000; // 30 seconds

// Storage keys (legacy - consider using plugin-namespaced keys instead)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LAST_SYNC: 'last_sync',
  LAST_PROFILE_ID: 'last_profile_id', // Electron only: last used profile

  // Core plugin storage keys (plugin-namespaced)
  CORE_SETTINGS: 'core-settings:app-settings',
  CORE_THEME: 'core-theme:preference',
} as const;

/**
 * Plugin storage key prefixes for consistent naming across the application.
 * All plugins should namespace their storage keys using the `plugin-id:key-name` pattern.
 *
 * @example
 * // Core plugins use predefined prefixes
 * const settingsPrefix = STORAGE_KEY_PREFIX.SETTINGS; // 'chaycards/core-settings'
 *
 * @example
 * // Third-party plugins use their plugin ID
 * const customPrefix = STORAGE_KEY_PREFIX.PLUGIN('my-plugin'); // 'my-plugin'
 */
export const STORAGE_KEY_PREFIX = {
  /** Core settings plugin prefix */
  SETTINGS: 'chaycards/core-settings',
  /** Core theme plugin prefix */
  THEME: 'chaycards/core-theme',
  /** Generate prefix for any plugin by ID */
  PLUGIN: (pluginId: string) => pluginId,
} as const;

/**
 * Builds a properly namespaced storage key for a plugin following the `plugin-id:key-name` pattern.
 * This ensures consistent key naming and prevents collisions between plugins.
 *
 * All plugin storage keys MUST use this format to:
 * - Prevent key collisions between plugins
 * - Enable plugin-scoped queries with `storage.list(pluginId + ':')`
 * - Make storage keys self-documenting
 *
 * @param pluginId - The unique identifier of the plugin (must match the plugin's `id` property)
 * @param key - The specific data key within the plugin's namespace (lowercase, kebab-case recommended)
 * @returns A namespaced storage key in the format `plugin-id:key-name`
 *
 * @example
 * // Core settings plugin
 * const settingsKey = buildPluginStorageKey('chaycards/core-settings', 'app-settings');
 * // Returns: 'core-settings:app-settings'
 * await storage.set(settingsKey, { theme: 'dark' });
 *
 * @example
 * // Theme preference
 * const themeKey = buildPluginStorageKey('chaycards/core-theme', 'preference');
 * // Returns: 'core-theme:preference'
 * await storage.set(themeKey, 'catppuccin-latte');
 *
 * @example
 * // Third-party plugin with multiple keys
 * const notesKey = buildPluginStorageKey('my-notes-plugin', 'notes');
 * const configKey = buildPluginStorageKey('my-notes-plugin', 'config');
 * // Returns: 'my-notes-plugin:notes', 'my-notes-plugin:config'
 *
 * @example
 * // Query all keys for a plugin
 * const allPluginKeys = await storage.list('my-notes-plugin:');
 * // Returns: ['my-notes-plugin:notes', 'my-notes-plugin:config', ...]
 */
export function buildPluginStorageKey(pluginId: string, key: string): string {
  return `${pluginId}:${key}`;
}

// Public routes that don't require authentication
export const PUBLIC_ROUTES = ['/', '/login', '/register', '/setup', '/profile'] as const;

// Plugin system
export const PLUGIN_API_VERSION = '1.0.0';
export const PLUGIN_MANIFEST_VERSION = '1.0';

/**
 * Core plugins that must ALWAYS load for all users.
 * These plugins provide essential functionality and cannot be disabled.
 *
 * System Plugins:
 * - core-settings: Manages app settings and storage initialization
 * - core-theme: Provides theming system and CSS variables
 * - core-ui: Base UI components used by other plugins
 *
 * Theme Plugins (all themes available to all users):
 * - theme-catppuccin: Catppuccin color schemes
 * - theme-dracula: Dracula theme
 * - theme-gruvbox: Gruvbox theme
 * - theme-tokyonight: Tokyo Night theme
 * - theme-chay: Custom Chay themes
 *
 * Development Plugins:
 * - demo-plugin: Example plugin for development and testing
 */
/**
 * Core plugins that ALWAYS load and cannot be disabled.
 * These are essential for the application to function.
 */
export const CORE_PLUGINS = [
  'chaycards/core-settings',
  'chaycards/core-theme',
  'chaycards/core-ui',
  'chaycards/core-documents',  // Essential feature - can't use ChayCards without documents
  'chaycards/theme-catppuccin',
  'chaycards/theme-dracula',
  'chaycards/theme-gruvbox',
  'chaycards/theme-tokyonight',
  'chaycards/theme-chay',
  'chaycards/demo-plugin',
] as const;

/**
 * Default plugins enabled for newly created users.
 * This is a superset of CORE_PLUGINS and includes recommended optional plugins.
 *
 * Used by:
 * - Server registration endpoint (PostgreSQL)
 * - Electron profile creation (SQLite)
 */
export const DEFAULT_PLUGINS = [
  ...CORE_PLUGINS,
  // Add future optional plugins here that should be enabled by default
] as const;

/**
 * Check if a plugin ID is a core plugin that cannot be disabled.
 *
 * @param pluginId - The plugin ID to check
 * @returns true if the plugin is a core plugin, false otherwise
 *
 * @example
 * isCorePlugin('chaycards/core-settings'); // true
 * isCorePlugin('chaycards/core-documents'); // true
 * isCorePlugin('chaycards/demo-plugin'); // true
 */
export function isCorePlugin(pluginId: string): boolean {
  return (CORE_PLUGINS as readonly string[]).includes(pluginId);
}

// Features flags (for future use)
export const FEATURES = {
  CLOUD_SYNC: false,
  PLUGIN_MARKETPLACE: false,
  AI_FEATURES: false,
} as const;