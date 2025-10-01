/**
 * StorageManager - Chooses and provides the correct storage adapter
 * based on user's storage mode setting
 */

import type { StorageAdapter } from './StorageAdapter';
import { SQLiteAdapter } from './SQLiteAdapter';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import type { StorageMode } from '../../plugins/core-settings/types';

export class StorageManager {
  private adapter: StorageAdapter | null = null;
  private initialized: boolean = false;

  /**
   * Initialize storage with user's chosen mode
   */
  async initialize(storageMode: StorageMode): Promise<void> {
    console.log(`[StorageManager] Initializing with mode: ${storageMode}`);

    switch (storageMode) {
      case 'local':
        // Desktop only: SQLite
        this.adapter = new SQLiteAdapter();
        break;

      case 'sync':
        // TODO: Implement sync adapter (SQLite + PostgreSQL)
        // For now, use SQLite as primary
        console.warn('[StorageManager] Sync mode not fully implemented, using SQLite');
        this.adapter = new SQLiteAdapter();
        break;

      case 'cloud':
        // Cloud only: PostgreSQL
        this.adapter = new PostgreSQLAdapter();
        break;

      default:
        throw new Error(`Unknown storage mode: ${storageMode}`);
    }

    this.initialized = true;
    console.log(`[StorageManager] Initialized successfully`);
  }

  /**
   * Get the storage adapter
   */
  getAdapter(): StorageAdapter {
    if (!this.initialized || !this.adapter) {
      throw new Error('StorageManager not initialized. Call initialize() first.');
    }
    return this.adapter;
  }

  /**
   * Check if storage is ready
   */
  isReady(): boolean {
    return this.initialized && this.adapter !== null;
  }
}

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}