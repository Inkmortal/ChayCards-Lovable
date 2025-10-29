import React from 'react';
import { useDragLayer } from 'react-dnd';

interface TreeDropIndicatorProps {
  dropCursor: {
    type: 'line';
    cursorX: number;      // Horizontal position (at indent level)
    cursorY: number;      // Vertical position
    lineEndX: number;     // Where line ends (right edge)
  } | {
    type: 'highlight';
    rect: DOMRect;        // Folder bounds to highlight
  } | null;
}

/**
 * Renders floating drop indicators for tree using useDragLayer.
 *
 * This component renders above all other DOM elements and shows:
 * - Horizontal line with dot (for insertion at indent level)
 * - Highlight box around folders (for dropping into folder)
 *
 * Uses useDragLayer to access drag state and render independently of drop targets.
 * Similar to grid's DropIndicator but with horizontal cursor for tree context.
 */
export const TreeDropIndicator: React.FC<TreeDropIndicatorProps> = ({ dropCursor }) => {
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  // Don't render if not dragging or no cursor
  if (!isDragging || !dropCursor) {
    return null;
  }

  if (dropCursor.type === 'line') {
    return (
      <div
        className="fixed flex items-center pointer-events-none z-50"
        style={{
          left: `${dropCursor.cursorX}px`,
          top: `${dropCursor.cursorY}px`,
          width: `${dropCursor.lineEndX - dropCursor.cursorX}px`,
          height: '2px',
        }}
      >
        {/* Dot at indent level */}
        <div
          className="absolute w-1 h-1 bg-primary rounded-full"
          style={{
            boxShadow: '0 0 0 3px #3b82f6',
            left: '-2px',  // Center on cursor position
            top: '-3px',   // Center vertically on line
          }}
        />
        {/* Horizontal line extending right */}
        <div className="w-full h-0.5 bg-primary rounded-full" />
      </div>
    );
  }

  if (dropCursor.type === 'highlight') {
    return (
      <div
        className="fixed ring-2 ring-primary ring-inset bg-primary/5 pointer-events-none z-40 rounded-lg"
        style={{
          left: `${dropCursor.rect.left}px`,
          top: `${dropCursor.rect.top}px`,
          width: `${dropCursor.rect.width}px`,
          height: `${dropCursor.rect.height}px`,
        }}
      />
    );
  }

  return null;
};
