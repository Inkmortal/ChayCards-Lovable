import { useCallback, useEffect, useState } from 'react';
import type { NodeApi, TreeApi } from 'react-arborist';
import type { TreeNode } from '../types';

/**
 * Drop zone type for tree nodes
 */
export interface TreeDropZone {
  // Zone type
  type: 'insert-before' | 'drop-into-folder' | 'insert-after';

  // Which node this zone belongs to
  nodeId: string;

  // Visual feedback coordinates
  cursorX: number;      // Left edge of cursor line (at indent level)
  cursorY: number;      // Vertical position
  lineEndX?: number;    // Right edge of cursor line (for insert zones)
  highlightRect?: DOMRect;  // Bounds to highlight (for drop-into zones)

  // Pre-computed drop operation
  parentId: string | null;  // Parent folder to drop into
  index: number;            // Index within parent's children
}

/**
 * Cached layout data for a tree node with its drop zones
 */
interface CachedNodeLayout {
  nodeId: string;
  rect: DOMRect;
  node: NodeApi<TreeNode>;
  zones: TreeDropZone[];
}

/**
 * Tree layout manager for drag-drop operations.
 *
 * Mirrors the grid's useGridLayoutManager pattern but adapted for tree hierarchy:
 * - Measures actual node heights from DOM (no hardcoded constants)
 * - Pre-computes drop zones (insert-before, drop-into, insert-after)
 * - Handles multi-level indent detection
 * - Caches zones and drop operations for performance
 * - Filters out dragged node to prevent self-drop
 *
 * @param treeRef React-arborist tree API reference
 * @param containerRef Tree container element reference
 * @param draggedItemId ID of currently dragged item (to filter zones)
 */
