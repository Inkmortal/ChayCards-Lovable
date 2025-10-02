/**
 * Platform detection utilities for ChayCards
 * Supports Web, Electron, and Capacitor (mobile) environments
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'electron' | 'capacitor';

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

export const isWeb = (): boolean => getPlatform() === 'web';
export const isElectron = (): boolean => getPlatform() === 'electron';
export const isCapacitor = (): boolean => getPlatform() === 'capacitor';
export const isMobile = (): boolean => isCapacitor();
export const isDesktop = (): boolean => isElectron();

/**
 * Get the native platform when running in Capacitor
 * Returns 'ios', 'android', or 'web' when not in Capacitor
 */
export const getNativePlatform = (): string => {
  if (isCapacitor()) {
    return Capacitor.getPlatform();
  }
  return 'web';
};

/**
 * Platform-specific capabilities check
 */
export const platformCapabilities = {
  hasFileSystem: (): boolean => isElectron(),
  hasNativeFeatures: (): boolean => isCapacitor(),
  hasWebFeatures: (): boolean => isWeb() || isElectron(),
  hasAppStore: (): boolean => isCapacitor(),
  hasMenuBar: (): boolean => isElectron(),
};