/**
 * ThemeModal - Rich modal interface for theme management
 * Features: Browse (categorized), Favorites, Custom themes, Theme builder
 */

import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, Save, Download, Upload } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import { useCurrentTheme, useAvailableThemes } from '../hooks/useThemes';
import { ThemeCard } from './ThemeCard';
import { ThemeBuilder } from './ThemeBuilder';
import type { Theme } from '../themes';

// Helper component for dark/light toggle with 3D styling
const CategoryToggle: React.FC<{
  value: 'dark' | 'light';
  onChange: (value: 'dark' | 'light') => void;
}> = ({ value, onChange }) => {
  const manager = PluginManager.getInstance();
  const Switch = manager.getComponent('chaycards/core-ui/Switch');

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
      <span className="text-xl">☀️</span>
      <span className="text-sm font-medium">Light</span>
      <Switch
        checked={value === 'dark'}
        onCheckedChange={(checked) => onChange(checked ? 'dark' : 'light')}
      />
      <span className="text-sm font-medium">Dark</span>
      <span className="text-xl">🌙</span>
    </div>
  );
};

interface ThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabValue = 'favorites' | 'browse' | 'custom';

// localStorage key for unified category filter persistence
const CATEGORY_FILTER_KEY = 'chaycards/core-theme:category-filter';

/**
 * ThemeModal component for comprehensive theme management
 *
 * @example
 * ```tsx
 * <ThemeModal
 *   open={modalOpen}
 *   onOpenChange={setModalOpen}
 * />
 * ```
 */
