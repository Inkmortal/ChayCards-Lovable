/**
 * FileBrowser - Main document management interface
 *
 * Features:
 * - Hierarchical folder navigation (left sidebar)
 * - File list with drag-and-drop support
 * - File upload and management
 */

import React, { useState } from 'react';
import { FileText, FolderPlus, Upload, Folder, ChevronRight, PanelLeftClose, PanelLeft, ArrowUpDown } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import { useDocumentStatistics, useUnifiedTree, useFilesInFolder, useChildFolders, useFolderPath, useSortBy } from '../hooks/useDocuments';
import { FolderTree } from './FolderTree';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import type { SortMode } from '../types';

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
  const filesInFolder = useFilesInFolder(selectedFolderId);
  const childFoldersUnsorted = useChildFolders(selectedFolderId);

  // Sort folders by order property
  const childFolders = React.useMemo(
    () => [...childFoldersUnsorted].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [childFoldersUnsorted]
  );

  const folderPath = useFolderPath(selectedFolderId);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sorting state and hook
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { sortBy } = useSortBy();

  // Folder creation dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6'); // Default to blue-500

  // Get UI components from core-ui plugin
  const PageHeader = manager.getComponent('core-ui/PageHeader');
  const EmptyState = manager.getComponent('core-ui/EmptyState');
  const Card = manager.getComponent('core-ui/Card');
  const Dialog = manager.getComponent('core-ui/Dialog');
  const Button = manager.getComponent('core-ui/Button');

  // Get DocumentsService for operations
  const documentsService = manager.getService('core-documents/documentsService');

  // Helper: Update tree structure optimistically after a move
  const updateTreeAfterMove = (tree: typeof fetchedTree, draggedId: string, newParentId: string | null): typeof fetchedTree => {
    // Find and remove the dragged node from its current location
    let draggedNode: typeof fetchedTree[0] | null = null;

    const removeNode = (nodes: typeof fetchedTree): typeof fetchedTree => {
      return nodes.filter(node => {
        if (node.id === draggedId) {
          draggedNode = node;
          return false;
        }
        if (node.type === 'folder') {
          node.children = removeNode(node.children);
        }
        return true;
      });
    };

    const insertNode = (nodes: typeof fetchedTree, parentId: string | null): typeof fetchedTree => {
      if (parentId === null) {
        // Insert at root
        return draggedNode ? [...nodes, draggedNode] : nodes;
      }

      return nodes.map(node => {
        if (node.type === 'folder') {
          if (node.id === parentId) {
            // Found the parent - add as child
            return {
              ...node,
              children: draggedNode ? [...node.children, draggedNode] : node.children
            };
          } else {
            // Keep searching in children
            return {
              ...node,
              children: insertNode(node.children, parentId)
            };
          }
        }
        return node;
      });
    };

    const updatedTree = removeNode([...tree]);
    return insertNode(updatedTree, newParentId);
  };

  // Handle folder move operations from tree
  const handleFolderMove = async (draggedId: string, operation: { type: 'before' | 'after' | 'child'; targetId: string; parentId: string | null }) => {
    if (!documentsService) {
      throw new Error('DocumentsService not available');
    }

    // Optimistic update - move the node in local tree immediately
    setLocalTree(currentTree => updateTreeAfterMove(currentTree, draggedId, operation.parentId));

    // Persist to backend
    try {
      let result;

      if (operation.type === 'before') {
        result = await documentsService.insertBefore(draggedId, operation.targetId);
      } else if (operation.type === 'after') {
        result = await documentsService.insertAfter(draggedId, operation.targetId);
      } else if (operation.type === 'child') {
        result = await documentsService.makeChild(draggedId, operation.parentId, 'end');
      }

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
  const handleCreateFolder = async () => {
    if (!documentsService) return;

    // Use "Untitled Folder" if no name provided (quick creation)
    const folderName = newFolderName.trim() || 'Untitled Folder';

    const result = await documentsService.createFolder({
      name: folderName,
      parentId: selectedFolderId,
      color: newFolderColor || undefined,
    });

    if (result.success) {
      setCreateFolderOpen(false);
      setNewFolderName('');
      setNewFolderColor('#3b82f6'); // Reset to default blue
    } else {
      console.error('Failed to create folder:', result.error);
      // TODO: Show error toast notification
    }
  };

  // Build breadcrumb trail
  const breadcrumbs = ['All Documents', ...folderPath.map(f => f.name)];

  return (
    <div className="file-browser h-full flex flex-col p-8 space-y-6">
      {/* Page Header */}
      {PageHeader && Button && (
        <PageHeader
          title="Documents"
          description={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((name, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-4 h-4" />}
                  <button
                    onClick={() => {
                      if (index === 0) {
                        setSelectedFolderId(null);
                      } else {
                        setSelectedFolderId(folderPath[index - 1].id);
                      }
                    }}
                    className="hover:text-foreground transition-colors"
                  >
                    {name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          }
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
            setNewFolderColor('#3b82f6'); // Reset to default blue
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Untitled Folder (optional)"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-color">Folder Color</Label>
              <Input
                key={`color-${createFolderOpen}`}
                id="folder-color"
                type="color"
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="h-10 w-20"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* Main Content: Sidebar + File Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Folder Tree */}
        <div
          className={`border-r bg-background/50 transition-all duration-300 ${
            sidebarCollapsed ? 'w-12' : 'w-64'
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
              tree={localTree}
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              onCollapseSidebar={() => setSidebarCollapsed(true)}
              onMove={handleFolderMove}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Files first */}
              {filesInFolder.map(file => (
                Card ? (
                  <Card key={file.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <FileText className="h-10 w-10 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.filename}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div key={file.id} className="border rounded p-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.filename}</span>
                    </div>
                  </div>
                )
              ))}

              {/* Then folders */}
              {childFolders.map(folder => {
                const folderColor = folder.color || 'hsl(var(--primary))';
                return Card ? (
                  <Card
                    key={folder.id}
                    className="p-6 cursor-pointer hover:shadow-xl transition-all duration-200 group"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: `${folderColor}20`,
                        }}
                      >
                        <Folder
                          className="h-7 w-7"
                          style={{ color: folderColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                          {folder.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Folder
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div
                    key={folder.id}
                    className="border rounded p-6 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" style={{ color: folderColor }} />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;
