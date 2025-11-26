/**
 * FlashcardService
 *
 * Core service for managing flashcards, decks, and templates.
 * Handles CRUD operations, spaced repetition scheduling, and study sessions.
 */

import type {
  Card,
  CardTemplate,
  Deck,
  DeckStats,
  CardState,
  StudySession,
  CardReview,
  UserStatistics,
  FolderTreeNode,
  FolderStats,
} from '../types';
import {
  STORAGE_KEYS,
  DEFAULT_CARD_STATE,
  DEFAULT_DECK_STATS,
  BUILT_IN_TEMPLATES,
  SR_PRESETS,
  SM2_DEFAULTS,
} from '../constants';
import { EventBus } from '@/services/eventBus';
import type { PluginManager, StorageAdapter } from '@/shared/plugin-system/types';
import type { DocumentsService, Folder, StoredFile } from '@/plugins/core-documents';
import { FOLDER_CONFIG, STORAGE_KEYS as DOCUMENTS_STORAGE_KEYS } from '@/plugins/core-documents/constants';
import { buildPluginStorageKey } from '@/shared/constants';

export class FlashcardService {
  private eventBus: EventBus;
  private storage: StorageAdapter | null = null;
  private manager: PluginManager | null = null;
  private defaultFolderId: string | null = null;
  private initialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Initialize service with PluginManager and StorageAdapter
   * Must be called after plugin onLoad
   */
  async initialize(manager: PluginManager, storage: StorageAdapter): Promise<void> {
    if (this.initialized) {
      console.log('[FlashcardService] Already initialized');
      return;
    }

    this.manager = manager;
    this.storage = storage;

    // Get DocumentsService for folder management
    const documentsService = manager.getService<DocumentsService>('chaycards/core-documents/documentsService');

    if (!documentsService) {
      console.warn('[FlashcardService] DocumentsService not available - folder integration disabled');
      this.initialized = true;
      return;
    }

    // Check if "Flashcards" folder already exists (don't create it yet - lazy creation)
    const folders = await documentsService.getFolders();
    const flashcardsFolder = folders.find(
      (f: Folder) => f.name === 'Flashcards' && f.parentId === null
    );

    if (flashcardsFolder) {
      this.defaultFolderId = flashcardsFolder.id;
      console.log('[FlashcardService] Found existing "Flashcards" folder:', this.defaultFolderId);
    } else {
      console.log('[FlashcardService] "Flashcards" folder will be created on first deck creation');
    }

    // Set up EventBus listener for folder deletion
    this.eventBus.on('documents:folder:deleted', this.handleFolderDeleted.bind(this));

    this.initialized = true;
    await this.migrateStorageKeys();
    console.log('[FlashcardService] Initialized successfully');
  }

  /**
   * Migrate old storage keys to new namespaced format
   * OLD: 'core-flashcards:decks/deck-123'
   * NEW: 'chaycards/core-flashcards:decks/deck-123'
   */
  private async migrateStorageKeys(): Promise<void> {
    if (!this.storage) return;

    console.log('[FlashcardService] Checking for old storage keys to migrate...');

    // Migrate decks
    const oldDeckKeys = await this.storage.list('core-flashcards:decks/');
    for (const oldKey of oldDeckKeys) {
      const result = await this.storage.get(oldKey);
      if (result) {
        const deckId = oldKey.split('/').pop();
        const newKey = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
        await this.storage.set(newKey, result.data, result.files);
        await this.storage.delete(oldKey);
        console.log(`[FlashcardService] Migrated deck: ${oldKey} → ${newKey}`);
      }
    }

    // Migrate cards
    const oldCardKeys = await this.storage.list('core-flashcards:cards/');
    for (const oldKey of oldCardKeys) {
      const result = await this.storage.get(oldKey);
      if (result) {
        const cardId = oldKey.split('/').pop();
        const newKey = buildPluginStorageKey('chaycards/core-flashcards', `cards/${cardId}`);
        await this.storage.set(newKey, result.data, result.files);
        await this.storage.delete(oldKey);
        console.log(`[FlashcardService] Migrated card: ${oldKey} → ${newKey}`);
      }
    }

    // Migrate templates
    const oldTemplateKeys = await this.storage.list('core-flashcards:templates/');
    for (const oldKey of oldTemplateKeys) {
      const result = await this.storage.get(oldKey);
      if (result) {
        const templateId = oldKey.split('/').pop();
        const newKey = buildPluginStorageKey('chaycards/core-flashcards', `templates/${templateId}`);
        await this.storage.set(newKey, result.data, result.files);
        await this.storage.delete(oldKey);
        console.log(`[FlashcardService] Migrated template: ${oldKey} → ${newKey}`);
      }
    }

    console.log('[FlashcardService] Migration complete');
  }

  /**
   * Handle folder deletion by moving orphaned decks to default folder
   */
  private async handleFolderDeleted(data: { folderId: string }): Promise<void> {
    const { folderId } = data;

    // Move orphaned decks to default folder
    const decks = await this.getDecks();
    const orphanedDecks = decks.filter(d => d.folderId === folderId);

    if (orphanedDecks.length > 0) {
      console.log(`[FlashcardService] Moving ${orphanedDecks.length} orphaned decks to default folder`);

      // Ensure default folder exists before moving decks
      const defaultFolderId = await this.ensureDefaultFolder();

      for (const deck of orphanedDecks) {
        await this.updateDeck(deck.id, { folderId: defaultFolderId });
      }
    }
  }

