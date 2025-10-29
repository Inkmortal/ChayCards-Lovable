/**
 * RenameFolderDialog - Dialog for renaming folders
 * Supports two modes:
 * 1. Conflict resolution mode: When drag-drop causes name collision
 * 2. Direct rename mode: From three-dot menu
 */

import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';

export interface ConflictData {
  draggedId: string;
  actualParentId: string | null;
  operation: {
    index: number;
  };
}

export interface RenameFolderDialogProps {
  // Conflict resolution mode
  conflictMode?: boolean;
  conflictData?: ConflictData | null;
  onConflictRename?: (newName: string) => Promise<void>;

  // Direct rename mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  currentName?: string;
  parentId: string | null;
  documentsService: any;
  onRenameComplete: () => void;
}

export const RenameFolderDialog: React.FC<RenameFolderDialogProps> = ({
  conflictMode = false,
  conflictData,
  onConflictRename,
  open,
  onOpenChange,
  folderId,
  currentName = '',
  parentId,
  documentsService,
  onRenameComplete,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('chaycards/core-ui/Dialog');

  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');

  // Initialize rename value when dialog opens or folder changes
  useEffect(() => {
    if (open && currentName) {
      setRenameValue(currentName);
      setRenameError('');
    }
  }, [open, currentName]);

  // Real-time validation
  const handleRenameChange = async (name: string) => {
    setRenameValue(name);

    // Clear error if empty
    if (!name.trim()) {
      setRenameError('Folder name cannot be empty');
      return;
    }

    // Check for duplicates in the same parent
    if (documentsService && folderId) {
      const targetParentId = conflictMode ? conflictData?.actualParentId : parentId;
      const siblings = await documentsService.listFolders(targetParentId);
      const duplicate = siblings.find(
        (f: any) => f.id !== folderId && f.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (duplicate) {
        setRenameError(`A folder named "${name.trim()}" already exists here`);
      } else {
        setRenameError('');
      }
    }
  };

  // Conflict resolution rename handler
  const handleConflictRenameConfirm = async () => {
    const newName = renameValue.trim();

    if (!newName) {
      setRenameError('Folder name cannot be empty');
      return;
    }

    if (renameError) {
      return; // Don't proceed if there's a validation error
    }

    try {
      if (onConflictRename) {
        await onConflictRename(newName);
      }

      // Reset state
      setRenameValue('');
      setRenameError('');
      onOpenChange(false);
    } catch (error) {
      console.error('Rename failed:', error);
      setRenameError('Failed to rename folder');
    }
  };

  // Direct rename handler
  const handleDirectRenameConfirm = async () => {
    if (!documentsService || !folderId) return;

    const newName = renameValue.trim();

    if (!newName) {
      setRenameError('Folder name cannot be empty');
      return;
    }

    if (renameError) {
      return; // Don't proceed if there's a validation error
    }

    try {
      await documentsService.updateFolder(folderId, { name: newName });

      // Reset state
      setRenameValue('');
      setRenameError('');
      onOpenChange(false);

      // Notify parent to refresh
      onRenameComplete();
    } catch (error) {
      console.error('Rename failed:', error);
      setRenameError('Failed to rename folder');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setRenameValue('');
    setRenameError('');
    onOpenChange(false);
  };

  if (!Dialog) return null;

  // Determine which mode we're in
  const isConflictMode = conflictMode && conflictData;
  const dialogOpen = isConflictMode ? !!conflictData : open;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        } else {
          onOpenChange(isOpen);
        }
      }}
      title="Rename Folder"
      description={isConflictMode ? "Enter a new name for the folder" : "Choose a new name for this folder"}
      showConfirm
      showCancel
      confirmText={isConflictMode ? "Rename and Move" : "Rename"}
      onConfirm={isConflictMode ? handleConflictRenameConfirm : handleDirectRenameConfirm}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rename-input">{isConflictMode ? "New Folder Name" : "Folder Name"}</Label>
          <Input
            id="rename-input"
            value={renameValue}
            onChange={(e) => handleRenameChange(e.target.value)}
            placeholder="Enter folder name"
            autoFocus
          />
          {renameError && (
            <p className="text-sm text-destructive">{renameError}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
};
