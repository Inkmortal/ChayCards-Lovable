/**
 * FileSettingsDialog - Dynamic settings dialog for file types
 * Renders plugin-specific settings components
 */

import React from 'react';
import { PluginManager } from '@/shared/plugin-system';

export interface FileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: any | null;
  documentsService: any;
}

export const FileSettingsDialog: React.FC<FileSettingsDialogProps> = ({
  open,
  onOpenChange,
  file,
  documentsService,
}) => {
  const manager = PluginManager.getInstance();
  const Dialog = manager.getComponent('core-ui/Dialog');

  if (!Dialog || !file) return null;

  const handler = documentsService.getHandlerForFile(file);
  if (!handler?.settingsComponent) return null;

  const SettingsComponent = manager.getComponent(handler.settingsComponent);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${file.filename} Settings`}
      size="large"
      showCancel
      cancelText="Close"
      onCancel={() => onOpenChange(false)}
    >
      {SettingsComponent ? (
        <SettingsComponent fileId={file.id} />
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <p>Settings component not found: {handler.settingsComponent}</p>
        </div>
      )}
    </Dialog>
  );
};
