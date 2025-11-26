/**
 * FileBrowser - Main document management interface
 *
 * Features:
 * - Hierarchical folder navigation (left sidebar)
 * - File list with drag-and-drop support
 * - File upload and management
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { PluginManager } from '@/shared/plugin-system';
import { useDocumentStatistics, useUnifiedTree, useFilesInFolder, useChildFolders, useFolderPath, useSortBy, useFileHandlers } from '../hooks/useDocuments';
import { useDocumentTabs } from '../hooks/useDocumentTabs';
import { useGridLayoutManager } from '../hooks/useGridLayoutManager';
import { Sidebar } from './Sidebar';
import { DocumentViewContent } from './DocumentViewContent';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { TabBar } from './TabBar';
import { GridView } from './grid/GridView';
import {
  CreateFolderDialog,
  RenameFolderDialog,
  DeleteFolderDialog,
  ChangeFolderColorDialog,
  RenameFileDialog,
  DeleteFileDialog,
  FileSettingsDialog
} from './dialogs';
import { getFileDisplayName } from './FileDisplay';
import { hslToHex } from '../utils/colorUtils';
import { useToast } from '@/renderer/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import type { SortMode, StoredFile } from '../types';

// Helper function for generating unique folder names
const generateUniqueFolderName = async (
  documentsService: any,
  parentId: string | null
): Promise<string> => {
  const folders = await documentsService.listFolders(parentId);
  const baseName = 'New Folder';

  const baseExists = folders.some(
    (f: any) => f.name.toLowerCase() === baseName.toLowerCase()
  );

  if (!baseExists) {
    return baseName;
  }

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

// ============ FileBrowser Component ============
export const FileBrowser: React.FC = () => {
  const manager = PluginManager.getInstance();
  const stats = useDocumentStatistics();
  const { toast } = useToast();

  // Get DocumentsService
  const documentsService = manager.getService('chaycards/core-documents/documentsService');

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
    navigateInTab,
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
        // Root level: folders at top-level array ARE root folders
        // Trust array position as source of truth (don't check parentId property)
        return nodes.filter(n => n.type === 'folder');
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

  // File operation dialog states
  const [fileRenameDialogOpen, setFileRenameDialogOpen] = useState(false);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);

  const [fileDeleteDialogOpen, setFileDeleteDialogOpen] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const [fileSettingsDialogOpen, setFileSettingsDialogOpen] = useState(false);
  const [settingsFile, setSettingsFile] = useState<any | null>(null);

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
  const PageHeader = manager.getComponent('chaycards/core-ui/PageHeader');
  const EmptyState = manager.getComponent('chaycards/core-ui/EmptyState');
  const Card = manager.getComponent('chaycards/core-ui/Card');
  const Dialog = manager.getComponent('chaycards/core-ui/Dialog');
  const Button = manager.getComponent('chaycards/core-ui/Button');
  const Popover = manager.getComponent('chaycards/core-ui/Popover');
  const DropdownMenu = manager.getComponent('chaycards/core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('chaycards/core-ui/DropdownMenuItem');

  // Early return if components aren't loaded yet
  if (!PageHeader || !EmptyState || !Card || !Dialog || !Button || !Popover || !DropdownMenu || !DropdownMenuItem) {
    return <div>Loading UI components...</div>;
  }

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

    // CHECK FOR DUPLICATE NAMES USING localTree (synchronous, instant)
    // Helper: Find node in tree
    const findNode = (nodes: typeof localTree, id: string): typeof localTree[0] | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.type === 'folder') {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    // Get the dragged folder from localTree
    const draggedFolder = findNode(localTree, draggedId);
    if (!draggedFolder || draggedFolder.type !== 'folder') {
      console.error('Dragged folder not found in localTree:', draggedId);
      return;
    }

    // Helper: Get folders at target location from localTree
    const getTargetFolders = (tree: typeof localTree, parentId: string | null): typeof localTree => {
      if (parentId === null) {
        // Root level - return all root folders
        return tree.filter(n => n.type === 'folder');
      }
      // Find parent and return its folder children
      const parent = findNode(tree, parentId);
      if (!parent || parent.type !== 'folder') return [];
      return parent.children.filter(c => c.type === 'folder');
    };

    const targetFolders = getTargetFolders(localTree, actualParentId);

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

    // No conflict - proceed with IMMEDIATE optimistic update
    setLocalTree(currentTree => updateTreeAfterMove(currentTree, draggedId, actualParentId, operation.index));

    // Persist to backend AFTER UI update (for instant feedback)
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
        navigateToFolder(folderToDelete?.parentId || null);
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

  // Handle file rename
  const handleFileRename = (fileId: string) => {
    setRenameFileId(fileId);
    setFileRenameDialogOpen(true);
  };

  // Handle file delete
  const handleFileDelete = (fileId: string) => {
    setDeleteFileId(fileId);
    setFileDeleteDialogOpen(true);
  };

  // Handle file settings
  const handleFileSettings = (file: any) => {
    const handler = documentsService?.getHandlerForFile(file);
    if (!handler?.settingsComponent) {
      toast({
        title: 'No settings available',
        description: 'This file type has no configurable settings.',
      });
      return;
    }
    setSettingsFile(file);
    setFileSettingsDialogOpen(true);
  };

  // Handle open file in new tab
  const handleFileOpenInTab = async (file: any) => {
    // Use existing addDocumentTab logic from useDocumentTabs
    const handler = documentsService?.getHandlerForFile(file);
    if (!handler) {
      toast({
        title: 'Cannot open file',
        description: `No viewer registered for ${file.extension} files`,
      });
      return;
    }

    // Check if already open
    const existingTab = tabs.find(t => t.type === 'document' && t.fileId === file.id);
    if (existingTab) {
      switchTab(existingTab.id);
      return;
    }

    // Add new document tab
    await addDocumentTab(file, handler);
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
        // Prevent dropping folder onto itself
        if (draggedId === currentDropZone.folderId) {
          console.log('[Drop] Ignoring: Cannot drop folder onto itself');
          return;
        }

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
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
        virtualTree={virtualTree}
        selectedFolderId={selectedFolderId}
        onFolderSelect={navigateToFolder}
        onMove={handleFolderMove}
        onCreate={(parentId) => {
          if (parentId) {
            navigateToFolder(parentId);
          }
          setCreateFolderOpen(true);
        }}
        onDelete={handleFolderDelete}
        onRename={handleDirectRename}
        onChangeColor={handleChangeColor}
      />

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
          <BreadcrumbNavigation
            activeTab={activeTab}
            folderPath={folderPath}
            onGoBack={() => goBack(activeTab.id)}
            onGoForward={() => goForward(activeTab.id)}
            canGoBack={canGoBack(activeTab.id)}
            canGoForward={canGoForward(activeTab.id)}
            onNavigateToFolder={navigateToFolder}
            onFolderDrop={handleFolderMove}
            Button={Button}
          />
        )}

        {/* Tab Content */}
        {activeTab && activeTab.type === 'grid' ? (
        // Grid View
        <GridView
          childFolders={childFolders}
          filesInFolder={filesInFolder}
          selectedFolderId={selectedFolderId}
          localTree={localTree}
          onFolderSelect={navigateToFolder}
          navigateToFolder={navigateToFolder}
          sortMode={sortMode}
          setSortMode={setSortMode}
          showSortDropdown={showSortDropdown}
          setShowSortDropdown={setShowSortDropdown}
          sortBy={sortBy}
          fileTypes={fileTypes}
          fileTypeSearch={fileTypeSearch}
          setFileTypeSearch={setFileTypeSearch}
          showAddFileDropdown={showAddFileDropdown}
          setShowAddFileDropdown={setShowAddFileDropdown}
          documentsService={documentsService}
          openFileInCurrentTab={openFileInCurrentTab}
          handleFolderMove={handleFolderMove}
          updateTreeAfterMove={updateTreeAfterMove}
          currentDropZone={currentDropZone}
          setCurrentDropZone={setCurrentDropZone}
          onRename={handleDirectRename}
          onChangeColor={handleChangeColor}
          onDelete={handleFolderDelete}
          onCreate={() => setCreateFolderOpen(true)}
          gridContainerRef={gridContainerRef}
          folderCardRefs={folderCardRefs}
          parentNavCardRef={parentNavCardRef}
          setGridRefs={setGridRefs}
          onFileRename={handleFileRename}
          onFileDelete={handleFileDelete}
          onFileSettings={handleFileSettings}
          onFileOpenInTab={handleFileOpenInTab}
          toast={toast}
          setTreeRefetchKey={setTreeRefetchKey}
          setFolders={setLocalTree}
          isDescendant={isDescendant}
          stats={stats}
          parentInfo={parentInfo}
        />
      ) : activeTab && activeTab.type === 'document' ? (
        // Document view content
        <DocumentViewContent
          activeTab={activeTab}
          activeTabId={activeTabId}
          documentsService={documentsService}
          manager={manager}
          addDocumentTab={addDocumentTab}
          closeTab={closeTab}
          setTabDirty={setTabDirty}
          navigateInTab={navigateInTab}
          goBack={goBack}
          canGoBack={canGoBack}
        />
      ) : null}
    </div>

      {/* All Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        selectedFolderId={selectedFolderId}
        documentsService={documentsService}
        defaultFolderColor={defaultFolderColor}
        colorPresets={colorPresets}
        onFolderCreated={() => setTreeRefetchKey(prev => prev + 1)}
      />

      <RenameFolderDialog
        conflictMode={conflictData !== null}
        open={conflictData !== null ? renameDialogOpen : directRenameDialogOpen}
        onOpenChange={(open) => {
          if (conflictData !== null) {
            setRenameDialogOpen(open);
            if (!open) {
              setRenameValue('');
              setRenameError('');
            }
          } else {
            setDirectRenameDialogOpen(open);
            if (!open) {
              setRenameFolderId(null);
              setDirectRenameValue('');
              setDirectRenameError('');
            }
          }
        }}
        folderId={conflictData?.draggedFolder.id || renameFolderId || ''}
        currentName={conflictData?.draggedFolder.name || (renameFolderId ? localTree.find((n: any) => n.id === renameFolderId)?.name : undefined)}
        parentId={conflictData?.targetParentId || selectedFolderId}
        documentsService={documentsService}
        onRenameComplete={async (newName: string) => {
          if (conflictData) {
            await handleConflictResolution('rename', newName);
          } else {
            setTreeRefetchKey(prev => prev + 1);
          }
        }}
        conflictData={conflictData}
      />

      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteFolderId(null);
            setDeleteConfirmed(false);
          }
        }}
        folderId={deleteFolderId || ''}
        documentsService={documentsService}
        onDeleteComplete={() => setTreeRefetchKey(prev => prev + 1)}
      />

      <ChangeFolderColorDialog
        open={changeColorDialogOpen}
        onOpenChange={(open) => {
          setChangeColorDialogOpen(open);
          if (!open) {
            setChangeColorFolderId(null);
            setChangeColorValue(defaultFolderColor);
          }
        }}
        folderId={changeColorFolderId || ''}
        currentColor={changeColorFolderId ? localTree.find((n: any) => n.id === changeColorFolderId)?.color : undefined}
        defaultFolderColor={defaultFolderColor}
        colorPresets={colorPresets}
        documentsService={documentsService}
        onColorChangeComplete={() => setTreeRefetchKey(prev => prev + 1)}
      />

      {/* File Dialogs */}
      <RenameFileDialog
        open={fileRenameDialogOpen}
        onOpenChange={setFileRenameDialogOpen}
        fileId={renameFileId}
        documentsService={documentsService}
        onRenameComplete={() => {
          setFileRenameDialogOpen(false);
          setRenameFileId(null);
          setTreeRefetchKey(prev => prev + 1);
        }}
      />

      <DeleteFileDialog
        open={fileDeleteDialogOpen}
        onOpenChange={setFileDeleteDialogOpen}
        fileId={deleteFileId}
        documentsService={documentsService}
        onDeleteComplete={() => {
          setFileDeleteDialogOpen(false);
          setDeleteFileId(null);
          setTreeRefetchKey(prev => prev + 1);
        }}
      />

      <FileSettingsDialog
        open={fileSettingsDialogOpen}
        onOpenChange={setFileSettingsDialogOpen}
        file={settingsFile}
        documentsService={documentsService}
      />
  </div>
  );
};

export default FileBrowser;
