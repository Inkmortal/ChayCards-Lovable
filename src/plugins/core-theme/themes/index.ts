/**
 * Theme Registry
 * All available themes for ChayCards
 */

export { catppuccinLatte, catppuccinFrappe } from './catppuccin';
export { draculaDark } from './dracula';
export { tokyoNightStorm, tokyoNightLight } from './tokyonight';
export { gruvboxDark, gruvboxLight } from './gruvbox';

export type { Theme, ThemeVariables } from './catppuccin';

// Export all themes as a registry
import { catppuccinLatte, catppuccinFrappe } from './catppuccin';
import { draculaDark } from './dracula';
import { tokyoNightStorm, tokyoNightLight } from './tokyonight';
import { gruvboxDark, gruvboxLight } from './gruvbox';

export const ALL_THEMES = [
  catppuccinLatte,
  catppuccinFrappe,
  draculaDark,
  tokyoNightStorm,
  tokyoNightLight,
  gruvboxDark,
  gruvboxLight
];

export const DEFAULT_THEME = catppuccinLatte;