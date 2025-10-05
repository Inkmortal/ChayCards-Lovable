/**
 * SplitView Component - Two-panel layout with resizable divider
 * Provides master-detail, sidebar-content, or other split layouts
 */

import { useState, useRef, useEffect } from 'react';

export interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSize?: number; // Percentage (0-100)
  minSize?: number; // Minimum percentage for left panel
  maxSize?: number; // Maximum percentage for left panel
  resizable?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Split View component for two-panel layouts
 *
 * @example
 * ```tsx
 * <SplitView
 *   left={<DocumentList />}
 *   right={<DocumentEditor />}
 *   defaultSize={30}
 *   resizable
 * />
 * ```
 */
export const SplitView: React.FC<SplitViewProps> = ({
  left,
  right,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  resizable = true,
  orientation = 'horizontal',
  className = '',
}) => {
  const [leftSize, setLeftSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    if (resizable) {
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSize: number;

      if (orientation === 'horizontal') {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      }

      // Clamp to min/max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setLeftSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, orientation, minSize, maxSize]);

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} h-full ${className}`}
    >
      {/* Left/Top Panel */}
      <div
        style={{
          [isHorizontal ? 'width' : 'height']: `${leftSize}%`,
        }}
        className="overflow-auto"
      >
        {left}
      </div>

      {/* Resizable Divider */}
      {resizable && (
        <div
          onMouseDown={handleMouseDown}
          className={`
            flex-shrink-0 bg-border hover:bg-accent transition-colors
            ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
            ${isDragging ? 'bg-accent' : ''}
          `}
        />
      )}

      {/* Right/Bottom Panel */}
      <div className="flex-1 overflow-auto">
        {right}
      </div>
    </div>
  );
};
