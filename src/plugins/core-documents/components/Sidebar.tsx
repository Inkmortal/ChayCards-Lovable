import React from 'react';
import { PanelLeft } from 'lucide-react';
import { FolderTree } from './FolderTree';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  virtualTree: any;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onMove: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  onCreate: (parentId?: string) => void;
  onDelete: (folderId: string) => Promise<void>;
  onRename: (folderId: string) => Promise<void>;
  onChangeColor: (folderId: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  virtualTree,
  selectedFolderId,
  onFolderSelect,
  onMove,
  onCreate,
  onDelete,
  onRename,
  onChangeColor
}) => {
  return (
    <div
      className={`border-r bg-background/50 transition-all duration-300 ${
        collapsed ? 'w-12' : 'min-w-64 max-w-96 w-auto'
      }`}
    >
      {collapsed ? (
        /* Collapsed thin bar */
        <div className="flex flex-col items-center p-2">
          <button
            onClick={() => onToggleCollapse(false)}
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
          onFolderSelect={onFolderSelect}
          onCollapseSidebar={() => onToggleCollapse(true)}
          onMove={onMove}
          onCreate={(parentId) => {
            if (parentId) {
              onFolderSelect(parentId); // Select parent folder
            }
            onCreate(parentId);     // Open create dialog
          }}
          onDelete={onDelete}
          onRename={onRename}
          onChangeColor={onChangeColor}
        />
      )}
    </div>
  );
};
