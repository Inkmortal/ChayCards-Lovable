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

  // No dependencies - works standalone with localStorage on public pages,
  // syncs to user storage when available on authenticated pages
  requires: [],

  components: {
    'ThemeSelector': ThemeSelector
  },

  services: {
    'themeService': new ThemeService()
  },

  onLoad: async (manager) => {
    console.log('[CoreThemePlugin] onLoad called');

    // Get theme service and storage
    const themeService = manager.getService('core-theme/themeService');
    const storage = manager.getStorage();

    console.log('[CoreThemePlugin] ThemeService:', !!themeService);
    console.log('[CoreThemePlugin] Storage:', !!storage);

    // Initialize theme service with storage for persistence (null on public pages)
    if (themeService && storage) {
      console.log('[CoreThemePlugin] Initializing theme service with storage...');
      await themeService.initialize(storage);
    } else if (themeService && !storage) {
      console.log('[CoreThemePlugin] No storage available (public page), theme service will use localStorage only');
    }

    // Emit theme system ready event
    console.log('[CoreThemePlugin] Emitting theme:system-ready event');
    manager.getEventBus().emit('theme:system-ready', {
      currentTheme: themeService?.getCurrentTheme(),
      availableThemes: themeService?.getAvailableThemes()
    });

    // Listen for theme change requests from other plugins
    manager.getEventBus().on('theme:change-request', async ({ themeId }) => {
      console.log('[CoreThemePlugin] Received theme:change-request for:', themeId);
      if (themeService) {
        await themeService.setTheme(themeId);
      }
    });
  }
};

export default CoreThemePlugin;