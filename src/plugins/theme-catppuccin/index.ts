import type { Plugin } from '@/shared/plugin-system';
import { catppuccinLatte, catppuccinFrappe } from './themes';

export const ThemeCatppuccinPlugin: Plugin = {
  id: 'theme-catppuccin',
  name: 'Catppuccin Themes',
  version: '1.0.0',
  description: 'Catppuccin Latte and Frappé theme variants',
  publicSafe: true,
  requires: ['core-theme'],

  onLoad: async (manager) => {
    const themeService = manager.getService('core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeCatppuccin] ThemeService not found - core-theme dependency missing?');
      return;
    }

    // Register themes with ThemeService (now async with storage check)
    await themeService.registerTheme(catppuccinLatte);
    await themeService.registerTheme(catppuccinFrappe);

    console.log('[ThemeCatppuccin] Registered 2 theme variants');
  }
};

export default ThemeCatppuccinPlugin;
