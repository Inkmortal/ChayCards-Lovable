
const { app, BrowserWindow } = require('electron');
const path = require('path');
const DatabaseManager = require('./database.cjs');
const { registerStorageHandlers } = require('./ipc/storageHandlers.cjs');
const { registerUserHandlers } = require('./ipc/userHandlers.cjs');
const { registerWindowHandlers } = require('./ipc/windowHandlers.cjs');
const { registerSystemHandlers } = require('./ipc/systemHandlers.cjs');

let mainWindow;
let dbManager;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    backgroundColor: '#1e1e2e',
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Show window when ready to prevent flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const devUrl = process.env.ELECTRON_DEV_URL || 'http://localhost:8080';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Register keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Only handle keyDown events
    if (input.type !== 'keyDown') return;

    // F12 to toggle DevTools (check first, highest priority)
    if (input.key === 'F12') {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
      return;
    }

    // Ctrl+Shift+I / Cmd+Shift+I to toggle DevTools
    if ((input.control || input.meta) && input.shift && (input.key === 'I' || input.key === 'i')) {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
      return;
    }

    // Zoom shortcuts
    if (input.control || input.meta) {
      // Zoom in: Ctrl/Cmd + Plus or Ctrl/Cmd + =
      if (input.key === '+' || input.key === '=') {
        event.preventDefault();
        const currentZoom = mainWindow.webContents.getZoomLevel();
        mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
      }
      // Zoom out: Ctrl/Cmd + Minus or Ctrl/Cmd + _
      else if (input.key === '-' || input.key === '_') {
        event.preventDefault();
        const currentZoom = mainWindow.webContents.getZoomLevel();
        mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
      }
      // Reset zoom: Ctrl/Cmd + 0
      else if (input.key === '0') {
        event.preventDefault();
        mainWindow.webContents.setZoomLevel(0);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // 1. Initialize database
  dbManager = new DatabaseManager(app);
  db = dbManager.initialize();

  // 2. Register IPC handlers that depend on database
  registerStorageHandlers(db);
  registerUserHandlers(db);

  // 3. Create window
  createWindow();

  // 4. Register handlers that depend on window
  registerWindowHandlers(mainWindow);
  registerSystemHandlers(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Graceful shutdown
app.on('before-quit', () => {
  if (dbManager) {
    dbManager.close();
  }
});

