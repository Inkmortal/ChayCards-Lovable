/**
 * BreadcrumbFolder - Breadcrumb navigation item
 * Displays a clickable breadcrumb with drop-target functionality
 */

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/shared/lib/utils';

export interface BreadcrumbFolderProps {
  folder: { id: string; name: string } | null;
  isActive: boolean;
  onClick: () => void;
  onDrop: (draggedId: string, source: string) => Promise<void>;
}

export const BreadcrumbFolder: React.FC<BreadcrumbFolderProps> = ({
  folder,
  isActive,
  onClick,
  onDrop
}) => {
  const internalRef = useRef<HTMLButtonElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FOLDER',
    drop: async (item: { id: string; source: string }) => {
      const targetId = folder?.id || null;

      // Don't drop on self
      if (item.id === targetId) return;

      console.log(`[Breadcrumb] Drop ${item.id} (from ${item.source}) onto ${folder?.name || 'All Files'}`);
      await onDrop(item.id, item.source);
    },
    canDrop: (item) => {
      return item.id !== (folder?.id || null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
      canDrop: monitor.canDrop(),
    }),
  }), [folder, onDrop]);

  // Callback ref to handle drop connection
  const setRefs = React.useCallback((node: HTMLButtonElement | null) => {
    // Store in internal ref
    internalRef.current = node;

    // Connect drop functionality
    drop(node);
  }, [drop]);

  return (
    <button
      ref={setRefs}
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-all px-2 py-1 rounded",
        isActive
          ? "text-foreground underline underline-offset-4"
          : "text-muted-foreground hover:text-foreground",
        // Drop feedback
        isOver && "bg-primary/20 ring-1 ring-primary/40",
        canDrop && !isOver && "hover:bg-muted/50"
      )}
    >
      {folder?.name || 'All Files'}
    </button>
  );
};
