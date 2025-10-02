/**
 * PostgreSQLAdapter - Storage implementation using backend REST API
 *
 * For web 'cloud' mode and desktop 'sync'/'cloud' modes
 * Communicates with backend API server
 */

import type { StorageAdapter } from './StorageAdapter';

export class PostgreSQLAdapter implements StorageAdapter {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // Priority:
    // 1. Explicit apiUrl parameter
    // 2. Environment variable (set via .env or build config)
    // 3. Default: Cloudflare Tunnel (works everywhere)
    //
    // Why Cloudflare Tunnel as default?
    // - Local dev can override with .env: VITE_STORAGE_API_URL=/api/storage
    // - Lovable preview needs absolute URL (no backend/proxy available)
    // - Production needs absolute URL
    const envUrl = import.meta.env.VITE_STORAGE_API_URL;
    const defaultUrl = 'https://api.chaycards.com/api/storage';

    this.apiUrl = apiUrl || envUrl || defaultUrl;

    console.log('[PostgreSQLAdapter] API URL:', this.apiUrl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const url = `${this.apiUrl}/${encodeURIComponent(key)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value as T;
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to get key "${key}":`, error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      const url = `${this.apiUrl}/${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Server returned success: false');
      }
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to set key "${key}":`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const url = `${this.apiUrl}/${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Server returned success: false');
      }
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to delete key "${key}":`, error);
      throw error;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const url = `${this.apiUrl}${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.keys || [];
    } catch (error) {
      console.error('[PostgreSQLAdapter] Failed to list keys:', error);
      return [];
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Server returned success: false');
      }

      console.log('[PostgreSQLAdapter] Storage cleared');
    } catch (error) {
      console.error('[PostgreSQLAdapter] Failed to clear storage:', error);
      throw error;
    }
  }
}