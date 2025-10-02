/**
 * PostgreSQLAdapter - Storage implementation using backend REST API
 *
 * For web 'cloud' mode and desktop 'sync'/'cloud' modes
 * Communicates with backend API server
 */

import type { StorageAdapter } from './StorageAdapter';
import { isPublicPage } from '@/utils/routeUtils';
import { STORAGE_KEYS } from '@/shared/constants';

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

  /**
   * Get Authorization headers with JWT token
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const url = `${this.apiUrl}/${encodeURIComponent(key)}`;

    try {
      console.log(`[PostgreSQLAdapter] GET ${url}`);
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      console.log(`[PostgreSQLAdapter] Response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[PostgreSQLAdapter] Key not found: ${key}`);
          return null;
        }

        // Handle auth errors - only redirect if not already on public pages
        if (response.status === 401 || response.status === 403) {
          if (!isPublicPage()) {
            console.error(`[PostgreSQLAdapter] Auth error - redirecting to login`);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            window.location.href = '/login';
          } else {
            console.warn(`[PostgreSQLAdapter] Auth error on public page - ignoring`);
          }
          return null;
        }

        // Get error details from response body
        const errorText = await response.text();
        console.error(`[PostgreSQLAdapter] HTTP ${response.status} error for key "${key}":`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[PostgreSQLAdapter] Successfully got key "${key}":`, data);
      return data.value as T;
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to get key "${key}":`, error);
      console.error(`[PostgreSQLAdapter] Request URL was: ${url}`);
      return null;
    }
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    const url = `${this.apiUrl}/${encodeURIComponent(key)}`;

    try {
      console.log(`[PostgreSQLAdapter] PUT ${url}`, { value });
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ value })
      });

      console.log(`[PostgreSQLAdapter] PUT Response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        // Handle auth errors - only redirect if not already on public pages
        if (response.status === 401 || response.status === 403) {
          if (!isPublicPage()) {
            console.error(`[PostgreSQLAdapter] Auth error - redirecting to login`);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            window.location.href = '/login';
          } else {
            console.warn(`[PostgreSQLAdapter] Auth error on public page - ignoring`);
          }
          return;
        }

        const errorText = await response.text();
        console.error(`[PostgreSQLAdapter] PUT failed for key "${key}":`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        console.error(`[PostgreSQLAdapter] Server returned success: false for key "${key}"`);
        throw new Error('Server returned success: false');
      }

      console.log(`[PostgreSQLAdapter] Successfully set key "${key}"`);
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to set key "${key}":`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const url = `${this.apiUrl}/${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

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
        method: 'DELETE',
        headers: this.getAuthHeaders()
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