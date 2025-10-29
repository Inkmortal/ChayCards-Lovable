/**
 * Flashcards Hooks
 *
 * Custom React hooks for FlashcardHome state management:
 * - usePersistentState: localStorage-backed state
 * - useFolderTree: Enriched folder tree with decks
 * - useDueCards: Due card calculation for Today's Focus
 */

export { usePersistentState } from './usePersistentState';
export { useFolderTree } from './useFolderTree';
export { useDueCards, type FocusMode, type DueDeck } from './useDueCards';
