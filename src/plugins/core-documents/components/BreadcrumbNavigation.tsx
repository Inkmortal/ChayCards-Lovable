import React from 'react';
import { ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { BreadcrumbFolder } from './grid/BreadcrumbFolder';
import type { GridTabType, DocumentTabType } from '../types';

interface BreadcrumbNavigationProps {
  activeTab: GridTabType | DocumentTabType;
  folderPath: any[] | null;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onNavigateToFolder: (folderId: string | null) => void;
  onFolderDrop: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  Button: any; // From core-ui plugin
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  activeTab,
  folderPath,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  onNavigateToFolder,
  onFolderDrop,
  Button
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 rounded-lg border border-border/50 mx-4 mt-2">
      {/* Back/Forward Navigation Buttons */}
      <div className="flex items-center gap-1 mr-2 border-r border-border/50 pr-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          disabled={!canGoBack}
          className="h-7 w-7 p-0"
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoForward}
          disabled={!canGoForward}
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
        onClick={() => onNavigateToFolder(null)}
        onDrop={async (draggedId, source) => {
          // Move to root (All Files) - use handleFolderMove for consistency
          console.log(`[Breadcrumb] Moving ${draggedId} to root`);
          await onFolderDrop(draggedId, {
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
            onClick={() => onNavigateToFolder(folder.id)}
            onDrop={async (draggedId, source) => {
              // Move to this breadcrumb folder - use handleFolderMove for consistency
              console.log(`[Breadcrumb] Moving ${draggedId} to ${folder.name}`);
              await onFolderDrop(draggedId, {
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
            onClick={() => item.folderId && onNavigateToFolder(item.folderId)}
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
  );
};