  /**
   * Get the default "Flashcards" folder ID
   */
  getDefaultFolderId(): string | null {
    return this.defaultFolderId;
  }

  /**
   * Ensure default "Flashcards" folder exists
   * Creates it lazily when first needed (when creating a deck without folder selection)
   */
  private async ensureDefaultFolder(): Promise<string | null> {
    if (this.defaultFolderId) {
      return this.defaultFolderId;
    }

    if (!this.manager) {
      console.warn('[FlashcardService] Manager not initialized');
      return null;
    }

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) {
      console.warn('[FlashcardService] DocumentsService not available');
      return null;
    }

    // Check again in case it was created by another call
    const folders = await documentsService.getFolders();
    const existingFolder = folders.find(
      (f: Folder) => f.name === 'Flashcards' && f.parentId === null
    );

    if (existingFolder) {
      this.defaultFolderId = existingFolder.id;
      return this.defaultFolderId;
    }

    // Create default folder with theme color
    console.log('[FlashcardService] Creating default "Flashcards" folder (first deck without folder)');
    const result = await documentsService.createFolder({
      name: 'Flashcards',
      parentId: null,
      color: 'hsl(var(--primary))', // Use theme primary color (purple in light mode, lighter purple in dark mode)
    });

    if (result.success) {
      // Note: DocumentsService returns { success, folder } not { success, data }
      // This is a bug in DocumentsService type definition but we handle it here
      const folder = (result as any).folder as Folder;
      if (folder) {
        this.defaultFolderId = folder.id;
        console.log('[FlashcardService] Created default folder:', this.defaultFolderId);
        return this.defaultFolderId;
      }
    }

