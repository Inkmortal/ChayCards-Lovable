/**
 * ThemeSelector - UI component for switching themes
 * Uses stateful observer pattern via custom hooks
 * Opens ThemeModal for rich theme management experience
 */

import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { ThemeModal } from './ThemeModal';
import { useCurrentTheme } from '../hooks/useThemes';

interface ThemeSelectorProps {
  className?: string;
  variant?: '3d' | 'flat';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  variant = '3d'
}) => {
  // Custom hook provides current theme state
  const currentTheme = useCurrentTheme();
  const [modalOpen, setModalOpen] = useState(false);

  if (!currentTheme) {
    return null;
  }

  return (
    <>
      {/* Theme selector button */}
      <button
        onClick={() => setModalOpen(true)}
        className={variant === '3d'
          ? `w-10 h-10 flex items-center justify-center rounded-lg border-2 font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150 ${className}`
          : `flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${className}`
        }
        style={variant === '3d' ? {
          boxShadow: '0 8px 0 color-mix(in oklab, hsl(var(--primary)), black 25%), 0 12px 20px color-mix(in oklab, hsl(var(--primary)), black 50%), inset 0 1px 0 hsl(var(--background))',
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary))'
        } : undefined}
        title="Open Theme Manager"
      >
        <Palette className="w-4 h-4" />
        {variant === 'flat' && currentTheme && (
          <span className="text-sm">{currentTheme.name}</span>
        )}
      </button>

      {/* Theme Modal */}
      <ThemeModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};