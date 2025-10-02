/**
 * StorageAdapter - Abstract interface for data persistence
 *
 * All plugins use this interface to store data
 * Implementation is chosen based on user's storage mode setting
 */

export interface StorageAdapter {
  /**
   * Get a value by key
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set a value by key
   */
  set<T = any>(key: string, value: T): Promise<void>;

  /**
   * Delete a value by key
   */
  delete(key: string): Promise<void>;

  /**
   * List all keys with optional prefix filter
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all data (use with caution!)
   */
  clear(): Promise<void>;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}