    console.error('[FlashcardService] Failed to create default folder:', result.error);
    return null;
  }

  // ==========================================================================
  // DECK MANAGEMENT
  // ==========================================================================

  /**
   * Get all decks
   */
  async getDecks(): Promise<Deck[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    // List all deck keys (Files as Entity Properties pattern)
    const keys = await this.storage.list('chaycards/core-flashcards:decks/');

    const decks: Deck[] = [];
    for (const key of keys) {
      const result = await this.storage.get<Deck>(key);
      if (result?.data) {
        let deck = result.data;

        // Migration: Add defaultTemplateId to existing decks that don't have it
        if (!deck.defaultTemplateId) {
          deck = { ...deck, defaultTemplateId: 'basic' };
          await this.storage.set(key, deck);
        }

        decks.push(deck);
      }
    }

    return decks;
  }

  /**
   * Get a single deck by ID
   */
  async getDeck(deckId: string): Promise<Deck | null> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const key = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
    const result = await this.storage.get<Deck>(key);

    if (!result?.data) return null;

    let deck = result.data;

    // Migration: Add defaultTemplateId to existing decks that don't have it
    if (!deck.defaultTemplateId) {
      deck = { ...deck, defaultTemplateId: 'basic' };
      await this.storage.set(key, deck);
    }

    return deck;
  }

  /**
   * Create a new deck
   */
  async createDeck(
    name: string,
    options: {
      description?: string;
      folderId?: string | null;
      preset?: 'relaxed' | 'balanced' | 'intense';
    } = {}
  ): Promise<Deck> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const now = Date.now();
    const preset = options.preset || 'balanced';

    // Default to "Flashcards" folder if no folder specified
    // This will lazily create the folder on first use
    let folderId: string | null;
    if (options.folderId !== undefined) {
      folderId = options.folderId;
    } else {
      folderId = await this.ensureDefaultFolder();
    }

    const deckId = `deck-${now}-${Math.random().toString(36).substr(2, 9)}`;
    const deck: Deck = {
      id: deckId,
      name,
      description: options.description,
      folderId,
      defaultTemplateId: 'basic', // Default to basic template
      settings: {
        algorithm: 'sm2',
        preset,
        ...SR_PRESETS[preset],
      },
      isActive: false,
      stats: { ...DEFAULT_DECK_STATS },
      createdAt: now,
      updatedAt: now,
    };

    // Store deck using Files as Entity Properties pattern
    const deckKey = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
    await this.storage.set(deckKey, deck);

    // Create StoredFile record for Documents integration
    await this.createDeckStoredFile(deck);

    this.eventBus.emit('flashcards:deck:created', { deck });
    return deck;
  }

  /**
   * Update a deck
   */
  async updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const deck = await this.getDeck(deckId);
    if (!deck) {
      throw new Error(`Deck not found: ${deckId}`);
    }

    const updatedDeck = {
      ...deck,
      ...updates,
      id: deckId, // Prevent ID change
      updatedAt: Date.now(),
    };

    // Store updated deck
    const deckKey = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
    await this.storage.set(deckKey, updatedDeck);

    // Update StoredFile record if folder or name changed
    if (updates.folderId !== undefined || updates.name !== undefined) {
      await this.updateDeckStoredFile(updatedDeck);
    }

    this.eventBus.emit('flashcards:deck:updated', { deck: updatedDeck });

    return updatedDeck;
  }

  /**
   * Sync deck from StoredFile changes (called by Documents callbacks)
   * CRITICAL: Does NOT call updateDeckStoredFile() to avoid circular updates
   */
  async syncFromStoredFile(deckId: string, updates: Partial<StoredFile>): Promise<void> {
    const deck = await this.getDeck(deckId);
    if (!deck) {
      console.warn(`[FlashcardService] Cannot sync - deck not found: ${deckId}`);
      return;
    }

    const deckUpdates: Partial<Deck> = {};

    // Sync filename to deck name (remove .deck extension)
    if (updates.filename) {
      deckUpdates.name = updates.filename.replace('.deck', '');
    }

    // Sync folderId directly
    if (updates.folderId !== undefined) {
      deckUpdates.folderId = updates.folderId;
    }

    // Only update if there are changes
    if (Object.keys(deckUpdates).length > 0) {
      const deckKey = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
      Object.assign(deck, deckUpdates);
      deck.updatedAt = Date.now();
      await this.storage!.set(deckKey, deck);

      // Emit event for UI updates
      this.eventBus.emit('flashcards:deck:updated', { deck });

      console.log('[FlashcardService] Synced deck from StoredFile:', deckId, deckUpdates);
    }
  }

  /**
   * Delete a deck and all its cards
   */
  async deleteDeck(deckId: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    // Delete all cards in the deck
    const cards = await this.getCards(deckId);
    for (const card of cards) {
      await this.deleteCard(card.id);
    }

    // Delete the deck (CASCADE deletes attached files automatically)
    const deckKey = buildPluginStorageKey('chaycards/core-flashcards', `decks/${deckId}`);
    await this.storage.delete(deckKey);

    // Delete StoredFile record from Documents
    await this.deleteDeckStoredFile(deckId);

    this.eventBus.emit('flashcards:deck:deleted', { deckId });
  }

  /**
   * Update deck statistics after study session
   */
  async updateDeckStats(deckId: string): Promise<void> {
    const cards = await this.getCards(deckId);

    const stats: DeckStats = {
      totalCards: cards.length,
      newCards: cards.filter(c => c.state.stage === 'new').length,
      learningCards: cards.filter(c => c.state.stage === 'learning' || c.state.stage === 'relearning').length,
      reviewCards: cards.filter(c => c.state.stage === 'review').length,
      dueToday: cards.filter(c => c.state.dueDate <= Date.now()).length,
      masteredCards: cards.filter(c => c.state.interval > 21).length,
      averageRetention: this.calculateAverageRetention(cards),
      averageEase: this.calculateAverageEase(cards),
      totalStudyTime: 0, // Updated from sessions
      currentStreak: 0, // Updated from user stats
      longestStreak: 0, // Updated from user stats
    };

    await this.updateDeck(deckId, { stats });
  }

  /**
   * Get all decks in a specific folder
   */
  async getDecksInFolder(folderId: string | null, options?: { recursive?: boolean }): Promise<Deck[]> {
    const allDecks = await this.getDecks();

    if (!options?.recursive) {
      // Non-recursive: only direct children
      return allDecks.filter(d => d.folderId === folderId);
    }

    // Recursive: get all descendant folders and their decks
    if (!this.manager) {
      console.warn('[FlashcardService] Manager not initialized - recursive query not available');
      return allDecks.filter(d => d.folderId === folderId);
    }

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) {
      return allDecks.filter(d => d.folderId === folderId);
    }

    // Get all descendant folder IDs
    const descendantIds = await this.getDescendantFolderIds(folderId, documentsService);
    descendantIds.add(folderId); // Include the folder itself

    // Filter decks that belong to any of these folders
    return allDecks.filter(d => descendantIds.has(d.folderId));
  }

  /**
   * Get all descendant folder IDs recursively
   */
  private async getDescendantFolderIds(
    folderId: string | null,
    documentsService: DocumentsService
  ): Promise<Set<string | null>> {
    const descendants = new Set<string | null>();
    const allFolders = await documentsService.getFolders();

    const traverse = (parentId: string | null) => {
      const children = allFolders.filter((f: Folder) => f.parentId === parentId);
      for (const child of children) {
        descendants.add(child.id);
        traverse(child.id); // Recurse into children
      }
    };

    traverse(folderId);
    return descendants;
  }

  /**
   * Get folder tree with deck counts (for Browse Decks view)
   * Integrates with Documents folder structure
   */
  async getFlashcardFolderTree(): Promise<FolderTreeNode[]> {
    if (!this.manager) {
      console.warn('[FlashcardService] Manager not initialized - folder tree not available');
      return [];
    }

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) {
      console.warn('[FlashcardService] DocumentsService not available');
      return [];
    }

    // Get folders and decks
    const allFolders = await documentsService.getFolders();
    const allDecks = await this.getDecks();

    // Build tree with deck counts
    const buildTree = (parentId: string | null): FolderTreeNode[] => {
      return allFolders
        .filter((f: Folder) => f.parentId === parentId)
        .map((folder: Folder) => {
          const deckCount = allDecks.filter(d => d.folderId === folder.id).length;
          const children = buildTree(folder.id);

          return {
            ...folder,
            children,
            fileCount: deckCount,
            isExpanded: false,
          };
        })
        .sort((a, b) => a.order - b.order);
    };

    return buildTree(null);
  }

  /**
   * Get aggregate statistics for a folder (including all descendants)
   */
  async getFolderStats(folderId: string | null, options?: { recursive?: boolean }): Promise<FolderStats> {
    const decks = await this.getDecksInFolder(folderId, options);

    // Aggregate stats from all decks
    const stats: FolderStats = {
      totalDecks: decks.length,
      totalCards: 0,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      dueToday: 0,
      masteredCards: 0,
      averageRetention: 0,
      averageEase: 0,
    };

    if (decks.length === 0) {
      return stats;
    }

    // Sum up deck statistics
    for (const deck of decks) {
      stats.totalCards += deck.stats.totalCards;
      stats.newCards += deck.stats.newCards;
      stats.learningCards += deck.stats.learningCards;
      stats.reviewCards += deck.stats.reviewCards;
      stats.dueToday += deck.stats.dueToday;
      stats.masteredCards += deck.stats.masteredCards;
      stats.averageRetention += deck.stats.averageRetention;
      stats.averageEase += deck.stats.averageEase;
    }

    // Calculate averages
    stats.averageRetention /= decks.length;
    stats.averageEase /= decks.length;

    return stats;
  }

  // ==========================================================================
  // CARD MANAGEMENT
  // ==========================================================================

  /**
   * Get all cards in a deck
   */
  async getCards(deckId: string): Promise<Card[]> {
    const allCards = await this.getAllCards();
    return allCards.filter(c => c.deckId === deckId);
  }

  /**
   * Get a single card by ID
   */
  async getCard(cardId: string): Promise<Card | null> {
    const allCards = await this.getAllCards();
    return allCards.find(c => c.id === cardId) || null;
  }

  /**
   * Create a new card
   */
  async createCard(
    deckId: string,
    templateId: string,
    fields: Record<string, string | number | boolean | string[] | null>,
    options: {
      tags?: string[];
      mediaFiles?: Record<string, string>;
    } = {}
  ): Promise<Card> {
    const now = Date.now();

    const card: Card = {
      id: `card-${now}-${Math.random().toString(36).substr(2, 9)}`,
      deckId,
      templateId,
      fields,
      mediaFiles: options.mediaFiles,
      state: { ...DEFAULT_CARD_STATE },
      tags: options.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const allCards = await this.getAllCards();
    allCards.push(card);
    await this.saveCards(allCards);

    // Update deck stats
    await this.updateDeckStats(deckId);

    this.eventBus.emit('flashcards:card:created', { card });
    return card;
  }

  /**
   * Update a card
   */
  async updateCard(cardId: string, updates: Partial<Card>): Promise<Card> {
    const allCards = await this.getAllCards();
    const index = allCards.findIndex(c => c.id === cardId);

    if (index === -1) {
      throw new Error(`Card not found: ${cardId}`);
    }

    const oldDeckId = allCards[index].deckId;

    allCards[index] = {
      ...allCards[index],
      ...updates,
      id: cardId, // Prevent ID change
      updatedAt: Date.now(),
    };

    await this.saveCards(allCards);

    // Update deck stats for both old and new deck (if deck changed)
    await this.updateDeckStats(oldDeckId);
    if (updates.deckId && updates.deckId !== oldDeckId) {
      await this.updateDeckStats(updates.deckId);
    }

    this.eventBus.emit('flashcards:card:updated', { card: allCards[index] });
    return allCards[index];
  }

  /**
   * Delete a card and its media files
   */
  async deleteCard(cardId: string): Promise<void> {
    const card = await this.getCard(cardId);
    if (!card) return;

    // Delete the card (media files cascade-delete automatically via Files as Entity Properties)
    const allCards = await this.getAllCards();
    const filtered = allCards.filter(c => c.id !== cardId);
    await this.saveCards(filtered);

    // Update deck stats
    await this.updateDeckStats(card.deckId);

    this.eventBus.emit('flashcards:card:deleted', { cardId });
  }

  /**
   * Upload media file for a card field
   * Uses Files as Entity Properties pattern - files are stored WITH the card
   */
  async uploadMediaFile(
    cardId: string,
    fieldName: string,
    file: File
  ): Promise<string> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    // Get card
    const card = await this.getCard(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    // Convert file to Uint8Array for storage
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Get existing files attached to card
    const storageKey = `${STORAGE_KEYS.CARDS}`;
    const result = await this.storage.get<Card[]>(storageKey);
    const existingFiles = result?.files || {};

    // Update card fields to reference the new file
    const updatedCard = {
      ...card,
      mediaFiles: {
        ...card.mediaFiles,
        [fieldName]: `file:${fieldName}`, // Reference to file attachment
      },
    };

    // Update all cards with new file attachment
    const allCards = await this.getAllCards();
    const updatedCards = allCards.map(c => c.id === cardId ? updatedCard : c);

    // Store cards WITH files using Files as Entity Properties pattern
    await this.storage.set(storageKey, updatedCards, {
      ...existingFiles,
      [`${cardId}_${fieldName}`]: fileData, // Store file as entity property
    });

    return `file:${fieldName}`;
  }

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  /**
   * Get all templates (built-in + custom)
   */
  async getTemplates(): Promise<CardTemplate[]> {
    const customTemplates = await this.getCustomTemplates();
    return [...BUILT_IN_TEMPLATES, ...customTemplates];
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<CardTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Create a custom template
   */
  async createTemplate(template: Omit<CardTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn'>): Promise<CardTemplate> {
    const now = Date.now();

    const newTemplate: CardTemplate = {
      ...template,
      id: `template-${now}-${Math.random().toString(36).substr(2, 9)}`,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };

    const customTemplates = await this.getCustomTemplates();
    customTemplates.push(newTemplate);
    await this.saveCustomTemplates(customTemplates);

    this.eventBus.emit('flashcards:template:created', { template: newTemplate });
    return newTemplate;
  }

  /**
   * Update a custom template
   */
  async updateTemplate(templateId: string, updates: Partial<CardTemplate>): Promise<CardTemplate> {
    const customTemplates = await this.getCustomTemplates();
    const index = customTemplates.findIndex(t => t.id === templateId);

    if (index === -1) {
      throw new Error(`Template not found or is built-in: ${templateId}`);
    }

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      id: templateId,
      isBuiltIn: false,
      updatedAt: Date.now(),
    };

    await this.saveCustomTemplates(customTemplates);
    this.eventBus.emit('flashcards:template:updated', { template: customTemplates[index] });

    return customTemplates[index];
  }

  /**
   * Delete a custom template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template || template.isBuiltIn) {
      throw new Error('Cannot delete built-in template');
    }

    // Check if any cards use this template
    const allCards = await this.getAllCards();
    const cardsUsingTemplate = allCards.filter(c => c.templateId === templateId);

    if (cardsUsingTemplate.length > 0) {
      throw new Error(`Cannot delete template: ${cardsUsingTemplate.length} cards use it`);
    }

    const customTemplates = await this.getCustomTemplates();
    const filtered = customTemplates.filter(t => t.id !== templateId);
    await this.saveCustomTemplates(filtered);

    this.eventBus.emit('flashcards:template:deleted', { templateId });
  }

  /**
   * Duplicate a template (for creating variants)
   */
  async duplicateTemplate(templateId: string, newName: string): Promise<CardTemplate> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.createTemplate({
      name: newName,
      front: template.front,
      back: template.back,
      css: template.css,
      js: template.js,
      fields: template.fields,
      derivedFrom: templateId,
    });
  }

  /**
   * Count how many cards use a specific template
   */
  async countCardsUsingTemplate(templateId: string): Promise<number> {
    const allCards = await this.getAllCards();
    return allCards.filter(c => c.templateId === templateId && !c.templateOverrides).length;
  }

  /**
   * Apply template overrides to a single card
   */
  async applyCardOverride(
    cardId: string,
    overrides: { front?: string; back?: string; css?: string }
  ): Promise<Card> {
    const card = await this.getCard(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    // Merge with existing overrides
    const templateOverrides = {
      ...card.templateOverrides,
      ...overrides,
    };

    return this.updateCard(cardId, { templateOverrides });
  }

  /**
   * Promote a card's overrides to a new template
   */
  async promoteOverrideToTemplate(cardId: string, templateName: string): Promise<CardTemplate> {
    const card = await this.getCard(cardId);
    if (!card || !card.templateOverrides) {
      throw new Error('Card not found or has no overrides');
    }

    const baseTemplate = await this.getTemplate(card.templateId);
    if (!baseTemplate) {
      throw new Error('Base template not found');
    }

    // Create new template from overrides
    const newTemplate = await this.createTemplate({
      name: templateName,
      front: card.templateOverrides.front || baseTemplate.front,
      back: card.templateOverrides.back || baseTemplate.back,
      css: card.templateOverrides.css
        ? baseTemplate.css + '\n/* Promoted overrides */\n' + card.templateOverrides.css
        : baseTemplate.css,
      js: baseTemplate.js,
      fields: baseTemplate.fields,
      derivedFrom: card.templateId,
    });

    // Update the card to use new template and remove overrides
    await this.updateCard(cardId, {
      templateId: newTemplate.id,
      templateOverrides: undefined,
    });

    return newTemplate;
  }

  /**
   * Revert a card's overrides back to its template
   */
  async revertCardToTemplate(cardId: string): Promise<Card> {
    return this.updateCard(cardId, { templateOverrides: undefined });
  }

  /**
   * Update a template and optionally apply changes to all cards using it
   */
  async updateTemplateAndCards(
    templateId: string,
    updates: Partial<CardTemplate>,
    applyToCards: boolean = false
  ): Promise<{ template: CardTemplate; cardsUpdated: number }> {
    const template = await this.updateTemplate(templateId, updates);

    let cardsUpdated = 0;
    if (applyToCards) {
      const allCards = await this.getAllCards();
      const affectedCards = allCards.filter(
        c => c.templateId === templateId && !c.templateOverrides
      );

      // Cards with overrides are NOT affected by template updates
      cardsUpdated = affectedCards.length;

      // Emit event for each card (triggers re-renders)
      affectedCards.forEach(card => {
        this.eventBus.emit('flashcards:card:updated', { card });
      });
    }

    return { template, cardsUpdated };
  }

  // ==========================================================================
  // SPACED REPETITION (SM-2 Algorithm)
  // ==========================================================================

  /**
   * Get due cards for study session
   */
  async getDueCards(deckId: string, limit?: number): Promise<Card[]> {
    const deck = await this.getDeck(deckId);
    if (!deck) return [];

    const cards = await this.getCards(deckId);
    const now = Date.now();

    // Filter cards due for review
    let dueCards = cards.filter(c => c.state.dueDate <= now);

    // Apply daily limits
    const newCards = dueCards.filter(c => c.state.stage === 'new').slice(0, deck.settings.newCardsPerDay);
    const reviewCards = dueCards.filter(c => c.state.stage !== 'new').slice(0, deck.settings.reviewsPerDay);

    dueCards = [...newCards, ...reviewCards];

    // Randomize order if enabled
    if (deck.settings.randomizeCardOrder) {
      dueCards = this.shuffleArray(dueCards);
    }

    // Apply limit
    if (limit) {
      dueCards = dueCards.slice(0, limit);
    }

    return dueCards;
  }

  /**
   * Get cards for a specific study mode
   * @param deckId - The deck ID
   * @param mode - The study mode (spaced-repetition, cram, shuffle, etc.)
   * @param limit - Optional limit on number of cards
   * @returns Cards filtered and ordered according to the mode
   */
  async getCardsForMode(deckId: string, mode: StudyMode, limit?: number): Promise<Card[]> {
    // For spaced repetition, use the existing getDueCards logic
    if (mode === 'spaced-repetition') {
      return this.getDueCards(deckId, limit);
    }

    const deck = await this.getDeck(deckId);
    if (!deck) return [];

    const cards = await this.getCards(deckId);
    const now = Date.now();

    let filteredCards: Card[] = [];

    switch (mode) {
      case 'cram':
        // Cram All: Review ALL cards in deck (new + seen)
        filteredCards = cards;
        break;

      case 'cram-seen':
        // Cram Seen: Only cards that have been in rotation (dueDate in past)
        filteredCards = cards.filter(c => c.state.dueDate < now);
        break;

      case 'shuffle':
        // Shuffle: All cards in random order
        filteredCards = this.shuffleArray([...cards]);
        break;

      default:
        // For other modes (match, type-race, etc.), include all cards
        filteredCards = cards;
        break;
    }

    // Apply limit if specified
    if (limit && filteredCards.length > limit) {
      filteredCards = filteredCards.slice(0, limit);
    }

    return filteredCards;
  }

  /**
   * Grade a card and update its state using SM-2 algorithm
   * @param cardId - The card ID
   * @param grade - Grade (1=Again, 2=Hard, 3=Good, 4=Easy)
   * @param timeSpent - Time spent on card in milliseconds
   * @param mode - Study mode (only 'spaced-repetition' updates schedule)
   */
  async gradeCard(
    cardId: string,
    grade: 1 | 2 | 3 | 4,
    timeSpent: number,
    mode: StudyMode = 'spaced-repetition'
  ): Promise<CardState> {
    const card = await this.getCard(cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`);

    const deck = await this.getDeck(card.deckId);
    if (!deck) throw new Error(`Deck not found: ${card.deckId}`);

    const oldState = { ...card.state };

    // Only update schedule for spaced repetition mode
    let newState: CardState;
    if (mode === 'spaced-repetition') {
      newState = this.calculateNextState(oldState, grade, deck.settings);
      await this.updateCard(cardId, { state: newState });
    } else {
      // For other modes, don't modify card state
      newState = oldState;
    }

    // Record review (for all modes, for statistics)
    this.eventBus.emit('flashcards:card:reviewed', {
      cardId,
      grade,
      timeSpent,
      oldState,
      newState,
      mode, // Include mode in event for tracking
    });

    return newState;
  }

  /**
   * Calculate next card state using SM-2 algorithm
   */
  private calculateNextState(
    state: CardState,
    grade: 1 | 2 | 3 | 4,
    settings: Deck['settings']
  ): CardState {
    const now = Date.now();
    const newState = { ...state };

    newState.reviewCount++;
    newState.lastReviewedAt = now;
    newState.lastGrade = grade;

    // Grade 1 (Again) = Lapse
    if (grade === 1) {
      newState.lapseCount++;
      newState.stage = 'relearning';
      newState.learningStep = 0;
      newState.easeFactor = Math.max(
        SM2_DEFAULTS.MIN_EASE,
        state.easeFactor + SM2_DEFAULTS.EASE_AGAIN_PENALTY
      );

      // Reset interval based on lapse settings
      newState.interval = Math.max(
        settings.minimumInterval,
        Math.floor(state.interval * (settings.newInterval / 100))
      );

      // Apply first relearning step
      newState.dueDate = now + (settings.relearningSteps[0] * 60 * 1000);

      return newState;
    }

    // New or relearning cards
    if (state.stage === 'new' || state.stage === 'relearning') {
      const steps = state.stage === 'new' ? settings.newCardSteps : settings.relearningSteps;

      if (grade === 4) {
        // Easy = Graduate immediately
        newState.stage = 'review';
        newState.interval = settings.easyInterval;
        newState.dueDate = now + (settings.easyInterval * 24 * 60 * 60 * 1000);
        newState.easeFactor = Math.min(5.0, state.easeFactor + SM2_DEFAULTS.EASE_EASY_BONUS);
      } else if (grade === 3) {
        // Good = Progress through steps
        if (state.learningStep < steps.length - 1) {
          newState.learningStep++;
          newState.dueDate = now + (steps[newState.learningStep] * 60 * 1000);
        } else {
          // Graduate
          newState.stage = 'review';
          newState.interval = settings.graduatingInterval;
          newState.dueDate = now + (settings.graduatingInterval * 24 * 60 * 60 * 1000);
        }
      } else if (grade === 2) {
        // Hard = Repeat current step
        newState.dueDate = now + (steps[state.learningStep] * 60 * 1000);
        newState.easeFactor = Math.max(
          SM2_DEFAULTS.MIN_EASE,
          state.easeFactor + SM2_DEFAULTS.EASE_HARD_PENALTY
        );
      }

      return newState;
    }

    // Review cards (SM-2 algorithm)
    if (state.stage === 'review') {
      let intervalMultiplier: number;

      if (grade === 2) {
        // Hard
        intervalMultiplier = settings.hardInterval / 100;
        newState.easeFactor = Math.max(
          SM2_DEFAULTS.MIN_EASE,
          state.easeFactor + SM2_DEFAULTS.EASE_HARD_PENALTY
        );
      } else if (grade === 3) {
        // Good
        intervalMultiplier = state.easeFactor * (settings.intervalModifier / 100);
      } else {
        // Easy
        intervalMultiplier = state.easeFactor * (settings.intervalModifier / 100) * (settings.easyBonus / 100);
        newState.easeFactor = Math.min(5.0, state.easeFactor + SM2_DEFAULTS.EASE_EASY_BONUS);
      }

      newState.interval = Math.min(
        settings.maxInterval,
        Math.max(
          state.interval + 1,
          Math.floor(state.interval * intervalMultiplier)
        )
      );

      newState.dueDate = now + (newState.interval * 24 * 60 * 60 * 1000);
    }

    return newState;
  }

  // ==========================================================================
  // STUDY SESSIONS
  // ==========================================================================

  /**
   * Start a new study session
   */
  async startStudySession(deckId: string, mode: StudySession['mode']): Promise<StudySession> {
    const session: StudySession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deckId,
      startTime: Date.now(),
      mode,
      cardsReviewed: [],
      totalCards: 0,
      correctCards: 0,
      againCount: 0,
      hardCount: 0,
      goodCount: 0,
      easyCount: 0,
      totalTime: 0,
      averageTimePerCard: 0,
    };

    this.eventBus.emit('flashcards:session:started', { session });
    return session;
  }

  /**
   * Get all study sessions
   */
  async getSessions(): Promise<StudySession[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const result = await this.storage.get<StudySession[]>(STORAGE_KEYS.SESSIONS);
    return result?.data || [];
  }

  /**
   * Get sessions within a date range
   */
  async getSessionsInDateRange(startDate: number, endDate: number): Promise<StudySession[]> {
    const allSessions = await this.getSessions();
    return allSessions.filter(
      s => s.startTime >= startDate && s.startTime <= endDate
    );
  }

  /**
   * End a study session and save statistics
   */
  async endStudySession(session: StudySession): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    session.endTime = Date.now();
    session.totalTime = session.endTime - session.startTime;
    session.averageTimePerCard = session.totalCards > 0 ? session.totalTime / session.totalCards : 0;

    // Save session to history
    const result = await this.storage.get<StudySession[]>(STORAGE_KEYS.SESSIONS);
    const sessions: StudySession[] = result?.data || [];
    sessions.push(session);
    await this.storage.set(STORAGE_KEYS.SESSIONS, sessions);

    // Update deck stats
    await this.updateDeckStats(session.deckId);

    // Update user statistics
    await this.updateUserStatistics(session);

    this.eventBus.emit('flashcards:session:ended', { session });
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<UserStatistics> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    const result = await this.storage.get<UserStatistics>(STORAGE_KEYS.USER_STATS);

    // Return stored stats or default
    return result?.data || {
      userId: 'local',
      totalDecks: 0,
      totalCards: 0,
      masteredCards: 0,
      cardsStudiedToday: 0,
      currentStreak: 0,
      longestStreak: 0,
      dailyReviews: {},
      totalReviews: 0,
      averageRetention: 0,
      totalStudyTime: 0,
      deckStats: {},
    };
  }

  /**
   * Update user statistics after study session
   */
  private async updateUserStatistics(session: StudySession): Promise<void> {
    const stats = await this.getUserStatistics();
    const today = new Date().toISOString().split('T')[0];

    // Update daily reviews
    stats.dailyReviews[today] = (stats.dailyReviews[today] || 0) + session.totalCards;

    // Update totals
    stats.totalReviews += session.totalCards;
    stats.totalStudyTime += session.totalTime;
    stats.cardsStudiedToday = stats.dailyReviews[today];

    // Update streaks
    stats.currentStreak = this.calculateCurrentStreak(stats.dailyReviews);
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

    // Update deck counts
    const decks = await this.getDecks();
    const allCards = await this.getAllCards();
    stats.totalDecks = decks.length;
    stats.totalCards = allCards.length;
    stats.masteredCards = allCards.filter(c => c.state.interval > 21).length;

    // Calculate average retention
    const correctCards = session.goodCount + session.easyCount;
    const retention = session.totalCards > 0 ? (correctCards / session.totalCards) * 100 : 0;
    stats.averageRetention =
      (stats.averageRetention * (stats.totalReviews - session.totalCards) + retention * session.totalCards) /
      stats.totalReviews;

    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    await this.storage.set(STORAGE_KEYS.USER_STATS, stats);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getAllCards(): Promise<Card[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    const result = await this.storage.get<Card[]>(STORAGE_KEYS.CARDS);
    return result?.data || [];
  }

  private async saveCards(cards: Card[]): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    await this.storage.set(STORAGE_KEYS.CARDS, cards);
  }

  /**
   * Create StoredFile record for deck integration with Documents plugin
   * @private
   */
  private async createDeckStoredFile(deck: Deck): Promise<void> {
    if (!this.manager) return;

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) {
      console.warn('[FlashcardService] DocumentsService not available - deck will not appear in Documents');
      return;
    }

    // Get max order for files in the folder
    const files = await documentsService.getFiles();
    const filesInFolder = files.filter(f => f.folderId === deck.folderId);
    const maxOrder = filesInFolder.length > 0
      ? Math.max(...filesInFolder.map(f => f.order))
      : 0;

    const storedFile: StoredFile = {
      id: deck.id,
      filename: `${deck.name}.deck`,
      extension: '.deck',
      mimeType: 'application/x-flashcard-deck',
      size: JSON.stringify(deck).length,
      folderId: deck.folderId,
      order: maxOrder + FOLDER_CONFIG.ORDER_GAP,
      tags: [],
      metadata: {
        type: 'flashcard-deck',
        cardCount: deck.stats.totalCards,
        preset: deck.settings.preset,
      },
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      accessedAt: deck.updatedAt,
    };

    // Add to documents files array
    files.push(storedFile);
    await this.storage!.set(DOCUMENTS_STORAGE_KEYS.FILES, files);

    // Emit event so UI updates
    this.eventBus.emit('document:created', { file: storedFile });
  }

  /**
   * Update StoredFile record when deck changes
   * @private
   */
  private async updateDeckStoredFile(deck: Deck): Promise<void> {
    if (!this.manager) return;

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) return;

    const files = await documentsService.getFiles();
    const fileIndex = files.findIndex(f => f.id === deck.id);

    if (fileIndex === -1) {
      // File doesn't exist yet, create it
      await this.createDeckStoredFile(deck);
      return;
    }

    // Update existing file record
    files[fileIndex] = {
      ...files[fileIndex],
      filename: `${deck.name}.deck`,
      folderId: deck.folderId,
      size: JSON.stringify(deck).length,
      metadata: {
        ...files[fileIndex].metadata,
        cardCount: deck.stats.totalCards,
        preset: deck.settings.preset,
      },
      updatedAt: deck.updatedAt,
    };

    await this.storage!.set(DOCUMENTS_STORAGE_KEYS.FILES, files);
    this.eventBus.emit('document:updated', { file: files[fileIndex] });
  }

  /**
   * Delete StoredFile record when deck deleted
   * @private
   */
  private async deleteDeckStoredFile(deckId: string): Promise<void> {
    if (!this.manager) return;

    const documentsService = this.manager.getService<DocumentsService>('chaycards/core-documents/documentsService');
    if (!documentsService) return;

    const files = await documentsService.getFiles();
    const filteredFiles = files.filter(f => f.id !== deckId);

    if (filteredFiles.length < files.length) {
      await this.storage!.set(DOCUMENTS_STORAGE_KEYS.FILES, filteredFiles);
      this.eventBus.emit('document:deleted', { fileId: deckId });
    }
  }

  private async getCustomTemplates(): Promise<CardTemplate[]> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    const result = await this.storage.get<CardTemplate[]>(STORAGE_KEYS.TEMPLATES);
    return result?.data || [];
  }

  private async saveCustomTemplates(templates: CardTemplate[]): Promise<void> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    await this.storage.set(STORAGE_KEYS.TEMPLATES, templates);
  }

  private calculateAverageRetention(cards: Card[]): number {
    const reviewedCards = cards.filter(c => c.state.reviewCount > 0);
    if (reviewedCards.length === 0) return 0;

    // Estimate retention based on ease factors
    const totalEase = reviewedCards.reduce((sum, c) => sum + c.state.easeFactor, 0);
    const avgEase = totalEase / reviewedCards.length;

    // Convert ease to retention percentage (rough estimate)
    return Math.min(100, (avgEase - 1.3) * 40);
  }

  private calculateAverageEase(cards: Card[]): number {
    const reviewedCards = cards.filter(c => c.state.reviewCount > 0);
    if (reviewedCards.length === 0) return SM2_DEFAULTS.STARTING_EASE;

    const totalEase = reviewedCards.reduce((sum, c) => sum + c.state.easeFactor, 0);
    return totalEase / reviewedCards.length;
  }

  private calculateCurrentStreak(dailyReviews: Record<string, number>): number {
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (dailyReviews[dateStr] && dailyReviews[dateStr] > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}