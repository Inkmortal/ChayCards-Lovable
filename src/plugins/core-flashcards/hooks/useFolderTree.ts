/**
 * useFolderTree Hook
 *
 * Builds enriched folder tree with:
 * - Flashcard decks grouped by folder
 * - Aggregate statistics (total decks, due cards)
 * - Recursive tree structure with expansion state
 * - Filters out folders without flashcard content
 *
 * Used by Library tab to render folder tree with decks.
 */

import { useMemo } from 'react';
import type { Folder } from '@/plugins/core-documents/types';
import type { Deck } from '../types';
import type { EnrichedFolder, FolderStats } from '../components/FolderTreeNode';

interface UseFolderTreeOptions {
  /** All folders from DocumentsService */
  folders: Folder[];
  /** All flashcard decks */
  decks: Deck[];
  /** Map of folder IDs to expansion state */
  expandedFolders: Record<string, boolean>;
}

/**
 * Build enriched folder tree with flashcard decks and aggregate stats
 */
export function useFolderTree({
  folders,
  decks,
  expandedFolders
}: UseFolderTreeOptions): EnrichedFolder[] {
  return useMemo(() => {
    // Group decks by folder
    const decksByFolder = new Map<string | null, Deck[]>();
    for (const deck of decks) {
      const folderId = deck.folderId || null;
      if (!decksByFolder.has(folderId)) {
        decksByFolder.set(folderId, []);
      }
      decksByFolder.get(folderId)!.push(deck);
    }

    // Calculate aggregate stats for a folder and its descendants
    const calculateStats = (folderId: string | null): FolderStats => {
      // Get decks directly in this folder
      const folderDecks = decksByFolder.get(folderId) || [];

      // Get child folders
      const childFolders = folders.filter(f => f.parentId === folderId);

      // Aggregate stats from children recursively
      const childStats = childFolders.map(child => calculateStats(child.id));

      // Calculate totals
      const totalDecks = folderDecks.length + childStats.reduce((sum, s) => sum + s.totalDecks, 0);
      const dueToday = folderDecks.reduce((sum, d) => sum + d.stats.dueToday, 0) +
        childStats.reduce((sum, s) => sum + s.dueToday, 0);
      const totalCards = folderDecks.reduce((sum, d) => sum + d.stats.totalCards, 0) +
        childStats.reduce((sum, s) => sum + s.totalCards, 0);

      return { totalDecks, dueToday, totalCards };
    };

    // Build enriched tree recursively
    const buildTree = (parentId: string | null): EnrichedFolder[] => {
      // Get folders at this level
      const childFolders = folders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.order - b.order);

      // Build enriched nodes
      const enriched: EnrichedFolder[] = [];

      for (const folder of childFolders) {
        const children = buildTree(folder.id);
        const folderDecks = decksByFolder.get(folder.id) || [];
        const stats = calculateStats(folder.id);

        // Only include folders that have flashcard content (directly or in descendants)
        if (stats.totalDecks > 0) {
          enriched.push({
            ...folder,
            children,
            decks: folderDecks,
            stats,
            isExpanded: expandedFolders[folder.id] || false
          });
        }
      }

      return enriched;
    };

    return buildTree(null);
  }, [folders, decks, expandedFolders]);
}
