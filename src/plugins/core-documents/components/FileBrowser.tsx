/**
 * FileBrowser - Main document management interface
 *
 * Features:
 * - Hierarchical folder navigation (left sidebar)
 * - File list with drag-and-drop support
 * - File upload and management
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { FileText, FolderPlus, Upload, Folder, ChevronRight, PanelLeftClose, PanelLeft, ArrowUpDown, MoreVertical, Edit2, Palette, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { HslColorPicker } from 'react-colorful';
import { useDrag, useDrop } from 'react-dnd';
import { PluginManager } from '@/shared/plugin-system';
import { useDocumentStatistics, useUnifiedTree, useFilesInFolder, useChildFolders, useFolderPath, useSortBy, useFileHandlers } from '../hooks/useDocuments';
import { useDocumentTabs } from '../hooks/useDocumentTabs';
import { useGridLayoutManager } from '../hooks/useGridLayoutManager';
import { FolderTree } from './FolderTree';
import { TabBar } from './TabBar';
import { DropIndicator } from './DropIndicator';
import { FileIconDisplay, FileTypeLabel, getFileDisplayName } from './FileDisplay';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { useToast } from '@/renderer/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { DocumentViewerContext } from '../context/DocumentViewerContext';
import type { SortMode, StoredFile } from '../types';

/**
 * Convert HSL string to object for react-colorful
 * Format: "220 23% 95%" → { h: 220, s: 23, l: 95 }
 */
const hslStringToObject = (hsl: string): { h: number; s: number; l: number } => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  return { h, s, l };
};

/**
 * Convert HSL object to string for storage
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
 * Calculate contrasting text color (black or white) for a given HSL background
 * Uses WCAG relative luminance formula for accessibility
 * Format: "220 23% 95%" → "#000000" or "#ffffff"
 */
const getContrastColor = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  // Convert HSL to RGB
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

  // Calculate relative luminance (WCAG formula)
  // Weights: R=0.2126, G=0.7152, B=0.0722 (based on human eye sensitivity)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Format timestamp as relative time
 * Examples: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago"
 */
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/**
 * Generate unique folder name with counter pattern
 * Pattern: "New Folder", "New Folder (1)", "New Folder (2)", etc.
 *
 * Uses case-insensitive matching to find available name in the parent folder.
 * This ensures the name is unique before the backend's duplicate checking validates it.
 */
const generateUniqueFolderName = async (
  documentsService: any,
  parentId: string | null
): Promise<string> => {
  const folders = await documentsService.listFolders(parentId);
  const baseName = 'New Folder';

  // Check if base name exists (case-insensitive)
  const baseExists = folders.some(
    (f: any) => f.name.toLowerCase() === baseName.toLowerCase()
  );

  if (!baseExists) {
    return baseName;
  }

  // Find the next available counter
  let counter = 1;
  while (true) {
    const candidateName = `${baseName} (${counter})`;
    const exists = folders.some(
      (f: any) => f.name.toLowerCase() === candidateName.toLowerCase()
    );

    if (!exists) {
      return candidateName;
    }
    counter++;
  }
};

// ============ FolderCard Component ============

