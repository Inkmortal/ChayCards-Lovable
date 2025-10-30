/**
 * Core Flashcards Plugin
 *
 * Provides spaced repetition flashcard system with:
 * - Custom HTML templates
 * - Field-level interactions (type-answer, cloze, etc.)
 * - SM-2 spaced repetition algorithm
 * - Multiple study modes
 * - Statistics dashboard
 * - Import/export (Anki, CSV, Quizlet)
 */

import type { Plugin } from '@/shared/plugin-system/types';
import { FlashcardService } from './services/FlashcardService';
import type { FileHandler, DocumentsService } from '@/plugins/core-documents';

// Components
import FlashcardHome from './components/FlashcardHome';
import DeckView from './components/DeckView';
import CardEditor from './components/CardEditor';
import StudySession from './components/StudySession';
import DeckSettings from './components/DeckSettings';

export const flashcardsPlugin: Plugin = {
  id: 'chaycards/core-flashcards',
  name: 'Flashcards',
  version: '1.0.0',
  author: {
    username: 'chaycards',
    displayName: 'ChayCards Team'
  },
  description: 'Spaced repetition learning system with customizable templates',

  dependencies: {
    requires: {
      'chaycards/core-ui': '^1.0.0',
      'chaycards/core-documents': '^1.0.0'
    }
  }, // Integrates with documents for folder organization

  // Components (auto-namespaced to 'chaycards/core-flashcards/ComponentName')
  components: {
    'FlashcardHome': FlashcardHome,
    'DeckView': DeckView,
    'CardEditor': CardEditor,
    'StudySession': StudySession,
    'DeckSettings': DeckSettings,
    // Statistics and others to be added later
  },

  // Services
  services: {},

  // Routes
  routes: [
    {
      path: '/app/flashcards',
      component: 'chaycards/core-flashcards/FlashcardHome',
      label: 'Flashcards',
      icon: 'Brain',
      showInNav: true,
      order: 30,
    },
    {
      path: '/app/flashcards/deck/:deckId',
      component: 'chaycards/core-flashcards/DeckView',
    },
    {
      path: '/app/flashcards/deck/:deckId/card/new',
      component: 'chaycards/core-flashcards/CardEditor',
    },
    {
      path: '/app/flashcards/deck/:deckId/card/:cardId',
      component: 'chaycards/core-flashcards/CardEditor',
    },
    {
      path: '/app/flashcards/study/:deckId',
      component: 'chaycards/core-flashcards/StudySession',
    },
    // Statistics and other routes to be added later
  ],

  // Navigation routes for Documents integration
  // Maps component names to route builder functions for standalone mode
  navigationRoutes: {
    'chaycards/core-flashcards/FlashcardHome': () => '/app/flashcards',
    'chaycards/core-flashcards/DeckView': (props) => `/app/flashcards/deck/${props.fileId || props.deckId}`,
    'chaycards/core-flashcards/CardEditor': (props) => {
      if (props.mode === 'create') {
        return `/app/flashcards/deck/${props.deckId}/card/new`;
      }
      return `/app/flashcards/deck/${props.deckId}/card/${props.cardId}`;
    },
    'chaycards/core-flashcards/StudySession': (props) => `/app/flashcards/study/${props.deckId}`,
  },

  async onLoad(manager) {
    console.log('[FlashcardsPlugin] Loading...');

    // Get dependencies
    const eventBus = manager.getEventBus();
    const storage = manager.getStorage();

    if (!storage) {
      console.warn('[FlashcardsPlugin] Storage not available (public page?)');
      return;
    }

    // Initialize service
    const service = new FlashcardService(eventBus);

    // Register service (will be namespaced to 'chaycards/core-flashcards/flashcardService')
    manager.setService('chaycards/core-flashcards/flashcardService', service);

    // Initialize with PluginManager and Storage (sets up default folder and event listeners)
    await service.initialize(manager, storage);

    // Get DocumentsService to register FileHandler
    const documentsService = manager.getService<DocumentsService>('chaycards/core-documents/documentsService');

    if (documentsService) {
      // Register FileHandler for flashcard decks
      const deckHandler: FileHandler = {
        id: 'flashcard-deck-handler',
        pluginId: 'chaycards/core-flashcards',
        name: 'Flashcard Deck',
        icon: { type: 'emoji', emoji: '🎴' },
        extensions: ['.deck'],
        mimeTypes: ['application/x-flashcard-deck'],
        viewerComponent: 'chaycards/core-flashcards/DeckView',
        editorComponent: 'chaycards/core-flashcards/DeckView', // Same component for now
        settingsComponent: 'chaycards/core-flashcards/DeckSettings', // Settings modal
        priority: 100,

        // Bidirectional sync callbacks
        onFileUpdated: async (fileId: string, updates: Partial<any>) => {
          await service.syncFromStoredFile(fileId, updates);
        },
        onFileDeleted: async (fileId: string) => {
          await service.deleteDeck(fileId);
        },
        onFileMoved: async (fileId: string, oldFolderId: string | null, newFolderId: string | null) => {
          await service.updateDeck(fileId, { folderId: newFolderId });
        },
      };

      documentsService.registerFileHandler(deckHandler);
      console.log('[FlashcardsPlugin] Registered FileHandler for flashcard decks with bidirectional sync');

      // Listen for file creation requests from Documents UI
      eventBus.on('file:create-requested', async ({ handlerId, pluginId, folderId }) => {
        if (handlerId === 'flashcard-deck-handler') {
          try {
            // Create a new deck via FlashcardService
            // FlashcardService.createDeck() now handles StoredFile creation automatically
            const deck = await service.createDeck('New Deck', {
              description: '',
              folderId: folderId || null
            });

            console.log('[FlashcardsPlugin] Created deck:', deck.id);

            // Emit success event for UI feedback
            eventBus.emit('file:created', {
              type: 'flashcard-deck',
              deckId: deck.id,
              name: deck.name
            });

          } catch (error) {
            console.error('[FlashcardsPlugin] Failed to create deck:', error);
          }
        }
      });
    } else {
      console.warn('[FlashcardsPlugin] DocumentsService not available - FileHandler not registered');
    }

    console.log('[FlashcardsPlugin] Loaded successfully');
  },

  async onUnload() {
    console.log('[FlashcardsPlugin] Unloading...');
    // Cleanup event listeners, timers, etc.
    // Service will be garbage collected
  },
};

// Export plugin as default (required for PluginManager discovery)
export default flashcardsPlugin;

// Export types and utilities for other plugins
export * from './types';
export * from './constants';
export { FlashcardService } from './services/FlashcardService';
export { useFlashcards } from './hooks/useFlashcards';
