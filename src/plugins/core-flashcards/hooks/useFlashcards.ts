/**
 * useFlashcards Hook
 *
 * React hook for managing flashcard operations (cards, decks, templates).
 * Provides reactive state management with real-time updates via EventBus.
 */

import { useState, useEffect, useCallback } from 'react';
import { PluginManager } from '@/shared/plugin-system';
import type {
  Card,
  Deck,
  CardTemplate,
  DeckStats,
  StudySession,
} from '../types';
import type { FlashcardService } from '../services/FlashcardService';

export function useFlashcards(service: FlashcardService) {
  // Get EventBus from PluginManager
  const manager = PluginManager.getInstance();
  const eventBus = manager.getEventBus();

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Record<string, Card[]>>({});
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ==========================================================================
  // LOAD DATA
  // ==========================================================================

  const loadDecks = useCallback(async () => {
    if (!service) return;
    try {
      const loadedDecks = await service.getDecks();
      setDecks(loadedDecks);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load decks:', err);
    }
  }, [service]);

  const loadCards = useCallback(async (deckId: string) => {
    if (!service) return;
    try {
      const loadedCards = await service.getCards(deckId);
      setCards(prev => ({ ...prev, [deckId]: loadedCards }));
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to load cards for deck ${deckId}:`, err);
    }
  }, [service]);

  const loadTemplates = useCallback(async () => {
    if (!service) return;
    try {
      const loadedTemplates = await service.getTemplates();
      setTemplates(loadedTemplates);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load templates:', err);
    }
  }, [service]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadDecks(),
        loadTemplates(),
      ]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loadDecks, loadTemplates]);

  // Initial load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ==========================================================================
  // DECK OPERATIONS
  // ==========================================================================

  const createDeck = useCallback(async (
    name: string,
    options?: {
      description?: string;
      folderId?: string | null;
      preset?: 'relaxed' | 'balanced' | 'intense';
    }
  ) => {
    try {
      const deck = await service.createDeck(name, options);
      setDecks(prev => [...prev, deck]);
      return deck;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const updateDeck = useCallback(async (deckId: string, updates: Partial<Deck>) => {
    try {
      const updated = await service.updateDeck(deckId, updates);
      setDecks(prev => prev.map(d => d.id === deckId ? updated : d));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      await service.deleteDeck(deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      setCards(prev => {
        const { [deckId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const getDeckStats = useCallback((deckId: string): DeckStats | null => {
    const deck = decks.find(d => d.id === deckId);
    return deck?.stats || null;
  }, [decks]);

  // ==========================================================================
  // CARD OPERATIONS
  // ==========================================================================

  const createCard = useCallback(async (
    deckId: string,
    templateId: string,
    fields: Record<string, string | number | boolean | string[] | null>,
    options?: {
      tags?: string[];
      mediaFiles?: Record<string, string>;
    }
  ) => {
    try {
      const card = await service.createCard(deckId, templateId, fields, options);
      setCards(prev => ({
        ...prev,
        [deckId]: [...(prev[deckId] || []), card],
      }));

      // Refresh deck stats
      const deck = await service.getDeck(deckId);
      if (deck) {
        setDecks(prev => prev.map(d => d.id === deckId ? deck : d));
      }

      return card;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    try {
      const updated = await service.updateCard(cardId, updates);
      const deckId = updated.deckId;

      setCards(prev => ({
        ...prev,
        [deckId]: (prev[deckId] || []).map(c => c.id === cardId ? updated : c),
      }));

      // Refresh deck stats
      const deck = await service.getDeck(deckId);
      if (deck) {
        setDecks(prev => prev.map(d => d.id === deckId ? deck : d));
      }

      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const deleteCard = useCallback(async (cardId: string, deckId: string) => {
    try {
      await service.deleteCard(cardId);
      setCards(prev => ({
        ...prev,
        [deckId]: (prev[deckId] || []).filter(c => c.id !== cardId),
      }));

      // Refresh deck stats
      const deck = await service.getDeck(deckId);
      if (deck) {
        setDecks(prev => prev.map(d => d.id === deckId ? deck : d));
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const uploadMediaFile = useCallback(async (
    cardId: string,
    fieldName: string,
    file: File
  ): Promise<string> => {
    try {
      return await service.uploadMediaFile(cardId, fieldName, file);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  // ==========================================================================
  // TEMPLATE OPERATIONS
  // ==========================================================================

  const createTemplate = useCallback(async (
    template: Omit<CardTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>
  ) => {
    try {
      const created = await service.createTemplate(template);
      setTemplates(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<CardTemplate>
  ) => {
    try {
      const updated = await service.updateTemplate(templateId, updates);
      setTemplates(prev => prev.map(t => t.id === templateId ? updated : t));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await service.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  // ==========================================================================
  // STUDY OPERATIONS
  // ==========================================================================

  const getDueCards = useCallback(async (deckId: string, limit?: number) => {
    try {
      return await service.getDueCards(deckId, limit);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const gradeCard = useCallback(async (
    cardId: string,
    grade: 1 | 2 | 3 | 4,
    timeSpent: number
  ) => {
    try {
      const newState = await service.gradeCard(cardId, grade, timeSpent);

      // Update card in state
      const card = await service.getCard(cardId);
      if (card) {
        setCards(prev => ({
          ...prev,
          [card.deckId]: (prev[card.deckId] || []).map(c =>
            c.id === cardId ? card : c
          ),
        }));
      }

      return newState;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const startStudySession = useCallback(async (
    deckId: string,
    mode: StudySession['mode']
  ) => {
    try {
      return await service.startStudySession(deckId, mode);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const endStudySession = useCallback(async (session: StudySession) => {
    try {
      await service.endStudySession(session);

      // Refresh deck stats
      const deck = await service.getDeck(session.deckId);
      if (deck) {
        setDecks(prev => prev.map(d => d.id === session.deckId ? deck : d));
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  // ==========================================================================
  // EVENT BUS SUBSCRIPTIONS
  // ==========================================================================

  useEffect(() => {
    if (!eventBus) return;

    // Create handler references so we can unsubscribe later
    const handleDeckCreated = () => loadDecks();
    const handleDeckUpdated = () => loadDecks();
    const handleDeckDeleted = () => loadDecks();
    const handleCardCreated = ({ card }: any) => loadCards(card.deckId);
    const handleCardUpdated = ({ card }: any) => loadCards(card.deckId);
    const handleCardDeleted = () => loadDecks(); // Refresh stats
    const handleTemplateCreated = () => loadTemplates();
    const handleTemplateUpdated = () => loadTemplates();
    const handleTemplateDeleted = () => loadTemplates();

    // Subscribe to events
    eventBus.on('flashcards:deck:created', handleDeckCreated);
    eventBus.on('flashcards:deck:updated', handleDeckUpdated);
    eventBus.on('flashcards:deck:deleted', handleDeckDeleted);
    eventBus.on('flashcards:card:created', handleCardCreated);
    eventBus.on('flashcards:card:updated', handleCardUpdated);
    eventBus.on('flashcards:card:deleted', handleCardDeleted);
    eventBus.on('flashcards:template:created', handleTemplateCreated);
    eventBus.on('flashcards:template:updated', handleTemplateUpdated);
    eventBus.on('flashcards:template:deleted', handleTemplateDeleted);

    // Cleanup: unsubscribe using eventBus.off()
    return () => {
      eventBus.off('flashcards:deck:created', handleDeckCreated);
      eventBus.off('flashcards:deck:updated', handleDeckUpdated);
      eventBus.off('flashcards:deck:deleted', handleDeckDeleted);
      eventBus.off('flashcards:card:created', handleCardCreated);
      eventBus.off('flashcards:card:updated', handleCardUpdated);
      eventBus.off('flashcards:card:deleted', handleCardDeleted);
      eventBus.off('flashcards:template:created', handleTemplateCreated);
      eventBus.off('flashcards:template:updated', handleTemplateUpdated);
      eventBus.off('flashcards:template:deleted', handleTemplateDeleted);
    };
  }, [eventBus, loadDecks, loadCards, loadTemplates]);

  // ==========================================================================
  // RETURN VALUES
  // ==========================================================================

  return {
    // State
    decks,
    cards,
    templates,
    loading,
    error,

    // Deck operations
    createDeck,
    updateDeck,
    deleteDeck,
    getDeckStats,
    loadCards,

    // Card operations
    createCard,
    updateCard,
    deleteCard,
    uploadMediaFile,

    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Study operations
    getDueCards,
    gradeCard,
    startStudySession,
    endStudySession,

    // Utils
    reload: loadAll,
  };
}
