/**
 * Platform detection utilities for ChayCards
 *
 * **CRITICAL: This is the ONLY place for platform detection logic.**
 * All platform checks MUST use these utilities, never check window.electronAPI directly.
 *
 * Supports three environments:
 * - **Web**: Browser-based (cloud storage via PostgreSQL API)
 * - **Electron**: Desktop app (local storage via SQLite IPC)
 * - **Capacitor**: Mobile apps (iOS/Android with native features)
 *
 * @module utils/platform
 */

import { Capacitor } from '@capacitor/core';

/**
 * Supported platform types
 */
export type Platform = 'web' | 'electron' | 'capacitor';

/**
 * Get the current platform ChayCards is running on.
 *
 * Detection order:
 * 1. Capacitor native (iOS/Android)
 * 2. Electron desktop
 * 3. Web browser (default)
 *
 * @returns {Platform} The detected platform
 *
 * @example
 * ```ts
 * const platform = getPlatform();
 * if (platform === 'electron') {
 *   // Use SQLite via Electron IPC
 * } else {
 *   // Use PostgreSQL via API
 * }
 * ```
 */
export const getPlatform = (): Platform => {
  // Check if running in Capacitor environment (mobile)
  if (Capacitor.isNativePlatform()) {
    return 'capacitor';
  }

  // Check if running in Electron environment
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'electron';
  }

  // Default to web
  return 'web';
};

/**
 * Check if running in a web browser.
 *
 * @returns {boolean} true if web platform
 *
 * @example
 * ```ts
 * if (isWeb()) {
 *   // Show cloud storage options
 * }
 * ```
 */
export const isWeb = (): boolean => getPlatform() === 'web';

/**
 * Check if running in Electron desktop app.
 *
 * **Use this instead of checking `window.electronAPI !== undefined` directly.**
 *
 * @returns {boolean} true if Electron platform
 *
 * @example
 * ```ts
 * import { isElectron } from '@/utils/platform';
 *
 * if (isElectron()) {
 *   // Access SQLite via window.electronAPI
 *   await window.electronAPI.storage.get(key);
 * }
 * ```
 */
export const isElectron = (): boolean => getPlatform() === 'electron';

/**
 * Check if running in Capacitor mobile app.
 *
 * @returns {boolean} true if Capacitor platform
 *
 * @example
 * ```ts
 * if (isCapacitor()) {
 *   // Use mobile-specific features
 * }
 * ```
 */
export const isCapacitor = (): boolean => getPlatform() === 'capacitor';

/**
 * Check if running on mobile (alias for isCapacitor).
 *
 * @returns {boolean} true if mobile platform
 */
export const isMobile = (): boolean => isCapacitor();

/**
 * Check if running on desktop (alias for isElectron).
 *
 * @returns {boolean} true if desktop platform
 */
export const isDesktop = (): boolean => isElectron();

/**
 * Get the native platform when running in Capacitor.
 *
 * @returns {string} 'ios', 'android', or 'web' when not in Capacitor
 *
 * @example
 * ```ts
 * const nativePlatform = getNativePlatform();
 * if (nativePlatform === 'ios') {
 *   // iOS-specific behavior
 * }
 * ```
 */
export const getNativePlatform = (): string => {
  if (isCapacitor()) {
    return Capacitor.getPlatform();
  }
  return 'web';
};

/**
 * Platform-specific capabilities detection.
 *
 * Use these helpers to conditionally enable/disable features based on platform.
 *
 * @example
 * ```ts
 * import { platformCapabilities } from '@/utils/platform';
 *
 * if (platformCapabilities.hasFileSystem()) {
 *   // Show "Export to File" option
 * }
 *
 * if (platformCapabilities.hasNativeFeatures()) {
 *   // Use camera, GPS, etc.
 * }
 * ```
 */
export const platformCapabilities = {
  /** File system access (Electron only) */
  hasFileSystem: (): boolean => isElectron(),

  /** Native mobile features (Capacitor only) */
  hasNativeFeatures: (): boolean => isCapacitor(),

  /** Modern web features (Web + Electron) */
  hasWebFeatures: (): boolean => isWeb() || isElectron(),

  /** App store deployment (Capacitor only) */
  hasAppStore: (): boolean => isCapacitor(),

  /** Desktop menu bar (Electron only) */
  hasMenuBar: (): boolean => isElectron(),
};