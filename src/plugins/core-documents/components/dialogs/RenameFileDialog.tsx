/**
 * RenameFileDialog - Dialog for renaming files
 * Preserves file extension while allowing name changes
 */

import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';

export interface RenameFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  documentsService: any;
  onRenameComplete: () => void;
}

export const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  open,
  onOpenChange,
  fileId,
  documentsService,
  onRenameComplete,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('core-ui/Dialog');

  const [file, setFile] = useState<any>(null);
  const [nameWithoutExt, setNameWithoutExt] = useState('');
  const [extension, setExtension] = useState('');
  const [error, setError] = useState('');

  // Load file data when dialog opens
  useEffect(() => {
    if (open && fileId && documentsService) {
      documentsService.getDocument(fileId).then((loadedFile: any) => {
        if (loadedFile) {
          setFile(loadedFile);

          // Split filename into name and extension
          const filename = loadedFile.filename || '';
          const lastDotIndex = filename.lastIndexOf('.');

          if (lastDotIndex > 0) {
            setNameWithoutExt(filename.substring(0, lastDotIndex));
            setExtension(filename.substring(lastDotIndex));
          } else {
            setNameWithoutExt(filename);
            setExtension('');
          }

          setError('');
        }
      });
    }
  }, [open, fileId, documentsService]);

  // Real-time validation
  const handleNameChange = async (name: string) => {
    setNameWithoutExt(name);

    if (!name.trim()) {
      setError('File name cannot be empty');
      return;
    }

    if (!file) return;

    // Check for duplicates in the same folder
    try {
      const filesInFolder = await documentsService.getFiles(file.folderId);
      const newFullName = name.trim() + extension;

      const duplicate = filesInFolder.find(
        (f: any) => f.id !== fileId && f.filename.toLowerCase() === newFullName.toLowerCase()
      );

      if (duplicate) {
        setError(`A file named "${newFullName}" already exists in this folder`);
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
    }
  };

  // Handle rename confirmation
  const handleConfirm = async () => {
    if (!documentsService || !fileId || !file) return;

    const newName = nameWithoutExt.trim();

    if (!newName) {
      setError('File name cannot be empty');
      return;
    }

    if (error) {
      return; // Don't proceed if there's a validation error
    }

    try {
      const newFullName = newName + extension;
      await documentsService.updateDocument(fileId, { filename: newFullName });

      // Reset state
      setFile(null);
      setNameWithoutExt('');
      setExtension('');
      setError('');
      onOpenChange(false);

      // Notify parent to refresh
      onRenameComplete();
    } catch (err) {
      console.error('Rename failed:', err);
      setError('Failed to rename file');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFile(null);
    setNameWithoutExt('');
    setExtension('');
    setError('');
    onOpenChange(false);
  };

  if (!Dialog) return null;

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
      title="Rename File"
      description="Enter a new name for this file"
      showConfirm
      showCancel
      confirmText="Rename"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rename-input">File Name</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rename-input"
              value={nameWithoutExt}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter file name"
              className="flex-1"
              autoFocus
            />
            {extension && (
              <span className="text-sm text-muted-foreground font-medium">
                {extension}
              </span>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    </Dialog>
  );
};
