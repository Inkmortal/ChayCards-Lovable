import type { Plugin } from '@/shared/plugin-system';
import { gruvboxDark, gruvboxLight } from './themes';

export const ThemeGruvboxPlugin: Plugin = {
  id: 'chaycards/theme-gruvbox',
  name: 'Gruvbox Themes',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'Gruvbox Dark and Light theme variants',
  publicSafe: true,
  dependencies: {
    requires: {
      'chaycards/core-theme': '^1.0.0'
    }
  },

  onLoad: async (manager) => {
    const themeService = manager.getService('chaycards/core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeGruvbox] ThemeService not found');
      return;
    }

    await themeService.registerTheme(gruvboxDark);
    await themeService.registerTheme(gruvboxLight);
    console.log('[ThemeGruvbox] Registered 2 theme variants');
  }
};

export default ThemeGruvboxPlugin;
