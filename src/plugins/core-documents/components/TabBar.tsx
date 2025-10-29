/**
 * TabBar - Tab management UI component
 *
 * Features:
 * - Horizontal scrollable tab list
 * - Active tab highlighting
 * - Close buttons (with dirty indicator)
 * - New tab button
 * - Tab icons from FileHandler
 * - Keyboard shortcuts (Cmd/Ctrl+W to close, Cmd/Ctrl+1-9 to switch)
 *
 * @example
 * <TabBar
 *   tabs={tabs}
 *   activeTabId={activeTabId}
 *   onTabClick={(id) => switchTab(id)}
 *   onTabClose={(id) => closeTab(id)}
 *   onNewTab={() => addGridTab(null)}
 * />
 */

import React, { useEffect } from 'react';
import { X, Plus, FolderOpen, FileText } from 'lucide-react';
import type { DocumentTabType, FileHandlerIcon } from '../types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/renderer/components/ui/button';

export interface TabBarProps {
  /** Array of tabs to display */
  tabs: DocumentTabType[];

  /** ID of currently active tab */
  activeTabId: string;

  /** Tab click handler */
  onTabClick: (tabId: string) => void;

  /** Tab close handler */
  onTabClose: (tabId: string) => void;

  /** New tab handler */
  onNewTab: () => void;
}

/**
 * Render icon from FileHandlerIcon
 */
const renderHandlerIcon = (icon: FileHandlerIcon, className?: string) => {
  if (icon.type === 'emoji') {
    return <span className={cn('text-base', className)}>{icon.emoji}</span>;
  }

  if (icon.type === 'lucide') {
    // For now, fallback to FileText for lucide icons
    // In production, would dynamically import lucide icons
    return <FileText className={className} />;
  }

  if (icon.type === 'component') {
    // Custom components would be rendered via PluginManager
    return <FileText className={className} />;
  }

  return null;
};

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab
}) => {
  /**
   * Keyboard shortcuts for tab management
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+W = Close active tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab?.closeable) {
          onTabClose(activeTabId);
        }
      }

      // Cmd/Ctrl+1-9 = Switch to tab N
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          onTabClick(tabs[index].id);
        }
      }

      // Cmd/Ctrl+T = New tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        onNewTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, onTabClick, onTabClose, onNewTab]);

  return (
    <div className="flex items-center border-b bg-background">
      {/* Tab list - scrollable */}
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 border-r cursor-pointer min-w-0 max-w-[200px]',
                'hover:bg-accent/50 transition-colors',
                isActive && 'bg-primary/10 border-b-2 border-b-primary'
              )}
              onClick={() => onTabClick(tab.id)}
              title={tab.title}
            >
              {/* Tab icon */}
              <div className="shrink-0">
                {tab.type === 'grid' ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  renderHandlerIcon(tab.handler.icon, 'h-4 w-4 text-muted-foreground')
                )}
              </div>

              {/* Tab title */}
              <span className={cn(
                'text-sm truncate flex-1 min-w-0',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}>
                {tab.title}
              </span>

              {/* Dirty indicator */}
              {tab.type === 'document' && tab.isDirty && (
                <div
                  className="h-2 w-2 rounded-full bg-warning shrink-0"
                  title="Unsaved changes"
                />
              )}

              {/* Close button */}
              {tab.closeable && (
                <button
                  className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity rounded inline-flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  title="Close tab (Cmd/Ctrl+W)"
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New tab button - sticky on right */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-none border-l"
        onClick={onNewTab}
        title="New tab (Cmd/Ctrl+T)"
        aria-label="Open new tab"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
