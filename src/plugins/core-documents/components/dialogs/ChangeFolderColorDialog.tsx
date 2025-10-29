/**
 * ChangeFolderColorDialog - Dialog for changing folder colors
 * Features:
 * - HSL color picker
 * - Theme-aware color presets
 * - Preview folder with selected color
 * - Reset to theme default button
 */

import React, { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { HslColorPicker } from 'react-colorful';
import { PluginManager } from '@/shared/plugin-system';
import {
  hslStringToObject,
  hslObjectToString,
  hslToHex,
} from '../../utils/colorUtils';

export interface ChangeFolderColorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  currentColor?: string;
  defaultFolderColor: string;
  colorPresets: Array<{ name: string; hsl: string }>;
  documentsService: any;
  onColorChangeComplete: () => void;
}

export const ChangeFolderColorDialog: React.FC<ChangeFolderColorDialogProps> = ({
  open,
  onOpenChange,
  folderId,
  currentColor,
  defaultFolderColor,
  colorPresets,
  documentsService,
  onColorChangeComplete,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('core-ui/Dialog');
  const Popover = manager.getComponent('core-ui/Popover');

  const [changeColorValue, setChangeColorValue] = useState(defaultFolderColor);

  // Initialize color value when dialog opens or currentColor changes
  useEffect(() => {
    if (open) {
      setChangeColorValue(currentColor || defaultFolderColor);
    }
  }, [open, currentColor, defaultFolderColor]);

  // Handle color change confirmation
  const handleChangeColorConfirm = async () => {
    if (!documentsService || !folderId) return;

    try {
      await documentsService.updateFolder(folderId, {
        color: hslToHex(changeColorValue)
      });

      // Reset state
      setChangeColorValue(defaultFolderColor);
      onOpenChange(false);

      // Notify parent to refresh
      onColorChangeComplete();
    } catch (error) {
      console.error('Color change failed:', error);
      // TODO: Show error toast
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setChangeColorValue(defaultFolderColor);
    onOpenChange(false);
  };

  if (!Dialog || !Popover) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        } else {
          onOpenChange(isOpen);
        }
      }}
      title="Change Folder Color"
      description="Choose a new color for this folder"
      showConfirm
      showCancel
      confirmText="Change Color"
      onConfirm={handleChangeColorConfirm}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        {/* Folder Icon Preview */}
        <div className="flex items-center justify-center p-6 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-center">
            <Folder className="w-20 h-20 mx-auto mb-2" style={{ color: `hsl(${changeColorValue})` }} />
            <p className="text-xs text-muted-foreground">Preview</p>
          </div>
        </div>

        <div className="p-4 w-full space-y-3 border rounded-lg">
          {/* Header with hex value */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Folder Color</div>
            <div className="text-xs text-muted-foreground font-mono">
              {hslToHex(changeColorValue).toUpperCase()}
            </div>
          </div>

          {/* HSL Color Picker */}
          <HslColorPicker
            color={hslStringToObject(changeColorValue)}
            onChange={(color) => setChangeColorValue(hslObjectToString(color))}
            className="w-full"
          />

          {/* Color Presets - Theme-aware */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Quick Colors</div>
            <div className="grid grid-cols-6 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setChangeColorValue(preset.hsl)}
                  className="w-8 h-8 rounded-md border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: `hsl(${preset.hsl})` }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Reset to Theme Default */}
          <button
            type="button"
            onClick={() => setChangeColorValue(defaultFolderColor)}
            className="w-full px-3 py-2 text-sm rounded bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <span>Reset to Theme Color</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
};
