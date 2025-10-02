/**
 * TypeScript definitions for Electron IPC API
 * Defines the electronAPI object exposed via contextBridge in preload script
 */

export interface ElectronAPI {
  /**
   * Get Electron configuration
   */
  getConfig: () => Promise<{
    apiBaseUrl: string;
    platform: string;
    version: string;
  }>;

  /**
   * Show system notification
   */
  showNotification: (title: string, body: string) => Promise<void>;

  /**
   * Open URL in external browser
   */
  openExternal: (url: string) => Promise<void>;

  /**
   * Save file dialog
   */
  saveFile: (data: string, filename: string) => Promise<string | undefined>;

  /**
   * Open file dialog
   */
  readFile: () => Promise<string | null>;

  /**
   * User API - Local user management
   */
  user: {
    /**
     * Create a new local user
     */
    create: (userData: {
      id: string;
      profileName: string;
      hasPassword: boolean;
      passwordHash: string | null;
    }) => Promise<boolean>;

    /**
     * Get user by ID
     */
    get: (userId: string) => Promise<{
      id: string;
      profileName: string;
      hasPassword: boolean;
      createdAt: number;
    } | null>;

    /**
     * Get current local user (first user in database)
     */
    getCurrent: () => Promise<{
      id: string;
      profileName: string;
      hasPassword: boolean;
      createdAt: number;
    } | null>;
  };

  /**
   * Storage API - SQLite database access via IPC
   */
  storage: {
    /**
     * Get value by key
     */
    get: <T = any>(key: string) => Promise<T | null>;

    /**
     * Set value for key
     */
    set: <T = any>(key: string, value: T) => Promise<boolean>;

    /**
     * Delete key
     */
    delete: (key: string) => Promise<boolean>;

    /**
     * List keys with optional prefix filter
     */
    list: (prefix?: string) => Promise<string[]>;

    /**
     * Clear all storage
     */
    clear: () => Promise<number>;

    /**
     * Check if key exists
     */
    has: (key: string) => Promise<boolean>;
  };
}

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};