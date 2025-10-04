
import { PlatformAdapter } from '../types';
import { WebAdapter } from '../adapters/WebAdapter';
import { ElectronAdapter } from '../adapters/ElectronAdapter';
import { isElectron } from '../../utils/platform';

class PlatformService {
  private adapter: PlatformAdapter;

  constructor() {
    // Use standardized platform detection utility
    this.adapter = isElectron() ? new ElectronAdapter() : new WebAdapter();
  }

  getAdapter(): PlatformAdapter {
    return this.adapter;
  }

  getConfig() {
    return this.adapter.getConfig();
  }

  showNotification(title: string, body: string) {
    this.adapter.showNotification(title, body);
  }

  openExternal(url: string) {
    this.adapter.openExternal(url);
  }

  async saveFile(data: string, filename: string) {
    return this.adapter.saveFile(data, filename);
  }

  async readFile() {
    return this.adapter.readFile();
  }
}

export const platformService = new PlatformService();
