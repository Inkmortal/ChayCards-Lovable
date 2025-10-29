/**
 * FolderTreeNode Component
 *
 * Expandable folder row for the Library tab with:
 * - Folder name, color, and icon
 * - Aggregate statistics (total decks, due cards)
 * - Expandable/collapsible with indented children
 * - Hover actions (Study, context menu)
 * - Renders child folders and decks
 *
 * Uses "fat row" list view with visual hierarchy via indentation.
 */

import React from 'react';
import { ChevronRight, ChevronDown, Folder, Play, MoreVertical } from 'lucide-react';
import type { Folder as FolderType } from '@/plugins/core-documents/types';
import { Deck } from '../types';
import { DeckRow, ViewMode } from './DeckRow';

export interface EnrichedFolder extends FolderType {
  /** Direct child folders */
  children: EnrichedFolder[];
  /** Decks directly in this folder */
  decks: Deck[];
  /** Aggregate stats (includes all descendants) */
  stats: FolderStats;
  /** Expansion state */
  isExpanded: boolean;
}

export interface FolderStats {
  /** Total decks in folder tree */
  totalDecks: number;
  /** Total due cards across all decks */
  dueToday: number;
  /** Total cards across all decks */
  totalCards: number;
}

interface FolderTreeNodeProps {
  /** Folder data with children and decks */
  folder: EnrichedFolder;
  /** Current view mode for decks */
  viewMode: ViewMode;
  /** Current indentation level (0 = root) */
  depth?: number;
  /** Callback when folder expand/collapse is toggled */
  onToggleExpand: (folderId: string) => void;
  /** Callback when deck is opened */
  onOpenDeck: (deckId: string) => void;
  /** Callback when study folder is clicked */
  onStudyFolder: (folderId: string) => void;
  /** Callback when deck study is clicked */
  onStudyDeck: (deckId: string) => void;
  /** Callback when deck active status is toggled */
  onToggleDeckActive: (deckId: string) => void;
  /** Callback when folder context menu is opened */
  onFolderContextMenu?: (folderId: string, event: React.MouseEvent) => void;
  /** Callback when deck context menu is opened */
  onDeckContextMenu?: (deckId: string, event: React.MouseEvent) => void;
}

export const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  folder,
  viewMode,
  depth = 0,
  onToggleExpand,
  onOpenDeck,
  onStudyFolder,
  onStudyDeck,
  onToggleDeckActive,
  onFolderContextMenu,
  onDeckContextMenu
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const hasChildren = folder.children.length > 0 || folder.decks.length > 0;
  const hasDueCards = folder.stats.dueToday > 0;
  const indentWidth = depth * 24; // 24px per level

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(folder.id);
  };

  const handleStudyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStudyFolder(folder.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFolderContextMenu?.(folder.id, e);
  };

  // Determine folder color (hex value or default gray)
  const folderColorClass = folder.color
    ? ''
    : 'text-gray-500 dark:text-gray-400';

  const folderStyle = folder.color
    ? { color: folder.color }
    : undefined;

  return (
    <div className="select-none">
      {/* Folder row */}
      <div
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        style={{ paddingLeft: `${16 + indentWidth}px` }}
        onClick={handleToggleExpand}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/collapse icon */}
        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            {folder.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacer for alignment
        )}

        {/* Folder icon */}
        <Folder
          className={`w-5 h-5 flex-shrink-0 ${folderColorClass}`}
          style={folderStyle}
        />

        {/* Folder name */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {folder.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          {hasDueCards && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {folder.stats.dueToday} due
            </span>
          )}
          <span>{folder.stats.totalDecks} decks</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Study folder button (on hover) */}
          {isHovered && hasDueCards && (
            <button
              onClick={handleStudyClick}
              className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
              title="Study all decks in folder"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {/* Context menu */}
          <button
            onClick={handleContextMenu}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children (folders and decks) - only when expanded */}
      {folder.isExpanded && hasChildren && (
        <div>
          {/* Child folders */}
          {folder.children.map(childFolder => (
            <FolderTreeNode
              key={childFolder.id}
              folder={childFolder}
              viewMode={viewMode}
              depth={depth + 1}
              onToggleExpand={onToggleExpand}
              onOpenDeck={onOpenDeck}
              onStudyFolder={onStudyFolder}
              onStudyDeck={onStudyDeck}
              onToggleDeckActive={onToggleDeckActive}
              onFolderContextMenu={onFolderContextMenu}
              onDeckContextMenu={onDeckContextMenu}
            />
          ))}

          {/* Decks in this folder */}
          {folder.decks.map(deck => (
            <div
              key={deck.id}
              style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}
            >
              <DeckRow
                deck={deck}
                viewMode={viewMode}
                onOpen={onOpenDeck}
                onStudy={onStudyDeck}
                onToggleActive={onToggleDeckActive}
                onContextMenu={onDeckContextMenu}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
