/**
 * PostgreSQLAdapter - Storage implementation using backend REST API
 *
 * For web 'cloud' mode and desktop 'sync'/'cloud' modes
 * Communicates with backend API server
 */

import type { StorageAdapter } from './StorageAdapter';
import { isPublicPage } from '@/utils/routeUtils';
import { STORAGE_KEYS } from '@/shared/constants';
import { API_ENDPOINTS } from '@/config/api';

export class PostgreSQLAdapter implements StorageAdapter {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // Use explicit parameter OR centralized config
    // Config automatically loads correct URL from .env.development/.env.production
    this.apiUrl = apiUrl || API_ENDPOINTS.STORAGE_BASE;

    if (import.meta.env.DEV) {
      console.log('[PostgreSQLAdapter] API URL:', this.apiUrl);
    }
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

  /**
   * Handle authentication errors (401/403)
   * Redirects to login on protected pages, ignores on public pages
   */
  private handleAuthError(): void {
    if (!isPublicPage()) {
      console.error('[PostgreSQLAdapter] Auth error - redirecting to login');
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.location.href = '/login';
    } else {
      console.warn('[PostgreSQLAdapter] Auth error on public page - ignoring');
    }
  }

  async get<T = any>(key: string): Promise<{ data: T; files: Record<string, Uint8Array> } | null> {
    const url = `${this.apiUrl}/${encodeURIComponent(key)}`;

    try {
      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] GET ${url}`);
      }
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] Response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      if (!response.ok) {
        if (response.status === 404) {
          if (import.meta.env.DEV) {
            console.log(`[PostgreSQLAdapter] Key not found: ${key}`);
          }
          return null;
        }

        // Handle auth errors - only redirect if not already on public pages
        if (response.status === 401 || response.status === 403) {
          this.handleAuthError();
          return null;
        }

        // Get error details from response body
        const errorText = await response.text();
        console.error(`[PostgreSQLAdapter] HTTP ${response.status} error for key "${key}":`, errorText);
        // Return null per contract - read operations never throw
        return null;
      }

      const responseData = await response.json();
      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] Successfully got key "${key}":`, responseData);
      }

      // Convert base64 files to Uint8Array
      const files: Record<string, Uint8Array> = {};
      if (responseData.files) {
        for (const [fieldName, base64Data] of Object.entries(responseData.files)) {
          if (typeof base64Data === 'string') {
            // Convert base64 to Uint8Array
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            files[fieldName] = bytes;
          }
        }
      }

      return {
        data: responseData.value as T,
        files
      };
    } catch (error) {
      console.error(`[PostgreSQLAdapter] Failed to get key "${key}":`, error);
      if (import.meta.env.DEV) {
        console.error(`[PostgreSQLAdapter] Request URL was: ${url}`);
      }
      return null;
    }
  }

  async set<T = any>(key: string, value: T, files?: Record<string, Uint8Array | null>): Promise<void> {
    const url = `${this.apiUrl}/${encodeURIComponent(key)}`;

    try {
      // Convert Uint8Array files to base64 for JSON transport
      const filesForTransport: Record<string, string | null> = {};
      if (files) {
        for (const [fieldName, fileData] of Object.entries(files)) {
          if (fileData === null) {
            filesForTransport[fieldName] = null;
          } else if (fileData instanceof Uint8Array) {
            // Convert Uint8Array to base64
            let binaryString = '';
            for (let i = 0; i < fileData.length; i++) {
              binaryString += String.fromCharCode(fileData[i]);
            }
            filesForTransport[fieldName] = btoa(binaryString);
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] PUT ${url}`, { value, files: Object.keys(filesForTransport) });
      }
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ value, files: Object.keys(filesForTransport).length > 0 ? filesForTransport : undefined })
      });

      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] PUT Response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      }

      if (!response.ok) {
        // Handle auth errors - only redirect if not already on public pages
        if (response.status === 401 || response.status === 403) {
          this.handleAuthError();
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

      if (import.meta.env.DEV) {
        console.log(`[PostgreSQLAdapter] Successfully set key "${key}"`);
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

      if (import.meta.env.DEV) {
        console.log('[PostgreSQLAdapter] Storage cleared');
      }
    } catch (error) {
      console.error('[PostgreSQLAdapter] Failed to clear storage:', error);
      throw error;
    }
  }
}