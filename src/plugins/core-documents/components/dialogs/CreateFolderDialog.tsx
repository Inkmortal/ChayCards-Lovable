/**
 * CreateFolderDialog - Dialog for creating new folders
 * Includes folder name input, validation, and color picker
 */

import React, { useState } from 'react';
import { Folder } from 'lucide-react';
import { HslColorPicker } from 'react-colorful';
import { PluginManager } from '@/shared/plugin-system';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  hslStringToObject,
  hslObjectToString,
  hslToHex,
  getContrastColor,
  generateUniqueFolderName
} from '../../utils/colorUtils';

export interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFolderId: string | null;
  documentsService: any;
  defaultFolderColor: string;
  colorPresets: Array<{ name: string; hsl: string }>;
  onFolderCreated: () => void;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onOpenChange,
  selectedFolderId,
  documentsService,
  defaultFolderColor,
  colorPresets,
  onFolderCreated,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('chaycards/core-ui/Dialog');
  const Popover = manager.getComponent('chaycards/core-ui/Popover');

  const [newFolderName, setNewFolderName] = useState('');
  const [folderPlaceholder, setFolderPlaceholder] = useState('New Folder');
  const [createFolderError, setCreateFolderError] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(defaultFolderColor);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Handle folder name change with validation
  const handleFolderNameChange = async (name: string) => {
    setNewFolderName(name);

    // Clear error if empty (empty is valid - will use counter name)
    if (!name.trim()) {
      setCreateFolderError('');
      return;
    }

    // Check if name already exists (case-insensitive)
    if (documentsService) {
      const existingFolders = await documentsService.listFolders(selectedFolderId);
      const duplicate = existingFolders.find(
        (f: any) => f.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (duplicate) {
        setCreateFolderError(`A folder named "${name.trim()}" already exists here`);
      } else {
        setCreateFolderError('');
      }
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!documentsService) return;

    // Don't create if there's a validation error
    if (createFolderError) {
      return;
    }

    // Generate unique name if no name provided (quick creation)
    const folderName = newFolderName.trim()
      ? newFolderName.trim()
      : await generateUniqueFolderName(documentsService, selectedFolderId);

    const result = await documentsService.createFolder({
      name: folderName,
      parentId: selectedFolderId,
      color: hslToHex(newFolderColor), // Convert HSL to hex for storage
    });

    if (result.success) {
      // Reset state
      setNewFolderName('');
      setCreateFolderError('');
      setNewFolderColor(defaultFolderColor);
      setShowColorPicker(false);
      onOpenChange(false);

      // Notify parent to refresh
      onFolderCreated();
    } else {
      console.error('Failed to create folder:', result.error);
      setCreateFolderError(result.error || 'Failed to create folder');
    }
  };

  // Handle dialog close
  const handleCancel = () => {
    setNewFolderName('');
    setCreateFolderError('');
    setNewFolderColor(defaultFolderColor);
    setShowColorPicker(false);
    onOpenChange(false);
  };

  if (!Dialog) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Folder"
      description="Organize your documents with folders"
      showConfirm
      showCancel
      confirmText="Create Folder"
      onConfirm={handleCreateFolder}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folder-name">Folder Name</Label>
          <Input
            id="folder-name"
            value={newFolderName}
            onChange={(e) => handleFolderNameChange(e.target.value)}
            placeholder={folderPlaceholder}
            autoFocus
          />
          {createFolderError && (
            <p className="text-sm text-destructive">{createFolderError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="folder-color">Folder Color</Label>
          {/* Folder Icon Preview */}
          <div className="flex items-center justify-center p-6 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-center">
              <Folder className="w-20 h-20 mx-auto mb-2" style={{ color: `hsl(${newFolderColor})` }} />
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>
          {Popover && (
            <Popover
              open={showColorPicker}
              onOpenChange={setShowColorPicker}
              trigger={
                <button
                  type="button"
                  className="w-full h-12 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer flex items-center justify-center gap-2"
                  style={{ backgroundColor: `hsl(${newFolderColor})` }}
                >
                  <span className="text-sm font-medium" style={{ color: getContrastColor(newFolderColor) }}>
                    Click to choose color
                  </span>
                </button>
              }
            >
              <div className="p-4 w-64 space-y-3">
                {/* Header with hex value */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Folder Color</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {hslToHex(newFolderColor).toUpperCase()}
                  </div>
                </div>

                {/* HSL Color Picker */}
                <HslColorPicker
                  color={hslStringToObject(newFolderColor)}
                  onChange={(color) => setNewFolderColor(hslObjectToString(color))}
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
                        onClick={() => setNewFolderColor(preset.hsl)}
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
                  onClick={() => setNewFolderColor(defaultFolderColor)}
                  className="w-full px-3 py-2 text-sm rounded bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Reset to Theme Color</span>
                </button>

                {/* Done Button */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="w-full px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </Popover>
          )}
        </div>
      </div>
    </Dialog>
  );
};
