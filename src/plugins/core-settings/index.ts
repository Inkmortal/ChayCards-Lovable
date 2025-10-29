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
  id: 'chaycards/core-settings',
  name: 'Core Settings',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'Manages application settings and user preferences',

  // No dependencies - this loads FIRST
  dependencies: {},

  services: {
    'settingsService': new SettingsService()
  },

  onLoad: async (manager) => {
    console.log('[core-settings] Plugin loaded');

    const settingsService = manager.getService('chaycards/core-settings/settingsService');

    // Log current app-wide settings
    console.log('[core-settings] Current settings:', settingsService.getSettings());

    // Emit ready event
    manager.getEventBus().emit('settings:ready', {
      settings: settingsService.getSettings()
    });
  }
};

export default CoreSettingsPlugin;