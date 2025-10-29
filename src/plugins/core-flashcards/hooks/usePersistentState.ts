/**
 * usePersistentState Hook
 *
 * Generic hook for persisting state to localStorage with type safety.
 * Used by FlashcardHome to persist user preferences across sessions.
 *
 * @example
 * const [viewMode, setViewMode] = usePersistentState<ViewMode>(
 *   'flashcards:viewMode',
 *   'simple'
 * );
 */

import { useState, useEffect } from 'react';

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from localStorage or default
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[usePersistentState] Failed to load ${key}:`, error);
    }
    return defaultValue;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`[usePersistentState] Failed to save ${key}:`, error);
    }
  }, [key, state]);

  return [state, setState];
}
