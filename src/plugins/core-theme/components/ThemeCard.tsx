/**
 * ThemeCard - Visual card component for displaying a theme
 * Shows theme name, category badge, color palette preview, and favorite star
 */

import React from 'react';
import { Star, MoreVertical, Copy, Edit, Trash2 } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/plugins/core-ui/components/DropdownMenu';
import type { Theme } from '../themes';

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isFavorite: boolean;
  onApply: () => void;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
}

/**
 * ThemeCard component displays a theme with visual preview
 *
 * @example
 * ```tsx
 * <ThemeCard
 *   theme={catppuccinLatte}
 *   isActive={currentTheme.id === theme.id}
 *   isFavorite={favorites.includes(theme.id)}
 *   onApply={() => applyTheme(theme.id)}
 *   onToggleFavorite={() => toggleFavorite(theme.id)}
 * />
 * ```
 */
export const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  isFavorite,
  onApply,
  onToggleFavorite,
  onEdit,
  onDelete,
  onClone,
}) => {
  const manager = PluginManager.getInstance();
  const Badge = manager.getComponent('chaycards/core-ui/Badge');
  const DropdownMenu = manager.getComponent('chaycards/core-ui/DropdownMenu');

  // Extract 4 most visually distinctive colors for theme identity
  const paletteColors = [
    theme.variables['--primary'] || '0 0% 50%',
    theme.variables['--background'] || '0 0% 100%',
    theme.variables['--secondary'] || '0 0% 50%',
    theme.variables['--tertiary'] || '0 0% 50%',
  ];

  const isCustom = theme.id.startsWith('custom-');

  return (
    <div
      onClick={onApply}
      className={`group relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
        isActive
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      {/* Thin horizontal color stripe */}
      <div className="mb-3 h-2 rounded-full overflow-hidden flex border border-border/50">
        {paletteColors.map((color, index) => (
          <div
            key={index}
            className="flex-1"
            style={{ backgroundColor: `hsl(${color})` }}
          />
        ))}
      </div>

      {/* Theme Name & Metadata */}
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground flex-1">{theme.name}</h3>

          <div className="flex items-center gap-1">
            {/* Favorite Star */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star
                className="w-4 h-4"
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </button>

            {/* 3-Dot Menu */}
            <DropdownMenu
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Theme options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
            >
              {onClone && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClone(); }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Theme
                </DropdownMenuItem>
              )}
              {isCustom && onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Theme
                </DropdownMenuItem>
              )}
              {isCustom && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Theme
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenu>
          </div>
        </div>

        {theme.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {theme.description}
          </p>
        )}
      </div>

      {/* Tags & Category */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Badge
          variant={theme.category === 'dark' ? 'default' : 'secondary'}
          className={theme.category === 'dark'
            ? 'bg-slate-800 text-slate-100 border-slate-700'
            : 'bg-amber-100 text-amber-900 border-amber-300'}
        >
          {theme.category === 'dark' ? '🌙' : '☀️'} {theme.category}
        </Badge>
        {theme.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {theme.tags.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{theme.tags.length - 2}
          </Badge>
        )}
      </div>

      {/* Author (if present) */}
      {theme.author && !isCustom && (
        <div className="mt-2 text-xs text-muted-foreground">
          by {theme.author}
        </div>
      )}
    </div>
  );
};
