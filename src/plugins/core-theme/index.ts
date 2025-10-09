/**
 * Core Theme Plugin
 * Provides theming system for ChayCards
 */

import type { Plugin } from '../../shared/plugin-system/types';
import { ThemeService } from './services/ThemeService';
import { ThemeSelector } from './components/ThemeSelector';
import { ThemeModal } from './components/ThemeModal';
import { ThemeCard } from './components/ThemeCard';
import { ThemeBuilder } from './components/ThemeBuilder';

export const CoreThemePlugin: Plugin = {
  id: 'core-theme',
  name: 'Core Theme System',
  version: '1.0.0',
  description: 'Provides theming capabilities with multiple theme variants',

  // Can run on public pages with localStorage, syncs to user storage when authenticated
  publicSafe: true,

  // No dependencies - works standalone with localStorage on public pages,
  // syncs to user storage when available on authenticated pages
  requires: [],

  components: {
    'ThemeSelector': ThemeSelector,
    'ThemeModal': ThemeModal,
    'ThemeCard': ThemeCard,
    'ThemeBuilder': ThemeBuilder
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

    // Initialize theme service with storage (loads theme ID but doesn't apply yet)
    if (themeService && storage) {
      console.log('[CoreThemePlugin] Initializing theme service with storage...');
      await themeService.initialize(storage);
      console.log('[CoreThemePlugin] Theme will be applied in onPluginsReady hook');
    } else if (themeService && !storage) {
      console.log('[CoreThemePlugin] No storage available (public page)');
      console.log('[CoreThemePlugin] Theme will be applied by PluginManager after all plugins load');
      // PluginManager calls applyLocalStorageTheme() after all plugins loaded
    }

    // Listen for theme change requests from other plugins
    manager.getEventBus().on('theme:change-request', async ({ themeId }) => {
      console.log('[CoreThemePlugin] Received theme:change-request for:', themeId);
      if (themeService) {
        await themeService.setTheme(themeId);
      }
    });
  },

  onPluginsReady: async (manager) => {
    console.log('[CoreThemePlugin] onPluginsReady called - all theme plugins loaded');

    const themeService = manager.getService('core-theme/themeService');

    // Apply stored theme now that all theme plugins have registered their themes
    if (themeService) {
      await themeService.applyStoredTheme();

      // Emit theme system ready event with all themes available
      console.log('[CoreThemePlugin] Emitting theme:system-ready event');
      manager.getEventBus().emit('theme:system-ready', {
        currentTheme: themeService.getCurrentTheme(),
        availableThemes: await themeService.getAvailableThemes()
      });
    }
  }
};

export default CoreThemePlugin;