export const ThemeModal: React.FC<ThemeModalProps> = ({ open, onOpenChange }) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('chaycards/core-ui/Dialog');
  const Tabs = manager.getComponent('chaycards/core-ui/Tabs');
  const Badge = manager.getComponent('chaycards/core-ui/Badge');
  const EmptyState = manager.getComponent('chaycards/core-ui/EmptyState');
  const Button = manager.getComponent('chaycards/core-ui/Button');
  const Switch = manager.getComponent('chaycards/core-ui/Switch');
  const ErrorMessage = manager.getComponent('chaycards/core-ui/ErrorMessage');

  const currentTheme = useCurrentTheme();
  const availableThemes = useAvailableThemes();
  const themeService = manager.getService('chaycards/core-theme/themeService');

  const [activeTab, setActiveTab] = useState<TabValue>('favorites');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(CATEGORY_FILTER_KEY);
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [originalThemeId, setOriginalThemeId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // Load favorites when service is available
  React.useEffect(() => {
    if (themeService) {
      themeService.getFavorites().then(setFavorites);
    }
  }, [themeService]);

  // Track the original theme when modal opens (only once, not on preview changes)
  React.useEffect(() => {
    if (open) {
      setOriginalThemeId(currentTheme?.id || null);
    }
  }, [open]); // Removed currentTheme dependency to prevent preview from overwriting original

  // Persist unified category filter to localStorage and clean up old keys
  React.useEffect(() => {
    localStorage.setItem(CATEGORY_FILTER_KEY, categoryFilter);
    // Clean up old separate keys (migration from old implementation)
    localStorage.removeItem('core-theme:browse-category-filter');
    localStorage.removeItem('core-theme:favorites-category-filter');
    localStorage.removeItem('core-theme:custom-category-filter');
    localStorage.removeItem('core-theme:category-filter'); // Legacy non-namespaced key
  }, [categoryFilter]);

  // Filter themes based on search and category
  const filteredThemes = useMemo(() => {
    let themes = availableThemes;

    // Apply category filter (always filter by dark or light)
    themes = themes.filter(theme => theme.category === categoryFilter);

    // Apply search filter (client-side filtering instead of async service call)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      themes = themes.filter(theme => {
        const nameMatch = theme.name.toLowerCase().includes(lowerQuery);
        const descMatch = theme.description?.toLowerCase().includes(lowerQuery);
        const tagMatch = theme.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        return nameMatch || descMatch || tagMatch;
      });
    }

    return themes;
  }, [availableThemes, searchQuery, categoryFilter]);

  // Get favorite themes (filtered by category)
  const favoriteThemes = useMemo(
    () => availableThemes.filter(t => favorites.includes(t.id) && t.category === categoryFilter),
    [availableThemes, favorites, categoryFilter]
  );

  // Get all favorite themes (unfiltered) for light/dark count
  const allFavoriteThemes = useMemo(
    () => availableThemes.filter(t => favorites.includes(t.id)),
    [availableThemes, favorites]
  );

  // Get custom themes (filtered by category)
  // Filter from availableThemes using source field
  const customThemes = useMemo(() => {
    return availableThemes.filter(t => t.source === 'custom' && t.category === categoryFilter);
  }, [availableThemes, categoryFilter]);

  // Get all custom themes (unfiltered) for light/dark count
  const allCustomThemes = useMemo(() => {
    return availableThemes.filter(t => t.source === 'custom');
  }, [availableThemes]);

  // Handlers

  // Unified revert logic - used by both Cancel button and X/overlay clicks
  const revertPreview = async () => {
    if (originalThemeId) {
      await themeService?.previewTheme(originalThemeId);
    }
    setSelectedThemeId(null);
  };

  const handleSelectTheme = async (themeId: string) => {
    setSelectedThemeId(themeId);
    // Preview theme without saving (CSS only)
    await themeService?.previewTheme(themeId);
  };

  const handleSaveTheme = async () => {
    // Actually persist the selected theme
    if (selectedThemeId) {
      await themeService?.setTheme(selectedThemeId);
    }
    setSelectedThemeId(null);
    onOpenChange(false);
  };

  const handleCancel = async () => {
    await revertPreview();
    onOpenChange(false);
  };

  const handleToggleFavorite = async (themeId: string) => {
    await themeService?.toggleFavorite(themeId);
    const updatedFavorites = await themeService?.getFavorites() || [];
    setFavorites(updatedFavorites);
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (confirm(`Delete custom theme "${theme?.name}"?`)) {
      await themeService?.deleteCustomTheme(themeId);
    }
  };

  const handleCloneTheme = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (!theme) return;

    // Pre-populate builder with cloned theme data (without ID)
    setEditingThemeId(null); // Not editing, creating new
    setShowBuilder(true);
    // Builder will receive theme data via a new prop, but for now just open it
    // User will need to manually set values - we'll enhance ThemeBuilder next
  };

  // Calculate light/dark counts for tab labels
  const favLightCount = allFavoriteThemes.filter(t => t.category === 'light').length;
  const favDarkCount = allFavoriteThemes.filter(t => t.category === 'dark').length;
  const browseLightCount = availableThemes.filter(t => t.category === 'light').length;
  const browseDarkCount = availableThemes.filter(t => t.category === 'dark').length;
  const customLightCount = allCustomThemes.filter(t => t.category === 'light').length;
  const customDarkCount = allCustomThemes.filter(t => t.category === 'dark').length;

  const tabs = [
    {
      value: 'favorites',
      label: `Favorites (${favLightCount}☀️ / ${favDarkCount}🌙)`,
      content: (
        <div className="space-y-4">
          {/* Category Toggle + Create Button */}
          <div className="flex items-center gap-3">
            <CategoryToggle value={categoryFilter} onChange={setCategoryFilter} />

            <Button variant="3d-primary" onClick={() => {
              setEditingThemeId(null);
              setShowBuilder(true);
            }} className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          </div>

          {favoriteThemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={selectedThemeId === theme.id}
                  isFavorite={true}
                  onApply={() => handleSelectTheme(theme.id)}
                  onToggleFavorite={() => handleToggleFavorite(theme.id)}
                  onClone={() => handleCloneTheme(theme.id)}
                  onEdit={theme.id.startsWith('custom-') ? () => {
                    setEditingThemeId(theme.id);
                    setShowBuilder(true);
                  } : undefined}
                  onDelete={theme.id.startsWith('custom-') ? () => handleDeleteCustomTheme(theme.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No favorite themes"
              description="Click the star icon on any theme to add it to favorites"
              action={
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Themes
                </Button>
              }
            />
          )}
        </div>
      ),
    },
    {
      value: 'browse',
      label: `Browse (${browseLightCount}☀️ / ${browseDarkCount}🌙)`,
      content: (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <CategoryToggle value={categoryFilter} onChange={setCategoryFilter} />

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search themes by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button variant="3d-primary" onClick={() => {
              setEditingThemeId(null);
              setShowBuilder(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          </div>

          {/* Themes Grid */}
          {filteredThemes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={selectedThemeId === theme.id}
                  isFavorite={favorites.includes(theme.id)}
                  onApply={() => handleSelectTheme(theme.id)}
                  onToggleFavorite={() => handleToggleFavorite(theme.id)}
                  onClone={() => handleCloneTheme(theme.id)}
                  onEdit={theme.id.startsWith('custom-') ? () => {
                    setEditingThemeId(theme.id);
                    setShowBuilder(true);
                  } : undefined}
                  onDelete={theme.id.startsWith('custom-') ? () => handleDeleteCustomTheme(theme.id) : undefined}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredThemes.length === 0 && (
            <EmptyState
              title="No themes found"
              description="Try adjusting your search or category filter"
            />
          )}
        </div>
      ),
    },
    {
      value: 'custom',
      label: `Custom (${customLightCount}☀️ / ${customDarkCount}🌙)`,
      content: (
        <div className="space-y-4">
          {/* Category Toggle + Create Button */}
          <div className="flex items-center gap-3">
            <CategoryToggle value={categoryFilter} onChange={setCategoryFilter} />

            <Button variant="3d-primary" onClick={() => {
              setEditingThemeId(null);
              setShowBuilder(true);
            }} className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          </div>

          {customThemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={selectedThemeId === theme.id}
                  isFavorite={favorites.includes(theme.id)}
                  onApply={() => handleSelectTheme(theme.id)}
                  onToggleFavorite={() => handleToggleFavorite(theme.id)}
                  onClone={() => handleCloneTheme(theme.id)}
                  onEdit={() => {
                    setEditingThemeId(theme.id);
                    setShowBuilder(true);
                  }}
                  onDelete={() => handleDeleteCustomTheme(theme.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No custom themes"
              description="Create your first custom theme with the button above"
            />
          )}
        </div>
      ),
    },
  ];

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      // If dialog is closing (X button or outside click), revert the preview
      revertPreview();
    }
    onOpenChange(isOpen);
  };

  // Handlers for header action buttons
  const handleBuilderExport = () => {
    if ((window as any).__themeBuilderExport) {
      (window as any).__themeBuilderExport();
    }
  };

  const handleBuilderImport = () => {
    if ((window as any).__themeBuilderImport) {
      (window as any).__themeBuilderImport();
    }
  };

  const handleBuilderSave = async () => {
    // Trigger save through the ThemeBuilder's onSave callback
    // This will be handled through the existing onSave prop
  };

  return (
    <>
      {/* Main Theme Manager Dialog */}
      <Dialog
        open={open && !showBuilder}
        onOpenChange={handleDialogClose}
        title="Theme Manager"
        description="Browse, favorite, and customize your themes"
        maxWidth="5xl"
        showCancel={false}
      >
        <div className="relative">
          <div className="min-h-[500px] max-h-[60vh] overflow-y-auto pb-20">
            <Tabs
              tabs={tabs}
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabValue)}
            />
          </div>

          {/* Sticky Save Button - Always visible */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex justify-end gap-3">
            <Button variant="3d-outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="3d-primary" onClick={handleSaveTheme}>
              Save Theme
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Theme Builder Dialog */}
      <Dialog
        open={showBuilder}
        onOpenChange={(open) => {
          setShowBuilder(open);
          if (!open) {
            setEditingThemeId(null);
            setBuilderError(null);
          }
        }}
        title={editingThemeId ? "Edit Custom Theme" : "Create Custom Theme"}
        description="Build your own theme with live preview"
        maxWidth="5xl"
        showCancel={false}
        showBackButton={true}
        onBack={() => {
          setShowBuilder(false);
          setEditingThemeId(null);
          setBuilderError(null);
        }}
        headerActions={
          <>
            <Button variant="3d-outline" size="sm" onClick={handleBuilderExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="3d-outline" size="sm" onClick={handleBuilderImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="3d-primary" size="sm" onClick={() => {
              // Trigger the save handler by finding the save button in ThemeBuilder
              const saveEvent = new CustomEvent('theme-builder-save');
              window.dispatchEvent(saveEvent);
            }}>
              <Save className="w-4 h-4 mr-2" />
              Save Theme
            </Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-hidden flex flex-col">
          {builderError && (
            <ErrorMessage
              title="Failed to save theme"
              message={builderError}
              variant="error"
              onDismiss={() => setBuilderError(null)}
            />
          )}

          <div className="flex-1 min-h-0">
            <ThemeBuilder
              editingTheme={editingThemeId ? availableThemes.find(t => t.id === editingThemeId) : undefined}
              onSave={async (themeData) => {
                try {
                  setBuilderError(null);
                  if (editingThemeId) {
                    // Update existing theme
                    await themeService?.updateCustomTheme(editingThemeId, themeData);
                  } else {
                    // Create new theme
                    await themeService?.createCustomTheme(themeData);
                  }
                  setShowBuilder(false);
                  setEditingThemeId(null);
                  setActiveTab('custom');
                } catch (error) {
                  // Show error to user with ErrorMessage component
                  setBuilderError(error instanceof Error ? error.message : 'Failed to save theme');
                }
              }}
              onExport={handleBuilderExport}
              onImport={handleBuilderImport}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
