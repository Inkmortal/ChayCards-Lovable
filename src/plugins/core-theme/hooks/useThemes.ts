/**
 * Custom hooks for accessing theme service data
 * Implements stateful observer pattern - subscribers receive immediate state updates
 */

import { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import type { Theme } from '../themes';
import type { ThemeService } from '../services/ThemeService';

/**
 * Internal hook to get theme service instance
 * @private
 */
const useThemeService = (): ThemeService | undefined => {
  return PluginManager.getInstance().getService('core-theme/themeService');
};

/**
 * Hook to get all available themes
 * Automatically updates when new themes are registered
 *
 * @returns Array of all registered themes
 *
 * @example
 * ```tsx
 * const themes = useAvailableThemes();
 * return themes.map(theme => <ThemeOption key={theme.id} theme={theme} />);
 * ```
 */
export const useAvailableThemes = (): Theme[] => {
  const themeService = useThemeService();

  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    if (!themeService) return;

    // onThemeListChange now calls setThemes immediately with current state
    // This solves the late-subscriber problem - component gets data even if
    // it mounts after theme plugins have already registered
    // The callback handles the async getAvailableThemes() internally
    const unsubscribe = themeService.onThemeListChange(setThemes);

    return unsubscribe;
  }, [themeService]);

  return themes;
};

/**
 * Hook to get the currently active theme
 * Automatically updates when theme changes
 *
 * @returns Current theme or null if not initialized
 *
 * @example
 * ```tsx
 * const currentTheme = useCurrentTheme();
 * return <div>Active: {currentTheme?.name}</div>;
 * ```
 */
export const useCurrentTheme = (): Theme | null => {
  const themeService = useThemeService();

  const [theme, setTheme] = useState<Theme | null>(
    () => themeService?.getCurrentTheme() || null
  );

  useEffect(() => {
    if (!themeService) return;

    // onThemeChange calls setTheme immediately with current theme
    // Then notifies on future changes
    const unsubscribe = themeService.onThemeChange(setTheme);

    return unsubscribe;
  }, [themeService]);

  return theme;
};
