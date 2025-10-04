import type { Plugin } from '@/shared/plugin-system';
import { tokyoNightStorm, tokyoNightLight } from './themes';

export const ThemeTokyoNightPlugin: Plugin = {
  id: 'theme-tokyonight',
  name: 'Tokyo Night Themes',
  version: '1.0.0',
  description: 'Tokyo Night Storm and Light theme variants',
  publicSafe: true,
  requires: ['core-theme'],

  onLoad: (manager) => {
    const themeService = manager.getService('core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeTokyoNight] ThemeService not found');
      return;
    }

    themeService.registerTheme(tokyoNightStorm);
    themeService.registerTheme(tokyoNightLight);
    console.log('[ThemeTokyoNight] Registered 2 theme variants');
  }
};

export default ThemeTokyoNightPlugin;
