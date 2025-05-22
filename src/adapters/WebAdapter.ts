
import { PlatformAdapter, AppConfig } from '../types';

export class WebAdapter implements PlatformAdapter {
  getConfig(): AppConfig {
    return {
      apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      platform: 'web',
      version: '1.0.0'
    };
  }

  showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }

  openExternal(url: string): void {
    window.open(url, '_blank');
  }

  async saveFile(data: string, filename: string): Promise<void> {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async readFile(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }
}
