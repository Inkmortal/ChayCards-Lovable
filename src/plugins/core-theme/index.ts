/**
 * Core Theme Plugin
 * Provides theming system for ChayCards
 */

import type { Plugin } from '../../shared/plugin-system/types';
import { ThemeService } from './services/ThemeService';
import { ThemeSelector } from './components/ThemeSelector';

export const CoreThemePlugin: Plugin = {
  id: 'core-theme',
  name: 'Core Theme System',
  version: '1.0.0',
  description: 'Provides theming capabilities with multiple theme variants',

  // Depends on core-settings to persist theme preferences
  requires: ['core-settings'],

  components: {
    'ThemeSelector': ThemeSelector
  },

  services: {
    'themeService': new ThemeService()
  },

  onLoad: async (manager) => {
    console.log('Core Theme Plugin loaded');

    // Get theme service and storage
    const themeService = manager.getService('core-theme/themeService');
    const storage = manager.getStorage();

    // Initialize theme service with storage for persistence
    if (themeService && storage) {
      await themeService.initialize(storage);
    }

    // Emit theme system ready event
    manager.getEventBus().emit('theme:system-ready', {
      currentTheme: themeService.getCurrentTheme(),
      availableThemes: themeService.getAvailableThemes()
    });

    // Listen for theme change requests from other plugins
    manager.getEventBus().on('theme:change-request', async ({ themeId }) => {
      if (themeService) {
        await themeService.setTheme(themeId);
      }
    });
  }
};

export default CoreThemePlugin;