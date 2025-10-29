/**
 * GridView - Main grid layout for folder/file display
 * Extracted from FileBrowser.tsx to improve modularity
 */

import React from 'react';
import { FileText, FolderPlus, ArrowUpDown, Folder } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { ParentNavigationCard } from './ParentNavigationCard';
import { DropIndicator } from '../DropIndicator';
import type { SortMode } from '../../types';

export interface GridViewProps {
  // Folder/file data
  childFolders: any[];
  filesInFolder: any[];
  selectedFolderId: string | null;

  // Tree data for folder card stats
  localTree: any[];

  // Navigation
  onFolderSelect: (folderId: string) => void;
  navigateToFolder: (folderId: string) => void;

  // Sorting
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  showSortDropdown: boolean;
  setShowSortDropdown: (show: boolean) => void;
  sortBy: (mode: SortMode, folderId: string | null) => Promise<void>;

  // File handlers
  fileTypes: any[];
  fileTypeSearch: string;
  setFileTypeSearch: (search: string) => void;
  showAddFileDropdown: boolean;
  setShowAddFileDropdown: (show: boolean) => void;
  documentsService: any;
  openFileInCurrentTab: (file: any) => void;

  // Drag & drop
  handleFolderMove: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  updateTreeAfterMove: (tree: any[], draggedId: string, newParentId: string | null, newIndex: number) => any[];
  currentDropZone: any;
  setCurrentDropZone: (zone: any) => void;

  // Dialog triggers
  onRename: (folderId: string) => void;
  onChangeColor: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onCreate: () => void;

  // Refs
  gridContainerRef: React.RefObject<HTMLDivElement>;
  folderCardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  parentNavCardRef: React.RefObject<HTMLDivElement>;
  setGridRefs: (node: HTMLDivElement | null) => void;

  // File action handlers
  onFileRename: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  onFileSettings: (file: any) => void;
  onFileOpenInTab: (file: any) => void;

  // Other
  toast: any;
  setTreeRefetchKey: React.Dispatch<React.SetStateAction<number>>;
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  isDescendant: (sourceId: string, targetId: string, tree: any[]) => boolean;
  stats: { totalFiles: number; totalFolders: number; totalSize: number };
  parentInfo: { id: string | null; folder: any } | null;
}

export const GridView: React.FC<GridViewProps> = ({
  childFolders,
  filesInFolder,
  selectedFolderId,
  localTree,
  onFolderSelect,
  navigateToFolder,
  sortMode,
  setSortMode,
  showSortDropdown,
  setShowSortDropdown,
  sortBy,
  fileTypes,
  fileTypeSearch,
  setFileTypeSearch,
  showAddFileDropdown,
  setShowAddFileDropdown,
  documentsService,
  openFileInCurrentTab,
  handleFolderMove,
  updateTreeAfterMove,
  currentDropZone,
  setCurrentDropZone,
  onRename,
  onChangeColor,
  onDelete,
  onCreate,
  gridContainerRef,
  folderCardRefs,
  parentNavCardRef,
  setGridRefs,
  onFileRename,
  onFileDelete,
  onFileSettings,
  onFileOpenInTab,
  toast,
  setTreeRefetchKey,
  setFolders,
  isDescendant,
  stats,
  parentInfo,
}) => {
  const manager = PluginManager.getInstance();
  const PageHeader = manager.getComponent('core-ui/PageHeader');
  const Button = manager.getComponent('core-ui/Button');
  const EmptyState = manager.getComponent('core-ui/EmptyState');

  // Handle sort button click
  const handleSort = async (mode: SortMode) => {
    setShowSortDropdown(false);
    await sortBy(mode, selectedFolderId);
  };

  // Click-away listener for sort dropdown
  React.useEffect(() => {
    if (!showSortDropdown) return;

    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showSortDropdown, setShowSortDropdown]);

  // Click-away listener for add file dropdown
  React.useEffect(() => {
    if (!showAddFileDropdown) return;

    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowAddFileDropdown(false);
        setFileTypeSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showAddFileDropdown, setShowAddFileDropdown, setFileTypeSearch]);

  return (
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
                onClick={onCreate}
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
            {parentInfo && (
              <ParentNavigationCard
                ref={parentNavCardRef}
                parentFolder={parentInfo.folder}
                parentFolderId={parentInfo.id}
                handleFolderMove={handleFolderMove}
                onNavigate={() => navigateToFolder(parentInfo.id)}
              />
            )}

            {/* Folders */}
            {childFolders.map((folder) => (
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
                setFolders={setFolders}
                updateTreeAfterMove={updateTreeAfterMove}
                documentsService={documentsService}
                toast={toast}
                onFolderSelect={navigateToFolder}
                onRename={onRename}
                onChangeColor={onChangeColor}
                onDelete={onDelete}
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
                onRename={() => onFileRename(file.id)}
                onDelete={() => onFileDelete(file.id)}
                onSettings={() => onFileSettings(file)}
                onOpenInTab={() => onFileOpenInTab(file)}
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
  );
};
