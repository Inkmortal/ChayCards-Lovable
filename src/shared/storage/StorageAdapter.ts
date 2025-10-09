/**
 * StorageAdapter - Abstract interface for data persistence
 *
 * All plugins use this interface to store data
 * Implementation is chosen based on user's storage mode setting
 *
 * BREAKING CHANGE: Files as Entity Properties
 * - get() now returns { data, files } instead of just data
 * - set() now accepts optional files parameter
 *
 * ERROR HANDLING CONTRACT:
 * - Read operations (get, list, has): Return safe fallbacks on error (null, [], false)
 * - Write operations (set, delete, clear): Throw errors to prevent silent data loss
 *
 * This ensures consistent behavior across SQLite (Electron) and PostgreSQL (Web)
 */

export interface StorageAdapter {
  /**
   * Get a value by key with optional file attachments
   * @param key - Storage key
   * @returns Object with data and files, or null if key doesn't exist OR on error
   * @throws Never - returns null on all errors for graceful degradation
   */
  get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null>;

  /**
   * Set a value by key with optional file attachments
   * @param key - Storage key
   * @param value - Data to store
   * @param files - Optional files to attach as entity properties (null values delete files)
   * @throws Error if write fails - caller MUST handle to prevent silent data loss
   */
  set<T = any>(key: string, value: T, files?: Record<string, Uint8Array | null>): Promise<void>;

  /**
   * Delete a value by key (CASCADE deletes attached files)
   * @param key - Storage key
   * @throws Error if delete fails - caller MUST know if operation succeeded
   */
  delete(key: string): Promise<void>;

  /**
   * List all keys with optional prefix filter
   * @param prefix - Optional prefix to filter keys
   * @returns Empty array on error for graceful degradation
   * @throws Never - returns [] on all errors
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Check if a key exists
   * @param key - Storage key
   * @returns false if key doesn't exist OR on error
   * @throws Never - returns false on all errors
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all data (use with caution!)
   * @throws Error if clear fails - caller MUST know if operation succeeded
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