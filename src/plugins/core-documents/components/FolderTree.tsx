/**
 * FolderTree - Navigation tree with react-arborist
 *
 * Features:
 * - Drag & drop with backend persistence
 * - Subtle opacity feedback during saves
 * - Multi-select support (Cmd/Ctrl+Click, Shift+Click)
 * - Folder expand/collapse
 */

import React, { useState, useRef, useEffect } from 'react';
import { Tree, NodeApi, TreeApi, CursorProps } from 'react-arborist';
import { ChevronRight, ChevronDown, Folder, FileText, PanelLeftClose, MoreVertical, Edit2, Trash2, Palette, Plus } from 'lucide-react';
import type { TreeNode } from '../types';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/renderer/hooks/use-toast';
import { PluginManager } from '@/shared/plugin-system/PluginManager';

// ============ Cursor Component ============

// Custom drop cursor component - shows blue line for before/after drops
// Minimal offset to align with node content area
const CustomCursor: React.FC<CursorProps> = ({ top, left, indent }) => {
  const cursorHeight = 2; // Height of the insertion line
  const adjustedTop = top - (cursorHeight / 2);

  return (
    <>
      {/* Main cursor line */}
      <div
        style={{
          position: 'absolute',
          top: adjustedTop,
          left: left + 8,  // Align with node content (matches pl-2 node padding)
          right: 8,
          height: cursorHeight,
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '1px',
          pointerEvents: 'none',
          zIndex: 10,
          // Smooth animation when cursor moves
          transition: 'top 0.15s ease-out, left 0.15s ease-out',
        }}
      />

      {/* Circle indicator at the start */}
      <div
        style={{
          position: 'absolute',
          top: top - 3,  // Center the 6px circle on the cursor position
          left: left + 6,  // Slightly before the line
          width: 6,
          height: 6,
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10,
          // Match the line animation
          transition: 'top 0.15s ease-out, left 0.15s ease-out',
        }}
      />
    </>
  );
};

