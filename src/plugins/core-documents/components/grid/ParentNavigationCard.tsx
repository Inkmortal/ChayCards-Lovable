/**
 * ParentNavigationCard - "Go up" folder navigation card
 * Displays a special card for navigating to parent folder with drop support
 */

import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { cn } from '@/shared/lib/utils';

export interface ParentNavigationCardProps {
  parentFolder: any;
  parentFolderId: string | null;
  handleFolderMove: (draggedId: string, operation: { parentId: string | null; index: number }) => Promise<void>;
  onNavigate: () => void;
}

export const ParentNavigationCard = React.forwardRef<HTMLDivElement, ParentNavigationCardProps>(({
  parentFolder,
  parentFolderId,
  handleFolderMove,
  onNavigate
}, ref) => {
  // useDrop hook - makes parent card accept folder drops
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FOLDER',
    drop: async (item: { id: string; source: string }) => {
      // Move to parent folder - use handleFolderMove for consistency
      await handleFolderMove(item.id, {
        parentId: parentFolderId,
        index: 0  // Drop at beginning
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [parentFolderId, handleFolderMove]);

  // Callback ref to handle both drop connection and ref forwarding
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    // Handle forwarded ref
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
    // Connect drop functionality
    drop(node);
  }, [ref, drop]);

  return (
    <div
      ref={setRefs}
      onClick={onNavigate}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        // Dashed border to indicate it's special
        "p-4 rounded-2xl",
        "bg-muted/30 border-2 border-dashed border-border",
        // Hover effects (lighter than regular folders)
        "hover:bg-muted/50",
        "hover:border-primary/50",
        "hover:-translate-y-1",
        "transition-all duration-200",
        // Drop target highlight
        isOver && "ring-2 ring-primary/40 bg-primary/10 border-primary/50",
        // Boxy layout matching other cards
        "flex flex-col justify-center aspect-[4/3]"
      )}
    >
      {/* Main content - vertical centered layout like macOS */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-4">
        {/* Parent folder icon with up arrow */}
        <div className="relative">
          <Folder className="w-16 h-16 text-muted-foreground/60 drop-shadow-lg" />
          {/* Up arrow overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-muted-foreground rotate-[-90deg]" />
          </div>
        </div>

        {/* Text content - centered below icon */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          {/* Parent label */}
          <h3 className="text-base font-semibold truncate w-full text-center px-2 text-muted-foreground">
            {parentFolder?.name || 'All Files'}
          </h3>

          {/* Helper text */}
          <div className="text-xs text-muted-foreground/70">
            <span>{isOver ? 'Drop to move here' : 'Go to parent'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ParentNavigationCard.displayName = 'ParentNavigationCard';
