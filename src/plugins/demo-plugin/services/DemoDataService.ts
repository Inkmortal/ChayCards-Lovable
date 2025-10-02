/**
 * Demo Data Service
 * Demonstrates plugin data persistence using the storage adapter system
 */

import type { StorageAdapter } from '../../../shared/storage';

export interface DemoNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export class DemoDataService {
  private storageKey = 'demo-plugin:notes';
  private storage: StorageAdapter | null = null;
  private cachedNotes: DemoNote[] = [];

  /**
   * Initialize with storage adapter from PluginManager
   * Should be called during plugin onLoad after storage is initialized
   */
  async initialize(storage: StorageAdapter): Promise<void> {
    this.storage = storage;
    await this.loadNotes();
  }

  /**
   * Load notes from storage
   */
  private async loadNotes(): Promise<void> {
    if (!this.storage) {
      console.warn('Storage not initialized - using empty notes array');
      return;
    }

    try {
      const notes = await this.storage.get<DemoNote[]>(this.storageKey);
      this.cachedNotes = notes || [];
    } catch (error) {
      console.error('Failed to load demo notes:', error);
      this.cachedNotes = [];
    }
  }

  /**
   * Get all notes (returns cached copy)
   */
  getNotes(): DemoNote[] {
    return [...this.cachedNotes];
  }

  /**
   * Add a note
   */
  async addNote(title: string, content: string): Promise<DemoNote> {
    const note: DemoNote = {
      id: Math.random().toString(36).substring(7),
      title,
      content,
      createdAt: Date.now()
    };

    this.cachedNotes.push(note);
    await this.saveNotes();

    return note;
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    this.cachedNotes = this.cachedNotes.filter(note => note.id !== id);
    await this.saveNotes();
  }

  /**
   * Clear all notes
   */
  async clearAll(): Promise<void> {
    this.cachedNotes = [];
    if (this.storage) {
      await this.storage.delete(this.storageKey);
    }
  }

  /**
   * Save notes to storage
   */
  private async saveNotes(): Promise<void> {
    if (!this.storage) {
      console.warn('Storage not initialized - notes not persisted');
      return;
    }

    try {
      await this.storage.set(this.storageKey, this.cachedNotes);
    } catch (error) {
      console.error('Failed to save demo notes:', error);
    }
  }
}