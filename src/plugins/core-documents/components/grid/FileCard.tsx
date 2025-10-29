/**
 * FileCard - Grid view file display component
 * Displays a file as a card with drag-and-drop support
 */

import React, { useRef } from 'react';
import { MoreVertical, Edit2, Trash2, Settings, ExternalLink } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { cn } from '@/shared/lib/utils';
import { FileIconDisplay, FileTypeLabel, getFileDisplayName } from '../FileDisplay';
import { PluginManager } from '@/shared/plugin-system';

export interface FileCardProps {
  file: any;
  onClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  onOpenInTab?: () => void;
}

export const FileCard = React.forwardRef<HTMLDivElement, FileCardProps>(({
  file,
  onClick,
  onRename,
  onDelete,
  onSettings,
  onOpenInTab
}, forwardedRef) => {
  const manager = PluginManager.getInstance();
  const DropdownMenu = manager.getComponent('chaycards/core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('chaycards/core-ui/DropdownMenuItem');
  const DropdownMenuSeparator = manager.getComponent('chaycards/core-ui/DropdownMenuSeparator');

  const internalRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // useDrag hook - makes this file draggable
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FILE',
    item: { id: file.id, source: 'main-view' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [file.id]);

  // Callback ref to handle both forwarding and drag connection
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    // Store in internal ref
    internalRef.current = node;

    // Handle forwarded ref
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        forwardedRef.current = node;
      }
    }

    // Connect drag functionality
    drag(node);
  }, [forwardedRef, drag]);

  return (
    <div
      ref={setRefs}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        // Base card with depth - TALLER aspect ratio (matching folders)
        "p-4 rounded-2xl",
        "bg-gradient-to-br from-card to-card/90",
        "border-2 border-border/50",
        "shadow-lg shadow-black/5",
        // Hover effects
        "hover:shadow-xl hover:shadow-black/10",
        "hover:border-primary/30",
        "hover:-translate-y-1",
        "transition-all duration-200",
        // Drag states
        isDragging && "opacity-40 scale-95",
        // Boxy layout - matching folders
        "flex flex-col justify-center aspect-[4/3]"
      )}
    >
      {/* Subtle accent stripe for files (lighter than folders) - reduced from h-2 to h-1 */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-muted-foreground/20" />

      {/* Three-dot menu (hidden until hover) - top right corner */}
      {DropdownMenu && (
        <div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu
            trigger={
              <button className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-accent/50 transition-colors shadow-sm">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          >
            {onOpenInTab && (
              <DropdownMenuItem onClick={onOpenInTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </DropdownMenuItem>
            )}
            {onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename...
              </DropdownMenuItem>
            )}
            {onSettings && (
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings...
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                {DropdownMenuSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenu>
        </div>
      )}

      {/* Main content - vertical centered layout like macOS */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-4">
        {/* File icon - handler-specific icon with fallback */}
        <div className="flex-shrink-0">
          <FileIconDisplay file={file} size="large" />
        </div>

        {/* Text content - centered below icon */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          {/* File name - without extension */}
          <h3 className="text-base font-semibold truncate w-full text-center px-2">
            {getFileDisplayName(file)}
          </h3>

          {/* Metadata - file type and size */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileTypeLabel file={file} />
            <span>•</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

FileCard.displayName = 'FileCard';