interface FolderTreeProps {
  tree: TreeNode[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCollapseSidebar: () => void;
  onMove?: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  onCreate?: (parentId: string) => void;
  onDelete?: (folderId: string) => void;
  onRename?: (folderId: string) => void;
  onChangeColor?: (folderId: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  tree,
  selectedFolderId,
  onFolderSelect,
  onCollapseSidebar,
  onMove,
  onCreate,
  onDelete,
  onRename,
  onChangeColor
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


  // Handle moves - just pass the raw values up to parent
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

    try {
      // Just pass the simple values react-arborist gives us
      await onMove(dragIds[0], { parentId, index });
    } catch (error) {
      // Silent revert on error - folder will snap back to original position
      console.error('[FolderTree] Move failed, reverted:', error);
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

      {/* Tree with All Files as virtual root node */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-4">
            No files or folders yet
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={tree}
            openByDefault={true}
            width="100%"
            height={containerHeight}
            indent={16}
            rowHeight={36}
            overscanCount={10}
            paddingTop={8}
            paddingBottom={8}
            onMove={handleMove}
            renderCursor={CustomCursor}
            // Tell react-arborist how to access our data structure
            idAccessor="id"
            childrenAccessor={(node) => node.type === 'folder' ? node.children : undefined}
          >
            {({ node, style, dragHandle }) => (
              <TreeNodeRenderer
                node={node}
                style={style}
                dragHandle={dragHandle}
                isSelected={
                  node.data.type === 'folder' &&
                  (
                    (selectedFolderId === null && node.id === '__ALL_FILES__') ||
                    selectedFolderId === node.id
                  )
                }
                isProcessing={processingNodeId === node.id}
                onFolderSelect={onFolderSelect}
                onCreate={onCreate}
                onDelete={onDelete}
                onRename={onRename}
                onChangeColor={onChangeColor}
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
  onCreate?: (parentId: string) => void;
  onDelete?: (folderId: string) => void;
  onRename?: (folderId: string) => void;
  onChangeColor?: (folderId: string) => void;
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  style,
  dragHandle,
  isSelected,
  isProcessing,
  onFolderSelect,
  onCreate,
  onDelete,
  onRename,
  onChangeColor
}) => {
  const manager = PluginManager.getInstance();
  const DropdownMenu = manager.getComponent('core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('core-ui/DropdownMenuItem');
  const data = node.data;
  const isFolder = data.type === 'folder';
  const hasChildren = isFolder && data.children && data.children.length > 0;
  const isAllFilesNode = data.id === '__ALL_FILES__';

  // Show vertical line for all nodes that have a parent (lines always visible)
  // Children disappear when parent is collapsed, so we don't need to check isOpen
  const showVerticalLine = !!node.parent;
  const isLastChild = node.parent ? node.parent.children[node.parent.children.length - 1]?.id === node.id : false;

  // Line position calculation:
  // All Files has pl-1 (4px), regular nodes have pl-2 (8px)
  // Chevron center: padding + 2px (button) + 7px (icon center) = 13px (All Files) or 17px (regular)
  // Each level indents by 16px, lines align with chevron columns
  // Adjusted for All Files having 4px less padding: level * 16 + 5 instead of + 9

  return (
    <div
      ref={isAllFilesNode ? undefined : dragHandle}  // Disable drag for All Files
      style={style}
      className={cn(
        'group relative flex gap-2 rounded-lg cursor-pointer transition-all duration-150',
        'h-9 py-2',
        isAllFilesNode ? 'pl-1' : 'pl-2', // Less padding for All Files to align it flush left
        isSelected && 'bg-accent/30',  // Softer highlight: 30% opacity for better readability
        !isSelected && 'hover:bg-muted/50',
        isProcessing && 'opacity-70', // Subtle processing feedback
        // Drop zone visual feedback (not for All Files)
        !isAllFilesNode && node.state.isDragging && 'opacity-50', // Being dragged - fade out
        !isAllFilesNode && node.willReceiveDrop && isFolder && 'bg-primary/10 ring-2 ring-primary/40', // Drop into folder - blue highlight
      )}
      onClick={() => {
        if (isFolder) {
          // All Files node should show all files (null), others show their folder
          onFolderSelect(isAllFilesNode ? null : data.id);
        }
      }}
    >
      {/* Vertical hierarchy lines - one per ancestor level */}
      {showVerticalLine && (
        <>
          {Array.from({ length: node.level }).map((_, level) => {
            // For each ancestor level, render a vertical line at its column position
            // Creates a visual "ladder" showing hierarchical depth
            // Offset by 5px instead of 9px to account for All Files having less padding
            const isLastLineOfLastChild = isLastChild && level === node.level - 1;

            return (
              <div
                key={level}
                className="absolute border-l border-muted-foreground"
                style={{
                  left: `${level * 16 + 5}px`, // Align with chevron column: level * indent + (pl-1 + 1px)
                  top: '-4px', // Start just above the node for seamless connection
                  bottom: isLastLineOfLastChild ? '0' : '-4px', // Last child: extend to bottom; others: extend below
                  width: '1px',
                  zIndex: 1,
                }}
              />
            );
          })}
        </>
      )}
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
        <div className="w-[18px] flex-shrink-0" />
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

      {/* Add Folder Button (appears on hover, folders only) */}
      {isFolder && onCreate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Normalize __ALL_FILES__ to null for root-level folder creation
            onCreate(data.id === '__ALL_FILES__' ? null : data.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-all"
          title="Add child folder"
          aria-label="Add child folder"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}

      {/* Spacer for All Files to align button with regular folders (replaces missing three-dot menu) */}
      {isFolder && isAllFilesNode && (
        <div className="w-6 flex-shrink-0" />
      )}

      {/* File size (files only) */}
      {!isFolder && (
        <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
          {formatFileSize(data.size)}
        </span>
      )}

      {/* Three-dot menu (folders only, not for All Files) */}
      {isFolder && !isAllFilesNode && (
        <div
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu
            trigger={
              <button className="p-1 rounded hover:bg-accent transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          >
            {onRename && (
              <DropdownMenuItem onClick={() => onRename(data.id)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
            )}
            {onChangeColor && (
              <DropdownMenuItem onClick={() => onChangeColor(data.id)}>
                <Palette className="mr-2 h-4 w-4" />
                Change Color
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={() => onDelete(data.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenu>
        </div>
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
