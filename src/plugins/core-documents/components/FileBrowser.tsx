/**
 * FileBrowser - Main document management interface
 *
 * Features:
 * - Hierarchical folder navigation (left sidebar)
 * - File list with drag-and-drop support
 * - File upload and management
 */

import React, { useState } from 'react';
import { FileText, FolderPlus, Upload, Folder, ChevronRight, PanelLeftClose, PanelLeft, ArrowUpDown, MoreVertical, Edit2, Palette, Trash2 } from 'lucide-react';
import { HslColorPicker } from 'react-colorful';
import { PluginManager } from '@/shared/plugin-system';
import { useDocumentStatistics, useUnifiedTree, useFilesInFolder, useChildFolders, useFolderPath, useSortBy } from '../hooks/useDocuments';
import { FolderTree } from './FolderTree';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { cn } from '@/shared/lib/utils';
import type { SortMode } from '../types';

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

export const FileBrowser: React.FC = () => {
  const manager = PluginManager.getInstance();
  const stats = useDocumentStatistics();

  // Local tree state for optimistic updates
  const [treeRefetchKey, setTreeRefetchKey] = useState(0);
  const fetchedTree = useUnifiedTree(treeRefetchKey);
  const [localTree, setLocalTree] = useState<typeof fetchedTree>(fetchedTree);

  // Sync local tree when fetched tree changes
  React.useEffect(() => {
    setLocalTree(fetchedTree);
  }, [fetchedTree]);

  // Selected folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const filesInFolder = useFilesInFolder(selectedFolderId, treeRefetchKey);
  const childFoldersUnsorted = useChildFolders(selectedFolderId, treeRefetchKey);

  // Sort folders by order property
  const childFolders = React.useMemo(
    () => [...childFoldersUnsorted].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [childFoldersUnsorted]
  );

  const folderPath = useFolderPath(selectedFolderId, treeRefetchKey);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sorting state and hook
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { sortBy } = useSortBy();

  // Folder creation dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderPlaceholder, setFolderPlaceholder] = useState('New Folder');
  const [createFolderError, setCreateFolderError] = useState('');

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

  // Get DocumentsService for operations
  const documentsService = manager.getService('core-documents/documentsService');

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

      // Trigger tree refetch to sync with backend
      setTreeRefetchKey(prev => prev + 1);
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
  const breadcrumbs = ['All Documents', ...folderPath.map(f => f.name)];

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

  return (
    <div className="file-browser h-full flex flex-col p-8 space-y-6">
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
              <Button variant="3d-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </>
          }
        />
      )}

      {/* Breadcrumb Navigation - Always visible with visual prominence */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={cn(
            "text-sm font-medium transition-colors",
            selectedFolderId === null
              ? "text-foreground underline underline-offset-4"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All Files
        </button>
        {folderPath && folderPath.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            <button
              onClick={() => setSelectedFolderId(folder.id)}
              className={cn(
                "text-sm font-medium transition-colors",
                index === folderPath.length - 1
                  ? "text-foreground underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

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

      {/* Main Content: Sidebar + File Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Folder Tree */}
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
              onFolderSelect={setSelectedFolderId}
              onCollapseSidebar={() => setSidebarCollapsed(true)}
              onMove={handleFolderMove}
              onCreate={(parentId) => {
                if (parentId) {
                  setSelectedFolderId(parentId); // Select parent folder
                }
                setCreateFolderOpen(true);     // Open create dialog
              }}
              onDelete={handleFolderDelete}
              onRename={handleDirectRename}
              onChangeColor={handleChangeColor}
            />
          )}
        </div>

        {/* Right Area: Folders + Files */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          {childFolders.length === 0 && filesInFolder.length === 0 ? (
            EmptyState ? (
              <EmptyState
                icon={FileText}
                title={selectedFolderId ? "Empty folder" : "No content yet"}
                description={
                  selectedFolderId
                    ? "Create subfolders or upload files to organize your content"
                    : "Start by creating folders or uploading files"
                }
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
                <p className="text-muted-foreground">
                  {selectedFolderId ? "Empty folder" : "No content yet"}
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg font-medium">Main view cleared</p>
              <p className="text-sm text-muted-foreground mt-2">Ready for fresh drag-and-drop implementation</p>
              <div className="mt-6 text-xs text-muted-foreground/70">
                <p>Files: {filesInFolder.length}</p>
                <p>Folders: {childFolders.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;
