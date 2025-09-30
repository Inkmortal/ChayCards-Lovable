/**
 * Demo Data Service
 * Demonstrates plugin data persistence and management
 */

export interface DemoNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export class DemoDataService {
  private storageKey = 'demo-plugin-notes';

  // Get all notes
  getNotes(): DemoNote[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load demo notes:', error);
      return [];
    }
  }

  // Add a note
  addNote(title: string, content: string): DemoNote {
    const note: DemoNote = {
      id: Math.random().toString(36).substring(7),
      title,
      content,
      createdAt: Date.now()
    };

    const notes = this.getNotes();
    notes.push(note);
    this.saveNotes(notes);

    return note;
  }

  // Delete a note
  deleteNote(id: string): void {
    const notes = this.getNotes().filter(note => note.id !== id);
    this.saveNotes(notes);
  }

  // Clear all notes
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }

  private saveNotes(notes: DemoNote[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save demo notes:', error);
    }
  }
}