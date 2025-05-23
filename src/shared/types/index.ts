// Core types for ChayCards

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  platform: 'web' | 'electron';
  version: string;
}

export interface PlatformAdapter {
  getConfig(): AppConfig;
  showNotification(title: string, body: string): void;
  openExternal(url: string): void;
  saveFile(data: string, filename: string): Promise<void>;
  readFile(): Promise<string | null>;
}

// Plugin system types will be added here later