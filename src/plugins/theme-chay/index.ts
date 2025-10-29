import type { Plugin } from '@/shared/plugin-system';
import { chayLight, chayDark } from './themes';

export const ThemeChayPlugin: Plugin = {
  id: 'chaycards/theme-chay',
  name: 'Chay Themes',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'Girly pink and plant green themes - Chay Light and Chay Dark',
  publicSafe: true,
  dependencies: {
    requires: {
      'chaycards/core-theme': '^1.0.0'
    }
  },

  onLoad: async (manager) => {
    const themeService = manager.getService('chaycards/core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeChay] ThemeService not found - core-theme dependency missing?');
      return;
    }

    // Register themes with ThemeService
    await themeService.registerTheme(chayLight);
    await themeService.registerTheme(chayDark);

    console.log('[ThemeChay] Registered 2 theme variants (Chay Light & Dark)');
  }
};

export default ThemeChayPlugin;
