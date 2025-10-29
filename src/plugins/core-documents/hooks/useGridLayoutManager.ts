import { useCallback, useEffect, useRef, useState } from 'react';

// Zone represents a rectangular drop target area
interface Zone {
  x: number;      // Left edge (client coordinates)
  y: number;      // Top edge (client coordinates)
  width: number;  // Zone width
  height: number; // Zone height
  centerX: number; // Center X for cursor positioning
  centerY: number; // Center Y for cursor positioning
}

// Cached layout data for each folder
interface CachedFolderLayout {
  id: string;
  rect: DOMRect;
  row: number;
  col: number;
  centerZone: Zone;  // 80% of card center for "drop into"
  leftGapZone: Zone;  // Left edge + half of left gap for "insert before" (always present)
  rightGapZone: Zone; // Right edge + half of right gap for "insert after" (always present)
}

// Result of getDropZone()
export type DropZone =
  | { type: 'folder-center'; folderId: string; rect: DOMRect }
  | { type: 'gap-left'; folderId: string; cursorX: number; cursorY: number; cursorHeight: number }
  | { type: 'gap-right'; folderId: string; cursorX: number; cursorY: number; cursorHeight: number };

const GAP_SIZE = 16; // CSS Grid gap-4 = 16px
const HALF_GAP = GAP_SIZE / 2;

/**
 * Manages cached layout data for grid folders and provides drop zone detection.
 *
 * Key features:
 * - Caches getBoundingClientRect() for all folders to avoid layout thrashing
 * - Uses ResizeObserver to detect layout changes and recalculate
 * - Pre-computes drop zones (center, left gap, right gap) for each folder
 * - Provides getDropZone() function for efficient zone detection during drag
 * - Uses childFolders array for correct visual order (not stale Map insertion order)
 */
