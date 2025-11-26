/**
 * API Configuration
 *
 * Centralized API URL configuration that automatically uses the correct
 * backend based on environment (.env.development or .env.production).
 *
 * Vite automatically loads the right .env file:
 * - `npm run dev` → .env.development
 * - `npm run build` → .env.production
 */

/**
 * Base API URL for the ChayCards backend.
 *
 * Development: https://dev-api.chaycards.com
 * Production: https://api.chaycards.com
 *
 * Set via VITE_API_URL in .env.development / .env.production
 */
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.chaycards.com';

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: `${API_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_URL}/api/auth/register`,
  AUTH_VERIFY: `${API_URL}/api/auth/verify`,

  // Storage
  STORAGE_BASE: `${API_URL}/api/storage`,
  STORAGE_KEY: (key: string) => `${API_URL}/api/storage/${encodeURIComponent(key)}`,

  // Users
  USERS_ME: `${API_URL}/api/users/me`,
  USERS_ME_PLUGINS: `${API_URL}/api/users/me/plugins`,
  USERS_LIST: `${API_URL}/api/users`,

  // Health
  HEALTH: `${API_URL}/api/health`,
} as const;

/**
 * Check if running in development mode
 */
export const IS_DEV = import.meta.env.DEV;

/**
 * Check if running in production mode
 */
export const IS_PROD = import.meta.env.PROD;

/**
 * Environment name (development, production, etc.)
 */
export const ENV_NAME = import.meta.env.VITE_ENV || (IS_DEV ? 'development' : 'production');

/**
 * Log API configuration on startup (dev only)
 */
if (IS_DEV) {
  console.log('[API Config]', {
    apiUrl: API_URL,
    environment: ENV_NAME,
    isDev: IS_DEV,
  });
}
