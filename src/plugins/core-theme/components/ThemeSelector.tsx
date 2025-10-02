/**
 * ThemeSelector - UI component for switching themes
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import type { Theme } from '../themes';
import { PluginManager } from '../../../shared/plugin-system';

interface ThemeSelectorProps {
  className?: string;
  showIcon?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  showIcon = true
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const manager = PluginManager.getInstance();
    const themeService = manager.getService('core-theme/themeService');

    if (themeService) {
      // Get current theme and available themes
      setCurrentTheme(themeService.getCurrentTheme());
      setAvailableThemes(themeService.getAvailableThemes());

      // Subscribe to theme changes
      const unsubscribe = themeService.onThemeChange((theme: Theme) => {
        setCurrentTheme(theme);
      });

      return unsubscribe;
    }
  }, []);

  const handleThemeSelect = (themeId: string) => {
    const manager = PluginManager.getInstance();
    const themeService = manager.getService('core-theme/themeService');

    if (themeService) {
      themeService.setTheme(themeId);
    }

    setIsOpen(false);
  };

  if (!currentTheme) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Theme selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {showIcon && <Palette className="w-4 h-4" />}
        <span className="text-sm font-medium">{currentTheme.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full mt-1 right-0 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-1">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    theme.id === currentTheme.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{theme.name}</span>
                    {theme.id === currentTheme.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};