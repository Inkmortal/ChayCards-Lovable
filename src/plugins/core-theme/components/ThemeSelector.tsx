/**
 * ThemeSelector - UI component for switching themes
 * Uses stateful observer pattern via custom hooks
 */

import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { PluginManager } from '../../../shared/plugin-system';
import { useCurrentTheme, useAvailableThemes } from '../hooks/useThemes';

interface ThemeSelectorProps {
  className?: string;
  variant?: '3d' | 'flat';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  variant = '3d'
}) => {
  // Custom hooks handle all subscription logic and provide immediate state
  const currentTheme = useCurrentTheme();
  const availableThemes = useAvailableThemes();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap below button
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

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
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={variant === '3d'
          ? "w-10 h-10 flex items-center justify-center rounded-lg border-2 font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
          : "flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        }
        style={variant === '3d' ? {
          boxShadow: '0 8px 0 color-mix(in oklab, hsl(var(--primary)), black 25%), 0 12px 20px color-mix(in oklab, hsl(var(--primary)), black 50%), inset 0 1px 0 hsl(var(--background))',
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary))'
        } : undefined}
      >
        <Palette className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu - using fixed positioning to escape stacking context */}
          <div
            className="fixed z-[9999] min-w-[200px] rounded-lg border border-border bg-popover shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
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