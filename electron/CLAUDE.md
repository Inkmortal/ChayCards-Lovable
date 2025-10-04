# Electron Directory

## Purpose
This directory contains Electron-specific files that handle window management, system integration, and the bridge between the main process and renderer process. These files ONLY run in Electron, never in the web version.

## Structure
```
electron/
├── main.cjs           - Main process entry point (126 lines)
├── preload.cjs        - Secure IPC bridge
├── database.cjs       - SQLite database manager
└── ipc/               - IPC handler modules
    ├── storageHandlers.cjs  - Storage operations (6 handlers)
    ├── userHandlers.cjs     - User management (6 handlers)
    ├── windowHandlers.cjs   - Window controls (4 handlers)
    └── systemHandlers.cjs   - OS integration (5 handlers)
```

## Files
- `main.cjs` - Main process entry point (window creation, app lifecycle)
- `preload.cjs` - Secure bridge between main and renderer processes
- `database.cjs` - DatabaseManager class for SQLite initialization and migrations
- `ipc/` - IPC handler modules organized by functionality

## Key Concepts

### Main Process (main.cjs)
- Runs in Node.js environment
- Full system access
- Manages application windows
- Handles app lifecycle events
- Starts local Express server

### Preload Script (preload.cjs)
- Runs in isolated context
- Bridges main and renderer
- Exposes safe APIs to renderer
- No direct Node.js access from renderer

### Security Model
```javascript
// preload.cjs - Safe API exposure
contextBridge.exposeInMainWorld('electronAPI', {
  // Only expose what's needed
  getVersion: () => process.versions.electron,
  saveFile: (data) => ipcRenderer.invoke('save-file', data)
})
```

## Important Notes

### CommonJS Required
- These files use `.cjs` extension
- Must use `require()` not `import`
- This is because Electron's main process doesn't fully support ES modules yet

### Starting Local Server
```javascript
// main.cjs
const { spawn } = require('child_process')

// Start Express server in background
const server = spawn('node', ['src/server/local.js'], {
  env: { ...process.env, PORT: 3001 }
})
```

### Window Management
- Create windows after app is ready
- Handle all window lifecycle events
- Manage window state persistence
- Handle deep linking

### Platform Integration
- System tray
- Native menus
- File associations
- Protocol handling
- Auto-updater

## Modular Architecture

### IPC Handler Organization
Each handler module follows a consistent pattern:

```javascript
// electron/ipc/exampleHandlers.cjs
const { ipcMain } = require('electron');

function registerExampleHandlers(dependencies) {
  ipcMain.handle('example:action', async (event, data) => {
    // Implementation using injected dependencies
  });
}

module.exports = { registerExampleHandlers };
```

### Handler Registration (main.cjs)
```javascript
// 1. Initialize database
dbManager = new DatabaseManager(app);
db = dbManager.initialize();

// 2. Register handlers that depend on database
registerStorageHandlers(db);
registerUserHandlers(db);

// 3. Create window
createWindow();

// 4. Register handlers that depend on window
registerWindowHandlers(mainWindow);
registerSystemHandlers(mainWindow);
```

### Benefits of Modular Structure
- **Single Responsibility**: Each module handles one domain
- **Testable**: Dependencies are injected, easy to mock
- **Maintainable**: Small, focused files (~70-100 lines each)
- **Clear Dependencies**: Explicit parameter passing shows what each handler needs

## Common Tasks

### Adding IPC Handlers
1. Create handler in appropriate module (or create new module in `ipc/`)
2. Export registration function
3. Import and call in `main.cjs` `app.whenReady()`
4. Expose in `preload.cjs` if needed by renderer

```javascript
// electron/ipc/newHandlers.cjs
const { ipcMain } = require('electron');

function registerNewHandlers(dependencies) {
  ipcMain.handle('new:action', async (event, data) => {
    // Implementation
  });
}

module.exports = { registerNewHandlers };

// main.cjs
const { registerNewHandlers } = require('./ipc/newHandlers.cjs');

app.whenReady().then(() => {
  // ... other initialization
  registerNewHandlers(dependencies);
});

// preload.cjs
electronAPI: {
  newAction: (data) => ipcRenderer.invoke('new:action', data)
}
```

### Window State
```javascript
// Persist window position/size
const windowState = {
  x: mainWindow.getX(),
  y: mainWindow.getY(),
  width: mainWindow.getWidth(),
  height: mainWindow.getHeight()
}
```

### Dev vs Production
```javascript
const isDev = process.env.NODE_ENV !== 'production'
if (isDev) {
  mainWindow.loadURL('http://localhost:8080')
  mainWindow.webContents.openDevTools()
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}
```

## Architecture Notes

### Separation of Concerns
- Window management only
- No business logic here
- Delegate to Express server
- Keep preload minimal

### Testing Approach
- Test IPC handlers
- Mock Electron APIs
- Verify security boundaries
- Test both dev and prod modes