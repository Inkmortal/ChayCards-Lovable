import type { Plugin } from '@/shared/plugin-system';
import { tokyoNightStorm, tokyoNightLight } from './themes';

export const ThemeTokyoNightPlugin: Plugin = {
  id: 'chaycards/theme-tokyonight',
  name: 'Tokyo Night Themes',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'Tokyo Night Storm and Light theme variants',
  publicSafe: true,
  dependencies: {
    requires: {
      'chaycards/core-theme': '^1.0.0'
    }
  },

  onLoad: async (manager) => {
    const themeService = manager.getService('chaycards/core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeTokyoNight] ThemeService not found');
      return;
    }

    await themeService.registerTheme(tokyoNightStorm);
    await themeService.registerTheme(tokyoNightLight);
    console.log('[ThemeTokyoNight] Registered 2 theme variants');
  }
};

export default ThemeTokyoNightPlugin;
