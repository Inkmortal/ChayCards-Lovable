
const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fssync = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
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
  initDatabase();
  createWindow();
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

// Initialize SQLite database
function initDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'storage.db');

    // Ensure directory exists
    if (!fssync.existsSync(userDataPath)) {
      fssync.mkdirSync(userDataPath, { recursive: true });
    }

    db = new Database(dbPath);

    // Initialize users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        profile_name TEXT NOT NULL,
        has_password INTEGER DEFAULT 0,
        password_hash TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Initialize storage table (with user_id for local user scoping)
    db.exec(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        user_id TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (key, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster user_id lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_storage_user_id ON storage(user_id)
    `);

    console.log('✓ SQLite database initialized at:', dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Database Error', 'Failed to initialize SQLite database: ' + error.message);
  }
}

// Graceful shutdown
app.on('before-quit', () => {
  if (db) {
    db.close();
    console.log('✓ Database closed');
  }
});

// User management IPC handlers
ipcMain.handle('user:create', (event, userData) => {
  const { id, profileName, hasPassword, passwordHash } = userData;
  db.prepare(`
    INSERT INTO users (id, profile_name, has_password, password_hash, created_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'))
  `).run(id, profileName, hasPassword ? 1 : 0, passwordHash);
  return true;
});

ipcMain.handle('user:get', (event, userId) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row ? {
    id: row.id,
    profileName: row.profile_name,
    hasPassword: row.has_password === 1,
    createdAt: row.created_at
  } : null;
});

ipcMain.handle('user:getCurrent', () => {
  // Get the first (and only) local user
  const row = db.prepare('SELECT * FROM users LIMIT 1').get();
  return row ? {
    id: row.id,
    profileName: row.profile_name,
    hasPassword: row.has_password === 1,
    createdAt: row.created_at
  } : null;
});

// Storage IPC handlers (user-scoped)
// Note: For local profiles, we get the current user from the users table
ipcMain.handle('storage:get', (event, key) => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    return null;
  }

  const row = db.prepare('SELECT value FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);
  return row ? JSON.parse(row.value) : null;
});

ipcMain.handle('storage:set', (event, key, value) => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    throw new Error('No local user found');
  }

  const serialized = JSON.stringify(value);
  db.prepare(`
    INSERT INTO storage (key, value, user_id, updated_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(key, user_id) DO UPDATE SET
      value = excluded.value,
      updated_at = strftime('%s', 'now')
  `).run(key, serialized, currentUser.id);
  return true;
});

ipcMain.handle('storage:delete', (event, key) => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    return false;
  }

  db.prepare('DELETE FROM storage WHERE key = ? AND user_id = ?').run(key, currentUser.id);
  return true;
});

ipcMain.handle('storage:list', (event, prefix) => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    return [];
  }

  const rows = prefix
    ? db.prepare('SELECT key FROM storage WHERE key LIKE ? AND user_id = ?').all(`${prefix}%`, currentUser.id)
    : db.prepare('SELECT key FROM storage WHERE user_id = ?').all(currentUser.id);
  return rows.map(row => row.key);
});

ipcMain.handle('storage:clear', () => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    return 0;
  }

  const result = db.prepare('DELETE FROM storage WHERE user_id = ?').run(currentUser.id);
  return result.changes;
});

ipcMain.handle('storage:has', (event, key) => {
  // Get current user ID
  const currentUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!currentUser) {
    console.error('No local user found for storage operation');
    return false;
  }

  const row = db.prepare('SELECT 1 FROM storage WHERE key = ? AND user_id = ?').get(key, currentUser.id);
  return !!row;
});

// IPC handlers
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

// Window control handlers
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
