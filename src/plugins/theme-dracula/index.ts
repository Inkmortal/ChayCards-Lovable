import type { Plugin } from '@/shared/plugin-system';
import { draculaDark } from './themes';

export const ThemeDraculaPlugin: Plugin = {
  id: 'chaycards/theme-dracula',
  name: 'Dracula Theme',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'The iconic Dracula dark theme',
  publicSafe: true,
  dependencies: {
    requires: {
      'chaycards/core-theme': '^1.0.0'
    }
  },

  onLoad: async (manager) => {
    const themeService = manager.getService('chaycards/core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeDracula] ThemeService not found');
      return;
    }

    await themeService.registerTheme(draculaDark);
    console.log('[ThemeDracula] Registered Dracula Dark theme');
  }
};

export default ThemeDraculaPlugin;
