/**
 * DeleteFolderDialog - Dialog for deleting folders with content handling
 * Features:
 * - Check if folder has contents
 * - Two delete options: move contents to parent (safe) OR delete all contents (requires confirmation)
 * - Empty folder: simple delete button
 */

import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';

export interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  documentsService: any;
  onDeleteComplete: () => void;
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  open,
  onOpenChange,
  folderId,
  documentsService,
  onDeleteComplete,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('chaycards/core-ui/Dialog');
  const Button = manager.getComponent('chaycards/core-ui/Button');

  const [folderHasContents, setFolderHasContents] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  // Check if folder has contents when dialog opens or folderId changes
  useEffect(() => {
    const checkFolderContents = async () => {
      if (open && folderId && documentsService) {
        try {
          const childFolders = await documentsService.listFolders(folderId);
          const childFiles = await documentsService.getFiles(folderId);
          const hasContents = childFolders.length > 0 || childFiles.length > 0;
          setFolderHasContents(hasContents);
        } catch (error) {
          console.error('Failed to check folder contents:', error);
          setFolderHasContents(false);
        }
      }
    };

    checkFolderContents();
  }, [open, folderId, documentsService]);

  // Handle delete confirmation
  const handleDeleteConfirm = async (deleteContents: boolean) => {
    if (!documentsService || !folderId) {
      console.error('[DeleteFolderDialog] Missing service or folder ID', {
        hasService: !!documentsService,
        folderId
      });
      return;
    }

    console.log('[DeleteFolderDialog] Starting folder deletion:', {
      folderId,
      deleteContents,
      folderHasContents
    });

    try {
      if (deleteContents) {
        console.log('[DeleteFolderDialog] Calling deleteFolder (delete all contents)...');
        // Delete folder and all contents - MUST pass true to actually delete contents!
        await documentsService.deleteFolder(folderId, true);
        console.log('[DeleteFolderDialog] deleteFolder completed successfully');
      } else {
        console.log('[DeleteFolderDialog] Calling deleteFolderAndMoveContents...');
        // Move contents to parent and delete folder
        await documentsService.deleteFolderAndMoveContents(folderId);
        console.log('[DeleteFolderDialog] deleteFolderAndMoveContents completed successfully');
      }

      // Reset state
      setDeleteConfirmed(false);
      setFolderHasContents(false);
      onOpenChange(false);

      // Notify parent to refresh
      onDeleteComplete();

      console.log('[DeleteFolderDialog] Folder deletion completed successfully');
    } catch (error) {
      console.error('[DeleteFolderDialog] Delete failed with error:', error);
      console.error('[DeleteFolderDialog] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // TODO: Show error toast to user
      alert(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setDeleteConfirmed(false);
    setFolderHasContents(false);
    onOpenChange(false);
  };

  if (!Dialog || !Button) return null;

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
      title="Delete Folder"
      description={folderHasContents ? "Choose how to delete this folder" : "This folder is empty"}
      showConfirm={false}
      showCancel={false}
    >
      <div className="space-y-4">
        {folderHasContents && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground">
              What would you like to do with the contents of this folder?
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {folderHasContents ? (
            <>
              {/* Option 1: Move contents to parent (SAFE, DEFAULT) */}
              <Button
                variant="3d-primary"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full justify-start text-left py-3 h-auto whitespace-normal"
              >
                <div className="flex-1 space-y-0.5">
                  <div className="font-semibold text-sm">Move Contents to Parent</div>
                  <div className="text-xs opacity-90 leading-snug">
                    Safe option: Move files & folders to parent before deleting
                  </div>
                </div>
              </Button>

              {/* Option 2: Delete all contents (DANGEROUS, requires confirmation) */}
              <div className="space-y-2">
                <Button
                  variant="3d-outline"
                  onClick={() => {
                    console.log('[DeleteFolderDialog] Delete All Contents button clicked', {
                      deleteConfirmed,
                      folderId,
                      folderHasContents
                    });
                    if (deleteConfirmed) {
                      console.log('[DeleteFolderDialog] Confirmed - calling handleDeleteConfirm(true)');
                      handleDeleteConfirm(true);
                    } else {
                      console.warn('[DeleteFolderDialog] Button clicked but deleteConfirmed is false (should not happen - button should be disabled)');
                    }
                  }}
                  disabled={!deleteConfirmed}
                  className="w-full justify-start text-left py-3 h-auto whitespace-normal"
                >
                  <div className="flex-1 space-y-0.5">
                    <div className="font-semibold text-sm text-destructive">Delete All Contents</div>
                    <div className="text-xs text-muted-foreground leading-snug">
                      Warning: Permanently delete folder and all contents
                    </div>
                  </div>
                </Button>

                {/* Confirmation checkbox */}
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => {
                      console.log('[DeleteFolderDialog] Confirmation checkbox changed:', e.target.checked);
                      setDeleteConfirmed(e.target.checked);
                    }}
                    className="rounded border-border flex-shrink-0"
                  />
                  <span className="leading-snug">I understand this action cannot be undone</span>
                </label>
              </div>
            </>
          ) : (
            /* Empty folder - simple delete button */
            <Button
              variant="3d-primary"
              onClick={() => handleDeleteConfirm(false)}
              className="w-full justify-start text-left py-3 h-auto whitespace-normal"
            >
              <div className="flex-1 space-y-0.5">
                <div className="font-semibold text-sm">Delete Empty Folder</div>
                <div className="text-xs opacity-90 leading-snug">
                  Remove this folder (no contents to delete)
                </div>
              </div>
            </Button>
          )}

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