interface FolderCardProps {
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

const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(({
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

// ============ FileCard Component ============

interface FileCardProps {
  file: any;
  onClick?: () => void;
}

const FileCard = React.forwardRef<HTMLDivElement, FileCardProps>(({ file, onClick }, forwardedRef) => {
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
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-accent/50 transition-colors shadow-sm">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

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

// ============ BreadcrumbFolder Component ============

interface BreadcrumbFolderProps {
  folder: { id: string; name: string } | null;
  isActive: boolean;
  onClick: () => void;
  onDrop: (draggedId: string, source: string) => Promise<void>;
}

const BreadcrumbFolder: React.FC<BreadcrumbFolderProps> = ({
  folder,
  isActive,
  onClick,
  onDrop
}) => {
  const internalRef = useRef<HTMLButtonElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FOLDER',
    drop: async (item: { id: string; source: string }) => {
      const targetId = folder?.id || null;

      // Don't drop on self
      if (item.id === targetId) return;

      console.log(`[Breadcrumb] Drop ${item.id} (from ${item.source}) onto ${folder?.name || 'All Files'}`);
      await onDrop(item.id, item.source);
    },
    canDrop: (item) => {
      return item.id !== (folder?.id || null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
      canDrop: monitor.canDrop(),
    }),
  }), [folder, onDrop]);

  // Callback ref to handle drop connection
  const setRefs = React.useCallback((node: HTMLButtonElement | null) => {
    // Store in internal ref
    internalRef.current = node;

    // Connect drop functionality
    drop(node);
  }, [drop]);

  return (
    <button
      ref={setRefs}
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-all px-2 py-1 rounded",
        isActive
          ? "text-foreground underline underline-offset-4"
          : "text-muted-foreground hover:text-foreground",
        // Drop feedback
        isOver && "bg-primary/20 ring-1 ring-primary/40",
        canDrop && !isOver && "hover:bg-muted/50"
      )}
    >
      {folder?.name || 'All Files'}
    </button>
  );
};

// ============ ParentNavigationCard Component ============

interface ParentNavigationCardProps {
  parentFolder: any;
  parentFolderId: string | null;
  handleFolderMove: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  onNavigate: () => void;
}

const ParentNavigationCard = React.forwardRef<HTMLDivElement, ParentNavigationCardProps>(({
  parentFolder,
  parentFolderId,
  handleFolderMove,
  onNavigate
}, ref) => {
  // useDrop hook - makes parent card accept folder drops
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FOLDER',
    drop: async (item: { id: string; source: string }) => {
      // Move to parent folder - use handleFolderMove for consistency
      await handleFolderMove(item.id, {
        parentId: parentFolderId,
        index: 0  // Drop at beginning
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [parentFolderId, handleFolderMove]);

  // Callback ref to handle both drop connection and ref forwarding
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    // Handle forwarded ref
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
    // Connect drop functionality
    drop(node);
  }, [ref, drop]);

  return (
    <div
      ref={setRefs}
      onClick={onNavigate}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        // Dashed border to indicate it's special
        "p-4 rounded-2xl",
        "bg-muted/30 border-2 border-dashed border-border",
        // Hover effects (lighter than regular folders)
        "hover:bg-muted/50",
        "hover:border-primary/50",
        "hover:-translate-y-1",
        "transition-all duration-200",
        // Drop target highlight
        isOver && "ring-2 ring-primary/40 bg-primary/10 border-primary/50",
        // Boxy layout matching other cards
        "flex flex-col justify-center aspect-[4/3]"
      )}
    >
      {/* Main content - vertical centered layout like macOS */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-4">
        {/* Parent folder icon with up arrow */}
        <div className="relative">
          <Folder className="w-16 h-16 text-muted-foreground/60 drop-shadow-lg" />
          {/* Up arrow overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-muted-foreground rotate-[-90deg]" />
          </div>
        </div>

        {/* Text content - centered below icon */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          {/* Parent label */}
          <h3 className="text-base font-semibold truncate w-full text-center px-2 text-muted-foreground">
            {parentFolder?.name || 'All Files'}
          </h3>

          {/* Helper text */}
          <div className="text-xs text-muted-foreground/70">
            <span>{isOver ? 'Drop to move here' : 'Go to parent'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const FileBrowser: React.FC = () => {
  const manager = PluginManager.getInstance();
  const stats = useDocumentStatistics();
  const { toast } = useToast();

  // Get DocumentsService
  const documentsService = manager.getService('core-documents/documentsService');

  // Local tree state for optimistic updates
  const [treeRefetchKey, setTreeRefetchKey] = useState(0);
  const fetchedTree = useUnifiedTree(treeRefetchKey);
  const [localTree, setLocalTree] = useState<typeof fetchedTree>(fetchedTree);

  // Tab system state (with localTree for instant navigation)
  const {
    tabs,
    activeTabId,
    activeTab,
    addGridTab,
    addDocumentTab,
    closeTab,
    switchTab,
    setTabDirty,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    openFileInCurrentTab,
    navigateToFolder
  } = useDocumentTabs(documentsService, localTree);

  // Sync local tree when fetched tree changes
  React.useEffect(() => {
    setLocalTree(fetchedTree);
  }, [fetchedTree]);

  // Get current folder from active tab
  const selectedFolderId = activeTab?.type === 'grid' ? activeTab.folderId : null;
  const filesInFolder = useFilesInFolder(selectedFolderId, treeRefetchKey);

  // Listen for document changes from any plugin (flashcards, future plugins, etc.)
  React.useEffect(() => {
    const eventBus = PluginManager.getInstance().getEventBus();

    const handleDocumentChange = () => {
      setTreeRefetchKey(prev => prev + 1);
    };

    // Subscribe to all document mutation events
    eventBus.on('document:created', handleDocumentChange);
    eventBus.on('document:updated', handleDocumentChange);
    eventBus.on('document:deleted', handleDocumentChange);
    eventBus.on('file:created', handleDocumentChange); // Backward compatibility

    return () => {
      eventBus.off('document:created', handleDocumentChange);
      eventBus.off('document:updated', handleDocumentChange);
      eventBus.off('document:deleted', handleDocumentChange);
      eventBus.off('file:created', handleDocumentChange);
    };
  }, []);

  // Extract child folders directly from localTree for instant optimistic updates
  const childFolders = React.useMemo(() => {
    const extractChildren = (nodes: any[], parentId: string | null): any[] => {
      if (parentId === null) {
        // Root level: return top-level folders (no parentId or parentId === null)
        return nodes.filter(n => n.type === 'folder' && (!n.parentId || n.parentId === null));
      }

      // Find the parent folder and return its children
      for (const node of nodes) {
        if (node.type === 'folder') {
          if (node.id === parentId) {
            // Found parent - return its folder children
            return node.children.filter((c: any) => c.type === 'folder');
          }
          // Recursively search in children
          const found = extractChildren(node.children, parentId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    const folders = extractChildren(localTree, selectedFolderId);
    return folders;  // Use array order directly, like the tree does
  }, [localTree, selectedFolderId]);

  // Calculate folder path from localTree (not from storage!) for instant updates
  const folderPath = React.useMemo(() => {
    if (!selectedFolderId) return null;

    const findPath = (nodes: any[], targetId: string, path: any[] = []): any[] | null => {
      for (const node of nodes) {
        if (node.type === 'folder') {
          if (node.id === targetId) {
            // Found target - return accumulated path including this node
            return [...path, node];
          }
          // Search in children
          if (node.children) {
            const found = findPath(node.children, targetId, [...path, node]);
            if (found) return found;
          }
        }
      }
      return null;
    };

    return findPath(localTree, selectedFolderId);
  }, [localTree, selectedFolderId]);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sorting state and hook
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { sortBy } = useSortBy();

  const folderCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Ref for parent navigation card (needs separate tracking as it's a different component)
  const parentNavCardRef = useRef<HTMLDivElement | null>(null);
  // Ref for grid container (needed for useGridLayoutManager)
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Container-level drop zone tracking
  const [currentDropZone, setCurrentDropZone] = useState<any>(null);

  // Grid layout manager for gap detection
  const { getDropZone } = useGridLayoutManager(folderCardRefs, gridContainerRef, childFolders);

  // Folder creation dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderPlaceholder, setFolderPlaceholder] = useState('New Folder');
  const [createFolderError, setCreateFolderError] = useState('');

  // Add File dropdown state
  const [showAddFileDropdown, setShowAddFileDropdown] = useState(false);
  const [fileTypeSearch, setFileTypeSearch] = useState('');

  // Get registered file handlers from plugins
  const registeredHandlers = useFileHandlers();

  // Convert file handlers to dropdown format
  const fileTypes = useMemo(() => {
    const types = registeredHandlers.map(handler => ({
      id: handler.id,
      name: handler.name,
      icon: handler.icon,
      description: `Create a new ${handler.name.toLowerCase()}`,
      favorited: false, // TODO: Load from user preferences
      disabled: false,
      pluginId: handler.pluginId
    }));

    // Add generic upload option (not a handler, but a UI action)
    types.push({
      id: 'upload',
      name: 'Upload File',
      icon: '📤',
      description: 'Upload a file from your device (coming soon)',
      favorited: false,
      disabled: true // Coming soon
    });

    return types;
  }, [registeredHandlers]);

  // Conflict resolution dialog state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    draggedId: string;
    draggedFolder: any;
    existingFolder: any;
    actualParentId: string | null;
    operation: { parentId: string | null; index: number };
  } | null>(null);

  // Rename dialog state (for conflict resolution)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');

  // Get primary color from theme for default folder color
  const defaultFolderColor = React.useMemo(() => {
    const primaryHsl = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    return primaryHsl || '221 83% 53%'; // Fallback to blue-500 HSL
  }, []);

  // Direct rename dialog state (from three-dot menu)
  const [directRenameDialogOpen, setDirectRenameDialogOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [directRenameValue, setDirectRenameValue] = useState('');
  const [directRenameError, setDirectRenameError] = useState('');

  // Delete options dialog state (from three-dot menu)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [folderHasContents, setFolderHasContents] = useState(false);

  // Change color dialog state (from three-dot menu)
  const [changeColorDialogOpen, setChangeColorDialogOpen] = useState(false);
  const [changeColorFolderId, setChangeColorFolderId] = useState<string | null>(null);
  const [changeColorValue, setChangeColorValue] = useState(defaultFolderColor);

  // Get color presets from theme variables (computed once)
  const colorPresets = React.useMemo(() => {
    const styles = getComputedStyle(document.documentElement);

    return [
      {
        name: 'Destructive',
        hsl: styles.getPropertyValue('--destructive').trim() || '0 72% 51%'
      },
      {
        name: 'Warning',
        hsl: styles.getPropertyValue('--chart-2').trim() || '25 95% 53%' // Orange
      },
      {
        name: 'Success',
        hsl: styles.getPropertyValue('--chart-4').trim() || '142 71% 45%' // Green
      },
      {
        name: 'Primary',
        hsl: styles.getPropertyValue('--primary').trim() || '221 83% 53%' // Blue
      },
      {
        name: 'Accent',
        hsl: styles.getPropertyValue('--accent-foreground').trim() || '271 81% 56%' // Purple
      },
      {
        name: 'Secondary',
        hsl: styles.getPropertyValue('--secondary-foreground').trim() || '240 5% 26%' // Gray
      },
    ];
  }, []);

  const [newFolderColor, setNewFolderColor] = useState(defaultFolderColor);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Get UI components from core-ui plugin
  const PageHeader = manager.getComponent('core-ui/PageHeader');
  const EmptyState = manager.getComponent('core-ui/EmptyState');
  const Card = manager.getComponent('core-ui/Card');
  const Dialog = manager.getComponent('core-ui/Dialog');
  const Button = manager.getComponent('core-ui/Button');
  const Popover = manager.getComponent('core-ui/Popover');
  const DropdownMenu = manager.getComponent('core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('core-ui/DropdownMenuItem');

  // Calculate placeholder preview when dialog opens
  React.useEffect(() => {
    if (createFolderOpen && documentsService) {
      // Calculate what the folder name would be if user leaves input empty
      generateUniqueFolderName(documentsService, selectedFolderId)
        .then(name => setFolderPlaceholder(name))
        .catch(err => {
          console.error('Failed to generate placeholder:', err);
          setFolderPlaceholder('New Folder');
        });
    }
  }, [createFolderOpen, selectedFolderId, documentsService, treeRefetchKey]);

  // Helper: Check if targetId is a descendant of sourceId
  const isDescendant = (sourceId: string, targetId: string, tree: typeof fetchedTree): boolean => {
    const findNode = (nodes: typeof fetchedTree, id: string): typeof fetchedTree[0] | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === 'folder') {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const checkChildren = (node: typeof fetchedTree[0]): boolean => {
      if (node.id === targetId) return true;
      if (node.type === 'folder') {
        return node.children.some(child => checkChildren(child));
      }
      return false;
    };

    const sourceNode = findNode(tree, sourceId);
    if (!sourceNode || sourceNode.type !== 'folder') return false;

    return checkChildren(sourceNode);
  };

  // Helper: Update tree structure optimistically after a move
  const updateTreeAfterMove = (
    tree: typeof fetchedTree,
    draggedId: string,
    newParentId: string | null,
    newIndex: number
  ): typeof fetchedTree => {
    let draggedNode: typeof fetchedTree[0] | null = null;

    // Step 1: Remove the dragged node from its current location (immutably)
    const removeNode = (nodes: typeof fetchedTree): typeof fetchedTree => {
      const result: typeof fetchedTree = [];

      for (const node of nodes) {
        if (node.id === draggedId) {
          // Found the node to remove - save it and skip it
          draggedNode = node;
          continue;
        }

        if (node.type === 'folder') {
          // Recursively remove from children
          const newChildren = removeNode(node.children);
          result.push({
            ...node,
            children: newChildren
          });
        } else {
          result.push(node);
        }
      }

      return result;
    };

    // Step 2: Insert the dragged node at the correct position
    const insertNode = (nodes: typeof fetchedTree, parentId: string | null, index: number): typeof fetchedTree => {
      if (!draggedNode) return nodes;

      if (parentId === null) {
        // Insert at root at the specified index
        const result = [...nodes];
        result.splice(index, 0, draggedNode);
        return result;
      }

      // Find the parent and insert as child at specified index
      return nodes.map(node => {
        if (node.type === 'folder') {
          if (node.id === parentId) {
            // Found the parent - insert at index
            const newChildren = [...node.children];
            newChildren.splice(index, 0, draggedNode);
            return {
              ...node,
              children: newChildren
            };
          } else {
            // Keep searching in children
            return {
              ...node,
              children: insertNode(node.children, parentId, index)
            };
          }
        }
        return node;
      });
    };

    const treeWithoutDragged = removeNode(tree);
    return insertNode(treeWithoutDragged, newParentId, newIndex);
  };

  // Handle folder move operations from tree
  const handleFolderMove = async (draggedId: string, operation: { parentId: string | null; index: number }) => {
    if (!documentsService) {
      throw new Error('DocumentsService not available');
    }

    // Translate virtual tree parentId to actual parentId
    // When moving to __ALL_FILES__ (virtual root), that means root level (null)
    const actualParentId = operation.parentId === '__ALL_FILES__' ? null : operation.parentId;

    // Don't allow moving __ALL_FILES__ itself
    if (draggedId === '__ALL_FILES__') {
      return;
    }

    // CHECK FOR DUPLICATE NAMES BEFORE OPTIMISTIC UPDATE
    // Get the dragged folder's name
    const draggedFolder = await documentsService.getFolder(draggedId);
    if (!draggedFolder) {
      console.error('Dragged folder not found:', draggedId);
      return;
    }

    // Get folders at the target location
    const targetFolders = await documentsService.listFolders(actualParentId);

    // Check if a folder with the same name already exists (case-insensitive)
    const conflict = targetFolders.find((f: any) =>
      f.id !== draggedId &&
      f.name.toLowerCase() === draggedFolder.name.toLowerCase()
    );

    if (conflict) {
      // Show conflict dialog - user must choose: Replace, Merge, or Rename
      setConflictDialogOpen(true);
      setConflictData({
        draggedId,
        draggedFolder,
        existingFolder: conflict,
        actualParentId,
        operation
      });
      return; // Don't proceed with move until user chooses an action
    }

    // No conflict - proceed with optimistic update
    setLocalTree(currentTree => updateTreeAfterMove(currentTree, draggedId, actualParentId, operation.index));

    // Persist to backend using the simple API
    try {
      const result = await documentsService.moveToPosition(draggedId, actualParentId, operation.index);

      if (!result?.success) {
        throw new Error(result?.error?.message || 'Move failed');
      }

      // ✅ No refetch needed - optimistic update is already correct!
      // Backend is synced, localTree matches reality
    } catch (error) {
      // Revert optimistic update on error
      setLocalTree(fetchedTree);
      throw error;
    }
  };

  // Helper: Merge two folders by moving all children from source to destination
  const mergeFolder = async (sourceFolderId: string, destinationFolderId: string) => {
    if (!documentsService) {
      throw new Error('DocumentsService not available');
    }

    // Get all children (folders and files) from source folder
    const childFolders = await documentsService.listFolders(sourceFolderId);
    const childFiles = await documentsService.getFiles(sourceFolderId);

    // Move all child folders to destination
    for (const folder of childFolders) {
      await documentsService.updateFolder(folder.id, { parentId: destinationFolderId });
    }

    // Move all child files to destination
    for (const file of childFiles) {
      await documentsService.updateDocument(file.id, { folderId: destinationFolderId });
    }

    // Delete the now-empty source folder
    await documentsService.deleteFolder(sourceFolderId);
  };

  // Handle conflict resolution: Replace, Merge, or Rename
  const handleConflictResolution = async (action: 'replace' | 'merge' | 'rename') => {
    if (!conflictData || !documentsService) return;

    const { draggedId, draggedFolder, existingFolder, actualParentId, operation } = conflictData;

    try {
      if (action === 'replace') {
        // REPLACE: Delete existing folder, then move dragged folder

        // Step 1: Remove existing folder from local tree (optimistic delete)
        setLocalTree(currentTree => {
          const removeFolder = (nodes: typeof currentTree): typeof currentTree => {
            return nodes.filter(node => {
              if (node.id === existingFolder.id) {
                return false; // Remove this node
              }
              if (node.type === 'folder') {
                return true; // Keep folders, but update their children
              }
              return true; // Keep files
            }).map(node => {
              if (node.type === 'folder') {
                return {
                  ...node,
                  children: removeFolder(node.children) // Recursively remove from children
                };
              }
              return node;
            });
          };
          return removeFolder(currentTree);
        });

        // Step 2: Delete from backend
        await documentsService.deleteFolder(existingFolder.id);

        // Step 3: Move dragged folder to new location
        setLocalTree(currentTree => updateTreeAfterMove(currentTree, draggedId, actualParentId, operation.index));
        const result = await documentsService.moveToPosition(draggedId, actualParentId, operation.index);

        if (!result?.success) {
          throw new Error(result?.error?.message || 'Move failed');
        }

        // Trigger tree refetch to sync with backend
        setTreeRefetchKey(prev => prev + 1);

        // Close dialog and clear conflict data
        setConflictDialogOpen(false);
        setConflictData(null);
      } else if (action === 'merge') {
        // MERGE: Move all children from dragged folder into existing folder, then delete dragged folder
        await mergeFolder(draggedId, existingFolder.id);

        // Trigger tree refetch to sync with backend
        setTreeRefetchKey(prev => prev + 1);

        // Close dialog and clear conflict data
        setConflictDialogOpen(false);
        setConflictData(null);
      } else if (action === 'rename') {
        // RENAME: Show rename dialog for user to choose new name
        setConflictDialogOpen(false); // Close conflict dialog
        setRenameValue(draggedFolder.name); // Pre-fill with current name
        setRenameError(''); // Clear any previous errors
        setRenameDialogOpen(true); // Open rename dialog
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      // Revert optimistic update on error
      setLocalTree(fetchedTree);
      // Re-throw to show error to user
      throw error;
    }
  };

  // Handle rename confirmation
  const handleRenameConfirm = async () => {
    if (!conflictData || !documentsService) return;

    const { draggedId, actualParentId, operation } = conflictData;
    const newName = renameValue.trim();

    if (!newName) {
      setRenameError('Folder name cannot be empty');
      return;
    }

    // Check if name is unique at target location
    const targetFolders = await documentsService.listFolders(actualParentId);
    const nameExists = targetFolders.some((f: any) =>
      f.id !== draggedId &&
      f.name.toLowerCase() === newName.toLowerCase()
    );

    if (nameExists) {
      setRenameError(`A folder named "${newName}" already exists here`);
      return;
    }

    try {
      // Update the folder's name first
      await documentsService.updateFolder(draggedId, { name: newName });

      // Now proceed with move (no conflict since name is unique)
      setLocalTree(currentTree => updateTreeAfterMove(currentTree, draggedId, actualParentId, operation.index));
      const result = await documentsService.moveToPosition(draggedId, actualParentId, operation.index);

      if (!result?.success) {
        throw new Error(result?.error?.message || 'Move failed');
      }

      // Trigger tree refetch to sync with backend
      setTreeRefetchKey(prev => prev + 1);

      // Close rename dialog and clear conflict data
      setRenameDialogOpen(false);
      setConflictData(null);
      setRenameValue('');
      setRenameError('');
    } catch (error) {
      console.error('Rename failed:', error);
      setRenameError('Failed to rename folder');
      // Revert optimistic update on error
      setLocalTree(fetchedTree);
    }
  };

  // Validate folder name in real-time during creation
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

  // Handle sorting
  const handleSort = async (mode: SortMode) => {
    setSortMode(mode);
    setShowSortDropdown(false);

    if (mode !== 'manual') {
      await sortBy(mode, selectedFolderId);
    }
  };

  // Close sort dropdown when clicking outside
  React.useEffect(() => {
    if (showSortDropdown) {
      const handleClickAway = () => setShowSortDropdown(false);
      document.addEventListener('click', handleClickAway);
      return () => document.removeEventListener('click', handleClickAway);
    }
  }, [showSortDropdown]);

  // Handle folder creation
  const handleCreateFolder = async (parentId?: string) => {
    if (!documentsService) return;

    // Use passed parentId or fall back to selectedFolderId
    const targetParentId = parentId ?? selectedFolderId;

    // Don't create if there's a validation error
    if (createFolderError) {
      return;
    }

    // Generate unique name if no name provided (quick creation)
    const folderName = newFolderName.trim()
      ? newFolderName.trim()
      : await generateUniqueFolderName(documentsService, targetParentId);

    const result = await documentsService.createFolder({
      name: folderName,
      parentId: targetParentId,
      color: hslToHex(newFolderColor), // Convert HSL to hex for storage
    });

    if (result.success) {
      // Trigger tree refetch to show new folder immediately
      setTreeRefetchKey(prev => prev + 1);
      setCreateFolderOpen(false);
      setNewFolderName('');
      setCreateFolderError('');
      setNewFolderColor(defaultFolderColor); // Reset to theme primary
    } else {
      console.error('Failed to create folder:', result.error);
      // TODO: Show error toast notification
    }
  };

  // Handle direct folder rename from three-dot menu
  const handleDirectRename = async (folderId: string) => {
    if (!documentsService) return;

    // Get folder data
    const folder = await documentsService.getFolder(folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    // Open rename dialog with current name
    setRenameFolderId(folderId);
    setDirectRenameValue(folder.name);
    setDirectRenameError('');
    setDirectRenameDialogOpen(true);
  };

  // Validate direct rename in real-time
  const handleDirectRenameChange = async (name: string) => {
    setDirectRenameValue(name);

    // Clear error if empty
    if (!name.trim()) {
      setDirectRenameError('Folder name cannot be empty');
      return;
    }

    // Check for duplicates in the same parent
    if (documentsService && renameFolderId) {
      const folder = await documentsService.getFolder(renameFolderId);
      if (folder) {
        const siblings = await documentsService.listFolders(folder.parentId);
        const duplicate = siblings.find(
          (f: any) => f.id !== renameFolderId && f.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (duplicate) {
          setDirectRenameError(`A folder named "${name.trim()}" already exists here`);
        } else {
          setDirectRenameError('');
        }
      }
    }
  };

  // Confirm direct rename
  const handleDirectRenameConfirm = async () => {
    if (!documentsService || !renameFolderId) return;

    const newName = directRenameValue.trim();

    if (!newName) {
      setDirectRenameError('Folder name cannot be empty');
      return;
    }

    if (directRenameError) {
      return; // Don't proceed if there's a validation error
    }

    try {
      await documentsService.updateFolder(renameFolderId, { name: newName });

      // Trigger tree refetch
      setTreeRefetchKey(prev => prev + 1);

      // Close dialog
      setDirectRenameDialogOpen(false);
      setRenameFolderId(null);
      setDirectRenameValue('');
      setDirectRenameError('');
    } catch (error) {
      console.error('Rename failed:', error);
      setDirectRenameError('Failed to rename folder');
    }
  };

  // Handle folder delete from three-dot menu
  const handleFolderDelete = async (folderId: string) => {
    if (!documentsService) return;

    // Check if folder has contents (child folders or files)
    const childFolders = await documentsService.listFolders(folderId);
    const childFiles = await documentsService.getFiles(folderId);
    const hasContents = childFolders.length > 0 || childFiles.length > 0;

    setDeleteFolderId(folderId);
    setDeleteConfirmed(false);
    setFolderHasContents(hasContents);
    setDeleteDialogOpen(true);
  };

  // Confirm folder delete
  const handleDeleteConfirm = async (deleteContents: boolean) => {
    if (!documentsService || !deleteFolderId) {
      console.error('[FileBrowser] handleDeleteConfirm: Missing service or folder ID', {
        hasService: !!documentsService,
        deleteFolderId
      });
      return;
    }

    console.log('[FileBrowser] Starting folder deletion:', {
      deleteFolderId,
      deleteContents,
      folderHasContents
    });

    try {
      // Get folder data before deleting (for parent navigation)
      const folderToDelete = await documentsService.getFolder(deleteFolderId);
      console.log('[FileBrowser] Folder to delete:', folderToDelete);

      if (deleteContents) {
        console.log('[FileBrowser] Calling deleteFolder (delete all contents)...');
        // Delete folder and all contents - MUST pass true to actually delete contents!
        await documentsService.deleteFolder(deleteFolderId, true);
        console.log('[FileBrowser] deleteFolder completed successfully');
      } else {
        console.log('[FileBrowser] Calling deleteFolderAndMoveContents...');
        // Move contents to parent and delete folder
        await documentsService.deleteFolderAndMoveContents(deleteFolderId);
        console.log('[FileBrowser] deleteFolderAndMoveContents completed successfully');
      }

      // AUTO-RECOVERY: If we're currently viewing the deleted folder, navigate to its parent
      if (selectedFolderId === deleteFolderId) {
        console.log('[FileBrowser] Navigating to parent after deleting current folder');
        setSelectedFolderId(folderToDelete?.parentId || null);
      }

      // Trigger tree refetch
      setTreeRefetchKey(prev => prev + 1);

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteFolderId(null);
      setDeleteConfirmed(false);
      setFolderHasContents(false);

      console.log('[FileBrowser] Folder deletion completed successfully');
    } catch (error) {
      console.error('[FileBrowser] Delete failed with error:', error);
      console.error('[FileBrowser] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // TODO: Show error toast to user
      alert(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle folder color change from three-dot menu
  const handleChangeColor = async (folderId: string) => {
    if (!documentsService) return;

    // Get folder data
    const folder = await documentsService.getFolder(folderId);
    if (!folder) {
      console.error('Folder not found:', folderId);
      return;
    }

    // Open color picker with current color
    setChangeColorFolderId(folderId);
    setChangeColorValue(folder.color || defaultFolderColor);
    setChangeColorDialogOpen(true);
  };

  // Confirm color change
  const handleChangeColorConfirm = async () => {
    if (!documentsService || !changeColorFolderId) return;

    try {
      await documentsService.updateFolder(changeColorFolderId, {
        color: hslToHex(changeColorValue)
      });

      // Trigger tree refetch
      setTreeRefetchKey(prev => prev + 1);

      // Close dialog
      setChangeColorDialogOpen(false);
      setChangeColorFolderId(null);
      setChangeColorValue(defaultFolderColor);
    } catch (error) {
      console.error('Color change failed:', error);
      // TODO: Show error toast
    }
  };

  // Build breadcrumb trail
  const breadcrumbs = ['All Documents', ...(folderPath || []).map(f => f.name)];

  // Calculate parent info with better null handling for parent navigation card
  const parentInfo = React.useMemo(() => {
    if (!selectedFolderId) return null; // Viewing root, no parent
    if (!folderPath || folderPath.length === 0) return null; // No path data yet

    // If we have a folderPath with at least 1 item, we can show parent navigation
    // - For top-level folders: parent is "All Files" (null)
    // - For nested folders: parent is the folder one level up
    return {
      id: folderPath.length > 1 ? folderPath[folderPath.length - 2]?.id : null,
      folder: folderPath.length > 1 ? folderPath[folderPath.length - 2] : null
    };
  }, [selectedFolderId, folderPath]);

  // Create virtual tree with "All Files" as root node
  const virtualTree = React.useMemo(() => {
    return [{
      id: '__ALL_FILES__',
      type: 'folder' as const,
      name: 'All Files',
      children: localTree,
      color: 'hsl(var(--primary))',
      order: 0
    }];
  }, [localTree]);
  /**
   * Handle drop reorder based on per-item drop indicator
   * Called from FolderCard drop callback with position (left/right/highlight)
   */
  const handleDropReorder = useCallback(async (
    draggedId: string,
    targetId: string,
    position: 'left' | 'right' | 'highlight'
  ) => {
    if (position === 'highlight') {
      // Drop INTO target folder (move to different parent)
      await handleFolderMove(draggedId, {
        parentId: targetId,  // Target folder becomes new parent
        index: 0  // Insert at start of target folder
      });
      return;
    }

    // Insert NEXT TO target folder (reorder within same parent)
    const folders = childFolders;
    const draggedIndex = folders.findIndex(f => f.id === draggedId);
    const targetIndex = folders.findIndex(f => f.id === targetId);

    if (draggedIndex === -1) {
      console.error('Dragged folder not found:', draggedId);
      return;
    }

    if (targetIndex === -1) {
      console.error('Target folder not found:', targetId);
      return;
    }

    // Calculate new index accounting for removal of dragged item
    // updateTreeAfterMove removes the dragged item first, which shifts all subsequent indices
    let newIndex: number;

    if (position === 'left') {
      // Insert BEFORE target
      if (draggedIndex < targetIndex) {
        // Left-to-right: target shifts left by 1 after removal
        newIndex = targetIndex - 1;
      } else {
        // Right-to-left: target position unchanged
        newIndex = targetIndex;
      }
    } else {
      // Insert AFTER target (position === 'right')
      if (draggedIndex < targetIndex) {
        // Left-to-right: target shifts left by 1 after removal
        newIndex = targetIndex;
      } else {
        // Right-to-left: target position unchanged, +1 to insert after
        newIndex = targetIndex + 1;
      }
    }

    // Optimistic update
    const prevTree = [...localTree];
    const updatedTree = updateTreeAfterMove(prevTree, draggedId, selectedFolderId, newIndex);
    setLocalTree(updatedTree);

    // Persist to backend
    try {
      const result = await documentsService.moveToPosition(draggedId, selectedFolderId, newIndex);
      if (!result.success) {
        // Revert on failure
        setLocalTree(prevTree);
        toast({ title: "Move failed", description: result.error?.message, variant: "destructive" });
      } else {
        toast({ title: "Folder reordered" });
        // ✅ No refetch needed - optimistic update is already correct!
      }
    } catch (error) {
      // Revert on error
      setLocalTree(prevTree);
      toast({ title: "Move failed", description: "An error occurred", variant: "destructive" });
    }
  }, [childFolders, localTree, selectedFolderId, updateTreeAfterMove, documentsService, toast, handleFolderMove]);

  /**
   * Simplified gap detection using horizontal middle-point per folder
   * Returns dropState for visual feedback (cursor or highlighted folder)
   */

  // Container-level drop zone for gap detection
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FOLDER',
    hover: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        setCurrentDropZone(null);
        return;
      }

      const dropZone = getDropZone(clientOffset);
      setCurrentDropZone(dropZone);
    },
    drop: async (item: any, monitor) => {
      if (!currentDropZone) return;

      const draggedId = item.id;

      if (currentDropZone.type === 'folder-center') {
        // Drop INTO folder - use handleFolderMove for consistency
        await handleFolderMove(draggedId, {
          parentId: currentDropZone.folderId,
          index: 0  // Insert at start of target folder
        });
      } else if (currentDropZone.type === 'gap-left') {
        // Insert BEFORE folder (sibling reordering)
        await handleDropReorder(draggedId, currentDropZone.folderId, 'left');
      } else if (currentDropZone.type === 'gap-right') {
        // Insert AFTER folder (sibling reordering)
        await handleDropReorder(draggedId, currentDropZone.folderId, 'right');
      }

      setCurrentDropZone(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [getDropZone, currentDropZone, handleDropReorder, handleFolderMove]);

  // Combine gridContainerRef with drop
  const setGridRefs = useCallback((node: HTMLDivElement | null) => {
    gridContainerRef.current = node;
    drop(node);
  }, [drop]);

  return (
    <div className="file-browser h-full flex">
      {/* Left Sidebar - OUTSIDE tabs, always visible */}
      <div
        className={`border-r bg-background/50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'min-w-64 max-w-96 w-auto'
        }`}
      >
        {sidebarCollapsed ? (
          /* Collapsed thin bar */
          <div className="flex flex-col items-center p-2">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Show folders"
            >
              <PanelLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <FolderTree
            tree={virtualTree}
            selectedFolderId={selectedFolderId}
            onFolderSelect={navigateToFolder}
            onCollapseSidebar={() => setSidebarCollapsed(true)}
            onMove={handleFolderMove}
            onCreate={(parentId) => {
              if (parentId) {
                navigateToFolder(parentId); // Select parent folder
              }
              setCreateFolderOpen(true);     // Open create dialog
            }}
            onDelete={handleFolderDelete}
            onRename={handleDirectRename}
            onChangeColor={handleChangeColor}
          />
        )}
      </div>

      {/* Right Area - INSIDE tabs */}
      <div className="flex-1 flex flex-col">
        {/* TabBar - shows tabs */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={switchTab}
          onTabClose={closeTab}
          onNewTab={() => addGridTab(null)}
        />

        {/* Breadcrumb Navigation - Always visible with visual prominence + drop targets */}
        {activeTab && (
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border/50 mx-4 mt-2">
            {/* Back/Forward Navigation Buttons */}
            <div className="flex items-center gap-1 mr-2 border-r border-border/50 pr-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goBack(activeTab.id)}
                disabled={!canGoBack(activeTab.id)}
                className="h-7 w-7 p-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goForward(activeTab.id)}
                disabled={!canGoForward(activeTab.id)}
                className="h-7 w-7 p-0"
                title="Go Forward"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <BreadcrumbFolder
              folder={null}
              isActive={
                activeTab.type === 'grid'
                  ? activeTab.folderId === null
                  : activeTab.breadcrumb.length === 1 // For document tabs, root = only 1 breadcrumb item
              }
              onClick={() => navigateToFolder(null)}
              onDrop={async (draggedId, source) => {
                // Move to root (All Files) - use handleFolderMove for consistency
                console.log(`[Breadcrumb] Moving ${draggedId} to root`);
                await handleFolderMove(draggedId, {
                  parentId: null,
                  index: 0  // Drop at beginning
                });
              }}
            />
            {/* For grid tabs, use folderPath from tree. For document tabs, use tab.breadcrumb (skip root since we already show it) */}
            {activeTab.type === 'grid' && folderPath && folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <BreadcrumbFolder
                  folder={folder}
                  isActive={index === folderPath.length - 1}
                  onClick={() => navigateToFolder(folder.id)}
                  onDrop={async (draggedId, source) => {
                    // Move to this breadcrumb folder - use handleFolderMove for consistency
                    console.log(`[Breadcrumb] Moving ${draggedId} to ${folder.name}`);
                    await handleFolderMove(draggedId, {
                      parentId: folder.id,
                      index: 0  // Drop at beginning
                    });
                  }}
                />
              </React.Fragment>
            ))}
            {/* For document tabs, show breadcrumb from tab.breadcrumb (skip first item since it's root) */}
            {activeTab.type === 'document' && activeTab.breadcrumb.slice(1).map((item, index) => (
              <React.Fragment key={item.id}>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <BreadcrumbFolder
                  folder={{ id: item.folderId || '', name: item.name, parentId: null, color: null, order: 0, createdAt: 0, updatedAt: 0 }}
                  isActive={false} // Folders are not active, only the file is
                  onClick={() => item.folderId && navigateToFolder(item.folderId)}
                  onDrop={async (draggedId, source) => {
                    // For document tabs, don't allow dropping on breadcrumbs
                    console.log('[Breadcrumb] Drop not supported in document view');
                  }}
                />
              </React.Fragment>
            ))}
            {/* Show the file name as the last breadcrumb item (active/underlined) */}
            {activeTab.type === 'document' && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <button
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary border-b-2 border-primary hover:bg-primary/20 transition-colors"
                >
                  {activeTab.title}
                </button>
              </>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab && activeTab.type === 'grid' ? (
        // Grid View - existing FileBrowser content
        <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
          {/* Page Header */}
          {PageHeader && Button && (
            <PageHeader
              title="Documents"
              description="Organize and manage your documents"
              actions={
            <>
              {/* Sort Dropdown */}
              <div className="relative">
                <Button
                  variant="3d-outline"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort: {sortMode === 'manual' ? 'Manual' : sortMode === 'name' ? 'Name' : sortMode === 'date' ? 'Date' : 'Size'}
                </Button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-background shadow-lg z-50">
                    <div className="p-1">
                      {(['manual', 'name', 'date', 'size'] as SortMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleSort(mode)}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${
                            sortMode === mode ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          {mode === 'manual' ? 'Manual Order' : mode === 'name' ? 'Sort by Name' : mode === 'date' ? 'Sort by Date' : 'Sort by Size'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="3d-outline"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <div className="relative">
                <Button
                  variant="3d-primary"
                  onClick={() => setShowAddFileDropdown(!showAddFileDropdown)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add File
                </Button>
                {showAddFileDropdown && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-background shadow-lg z-50">
                    <div className="p-2">
                      {/* Search input */}
                      <input
                        type="text"
                        placeholder="Search file types..."
                        value={fileTypeSearch}
                        onChange={(e) => setFileTypeSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-background mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      {/* File type options */}
                      <div className="space-y-1">
                        {fileTypes
                          .filter(type =>
                            type.name.toLowerCase().includes(fileTypeSearch.toLowerCase()) ||
                            type.description.toLowerCase().includes(fileTypeSearch.toLowerCase())
                          )
                          .map((type) => (
                            <button
                              key={type.id}
                              onClick={() => {
                                if (!type.disabled) {
                                  setShowAddFileDropdown(false);
                                  setFileTypeSearch('');

                                  // If this is a registered handler, emit event for plugin to handle
                                  if ('pluginId' in type) {
                                    const eventBus = PluginManager.getInstance().getEventBus();
                                    eventBus.emit('file:create-requested', {
                                      handlerId: type.id,
                                      pluginId: type.pluginId,
                                      folderId: selectedFolderId
                                    });

                                    toast({
                                      title: `Creating ${type.name}`,
                                      description: 'File creation in progress...'
                                    });
                                  } else {
                                    // Generic upload action (not a handler)
                                    console.log('Upload action requested');
                                    toast({
                                      title: `Creating ${type.name}`,
                                      description: 'File creation coming soon'
                                    });
                                  }
                                }
                              }}
                              disabled={type.disabled}
                              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                                type.disabled
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-accent cursor-pointer'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-2xl flex-shrink-0">{type.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{type.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          }
        />
      )}

      {/* Create Folder Dialog */}
      {Dialog && (
        <Dialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          title="Create New Folder"
          description="Organize your documents with folders"
          showConfirm
          showCancel
          confirmText="Create Folder"
          onConfirm={handleCreateFolder}
          onCancel={() => {
            setCreateFolderOpen(false);
            setNewFolderName('');
            setCreateFolderError('');
            setNewFolderColor(defaultFolderColor); // Reset to theme primary
            setShowColorPicker(false); // Close color picker popover
          }}
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
      )}

      {/* Conflict Resolution Dialog */}
      {Dialog && conflictData && (
        <Dialog
          open={conflictDialogOpen}
          onOpenChange={(open) => {
            setConflictDialogOpen(open);
            if (!open) {
              setConflictData(null);
            }
          }}
          title="Folder Name Conflict"
          description={`A folder named "${conflictData.existingFolder.name}" already exists in this location.`}
          showConfirm={false}
          showCancel={false}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">
                Choose how to handle the folder "{conflictData.draggedFolder.name}":
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {Button && (
                <>
                  {/* Replace Button */}
                  <Button
                    variant="3d-outline"
                    onClick={() => handleConflictResolution('replace')}
                    className="justify-start text-left py-4 h-auto"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-base">Replace</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Delete the existing folder and move the new one
                      </div>
                    </div>
                  </Button>

                  {/* Merge Button */}
                  <Button
                    variant="3d-primary"
                    onClick={() => handleConflictResolution('merge')}
                    className="justify-start text-left py-4 h-auto"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-base">Merge</div>
                      <div className="text-xs opacity-90 leading-relaxed">
                        Combine contents from both folders
                      </div>
                    </div>
                  </Button>

                  {/* Rename Button */}
                  <Button
                    variant="3d-outline"
                    onClick={() => handleConflictResolution('rename')}
                    className="justify-start text-left py-4 h-auto"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-semibold text-base">Rename</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Choose a new name for the folder
                      </div>
                    </div>
                  </Button>

                  {/* Cancel Button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConflictDialogOpen(false);
                      setConflictData(null);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Rename Dialog (for conflict resolution) */}
      {Dialog && conflictData && (
        <Dialog
          open={renameDialogOpen}
          onOpenChange={(open) => {
            setRenameDialogOpen(open);
            if (!open) {
              setRenameValue('');
              setRenameError('');
            }
          }}
          title="Rename Folder"
          description="Enter a new name for the folder"
          showConfirm
          showCancel
          confirmText="Rename and Move"
          onConfirm={handleRenameConfirm}
          onCancel={() => {
            setRenameDialogOpen(false);
            setRenameValue('');
            setRenameError('');
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">New Folder Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
              {renameError && (
                <p className="text-sm text-destructive">{renameError}</p>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Direct Rename Dialog (from three-dot menu) */}
      {Dialog && (
        <Dialog
          open={directRenameDialogOpen}
          onOpenChange={(open) => {
            setDirectRenameDialogOpen(open);
            if (!open) {
              setRenameFolderId(null);
              setDirectRenameValue('');
              setDirectRenameError('');
            }
          }}
          title="Rename Folder"
          description="Choose a new name for this folder"
          showConfirm
          showCancel
          confirmText="Rename"
          onConfirm={handleDirectRenameConfirm}
          onCancel={() => {
            setDirectRenameDialogOpen(false);
            setRenameFolderId(null);
            setDirectRenameValue('');
            setDirectRenameError('');
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direct-rename-input">Folder Name</Label>
              <Input
                id="direct-rename-input"
                value={directRenameValue}
                onChange={(e) => handleDirectRenameChange(e.target.value)}
                placeholder="Enter folder name"
                autoFocus
              />
              {directRenameError && (
                <p className="text-sm text-destructive">{directRenameError}</p>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Delete Options Dialog (from three-dot menu) */}
      {Dialog && Button && (
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteFolderId(null);
              setDeleteConfirmed(false);
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
                        console.log('[FileBrowser] Delete All Contents button clicked', {
                          deleteConfirmed,
                          deleteFolderId,
                          folderHasContents
                        });
                        if (deleteConfirmed) {
                          console.log('[FileBrowser] Confirmed - calling handleDeleteConfirm(true)');
                          handleDeleteConfirm(true);
                        } else {
                          console.warn('[FileBrowser] Button clicked but deleteConfirmed is false (should not happen - button should be disabled)');
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
                          console.log('[FileBrowser] Confirmation checkbox changed:', e.target.checked);
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
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeleteFolderId(null);
                  setDeleteConfirmed(false);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Change Color Dialog (from three-dot menu) */}
      {Dialog && Popover && (
        <Dialog
          open={changeColorDialogOpen}
          onOpenChange={(open) => {
            setChangeColorDialogOpen(open);
            if (!open) {
              setChangeColorFolderId(null);
              setChangeColorValue(defaultFolderColor);
            }
          }}
          title="Change Folder Color"
          description="Choose a new color for this folder"
          showConfirm
          showCancel
          confirmText="Change Color"
          onConfirm={handleChangeColorConfirm}
          onCancel={() => {
            setChangeColorDialogOpen(false);
            setChangeColorFolderId(null);
            setChangeColorValue(defaultFolderColor);
          }}
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
      )}

      {/* Grid Content Area */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        {/* Always show grid layout when inside a folder (to show parent nav card) */}
        {/* For root level with no content, show empty state */}
        {!selectedFolderId && childFolders.length === 0 && filesInFolder.length === 0 ? (
            EmptyState ? (
              <EmptyState
                icon={FileText}
                title="No content yet"
                description="Start by creating folders or uploading files"
              >
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p><strong>Workspace Statistics:</strong></p>
                  <ul className="list-disc list-inside">
                    <li>Files: {stats.totalFiles}</li>
                    <li>Folders: {stats.totalFolders}</li>
                    <li>Total Size: {(stats.totalSize / 1024).toFixed(2)} KB</li>
                  </ul>
                </div>
              </EmptyState>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No content yet</p>
              </div>
            )
          ) : (
            <div
              ref={setGridRefs}
              className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 min-h-[200px]"
            >
              {/* Drop indicator (floating above grid) */}
              <DropIndicator currentDropZone={currentDropZone} />
              {/* Parent folder navigation card - shown when inside a folder with a parent */}
              {/* Uses parentInfo instead of direct folderPath to avoid null reference errors during state transitions */}
              {parentInfo && (
                <ParentNavigationCard
                  ref={parentNavCardRef}
                  parentFolder={parentInfo.folder}
                  parentFolderId={parentInfo.id}
                  handleFolderMove={handleFolderMove}
                  onNavigate={() => {
                    navigateToFolder(parentInfo.id);
                  }}
                />
              )}

              {/* Folders */}
              {childFolders.map((folder, index) => (
                <FolderCard
                  key={folder.id}
                    ref={(el: HTMLDivElement | null) => {
                      if (el) {
                        folderCardRefs.current.set(folder.id, el);
                      } else {
                        folderCardRefs.current.delete(folder.id);
                      }
                    }}
                    folder={folder}
                    folders={localTree}
                    setFolders={setLocalTree}
                    updateTreeAfterMove={updateTreeAfterMove}
                    documentsService={documentsService}
                    toast={toast}
                    onFolderSelect={navigateToFolder}
                    onRename={handleDirectRename}
                    onChangeColor={handleChangeColor}
                    onDelete={handleFolderDelete}
                    isDescendant={(sourceId, targetId) => isDescendant(sourceId, targetId, localTree)}
                    setTreeRefetchKey={setTreeRefetchKey}
                  />
              ))}

              {/* Files */}
              {filesInFolder.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => openFileInCurrentTab(file)}
                />
              ))}

              {/* Empty folder message - shown after parent nav card */}
              {selectedFolderId && childFolders.length === 0 && filesInFolder.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    This folder is empty. Create subfolders or upload files to get started.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  ) : activeTab ? (
        // Document/Component View - plugin content embedded
        <DocumentViewerContext.Provider
          value={{
            isEmbedded: true,
            openInNewTab: async (route: string) => {
              // Parse route to extract fileId
              // This is a simplification - in production, you'd parse the route properly
              const fileId = route.split('/').pop();
              if (fileId) {
                const file = await documentsService.getDocument(fileId);
                if (file) {
                  const handler = documentsService.getHandlerForFile(file);
                  if (handler) {
                    await addDocumentTab(file, handler);
                  }
                }
              }
            },
            closeTab: () => closeTab(activeTabId),
            setTabDirty: (isDirty: boolean) => setTabDirty(activeTabId, isDirty),
            navigateInTab: (item) => navigateInTab(activeTabId, item)
          }}
        >
          <div className="document-viewer flex-1 overflow-auto">
            {/* Render current history entry */}
            {(() => {
              const currentHistory = activeTab.history[activeTab.historyIndex];

              // DEBUG: Log state to understand why tab is blank
              console.log('[FileBrowser] Document viewer rendering:', {
                activeTabType: activeTab.type,
                activeTabId: activeTab.id,
                activeTabFileId: activeTab.fileId,
                handler: activeTab.handler,
                handlerViewerComponent: activeTab.handler?.viewerComponent,
                historyIndex: activeTab.historyIndex,
                historyLength: activeTab.history.length,
                currentHistory,
                currentHistoryType: currentHistory?.type,
                conditionCheck: {
                  currentHistoryTypeIsDocument: currentHistory?.type === 'document',
                  activeTabTypeIsDocument: activeTab.type === 'document',
                  bothTrue: currentHistory?.type === 'document' && activeTab.type === 'document'
                }
              });

              if (currentHistory.type === 'component') {
                // Render component from history
                const ComponentToRender = manager.getComponent(currentHistory.component || '');

                if (!ComponentToRender) {
                  return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <p className="text-lg font-medium">Component not found</p>
                        <p className="text-sm">Component '{currentHistory.component}' is not registered</p>
                      </div>
                    </div>
                  );
                }

                return <ComponentToRender {...(currentHistory.componentProps || {})} />;
              } else if (currentHistory.type === 'document' && activeTab.type === 'document') {
                // Render file viewer component
                const ViewerComponent = manager.getComponent(activeTab.handler.viewerComponent || '');

                if (!ViewerComponent) {
                  return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <p className="text-lg font-medium">Viewer not found</p>
                        <p className="text-sm">Component '{activeTab.handler.viewerComponent}' is not registered</p>
                      </div>
                    </div>
                  );
                }

                // Render the plugin's viewer component with fileId prop
                return <ViewerComponent fileId={activeTab.fileId} />;
              }

              // DEBUG: This is why the tab is blank
              console.error('[FileBrowser] Returning null - no matching render condition!', {
                currentHistoryType: currentHistory?.type,
                activeTabType: activeTab.type,
                reason: 'Neither component nor document condition matched'
              });

              return null;
            })()}
          </div>
        </DocumentViewerContext.Provider>
      ) : null}
    </div>
  </div>
  );
};

export default FileBrowser;
