import React from 'react';
import { useDragLayer } from 'react-dnd';
import type { DropZone } from '../hooks/useGridLayoutManager';

interface DropIndicatorProps {
  currentDropZone: DropZone | null;
}

/**
 * Renders floating drop indicators using useDragLayer.
 *
 * This component renders above all other DOM elements and shows:
 * - Vertical cursor in gaps (gap-left, gap-right)
 * - Highlight box around folders (folder-center)
 *
 * Uses useDragLayer to access drag state and render independently of drop targets.
 */
export const DropIndicator: React.FC<DropIndicatorProps> = ({ currentDropZone }) => {
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  // Don't render if not dragging or no drop zone
  if (!isDragging || !currentDropZone) {
    return null;
  }

  // Render vertical cursor for gap zones
  if (currentDropZone.type === 'gap-left' || currentDropZone.type === 'gap-right') {
    return (
      <div
        className="fixed flex flex-col items-center pointer-events-none z-50"
        style={{
          left: `${currentDropZone.cursorX}px`,
          top: `${currentDropZone.cursorY}px`,
          height: `${currentDropZone.cursorHeight}px`,
        }}
      >
        {/* Top circle */}
        <div
          className="w-1 h-1 bg-primary rounded-full flex-shrink-0"
          style={{ boxShadow: '0 0 0 3px #3b82f6' }}
        />
        {/* Vertical line */}
        <div className="w-0.5 flex-1 bg-primary rounded-full" />
        {/* Bottom circle */}
        <div
          className="w-1 h-1 bg-primary rounded-full flex-shrink-0"
          style={{ boxShadow: '0 0 0 3px #3b82f6' }}
        />
      </div>
    );
  }

  // Render highlight box for folder-center zone
  if (currentDropZone.type === 'folder-center') {
    return (
      <div
        className="fixed ring-2 ring-primary ring-inset bg-primary/5 pointer-events-none z-40 rounded-2xl"
        style={{
          left: `${currentDropZone.rect.left}px`,
          top: `${currentDropZone.rect.top}px`,
          width: `${currentDropZone.rect.width}px`,
          height: `${currentDropZone.rect.height}px`,
        }}
      />
    );
  }

  return null;
};
