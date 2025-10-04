import type { Plugin } from '@/shared/plugin-system';
import { draculaDark } from './themes';

export const ThemeDraculaPlugin: Plugin = {
  id: 'theme-dracula',
  name: 'Dracula Theme',
  version: '1.0.0',
  description: 'The iconic Dracula dark theme',
  publicSafe: true,
  requires: ['core-theme'],

  onLoad: (manager) => {
    const themeService = manager.getService('core-theme/themeService');

    if (!themeService) {
      console.error('[ThemeDracula] ThemeService not found');
      return;
    }

    themeService.registerTheme(draculaDark);
    console.log('[ThemeDracula] Registered Dracula Dark theme');
  }
};

export default ThemeDraculaPlugin;
