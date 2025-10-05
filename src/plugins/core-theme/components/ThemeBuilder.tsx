/**
 * ThemeBuilder - Interactive theme creation tool
 * Features: Color pickers, live preview, import/export
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { HslColorPicker } from 'react-colorful';
import { PluginManager } from '@/shared/plugin-system';
import type { Theme, ThemeVariables } from '../themes';
import { DEFAULT_THEME } from '../themes';

interface ThemeBuilderProps {
  editingTheme?: Theme;
  onSave?: (theme: Omit<Theme, 'id'>) => void;
  onExport?: () => void;
  onImport?: () => void;
}

/**
 * Convert HSL string to object for react-colorful
 * Format: "220 23% 95%" → { h: 220, s: 23, l: 95 }
 */
const hslStringToObject = (hsl: string): { h: number; s: number; l: number } => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  return { h, s, l };
};

/**
 * Convert HSL object to string for theme variables
 * Format: { h: 220, s: 23, l: 95 } → "220 23% 95%"
 */
const hslObjectToString = (color: { h: number; s: number; l: number }): string => {
  return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`;
};

/**
 * Convert HSL string to hex color
 * Format: "220 23% 95%" → "#eff1f5"
 */
const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;
  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Convert HSL string to RGB string
 * Format: "220 23% 95%" → "239, 241, 245"
 */
const hslToRgb = (hsl: string): string => {
  const hex = hslToHex(hsl);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

/**
 * Convert hex color to HSL string
 * Format: "#eff1f5" → "220 23% 95%"
 */
const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '').trim();

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid hex format');
  }

  // Parse RGB values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  // Find min/max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Calculate lightness
  const l = (max + min) / 2;

  // Calculate saturation
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }

  // Calculate hue
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }

  // Convert to HSL string format
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Convert RGB string to HSL string
 * Format: "239, 241, 245" → "220 23% 95%"
 */
const rgbToHsl = (rgb: string): string => {
  // Extract RGB values from string (format: "239, 241, 245")
  const match = rgb.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/);
  if (!match) {
    throw new Error('Invalid RGB format. Expected format: "239, 241, 245"');
  }

  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;

  // Find min/max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Calculate lightness
  const l = (max + min) / 2;

  // Calculate saturation
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }

  // Calculate hue
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }

  // Convert to HSL string format
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeBuilder: React.FC<ThemeBuilderProps> = ({
  editingTheme,
  onSave,
  onExport,
  onImport
}) => {
  const manager = PluginManager.getInstance();
  const FormSection = manager.getComponent('core-ui/FormSection');
  const FormField = manager.getComponent('core-ui/FormField');
  const Button = manager.getComponent('core-ui/Button');
  const Popover = manager.getComponent('core-ui/Popover');

  // Defensive check - if components aren't available, show error
  if (!FormSection || !FormField || !Button) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Error: Required UI components not loaded.</p>
        <p className="text-sm text-muted-foreground mt-2">
          FormSection: {FormSection ? '✓' : '✗'} | FormField: {FormField ? '✓' : '✗'}
        </p>
      </div>
    );
  }

  // Initialize with editing theme or defaults
  const [themeName, setThemeName] = useState(editingTheme?.name || '');
  const [themeDescription, setThemeDescription] = useState(editingTheme?.description || '');
  const [themeCategory, setThemeCategory] = useState<'light' | 'dark'>(editingTheme?.category || 'light');
  const [themeTags, setThemeTags] = useState<string[]>(editingTheme?.tags || []);
  const [themeVariables, setThemeVariables] = useState<ThemeVariables>(
    editingTheme?.variables || DEFAULT_THEME.variables
  );

  // Color picker popover state
  const [activeColorKey, setActiveColorKey] = useState<string | null>(null);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb'>('hex');
  const [previewTab, setPreviewTab] = useState<'components' | 'states'>('components');
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Preview container ref for applying CSS variables
  const previewRef = useRef<HTMLDivElement>(null);

  // Apply all theme variables to preview container
  useEffect(() => {
    if (previewRef.current) {
      Object.entries(themeVariables).forEach(([key, value]) => {
        previewRef.current!.style.setProperty(key, value);
      });
    }
  }, [themeVariables]);

  // Color groups for organized UI
  const colorGroups = [
    {
      title: 'Core Identity',
      colors: [
        { key: '--primary', label: 'Primary' },
        { key: '--primary-foreground', label: 'Primary Text' },
        { key: '--secondary', label: 'Secondary' },
        { key: '--secondary-foreground', label: 'Secondary Text' },
        { key: '--tertiary', label: 'Tertiary' },
        { key: '--tertiary-foreground', label: 'Tertiary Text' },
      ]
    },
    {
      title: 'Base Colors',
      colors: [
        { key: '--background', label: 'Background' },
        { key: '--foreground', label: 'Foreground' },
        { key: '--border', label: 'Border' },
        { key: '--input', label: 'Input' },
        { key: '--ring', label: 'Focus Ring' },
      ]
    },
    {
      title: 'State Semantics',
      colors: [
        { key: '--success', label: 'Success' },
        { key: '--success-foreground', label: 'Success Text' },
        { key: '--warning', label: 'Warning' },
        { key: '--warning-foreground', label: 'Warning Text' },
        { key: '--destructive', label: 'Destructive' },
        { key: '--destructive-foreground', label: 'Destructive Text' },
        { key: '--info', label: 'Info' },
        { key: '--info-foreground', label: 'Info Text' },
      ]
    },
    {
      title: 'Neutral Variety',
      colors: [
        { key: '--muted', label: 'Muted' },
        { key: '--muted-foreground', label: 'Muted Text' },
        { key: '--accent', label: 'Accent' },
        { key: '--accent-foreground', label: 'Accent Text' },
      ]
    },
    {
      title: 'Surfaces',
      colors: [
        { key: '--card', label: 'Card' },
        { key: '--card-foreground', label: 'Card Text' },
        { key: '--popover', label: 'Popover' },
        { key: '--popover-foreground', label: 'Popover Text' },
      ]
    }
  ];

  const handleColorChange = (key: keyof ThemeVariables, color: { h: number; s: number; l: number }) => {
    setThemeVariables(prev => ({
      ...prev,
      [key]: hslObjectToString(color)
    }));
  };

  const handleSave = () => {
    // Check if storage is available
    const manager = PluginManager.getInstance();
    const themeService = manager.getService<any>('core-theme/themeService');

    if (!themeService?.hasStorage()) {
      throw new Error('Please log in to create custom themes. Custom themes require persistent storage.');
    }

    if (!themeName.trim()) {
      throw new Error('Please enter a theme name');
    }

    const theme: Omit<Theme, 'id'> = {
      name: themeName.trim(),
      description: themeDescription.trim() || undefined,
      category: themeCategory,
      tags: themeTags,
      variables: themeVariables,
      className: themeCategory === 'dark' ? 'dark' : undefined,
    };

    onSave?.(theme);
  };

  const handleExport = () => {
    const theme = {
      name: themeName,
      description: themeDescription,
      category: themeCategory,
      tags: themeTags,
      variables: themeVariables,
    };

    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setThemeName(imported.name || '');
          setThemeDescription(imported.description || '');
          setThemeCategory(imported.category || 'light');
          setThemeTags(imported.tags || []);
          setThemeVariables(imported.variables || DEFAULT_THEME.variables);
        } catch (error) {
          // Silent failure - user can try again with a valid file
          console.warn('Failed to import theme:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Store export/import handlers on window for parent access
  // This effect only runs once since handleExport/handleImport are stable
  React.useEffect(() => {
    (window as any).__themeBuilderExport = handleExport;
    (window as any).__themeBuilderImport = handleImport;

    return () => {
      delete (window as any).__themeBuilderExport;
      delete (window as any).__themeBuilderImport;
    };
  }, []); // No dependencies - handlers are stable within this component

  // Listen for save event from header button
  // This effect re-runs when form state changes to ensure latest values are saved
  React.useEffect(() => {
    const handleSaveEvent = () => {
      handleSave();
    };
    window.addEventListener('theme-builder-save', handleSaveEvent);

    return () => {
      window.removeEventListener('theme-builder-save', handleSaveEvent);
    };
  }, [themeName, themeDescription, themeCategory, themeTags, themeVariables]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
      {/* Left: Theme Builder Form */}
      <div className="space-y-6 overflow-y-auto pr-4 max-h-full min-h-0">
        {/* Metadata Section */}
        <FormSection title="Theme Information">
          <FormField label="Theme Name" required>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="My Custom Theme"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={themeDescription}
              onChange={(e) => setThemeDescription(e.target.value)}
              placeholder="A beautiful custom theme for..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>

          <FormField label="Category">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="light"
                  checked={themeCategory === 'light'}
                  onChange={(e) => setThemeCategory(e.target.value as 'light' | 'dark')}
                  className="w-4 h-4"
                />
                <span>☀️ Light</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="dark"
                  checked={themeCategory === 'dark'}
                  onChange={(e) => setThemeCategory(e.target.value as 'light' | 'dark')}
                  className="w-4 h-4"
                />
                <span>🌙 Dark</span>
              </label>
            </div>
          </FormField>

          <FormField label="Tags (comma-separated)">
            <input
              type="text"
              value={themeTags.join(', ')}
              onChange={(e) => setThemeTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="modern, vibrant, blue"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
        </FormSection>

        {/* Color Picker Sections */}
        {colorGroups.map((group, groupIndex) => (
          <FormSection
            key={group.title}
            title={
              <div className="flex items-center justify-between">
                <span>{group.title}</span>
                {/* Format toggle only for Base Colors */}
                {groupIndex === 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setColorFormat('hex')}
                      className={`px-2 py-1 rounded ${colorFormat === 'hex' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      HEX
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorFormat('rgb')}
                      className={`px-2 py-1 rounded ${colorFormat === 'rgb' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      RGB
                    </button>
                  </div>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              {group.colors.map(({ key, label }) => {
                const hslValue = themeVariables[key as keyof ThemeVariables] as string;
                const displayValue = colorFormat === 'hex' ? hslToHex(hslValue) : hslToRgb(hslValue);
                const isOpen = activeColorKey === key;

                return (
                  <div key={key} className="flex items-center gap-3">
                    {/* Color Swatch Button with Popover */}
                    <Popover
                      open={isOpen}
                      onOpenChange={(open) => setActiveColorKey(open ? key : null)}
                      trigger={
                        <button
                          type="button"
                          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                          style={{ backgroundColor: `hsl(${hslValue})` }}
                          title={`Edit ${label}`}
                        />
                      }
                    >
                      <div className="p-4 w-64">
                        <div className="mb-2 text-sm font-medium">{label}</div>
                        <HslColorPicker
                          color={hslStringToObject(hslValue)}
                          onChange={(color) => handleColorChange(key as keyof ThemeVariables, color)}
                          className="w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveColorKey(null)}
                          className="mt-3 w-full px-3 py-1 text-sm rounded bg-secondary hover:bg-secondary/80"
                        >
                          Done
                        </button>
                      </div>
                    </Popover>

                    {/* Label and Editable Formatted Value */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">{label}</div>

                      {colorFormat === 'hex' ? (
                        // Hex: Single text input
                        <input
                          type="text"
                          value={editingValues[key] !== undefined ? editingValues[key] : displayValue}
                          onChange={(e) => {
                            setEditingValues(prev => ({
                              ...prev,
                              [key]: e.target.value
                            }));
                          }}
                          onBlur={(e) => {
                            const input = e.target.value.trim();
                            try {
                              const hslValue = hexToHsl(input);
                              handleColorChange(key as keyof ThemeVariables, hslStringToObject(hslValue));
                            } catch (error) {
                              console.warn('Invalid hex format:', input);
                            }
                            setEditingValues(prev => {
                              const newState = { ...prev };
                              delete newState[key];
                              return newState;
                            });
                          }}
                          placeholder="#000000"
                          className="w-full text-xs font-mono text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary transition-colors px-1 py-0.5"
                        />
                      ) : (
                        // RGB: Three separate number inputs
                        (() => {
                          const currentRgb = displayValue.split(',').map(v => v.trim());
                          const r = editingValues[`${key}-r`] !== undefined ? editingValues[`${key}-r`] : currentRgb[0] || '0';
                          const g = editingValues[`${key}-g`] !== undefined ? editingValues[`${key}-g`] : currentRgb[1] || '0';
                          const b = editingValues[`${key}-b`] !== undefined ? editingValues[`${key}-b`] : currentRgb[2] || '0';

                          const handleRgbBlur = () => {
                            try {
                              const rVal = Math.max(0, Math.min(255, parseInt(r) || 0));
                              const gVal = Math.max(0, Math.min(255, parseInt(g) || 0));
                              const bVal = Math.max(0, Math.min(255, parseInt(b) || 0));
                              const rgbString = `${rVal}, ${gVal}, ${bVal}`;
                              const hslValue = rgbToHsl(rgbString);
                              handleColorChange(key as keyof ThemeVariables, hslStringToObject(hslValue));
                            } catch (error) {
                              console.warn('Invalid RGB values:', { r, g, b });
                            }
                            // Clear editing state for all three components
                            setEditingValues(prev => {
                              const newState = { ...prev };
                              delete newState[`${key}-r`];
                              delete newState[`${key}-g`];
                              delete newState[`${key}-b`];
                              return newState;
                            });
                          };

                          return (
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground mb-1">R</div>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={r}
                                  onChange={(e) => {
                                    setEditingValues(prev => ({
                                      ...prev,
                                      [`${key}-r`]: e.target.value
                                    }));
                                  }}
                                  onBlur={handleRgbBlur}
                                  className="w-full text-xs font-mono text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary transition-colors px-1 py-0.5"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground mb-1">G</div>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={g}
                                  onChange={(e) => {
                                    setEditingValues(prev => ({
                                      ...prev,
                                      [`${key}-g`]: e.target.value
                                    }));
                                  }}
                                  onBlur={handleRgbBlur}
                                  className="w-full text-xs font-mono text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary transition-colors px-1 py-0.5"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-muted-foreground mb-1">B</div>
                                <input
                                  type="number"
                                  min="0"
                                  max="255"
                                  value={b}
                                  onChange={(e) => {
                                    setEditingValues(prev => ({
                                      ...prev,
                                      [`${key}-b`]: e.target.value
                                    }));
                                  }}
                                  onBlur={handleRgbBlur}
                                  className="w-full text-xs font-mono text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary transition-colors px-1 py-0.5"
                                />
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </FormSection>
        ))}
      </div>

      {/* Right: Live Preview with Tabs */}
      <div className="space-y-4 min-h-0 overflow-y-auto max-h-full">
        <h3 className="text-lg font-semibold">Live Preview</h3>

        {/* Preview Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setPreviewTab('components')}
            className={`px-4 py-2 font-medium transition-colors ${
              previewTab === 'components'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Components
          </button>
          <button
            onClick={() => setPreviewTab('states')}
            className={`px-4 py-2 font-medium transition-colors ${
              previewTab === 'states'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            States
          </button>
        </div>

        <div
          ref={previewRef}
          className="rounded-lg border-2 border-border bg-background text-foreground p-6 space-y-4 min-h-[400px]"
        >
          {/* Components Tab */}
          {previewTab === 'components' && (
            <div className="space-y-6">
              {/* App Header Simulation */}
              <div className="rounded-lg bg-card text-card-foreground border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-bold">{themeName || 'Untitled Theme'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {themeDescription || 'Live preview of your custom theme'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity">
                      Secondary
                    </button>
                    <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                      Primary Action
                    </button>
                  </div>
                </div>
              </div>

              {/* Button Hierarchy */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">BUTTON HIERARCHY</div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Primary
                  </button>
                  <button className="px-4 py-2 rounded-lg font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity">
                    Secondary
                  </button>
                  <button className="px-4 py-2 rounded-lg font-medium bg-tertiary text-tertiary-foreground hover:opacity-90 transition-opacity">
                    Tertiary
                  </button>
                  <button className="px-4 py-2 rounded-lg font-medium bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
                    Accent
                  </button>
                  <button className="px-4 py-2 rounded-lg font-medium bg-muted text-muted-foreground hover:opacity-90 transition-opacity">
                    Muted
                  </button>
                </div>
              </div>

              {/* Form Elements */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">FORM INPUTS</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Username or email..."
                    className="w-full px-3 py-2 rounded-md bg-input text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value="••••••••"
                    readOnly
                    className="w-full px-3 py-2 rounded-md bg-input text-foreground border border-border"
                  />
                  <input
                    type="text"
                    value="Disabled field"
                    disabled
                    className="w-full px-3 py-2 rounded-md bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              {/* Card Surfaces */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wide">CARD</div>
                  <div className="p-4 rounded-lg bg-card text-card-foreground border border-border">
                    <h5 className="font-semibold mb-1 text-sm">Card Surface</h5>
                    <p className="text-xs text-muted-foreground">
                      Uses card background and foreground colors
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground tracking-wide">POPOVER</div>
                  <div className="p-4 rounded-lg bg-popover text-popover-foreground border border-border shadow-lg">
                    <h5 className="font-semibold mb-1 text-sm">Popover Surface</h5>
                    <p className="text-xs text-muted-foreground">
                      Elevated surface with shadow
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Hierarchy */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">TEXT HIERARCHY</div>
                <div className="space-y-1 p-3 rounded-lg border border-border">
                  <p className="text-foreground font-semibold">Primary text (foreground)</p>
                  <p className="text-muted-foreground">Secondary text (muted-foreground)</p>
                  <p className="text-muted-foreground text-sm">Tertiary text (muted, smaller)</p>
                </div>
              </div>
            </div>
          )}

          {/* States Tab */}
          {previewTab === 'states' && (
            <div className="space-y-6">
              {/* Semantic States */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">SEMANTIC STATES</div>
                <div className="space-y-2">
                  <div className="px-4 py-3 rounded-lg bg-success/10 text-success border border-success/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <div>
                        <div className="font-semibold text-sm">Success</div>
                        <div className="text-xs opacity-90">Operation completed successfully</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-warning/10 text-warning border border-warning/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠</span>
                      <div>
                        <div className="font-semibold text-sm">Warning</div>
                        <div className="text-xs opacity-90">Please review before proceeding</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✗</span>
                      <div>
                        <div className="font-semibold text-sm">Error</div>
                        <div className="text-xs opacity-90">Something went wrong with this action</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-info/10 text-info border border-info/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">ℹ</span>
                      <div>
                        <div className="font-semibold text-sm">Info</div>
                        <div className="text-xs opacity-90">Additional information available</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive States */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">INTERACTIVE STATES</div>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-left">
                    <div className="font-medium text-sm">Hover State</div>
                    <div className="text-xs opacity-90">Primary button with hover effect</div>
                  </button>
                  <div className="w-full px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                    <div className="font-medium text-sm">Muted / Disabled State</div>
                    <div className="text-xs">Less prominent or inactive elements</div>
                  </div>
                  <button className="w-full px-4 py-2 rounded-lg bg-background text-foreground border-2 border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all">
                    <div className="font-medium text-sm">Focus State (Click Me)</div>
                    <div className="text-xs text-muted-foreground">Shows ring color on focus</div>
                  </button>
                </div>
              </div>

              {/* Borders & Accents */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground tracking-wide">BORDERS & SEPARATORS</div>
                <div className="space-y-3 p-4 rounded-lg border-2 border-border">
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium">Border Color</p>
                    <p className="text-xs text-muted-foreground">Default border between elements</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-1 rounded-full bg-primary"></div>
                    <span className="text-xs text-muted-foreground">Primary</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-1 rounded-full bg-accent"></div>
                    <span className="text-xs text-muted-foreground">Accent</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-1 rounded-full bg-muted"></div>
                    <span className="text-xs text-muted-foreground">Muted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
