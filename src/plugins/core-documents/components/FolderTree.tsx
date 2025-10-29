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
import { useDrag, useDrop } from 'react-dnd';
import { ChevronRight, ChevronDown, Folder, FileText, PanelLeftClose, MoreVertical, Edit2, Trash2, Palette, Plus, ExternalLink } from 'lucide-react';
import type { TreeNode } from '../types';
import { FileIconDisplay, getFileDisplayName } from './FileDisplay';
import { TreeDropIndicator } from './TreeDropIndicator';
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
  onOpenInNewTab?: (folderId: string) => void;
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
  onChangeColor,
  onOpenInNewTab
}) => {
  const { toast } = useToast();
  const [processingNodeId, setProcessingNodeId] = useState<string | null>(null);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Default height
  const [gapCursorPosition, setGapCursorPosition] = useState<{ top: number; left: number; visible: boolean }>({ top: 0, left: 0, visible: false });

  // Global drop cursor state for TreeDropIndicator
  const [globalDropCursor, setGlobalDropCursor] = useState<{
    type: 'line';
    cursorX: number;
    cursorY: number;
    lineEndX: number;
  } | {
    type: 'highlight';
    rect: DOMRect;
  } | null>(null);

  // Computed drop operation for container-level drop handler
  const [computedDrop, setComputedDrop] = useState<{
    parentId: string | null;
    index: number;
  } | null>(null);

  // Container-level drop zone - continuously tracks mouse over entire tree
  const [{ isOverContainer }, dropContainer] = useDrop(() => ({
    accept: 'FOLDER',
    hover: (item: { id: string; source: string }, monitor) => {
      if (!containerRef.current || !treeRef.current) {
        setGlobalDropCursor(null);
        setComputedDrop(null);
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        setGlobalDropCursor(null);
        setComputedDrop(null);
        return;
      }

      // Get all visible nodes from react-arborist
      const visibleNodes = treeRef.current.visibleNodes;
      if (!visibleNodes || visibleNodes.length === 0) {
        setGlobalDropCursor(null);
        setComputedDrop(null);
        return;
      }

      // Find which node the mouse is over
      let targetNode: NodeApi<TreeNode> | null = null;
      let nodeElement: Element | null = null;

      for (const node of visibleNodes) {
        // Get node element by data-node-id attribute
        const element = containerRef.current.querySelector(`[data-node-id="${node.id}"]`);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        if (
          clientOffset.x >= rect.left &&
          clientOffset.x <= rect.right &&
          clientOffset.y >= rect.top &&
          clientOffset.y <= rect.bottom
        ) {
          targetNode = node;
          nodeElement = element;
          break;
        }
      }

      // No node found - clear cursor
      if (!targetNode || !nodeElement) {
        setGlobalDropCursor(null);
        setComputedDrop(null);
        return;
      }

      // Now we have the node - apply all the same logic from TreeNodeRenderer
      const hoverBoundingRect = nodeElement.getBoundingClientRect();
      const y = clientOffset.y - hoverBoundingRect.top;
      const x = clientOffset.x - hoverBoundingRect.left;
      const data = targetNode.data;
      const isFolder = data.type === 'folder';
      const isAllFilesNode = data.id === '__ALL_FILES__';

      const VISUAL_HEIGHT = 36;
      const PADDING_BOTTOM = 24;
      const indentPerLevel = 16;
      const basePadding = isAllFilesNode ? 4 : 8;
      const hoverLevel = Math.floor(Math.max(0, x - basePadding) / indentPerLevel);

      const topThreshold = VISUAL_HEIGHT * 0.25;
      const bottomThreshold = VISUAL_HEIGHT * 0.75;
      const atTop = y < topThreshold;
      const inMiddle = y >= topThreshold && y <= bottomThreshold;

      // Middle hover = highlight folder
      if (isFolder && inMiddle) {
        const chevronWidth = 18;
        const breathingRoom = 4;
        const highlightLeftEdge = basePadding + (targetNode.level * 16) + chevronWidth - breathingRoom;

        const highlightRect = new DOMRect(
          hoverBoundingRect.left + highlightLeftEdge,
          hoverBoundingRect.top,
          hoverBoundingRect.width - highlightLeftEdge,
          hoverBoundingRect.height
        );

        setGlobalDropCursor({ type: 'highlight', rect: highlightRect });
        setComputedDrop({
          parentId: data.id === '__ALL_FILES__' || data.id === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : data.id,
          index: 0,
        });
        return;
      }

      // Line cursor with context-aware indent rules
      const nextNode = targetNode.next;
      const isBetweenSiblings = nextNode && nextNode.level === targetNode.level;
      const isAfterLastChild = !nextNode || nextNode.level < targetNode.level;
      const isBeforeFirstChild = atTop && targetNode.prev === targetNode.parent;

      let boundedLevel: number;
      if (isBetweenSiblings) {
        boundedLevel = targetNode.level;
      } else if (isBeforeFirstChild) {
        boundedLevel = targetNode.level;
      } else if (isAfterLastChild) {
        boundedLevel = Math.max(0, Math.min(targetNode.level, hoverLevel));
      } else if (nextNode && nextNode.level < targetNode.level) {
        boundedLevel = Math.max(nextNode.level, Math.min(targetNode.level, hoverLevel));
      } else {
        boundedLevel = Math.max(0, Math.min(targetNode.level, hoverLevel));
      }

      let nodeAboveCursor;
      if (atTop) {
        const prev = targetNode.prev;
        if (prev && prev.id === item.id) {
          nodeAboveCursor = prev.prev;
        } else {
          nodeAboveCursor = prev;
        }
      } else {
        if (targetNode.next && targetNode.next.id === item.id) {
          setGlobalDropCursor(null);
          setComputedDrop(null);
          return;
        }
        nodeAboveCursor = targetNode;
      }

      if (!nodeAboveCursor) {
        const cursorX = hoverBoundingRect.left + basePadding + (0 * indentPerLevel);
        const cursorY = hoverBoundingRect.top - 2;
        const lineEndX = hoverBoundingRect.right - 16;
        setGlobalDropCursor({ type: 'line', cursorX, cursorY, lineEndX });
        setComputedDrop({ parentId: null, index: 0 });
        return;
      }

      let actualTargetNode = nodeAboveCursor;
      while (actualTargetNode.parent && actualTargetNode.level > boundedLevel) {
        actualTargetNode = actualTargetNode.parent;
      }

      if (actualTargetNode.id === '__ALL_FILES__') {
        const cursorX = hoverBoundingRect.left + basePadding + (0 * indentPerLevel);
        const cursorY = hoverBoundingRect.top - 2;
        const lineEndX = hoverBoundingRect.right - 16;
        setGlobalDropCursor({ type: 'line', cursorX, cursorY, lineEndX });
        setComputedDrop({ parentId: null, index: 0 });
        return;
      }

      const parentId = actualTargetNode.parent ?
        (actualTargetNode.parent.id === '__ALL_FILES__' || actualTargetNode.parent.id === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : actualTargetNode.parent.id) :
        null;
      const siblings = actualTargetNode.parent?.children || [];
      const targetIndex = siblings.findIndex(child => child.id === actualTargetNode.id);
      const draggedIndex = siblings.findIndex(child => child.id === item.id);
      const isDraggingDownward = draggedIndex !== -1 && draggedIndex < targetIndex;
      const isDraggingUpward = draggedIndex !== -1 && draggedIndex > targetIndex;
      const dropIndex = isDraggingDownward ? targetIndex : targetIndex + 1;

      let cursorPosition: 'top' | 'bottom';
      if (isDraggingUpward && !atTop) {
        cursorPosition = 'top';
      } else {
        cursorPosition = atTop ? 'top' : 'bottom';
      }

      const cursorX = hoverBoundingRect.left + basePadding + (boundedLevel * indentPerLevel);
      const cursorY = cursorPosition === 'top'
        ? hoverBoundingRect.top - 2
        : hoverBoundingRect.top + VISUAL_HEIGHT + (PADDING_BOTTOM / 2);
      const lineEndX = hoverBoundingRect.right - 16;

      setGlobalDropCursor({ type: 'line', cursorX, cursorY, lineEndX });
      setComputedDrop({ parentId, index: dropIndex });
    },
    drop: async (item: { id: string; source: string }) => {
      if (!onMove || !computedDrop) return;

      const { parentId, index } = computedDrop;
      setGlobalDropCursor(null);
      setComputedDrop(null);

      console.log(`[TreeContainer] Drop: ${item.id} -> parent=${parentId || 'root'}, index=${index}`);

      await onMove(item.id, {
        parentId,
        index
      });
    },
    canDrop: (item) => {
      if (item.id === '__ALL_FILES__') return false;
      return true;
    },
    collect: (monitor) => ({
      isOverContainer: monitor.isOver(),
    }),
  }), [onMove, computedDrop, containerRef, treeRef]);

  // Connect drop to container
  useEffect(() => {
    if (containerRef.current) {
      dropContainer(containerRef.current);
    }
  }, [dropContainer]);

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

  // Container-level drop target for gaps between tree nodes
  const [{ isOver: isOverGapContainer }, dropGapContainer] = useDrop(() => ({
    accept: 'NODE',
    hover: (item, monitor) => {
      // Only handle gaps when hovering over container itself (shallow)
      if (!monitor.isOver({ shallow: true })) {
        setGapCursorPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !containerRef.current) {
        setGapCursorPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeY = clientOffset.y - containerRect.top;

      // Calculate which gap we're in based on Y position
      // Each node is 36px tall (rowHeight), with 8px paddingTop
      const rowHeight = 36;
      const paddingTop = 8;
      const adjustedY = relativeY - paddingTop;

      if (adjustedY < 0) {
        setGapCursorPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Calculate which row we're closest to
      const rowIndex = Math.floor(adjustedY / rowHeight);
      const positionInRow = adjustedY % rowHeight;

      // Only show cursor in gaps (first/last 2px of each row)
      const isInTopGap = positionInRow < 2;
      const isInBottomGap = positionInRow > rowHeight - 2;

      if (!isInTopGap && !isInBottomGap) {
        setGapCursorPosition(prev => ({ ...prev, visible: false }));
        return;
      }

      // Calculate cursor position
      let cursorRow = isInTopGap ? rowIndex : rowIndex + 1;
      const cursorTop = paddingTop + (cursorRow * rowHeight);

      setGapCursorPosition({
        top: cursorTop,
        left: 8, // Same as node padding
        visible: true,
      });
    },
    drop: () => {
      setGapCursorPosition(prev => ({ ...prev, visible: false }));
    },
    collect: (monitor) => ({
      isOverContainer: monitor.isOver({ shallow: true }),
    }),
  }), []);

  // Connect gap drop ref to container
  useEffect(() => {
    if (containerRef.current) {
      dropGapContainer(containerRef);
    }
  }, [dropGapContainer]);

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
      <div ref={containerRef} className="relative flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-sm text-muted-foreground italic p-4">
            No files or folders yet
          </div>
        ) : (
          <>
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
            disableDrag={true}
            disableDrop={true}
            renderCursor={CustomCursor}
            // Tell react-arborist how to access our data structure
            idAccessor="id"
            childrenAccessor={(node) => node.type === 'folder' ? node.children : undefined}
          >
            {({ node, style }) => (
              <TreeNodeRenderer
                node={node}
                style={style}
                isSelected={
                  node.data.type === 'folder' &&
                  (
                    (selectedFolderId === null && node.id === '__ALL_FILES__') ||
                    selectedFolderId === node.id
                  )
                }
                isProcessing={processingNodeId === node.id}
                onFolderSelect={onFolderSelect}
                onMove={onMove}
                onCreate={onCreate}
                onDelete={onDelete}
                onRename={onRename}
                onChangeColor={onChangeColor}
                onOpenInNewTab={onOpenInNewTab}
                containerRef={containerRef}
                setGlobalDropCursor={setGlobalDropCursor}
              />
            )}
          </Tree>

          {/* Tree drop cursor - renders above all nodes using useDragLayer */}
          <TreeDropIndicator dropCursor={globalDropCursor} />

          {/* Gap cursor - shown when hovering over gaps between nodes */}
          {gapCursorPosition.visible && (
            <div
              className="absolute flex items-center pointer-events-none"
              style={{
                top: `${gapCursorPosition.top}px`,
                left: `${gapCursorPosition.left}px`,
                right: '16px',
                zIndex: 10,
              }}
            >
              {/* Dot */}
              <div
                className="w-1 h-1 bg-primary rounded-full flex-shrink-0"
                style={{ boxShadow: '0 0 0 3px #3b82f6' }}
              />
              {/* Line extending to the right */}
              <div className="flex-1 h-0.5 bg-primary rounded-full" />
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
};

// ============ TreeNodeRenderer Component ============

interface TreeNodeRendererProps {
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
  isSelected: boolean;
  isProcessing: boolean;
  onFolderSelect: (folderId: string | null) => void;
  onMove?: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  onCreate?: (parentId: string) => void;
  onDelete?: (folderId: string) => void;
  onRename?: (folderId: string) => void;
  onChangeColor?: (folderId: string) => void;
  onOpenInNewTab?: (folderId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  setGlobalDropCursor: React.Dispatch<React.SetStateAction<{
    type: 'line';
    cursorX: number;
    cursorY: number;
    lineEndX: number;
  } | {
    type: 'highlight';
    rect: DOMRect;
  } | null>>;
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  style,
  isSelected,
  isProcessing,
  onFolderSelect,
  onMove,
  onCreate,
  onDelete,
  onRename,
  onChangeColor,
  onOpenInNewTab,
  containerRef,
  setGlobalDropCursor
}) => {
  const manager = PluginManager.getInstance();
  const DropdownMenu = manager.getComponent('core-ui/DropdownMenu');
  const DropdownMenuItem = manager.getComponent('core-ui/DropdownMenuItem');
  const data = node.data;
  const isFolder = data.type === 'folder';
  const hasChildren = isFolder && data.children && data.children.length > 0;
  const isAllFilesNode = data.id === '__ALL_FILES__';

  // Single ref for react-dnd drag
  const nodeRef = useRef<HTMLDivElement>(null);

  // React-dnd drag hook - makes tree folders draggable
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FOLDER',
    item: { id: data.id, source: 'tree' },
    canDrag: () => !isAllFilesNode && isFolder,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [data.id, isAllFilesNode, isFolder]);

  // Connect nodeRef to react-dnd drag (drop is handled at container level)
  drag(nodeRef);

  // NOTE: Drop detection is now handled at container level in FolderTree
  // This eliminates the per-node drop zones that caused flickering
  // See container useDrop hook above for the unified drop logic

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
      ref={nodeRef}  // Single ref for react-dnd drag + drop
      data-node-id={node.id}  // For container-level drop detection
      style={{ ...style, width: '100%' }}  // Extend node to full width for proper hover detection
      className={cn(
        'group relative rounded-lg transition-all duration-150',
        'flex gap-2 cursor-pointer',
        'h-9 py-2', // Standard height and padding - no tricks that break layout
        isAllFilesNode ? 'pl-1' : 'pl-2', // Less padding for All Files to align it flush left
        isSelected && 'bg-accent/30',  // Softer highlight: 30% opacity for better readability
        !isSelected && 'hover:bg-muted/50',
        isProcessing && 'opacity-70', // Subtle processing feedback
        // Drag and drop visual feedback
        isDragging && 'opacity-50', // Being dragged - fade out
        // Drop cursor handles visual feedback (no generic highlight)
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
          <FileIconDisplay file={data} size="small" />
        )}
      </div>

      {/* Name */}
      <span className={cn(
        'text-sm truncate flex-1',
        isSelected && 'font-medium'
      )}>
        {isFolder ? data.name : getFileDisplayName(data)}
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
            {onOpenInNewTab && (
              <DropdownMenuItem onClick={() => onOpenInNewTab(data.id)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </DropdownMenuItem>
            )}
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