export function useGridLayoutManager(
  folderCardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>,
  gridContainerRef: React.RefObject<HTMLDivElement>,
  childFolders: any[]
) {
  const [cachedLayout, setCachedLayout] = useState<CachedFolderLayout[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  /**
   * Calculate all drop zones for current layout.
   * Called on mount, resize, and when folders change.
   */
  const recalculateLayout = useCallback(() => {
    if (!gridContainerRef.current || childFolders.length === 0) {
      setCachedLayout([]);
      return;
    }

    const folders: CachedFolderLayout[] = [];
    // Use childFolders order (visual order) instead of Map insertion order
    const sortedEntries = childFolders
      .map(folder => {
        const ref = folderCardRefs.current.get(folder.id);
        return ref ? [folder.id, ref] as [string, HTMLDivElement] : null;
      })
      .filter((entry): entry is [string, HTMLDivElement] => entry !== null);

    // Get all folder positions
    const folderPositions = sortedEntries.map(([id, element]) => ({
      id,
      rect: element.getBoundingClientRect(),
    }));

    // Determine column count by comparing left positions
    // Folders in same row have similar top values
    let currentRow = 0;
    let currentTop = folderPositions[0]?.rect.top ?? 0;
    const rowMap = new Map<string, number>();
    const colMap = new Map<string, number>();
    let currentCol = 0;

    for (const { id, rect } of folderPositions) {
      // New row detected (top position changed significantly)
      if (Math.abs(rect.top - currentTop) > 10) {
        currentRow++;
        currentTop = rect.top;
        currentCol = 0;
      }

      rowMap.set(id, currentRow);
      colMap.set(id, currentCol);
      currentCol++;
    }

    // Calculate zones for each folder
    for (let i = 0; i < folderPositions.length; i++) {
      const { id, rect } = folderPositions[i];
      const row = rowMap.get(id) ?? 0;
      const col = colMap.get(id) ?? 0;

      // CENTER ZONE: 80% of card area for "drop into" highlight
      const centerMargin = rect.width * 0.1; // 10% margin on each side
      const centerZone: Zone = {
        x: rect.left + centerMargin,
        y: rect.top,
        width: rect.width * 0.8,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };

      // LEFT GAP ZONE: 10% left edge + half of left gap
      // Always present - first folder uses container padding as left gap
      const isFirstInRow = col === 0;
      const leftGapZone: Zone = {
        x: isFirstInRow ? rect.left - centerMargin : rect.left - HALF_GAP,
        y: rect.top,
        width: centerMargin + (isFirstInRow ? centerMargin : HALF_GAP),
        height: rect.height,
        centerX: isFirstInRow ? rect.left - centerMargin : rect.left - HALF_GAP,
        centerY: rect.top + rect.height / 2,
      };

      // RIGHT GAP ZONE: 10% right edge + half of right gap
      // Always present - last folder uses container padding as right gap
      const nextFolder = folderPositions[i + 1];
      const isLastInRow = !nextFolder || (rowMap.get(nextFolder.id) ?? 0) > row;
      const rightGapZone: Zone = {
        x: rect.right - centerMargin,
        y: rect.top,
        width: centerMargin + (isLastInRow ? centerMargin : HALF_GAP),
        height: rect.height,
        centerX: isLastInRow ? rect.right + centerMargin : rect.right + HALF_GAP,
        centerY: rect.top + rect.height / 2,
      };

      folders.push({
        id,
        rect,
        row,
        col,
        centerZone,
        leftGapZone,
        rightGapZone,
      });
    }

    setCachedLayout(folders);
  }, [folderCardRefs, gridContainerRef, childFolders]);

  /**
   * Set up ResizeObserver to detect layout changes.
   */
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    // Initial calculation
    recalculateLayout();

    // Watch for resize
    resizeObserverRef.current = new ResizeObserver(() => {
      recalculateLayout();
    });

    resizeObserverRef.current.observe(container);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [gridContainerRef, recalculateLayout]);

  /**
   * Recalculate when childFolders changes (folders added/removed/reordered).
   */
  useEffect(() => {
    recalculateLayout();
  }, [childFolders, recalculateLayout]);

  /**
   * Determine which drop zone the mouse is currently in.
   * Uses cached layout data for efficiency.
   */
  const getDropZone = useCallback((clientOffset: { x: number; y: number }): DropZone | null => {
    const { x, y } = clientOffset;

    // Check all folders in order of priority:
    // 1. Left gap zones (mouse in gap to left of folder)
    // 2. Right gap zones (mouse in gap to right of folder)
    // 3. Center zones (mouse over folder center)

    // Check gap zones first (higher priority for precise cursor positioning)
    for (const folder of cachedLayout) {
      // Left gap zone (always exists)
      const leftZone = folder.leftGapZone;
      if (
        x >= leftZone.x &&
        x <= leftZone.x + leftZone.width &&
        y >= leftZone.y &&
        y <= leftZone.y + leftZone.height
      ) {
        return {
          type: 'gap-left',
          folderId: folder.id,
          cursorX: leftZone.centerX,
          cursorY: leftZone.y,
          cursorHeight: leftZone.height,
        };
      }

      // Right gap zone (always exists)
      const rightZone = folder.rightGapZone;
      if (
        x >= rightZone.x &&
        x <= rightZone.x + rightZone.width &&
        y >= rightZone.y &&
        y <= rightZone.y + rightZone.height
      ) {
        return {
          type: 'gap-right',
          folderId: folder.id,
          cursorX: rightZone.centerX,
          cursorY: rightZone.y,
          cursorHeight: rightZone.height,
        };
      }
    }

    // Check center zones (drop into folder)
    for (const folder of cachedLayout) {
      const zone = folder.centerZone;
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        return {
          type: 'folder-center',
          folderId: folder.id,
          rect: folder.rect,
        };
      }
    }

    return null;
  }, [cachedLayout]);

  return {
    cachedLayout,
    getDropZone,
    recalculateLayout,
  };
}