export function useTreeLayoutManager(
  treeRef: React.RefObject<TreeApi<TreeNode>>,
  containerRef: React.RefObject<HTMLDivElement>,
  draggedItemId: string | null
) {
  const [cachedLayout, setCachedLayout] = useState<CachedNodeLayout[]>([]);

  /**
   * Calculate drop zones for all visible nodes.
   * Called when tree changes or drag starts.
   */
  const recalculateZones = useCallback(() => {
    if (!treeRef.current || !containerRef.current) {
      setCachedLayout([]);
      return;
    }

    const visibleNodes = treeRef.current.visibleNodes;
    if (!visibleNodes || visibleNodes.length === 0) {
      setCachedLayout([]);
      return;
    }

    const layouts: CachedNodeLayout[] = [];

    for (const node of visibleNodes) {
      // Skip the dragged node itself
      if (draggedItemId && node.id === draggedItemId) {
        continue;
      }

      // Skip descendants of dragged node (can't drop into own children)
      if (draggedItemId && isDescendantOf(node, draggedItemId)) {
        continue;
      }

      // Get node element from DOM
      const element = containerRef.current.querySelector(
        `[data-node-id="${node.id}"]`
      );
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      // Measure actual padding and indent from computed styles
      const style = window.getComputedStyle(element);
      const basePadding = parseInt(style.paddingLeft);
      const indentPerLevel = 16; // From react-arborist config
      const indent = basePadding + (node.level * indentPerLevel);

      const zones: TreeDropZone[] = [];

      // Zone 1: Insert Before (top 25% of node)
      const insertBeforeZone: TreeDropZone = {
        type: 'insert-before',
        nodeId: node.id,
        cursorX: rect.left + indent,
        cursorY: rect.top - 2,
        lineEndX: rect.right - 16,
        ...calculateDropOperation(node, 'before', draggedItemId)
      };
      zones.push(insertBeforeZone);

      // Zone 2: Drop Into Folder (middle 50%, folders only)
      const isFolder = node.data.type === 'folder';
      if (isFolder) {
        const chevronWidth = 18;
        // basePadding already includes indent from react-arborist, just add chevron
        const highlightLeftEdge = basePadding + chevronWidth;

        const highlightRect = new DOMRect(
          rect.left + highlightLeftEdge,
          rect.top,
          rect.width - highlightLeftEdge,
          rect.height
        );

        const dropIntoZone: TreeDropZone = {
          type: 'drop-into-folder',
          nodeId: node.id,
          cursorX: rect.left + indent,
          cursorY: rect.top + rect.height / 2,
          highlightRect,
          parentId: node.id === '__ALL_FILES__' || node.id === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : node.id,
          index: 0, // Always drop as first child
        };
        zones.push(dropIntoZone);
      }

      // Zone 3: Insert After (bottom 25% of node)
      const insertAfterZone: TreeDropZone = {
        type: 'insert-after',
        nodeId: node.id,
        cursorX: rect.left + indent,
        cursorY: rect.bottom - 2,
        lineEndX: rect.right - 16,
        ...calculateDropOperation(node, 'after', draggedItemId)
      };
      zones.push(insertAfterZone);

      layouts.push({
        nodeId: node.id,
        rect,
        node,
        zones
      });
    }

    setCachedLayout(layouts);
  }, [treeRef, containerRef, draggedItemId]);

  /**
   * Recalculate zones when drag starts/ends or tree changes
   */
  useEffect(() => {
    recalculateZones();
  }, [draggedItemId, recalculateZones]);

  /**
   * Find which drop zone the mouse is currently in.
   * Uses a two-pass approach:
   * 1. Find which node the mouse is over
   * 2. Determine which zone within that node based on Y position and indent level
   */
  const getDropZone = useCallback((clientOffset: { x: number; y: number }): TreeDropZone | null => {
    const { x, y } = clientOffset;

    // Find the node the mouse is over
    const hoveredLayout = cachedLayout.find(layout => {
      const rect = layout.rect;
      return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      );
    });

    if (!hoveredLayout) {
      return null;
    }

    const rect = hoveredLayout.rect;
    const yOffset = y - rect.top;
    const nodeHeight = rect.height;

    // Determine zone based on vertical position
    const topThreshold = nodeHeight * 0.25;
    const bottomThreshold = nodeHeight * 0.75;

    const atTop = yOffset < topThreshold;
    const inMiddle = yOffset >= topThreshold && yOffset <= bottomThreshold;
    const atBottom = yOffset > bottomThreshold;

    // Check for drop-into-folder zone (middle 50%, folders only)
    if (inMiddle) {
      const dropIntoZone = hoveredLayout.zones.find(z => z.type === 'drop-into-folder');
      if (dropIntoZone) {
        return dropIntoZone;
      }
    }

    // For insert zones, need to handle multi-level indent detection
    const xOffset = x - rect.left;
    const element = containerRef.current?.querySelector(
      `[data-node-id="${hoveredLayout.nodeId}"]`
    );
    if (!element) return null;

    const style = window.getComputedStyle(element);
    const basePadding = parseInt(style.paddingLeft);
    const indentPerLevel = 16;
    const hoverLevel = Math.floor(Math.max(0, xOffset - basePadding) / indentPerLevel);

    // Determine bounded level based on context
    const node = hoveredLayout.node;
    const boundedLevel = determineBoundedLevel(node, hoverLevel, atTop);

    // Get appropriate zone and adjust for indent level
    let zone: TreeDropZone | null = null;
    if (atTop) {
      zone = hoveredLayout.zones.find(z => z.type === 'insert-before') || null;
    } else if (atBottom) {
      zone = hoveredLayout.zones.find(z => z.type === 'insert-after') || null;
    }

    if (!zone) return null;

    // Adjust drop operation for indent level
    const adjustedZone = adjustZoneForIndentLevel(zone, node, boundedLevel, draggedItemId);

    // Adjust cursor X position for indent level
    return {
      ...adjustedZone,
      cursorX: rect.left + basePadding + (boundedLevel * indentPerLevel)
    };
  }, [cachedLayout, containerRef, draggedItemId]);

  return {
    getDropZone,
    recalculateZones
  };
}

/**
 * Calculate the drop operation (parentId, index) for a node position.
 */
