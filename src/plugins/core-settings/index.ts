/**
 * Core Settings Plugin
 * Manages application settings and user preferences
 *
 * CRITICAL: This plugin MUST load before all others
 * It provides the storage mode that determines which storage adapter to use
 */

import type { Plugin } from '../../shared/plugin-system/types';
import { SettingsService } from './services/SettingsService';

export const CoreSettingsPlugin: Plugin = {
  id: 'core-settings',
  name: 'Core Settings',
  version: '1.0.0',
  description: 'Manages application settings and user preferences',

  // No dependencies - this loads FIRST
  requires: [],

  services: {
    'settingsService': new SettingsService()
  },

  onLoad: async (manager) => {
    console.log('Core Settings Plugin loaded');

    const settingsService = manager.getService('core-settings/settingsService');

    // Log current settings
    console.log('Current settings:', settingsService.getSettings());
    console.log('Storage mode:', settingsService.getStorageMode());

    // Emit ready event
    manager.getEventBus().emit('settings:ready', {
      storageMode: settingsService.getStorageMode(),
      setupComplete: settingsService.isSetupComplete()
    });
  }
};

export default CoreSettingsPlugin;