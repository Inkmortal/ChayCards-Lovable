/**
 * BreadcrumbBar - Navigation breadcrumbs with back/forward history buttons
 *
 * Features:
 * - Back/forward buttons with browser-style navigation
 * - Clickable breadcrumb trail showing current location
 * - Disabled state when at start/end of history
 * - Keyboard shortcuts (Alt+←/→, Cmd/Ctrl+[/])
 *
 * @example
 * <BreadcrumbBar
 *   tab={activeTab}
 *   canGoBack={canGoBack(activeTab.id)}
 *   canGoForward={canGoForward(activeTab.id)}
 *   onGoBack={() => goBack(activeTab.id)}
 *   onGoForward={() => goForward(activeTab.id)}
 *   onNavigateToFolder={(folderId) => navigateToFolder(folderId)}
 * />
 */

import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DocumentTabType, BreadcrumbItem } from '../types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/renderer/components/ui/button';

export interface BreadcrumbBarProps {
  /** Current tab to show breadcrumbs for */
  tab: DocumentTabType;

  /** Can go back in history? */
  canGoBack: boolean;

  /** Can go forward in history? */
  canGoForward: boolean;

  /** Go back callback */
  onGoBack: () => void;

  /** Go forward callback */
  onGoForward: () => void;

  /** Navigate to folder callback */
  onNavigateToFolder: (folderId: string | null) => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  tab,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onNavigateToFolder
}) => {
  /**
   * Keyboard shortcuts for navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+← = Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) onGoBack();
      }

      // Alt+→ = Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoForward) onGoForward();
      }

      // Cmd/Ctrl+[ = Back (VS Code style)
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        if (canGoBack) onGoBack();
      }

      // Cmd/Ctrl+] = Forward (VS Code style)
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        if (canGoForward) onGoForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, onGoBack, onGoForward]);

  /**
   * Handle breadcrumb click
   */
  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    // For document tabs, clicking breadcrumb navigates to folder
    // For grid tabs, clicking breadcrumb navigates to folder
    onNavigateToFolder(item.folderId);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 shrink-0',
          !canGoBack && 'opacity-40 cursor-not-allowed'
        )}
        onClick={onGoBack}
        disabled={!canGoBack}
        title="Go back (Alt+←)"
        aria-label="Go back in history"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Forward button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-7 w-7 shrink-0',
          !canGoForward && 'opacity-40 cursor-not-allowed'
        )}
        onClick={onGoForward}
        disabled={!canGoForward}
        title="Go forward (Alt+→)"
        aria-label="Go forward in history"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Separator */}
      <div className="h-4 w-px bg-border shrink-0" />

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 text-sm min-w-0 flex-1">
        {tab.breadcrumb.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <button
              onClick={() => handleBreadcrumbClick(item)}
              className={cn(
                'hover:text-primary transition-colors truncate',
                index === tab.breadcrumb.length - 1 && tab.type === 'document'
                  ? 'text-muted-foreground cursor-default hover:text-muted-foreground'
                  : 'text-foreground'
              )}
              disabled={index === tab.breadcrumb.length - 1 && tab.type === 'document'}
              title={item.name}
            >
              {item.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Dirty indicator for document tabs */}
      {tab.type === 'document' && tab.isDirty && (
        <div
          className="h-2 w-2 rounded-full bg-warning shrink-0"
          title="Unsaved changes"
          aria-label="Unsaved changes"
        />
      )}
    </div>
  );
};
