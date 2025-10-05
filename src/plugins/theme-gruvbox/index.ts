import type { Plugin } from '@/shared/plugin-system';
import { gruvboxDark, gruvboxLight } from './themes';

export const ThemeGruvboxPlugin: Plugin = {
  id: 'theme-gruvbox',
  name: 'Gruvbox Themes',
  version: '1.0.0',
  description: 'Gruvbox Dark and Light theme variants',
  publicSafe: true,
  requires: ['core-theme'],

  onLoad: async (manager) => {
    const themeService = manager.getService('core-theme/themeService');

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
