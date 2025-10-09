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

  async get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      const result = await window.electronAPI.storage.get(key);
      return result as { data: T; files: Record<string, Uint8Array> } | null;
    } catch (error) {
      console.error(`[SQLiteAdapter] Failed to get key "${key}":`, error);
      return null; // Graceful degradation per contract
    }
  }

  async set<T = any>(key: string, value: T, files?: Record<string, Uint8Array | null>): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      await window.electronAPI.storage.set(key, value, files);
    } catch (error) {
      console.error(`[SQLiteAdapter] Failed to set key "${key}":`, error);
      throw new Error(`Failed to save data for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      await window.electronAPI.storage.delete(key);
    } catch (error) {
      console.error(`[SQLiteAdapter] Failed to delete key "${key}":`, error);
      throw new Error(`Failed to delete data for key "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async list(prefix?: string): Promise<string[]> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      return await window.electronAPI.storage.list(prefix || '');
    } catch (error) {
      console.error('[SQLiteAdapter] Failed to list keys:', error);
      return []; // Graceful degradation per contract
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      return await window.electronAPI.storage.has(key);
    } catch (error) {
      console.error(`[SQLiteAdapter] Failed to check key "${key}":`, error);
      return false; // Graceful degradation per contract
    }
  }

  async clear(): Promise<void> {
    if (!this.isElectron) {
      throw new Error('SQLite not available - not running in Electron');
    }

    try {
      await window.electronAPI.storage.clear();
      console.log('[SQLiteAdapter] Storage cleared');
    } catch (error) {
      console.error('[SQLiteAdapter] Failed to clear storage:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}