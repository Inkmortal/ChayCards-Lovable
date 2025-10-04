
const { ipcMain } = require('electron');

/**
 * Register window control IPC handlers
 * Provides window management operations (minimize, maximize, close, etc.)
 *
 * @param {BrowserWindow} mainWindow - The main application window
 */
function registerWindowHandlers(mainWindow) {
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });
}

module.exports = { registerWindowHandlers };
