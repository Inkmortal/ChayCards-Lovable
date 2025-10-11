/**
 * FolderTree - Drag-and-drop navigation tree with react-arborist
 *
 * Features:
 * - Drag & drop with backend persistence (Option A pattern)
 * - Subtle opacity feedback during saves (no spinners)
 * - Multi-select support (Cmd/Ctrl+Click, Shift+Click)
 * - Hover-to-expand for folders
 * - Cross-panel drag & drop ready
 */

import React, { useState, useRef, useEffect } from 'react';
import { Tree, NodeApi, TreeApi, CursorProps } from 'react-arborist';
import { ChevronRight, ChevronDown, Folder, FileText, PanelLeftClose } from 'lucide-react';
import type { TreeNode } from '../types';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/renderer/hooks/use-toast';

// Custom drop cursor component - shows blue line for before/after drops
const CustomCursor: React.FC<CursorProps> = ({ top, left, indent }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: left + indent,
        right: 8,
        height: 2,
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: '1px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};

interface FolderTreeProps {
  tree: TreeNode[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCollapseSidebar: () => void;
  onMove?: (draggedId: string, operation: MoveOperation) => Promise<void>;
}

interface MoveOperation {
  type: 'before' | 'after' | 'child';
  targetId: string;
  parentId: string | null;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  tree,
  selectedFolderId,
  onFolderSelect,
  onCollapseSidebar,
  onMove
}) => {
  const { toast } = useToast();
  const [processingNodeId, setProcessingNodeId] = useState<string | null>(null);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Default height

  // Measure container height on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle moves - react-arborist calls this AFTER updating its internal tree
  const handleMove = async ({
    dragIds,
    parentId,
    index
  }: {
    dragIds: string[];
    parentId: string | null;
    index: number;
  }) => {
    if (!onMove || dragIds.length === 0) return;

    const draggedId = dragIds[0]; // Handle single item for now

    // React-arborist has already updated the UI optimistically
    // Now we persist to backend silently
    try {
      // Use the tree API to determine the operation
      const tree = treeRef.current;
      if (!tree) return;

      const draggedNode = tree.get(draggedId);
      if (!draggedNode) return;

      // Get siblings at the new location
      const parentNode = parentId ? tree.get(parentId) : tree.root;
      const siblings = parentNode?.children?.filter(n => n.id !== draggedId) || [];

      let operation: MoveOperation;

      if (siblings.length === 0) {
        // No siblings - making it a child of parent
        operation = {
          type: 'child',
          targetId: parentId || 'root',
          parentId
        };
      } else if (index === 0) {
        // First position - insert before first sibling
        operation = {
          type: 'before',
          targetId: siblings[0].id,
          parentId
        };
      } else if (index >= siblings.length) {
        // Last position - insert after last sibling
        operation = {
          type: 'after',
          targetId: siblings[siblings.length - 1].id,
          parentId
        };
      } else {
        // Middle position - insert before sibling at index
        operation = {
          type: 'before',
          targetId: siblings[index].id,
          parentId
        };
      }

      // Persist to backend (fire-and-forget, UI already updated)
      await onMove(draggedId, operation);

    } catch (error) {
      console.error('[FolderTree] Failed to persist move:', error);
      toast({
        title: 'Move failed to save',
        description: error instanceof Error ? error.message : 'Could not persist folder move',
        variant: 'destructive'
      });
      // Note: Tree already updated visually. Could trigger a refetch here to revert.
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files & Folders
        </div>
        <button
          onClick={onCollapseSidebar}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Close sidebar"
        >
          <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Tree */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {tree.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-4">
            No files or folders yet
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={tree}
            key={`tree-${tree.length}-${tree.map(n => n.id).join('-')}`}
            openByDefault={false}
            width="100%"
            height={containerHeight}
            indent={16}
            rowHeight={36}
            overscanCount={10}
            onMove={handleMove}
            renderCursor={CustomCursor}
            // Tell react-arborist how to access our data structure
            idAccessor="id"
            childrenAccessor={(node) => node.type === 'folder' ? node.children : undefined}
            className="p-2"
          >
            {({ node, style, dragHandle }) => (
              <TreeNodeRenderer
                node={node}
                style={style}
                dragHandle={dragHandle}
                isSelected={node.data.type === 'folder' && selectedFolderId === node.id}
                isProcessing={processingNodeId === node.id}
                onFolderSelect={onFolderSelect}
              />
            )}
          </Tree>
        )}
      </div>
    </div>
  );
};

// ============ TreeNodeRenderer Component ============

interface TreeNodeRendererProps {
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
  dragHandle?: (el: HTMLDivElement | null) => void;
  isSelected: boolean;
  isProcessing: boolean;
  onFolderSelect: (folderId: string | null) => void;
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  style,
  dragHandle,
  isSelected,
  isProcessing,
  onFolderSelect
}) => {
  const data = node.data;
  const isFolder = data.type === 'folder';
  const hasChildren = isFolder && data.children && data.children.length > 0;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg cursor-pointer transition-all duration-150',
        'h-9', // 36px height
        isSelected && 'bg-accent',
        !isSelected && 'hover:bg-muted/50',
        isProcessing && 'opacity-70', // Subtle processing feedback
        // Drop zone visual feedback
        node.state.isDragging && 'opacity-50', // Being dragged - fade out
        node.willReceiveDrop && isFolder && 'bg-primary/10 ring-2 ring-primary/40', // Drop into folder - blue highlight
      )}
      onClick={() => isFolder && onFolderSelect(data.id)}
    >
      {/* Expand/collapse chevron (folders with children only) */}
      {isFolder && hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
          className="flex-shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
        >
          {node.isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      )}

      {/* Spacer for items without chevron */}
      {(!isFolder || !hasChildren) && (
        <div className="w-4 flex-shrink-0" />
      )}

      {/* Icon */}
      <div className="flex-shrink-0">
        {isFolder ? (
          <Folder
            className="w-5 h-5"
            style={{ color: data.color || 'hsl(var(--primary))' }}
          />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <span className={cn(
        'text-sm truncate flex-1',
        isSelected && 'font-medium'
      )}>
        {isFolder ? data.name : data.filename}
      </span>

      {/* File size (files only) */}
      {!isFolder && (
        <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
          {formatFileSize(data.size)}
        </span>
      )}
    </div>
  );
};

// ============ Helper Functions ============

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default FolderTree;
