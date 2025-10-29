/**
 * FolderCard - Grid view folder display component
 * Displays a folder as a card with drag-and-drop support
 */

import React, { useRef } from 'react';
import { FileText, Folder, MoreVertical, Edit2, Palette, Trash2 } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { PluginManager } from '@/shared/plugin-system';
import { cn } from '@/shared/lib/utils';

export interface FolderCardProps {
  folder: any;
  folders: any[];
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  updateTreeAfterMove: (tree: any[], draggedId: string, newParentId: string | null, newIndex: number) => any[];
  documentsService: any;
  toast: any;
  onFolderSelect: (folderId: string) => void;
  onRename: (folderId: string) => void;
  onChangeColor: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  isDescendant: (sourceId: string, targetId: string) => boolean;
  setTreeRefetchKey: React.Dispatch<React.SetStateAction<number>>;
}

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(({
  folder,
  folders,
  setFolders,
  updateTreeAfterMove,
  documentsService,
  toast,
  onFolderSelect,
  onRename,
  onChangeColor,
  onDelete,
  isDescendant,
  setTreeRefetchKey,
}, forwardedRef) => {
  const manager = PluginManager.getInstance();
  const DropdownMenu = manager.getComponent('core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('core-ui/DropdownMenuItem');

  const internalRef = useRef<HTMLDivElement>(null);

  // useDrag hook - makes this folder draggable
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FOLDER',
    item: { id: folder.id, source: 'main-view' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [folder.id]);

  // Callback ref to handle forwarding and drag connection
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

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on the menu
    if (!(e.target as HTMLElement).closest('.folder-menu')) {
      onFolderSelect(folder.id);
    }
  };

  // Calculate folder statistics
  const folderStats = React.useMemo(() => {
    // Count files in this folder
    const countFiles = (nodes: any[], targetFolderId: string): number => {
      let count = 0;
      for (const node of nodes) {
        if (node.type === 'file' && node.folderId === targetFolderId) {
          count++;
        }
        if (node.type === 'folder') {
          count += countFiles(node.children, targetFolderId);
        }
      }
      return count;
    };

    return {
      fileCount: countFiles(folders, folder.id)
    };
  }, [folders, folder.id]);

  return (
      <div
        ref={setRefs}
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden cursor-pointer",
          // Base card with depth - TALLER aspect ratio (more vertical)
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
          // Boxy layout - more square like macOS/Google Drive
          "flex flex-col justify-center aspect-[4/3]"
      )}
    >
      {/* Colored accent stripe at top - reduced from h-2 to h-1 */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: folder.color || 'hsl(var(--primary))' }}
      />

      {/* Three-dot menu (hidden until hover) - moved to top right corner */}
      {DropdownMenu && (
        <div
          className="folder-menu absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu
            trigger={
              <button className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-accent/50 transition-colors shadow-sm">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          >
            <DropdownMenuItem onClick={() => onRename(folder.id)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeColor(folder.id)}>
              <Palette className="mr-2 h-4 w-4" />
              Change Color
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(folder.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      )}

      {/* Main content - vertical centered layout like macOS */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-4">
        {/* Folder icon - increased from w-14 to w-16 */}
        <div className="relative">
          <Folder
            className="w-16 h-16 drop-shadow-lg"
            style={{ color: folder.color || 'hsl(var(--primary))' }}
          />

          {/* Content preview dots */}
          {folderStats.fileCount > 0 && (
            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
              {[...Array(Math.min(3, folderStats.fileCount))].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shadow-sm"
                />
              ))}
            </div>
          )}
        </div>

        {/* Text content - centered below icon */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          {/* Folder name - increased from text-sm to text-base */}
          <h3 className="text-base font-semibold truncate w-full text-center px-2">
            {folder.name}
          </h3>

          {/* Metadata - single line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {folderStats.fileCount} {folderStats.fileCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* Tags (optional) - centered */}
      {folder.tags && folder.tags.length > 0 && (
        <div className="flex gap-1 mt-2 overflow-hidden justify-center flex-wrap px-2">
          {folder.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium truncate"
            >
              {tag}
            </span>
          ))}
          {folder.tags.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{folder.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

FolderCard.displayName = 'FolderCard';
