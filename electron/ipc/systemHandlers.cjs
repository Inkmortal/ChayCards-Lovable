
const { ipcMain, shell, Notification, dialog, app } = require('electron');
const fs = require('fs').promises;

/**
 * Register system-level IPC handlers
 * Provides OS integration: notifications, file operations, external URLs, config
 *
 * @param {BrowserWindow} mainWindow - The main application window
 */
function registerSystemHandlers(mainWindow) {
  ipcMain.handle('get-config', () => {
    return {
      apiBaseUrl: process.env.API_URL || 'http://localhost:3001',
      platform: 'electron',
      version: app.getVersion() || '1.0.0'
    };
  });

  ipcMain.handle('show-notification', (event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('save-file', async (event, data, filename) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        await fs.writeFile(result.filePath, data, 'utf8');
        return result.filePath;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  });

  ipcMain.handle('read-file', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const data = await fs.readFile(result.filePaths[0], 'utf8');
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });
}

module.exports = { registerSystemHandlers };
