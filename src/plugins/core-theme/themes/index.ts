/**
 * Theme Type Definitions and Default Theme
 * Individual themes are now registered by separate theme plugins
 */

// Export types for theme plugins to use
export type { Theme, ThemeVariables } from './catppuccin';

// Export default theme (Catppuccin Latte) - keeps core-theme minimal
export { catppuccinLatte as DEFAULT_THEME } from './catppuccin';
