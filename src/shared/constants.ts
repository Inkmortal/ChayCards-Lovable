// Application constants

export const APP_NAME = 'ChayCards';
export const APP_VERSION = '0.0.1';

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_TIMEOUT = 30000; // 30 seconds

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LAST_SYNC: 'last_sync',
} as const;

// Public routes that don't require authentication
export const PUBLIC_ROUTES = ['/', '/login', '/register', '/setup'] as const;

// Plugin system
export const PLUGIN_API_VERSION = '1.0.0';
export const PLUGIN_MANIFEST_VERSION = '1.0';

// Features flags (for future use)
export const FEATURES = {
  CLOUD_SYNC: false,
  PLUGIN_MARKETPLACE: false,
  AI_FEATURES: false,
} as const;