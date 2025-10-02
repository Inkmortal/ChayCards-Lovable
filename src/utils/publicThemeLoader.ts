/**
 * Public Theme Loader
 * Applies theme on public pages where plugins don't load
 * Uses localStorage to maintain consistency with ThemeService
 */

import { ALL_THEMES } from '../plugins/core-theme/themes';

const THEME_LOCALSTORAGE_KEY = 'chaycards-theme';
const DEFAULT_THEME_ID = 'dracula';

/**
 * Load and apply theme from localStorage on public pages
 * This runs before React and doesn't require any plugin infrastructure
 */
export function loadPublicTheme(): void {
  const themeId = localStorage.getItem(THEME_LOCALSTORAGE_KEY) || DEFAULT_THEME_ID;
  const theme = ALL_THEMES.find(t => t.id === themeId);

  if (!theme) {
    console.warn(`[PublicTheme] Theme ${themeId} not found, using default`);
    return;
  }

  // Apply CSS variables to document root
  const root = document.documentElement;
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  console.log(`[PublicTheme] Applied theme: ${theme.name} (${theme.id})`);
}