function calculateDropOperation(
  node: NodeApi<TreeNode>,
  position: 'before' | 'after',
  draggedItemId: string | null
): { parentId: string | null; index: number } {
  const parentId = node.parent
    ? (node.parent.id === '__ALL_FILES__' || node.parent.id === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : node.parent.id)
    : null;

  const siblings = node.parent?.children || [];
  const targetIndex = siblings.findIndex(child => child.id === node.id);

  // If dragged item not in siblings, simple calculation
  const draggedIndex = draggedItemId ? siblings.findIndex(child => child.id === draggedItemId) : -1;

  if (draggedIndex === -1) {
    // Cross-parent move: respect position
    return {
      parentId,
      index: position === 'before' ? targetIndex : targetIndex + 1
    };
  }

  // Same-parent move: adjust for removal
  // Match grid's handleDropReorder logic (FileBrowser.tsx lines 1076-1094)
  if (position === 'before') {
    // Insert BEFORE target
    if (draggedIndex < targetIndex) {
      // Left-to-right: target shifts left by 1 after removal
      return { parentId, index: targetIndex - 1 };
    } else {
      // Right-to-left: target position unchanged
      return { parentId, index: targetIndex };
    }
  } else {
    // Insert AFTER target (position === 'after')
    if (draggedIndex < targetIndex) {
      // Left-to-right: target shifts left by 1 after removal
      return { parentId, index: targetIndex };
    } else {
      // Right-to-left: target position unchanged, +1 to insert after
      return { parentId, index: targetIndex + 1 };
    }
  }
}

/**
 * Determine the bounded indent level based on context.
 * Ported from FolderTree.tsx lines 218-229.
 */
function determineBoundedLevel(
  targetNode: NodeApi<TreeNode>,
  hoverLevel: number,
  atTop: boolean
): number {
  const nextNode = targetNode.next;
  const isBetweenSiblings = nextNode && nextNode.level === targetNode.level;
  const isAfterLastChild = !nextNode || nextNode.level < targetNode.level;
  const isBeforeFirstChild = atTop && targetNode.prev === targetNode.parent;

  if (isBetweenSiblings) {
    return targetNode.level;
  } else if (isBeforeFirstChild) {
    return targetNode.level;
  } else if (isAfterLastChild) {
    return Math.max(0, Math.min(targetNode.level, hoverLevel));
  } else if (nextNode && nextNode.level < targetNode.level) {
    return Math.max(nextNode.level, Math.min(targetNode.level, hoverLevel));
  } else {
    return Math.max(0, Math.min(targetNode.level, hoverLevel));
  }
}

/**
 * Adjust zone's drop operation for a different indent level.
 * Walks up the tree to find the appropriate parent.
 */
function adjustZoneForIndentLevel(
  zone: TreeDropZone,
  node: NodeApi<TreeNode>,
  boundedLevel: number,
  draggedItemId: string | null
): TreeDropZone {
  // Find the actual target node at the bounded level
  let actualTargetNode = node;

  // Walk up the tree until we reach the desired level
  while (actualTargetNode.parent && actualTargetNode.level > boundedLevel) {
    actualTargetNode = actualTargetNode.parent;
  }

  // Special case: dropping at root
  if (actualTargetNode.id === '__ALL_FILES__' || actualTargetNode.id === '__REACT_ARBORIST_INTERNAL_ROOT__') {
    return {
      ...zone,
      parentId: null,
      index: 0
    };
  }

  // Calculate new parent and index
  const parentId = actualTargetNode.parent
    ? (actualTargetNode.parent.id === '__ALL_FILES__' || actualTargetNode.parent.id === '__REACT_ARBORIST_INTERNAL_ROOT__' ? null : actualTargetNode.parent.id)
    : null;

  const siblings = actualTargetNode.parent?.children || [];
  const targetIndex = siblings.findIndex(child => child.id === actualTargetNode.id);
  const draggedIndex = draggedItemId ? siblings.findIndex(child => child.id === draggedItemId) : -1;

  let index: number;
  if (draggedIndex === -1) {
    // Cross-parent: respect zone type
    index = zone.type === 'insert-before' ? targetIndex : targetIndex + 1;
  } else {
    // Same-parent: adjust for removal (match grid logic)
    if (zone.type === 'insert-before') {
      // Insert BEFORE target
      if (draggedIndex < targetIndex) {
        // Dragging downward: target shifts up by 1 after removal
        index = targetIndex - 1;
      } else {
        // Dragging upward: target position unchanged
        index = targetIndex;
      }
    } else {
      // Insert AFTER target (zone.type === 'insert-after')
      if (draggedIndex < targetIndex) {
        // Dragging downward: target shifts up by 1 after removal
        index = targetIndex;
      } else {
        // Dragging upward: target position unchanged, +1 to insert after
        index = targetIndex + 1;
      }
    }
  }

  return {
    ...zone,
    parentId,
    index
  };
}

/**
 * Check if a node is a descendant of another node.
 */
function isDescendantOf(node: NodeApi<TreeNode>, ancestorId: string): boolean {
  let current = node.parent;
  while (current) {
    if (current.id === ancestorId) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
