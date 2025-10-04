/**
 * SQLiteAdapter - Storage implementation using SQLite via Electron IPC
 *
 * For desktop 'local' and 'sync' modes
 * Communicates with Electron main process to access SQLite database
 */

import type { StorageAdapter } from './StorageAdapter';
import { isElectron } from '@/utils/platform';

export class SQLiteAdapter implements StorageAdapter {
  private isElectron: boolean;

  constructor() {
    this.isElectron = isElectron();

    if (!this.isElectron) {
      console.warn('[SQLiteAdapter] Created in non-Electron environment');
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    const result = await window.electronAPI.storage.get(key);
    return result as T;
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    await window.electronAPI.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    await window.electronAPI.storage.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    return await window.electronAPI.storage.list(prefix || '');
  }

  async has(key: string): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    return await window.electronAPI.storage.has(key);
  }

  async clear(): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    await window.electronAPI.storage.clear();
    console.log('[SQLiteAdapter] Storage cleared');
  }
}