/**
 * DeleteFileDialog - Confirmation dialog for deleting files
 */

import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import { AlertTriangle } from 'lucide-react';

export interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  documentsService: any;
  onDeleteComplete: () => void;
}

export const DeleteFileDialog: React.FC<DeleteFileDialogProps> = ({
  open,
  onOpenChange,
  fileId,
  documentsService,
  onDeleteComplete,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('core-ui/Dialog');

  const [file, setFile] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load file data when dialog opens
  useEffect(() => {
    if (open && fileId && documentsService) {
      documentsService.getDocument(fileId).then((loadedFile: any) => {
        if (loadedFile) {
          setFile(loadedFile);
        }
      });
    }
  }, [open, fileId, documentsService]);

  // Handle delete confirmation
  const handleConfirm = async () => {
    if (!documentsService || !fileId) return;

    setIsDeleting(true);

    try {
      await documentsService.deleteDocument(fileId);

      // Reset state
      setFile(null);
      setIsDeleting(false);
      onOpenChange(false);

      // Notify parent to refresh
      onDeleteComplete();
    } catch (err) {
      console.error('Delete failed:', err);
      setIsDeleting(false);
      // TODO: Show error toast
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFile(null);
    setIsDeleting(false);
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
      title="Delete File"
      description="Are you sure you want to delete this file?"
      showConfirm
      showCancel
      confirmText={isDeleting ? "Deleting..." : "Delete"}
      confirmVariant="destructive"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              This action cannot be undone
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              The file "{file?.filename}" will be permanently deleted.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
