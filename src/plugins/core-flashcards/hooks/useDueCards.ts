/**
 * useDueCards Hook
 *
 * Calculates due cards for Today's Focus widget:
 * - Filters to active decks (starred)
 * - Groups by focus mode (Combined, By Deck, By Folder)
 * - Returns sorted deck list with due counts
 *
 * Used by Focus tab to render Today's Focus section.
 */

import { useMemo } from 'react';
import type { Deck } from '../types';

export type FocusMode = 'combined' | 'by-deck' | 'by-folder';

interface UseDueCardsOptions {
  /** All flashcard decks */
  decks: Deck[];
  /** Current focus mode */
  focusMode: FocusMode;
}

export interface DueDeck {
  /** Deck ID */
  id: string;
  /** Deck name */
  name: string;
  /** Folder ID (null = root) */
  folderId: string | null;
  /** Number of cards due today */
  dueToday: number;
  /** Total cards in deck */
  totalCards: number;
  /** Is this deck active (starred)? */
  isActive: boolean;
}

/**
 * Get decks with due cards for Today's Focus
 */
export function useDueCards({ decks, focusMode }: UseDueCardsOptions) {
  // Filter to active decks with due cards
  const activeDecksWithDue = useMemo(() => {
    return decks
      .filter(deck => deck.isActive && deck.stats.dueToday > 0)
      .map(deck => ({
        id: deck.id,
        name: deck.name,
        folderId: deck.folderId || null,
        dueToday: deck.stats.dueToday,
        totalCards: deck.stats.totalCards,
        isActive: deck.isActive
      }))
      .sort((a, b) => b.dueToday - a.dueToday); // Sort by due count desc
  }, [decks]);

  // Calculate total due cards
  const totalDue = useMemo(() => {
    return activeDecksWithDue.reduce((sum, deck) => sum + deck.dueToday, 0);
  }, [activeDecksWithDue]);

  // Group by folder if focus mode is 'by-folder'
  const decksByFolder = useMemo(() => {
    if (focusMode !== 'by-folder') return null;

    const folderMap = new Map<string | null, DueDeck[]>();
    for (const deck of activeDecksWithDue) {
      if (!folderMap.has(deck.folderId)) {
        folderMap.set(deck.folderId, []);
      }
      folderMap.get(deck.folderId)!.push(deck);
    }

    return folderMap;
  }, [activeDecksWithDue, focusMode]);

  return {
    /** Active decks with due cards */
    dueDecks: activeDecksWithDue,
    /** Total due cards across all active decks */
    totalDue,
    /** Decks grouped by folder (only for 'by-folder' mode) */
    decksByFolder
  };
}
