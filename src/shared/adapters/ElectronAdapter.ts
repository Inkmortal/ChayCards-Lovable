
import { PlatformAdapter, AppConfig } from '../types';


export class ElectronAdapter implements PlatformAdapter {
  getConfig(): AppConfig {
    return window.electronAPI?.getConfig() || {
      apiBaseUrl: 'http://localhost:3001',
      platform: 'electron',
      version: '1.0.0'
    };
  }

  showNotification(title: string, body: string): void {
    if (window.electronAPI) {
      window.electronAPI.showNotification(title, body);
    }
  }

  openExternal(url: string): void {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    }
  }

  async saveFile(data: string, filename: string): Promise<void> {
    if (window.electronAPI) {
      return window.electronAPI.saveFile(data, filename);
    }
  }

  async readFile(): Promise<string | null> {
    if (window.electronAPI) {
      return window.electronAPI.readFile();
    }
    return null;
  }
}
