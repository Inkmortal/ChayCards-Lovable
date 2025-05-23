# Electron Directory

## Purpose
This directory contains Electron-specific files that handle window management, system integration, and the bridge between the main process and renderer process. These files ONLY run in Electron, never in the web version.

## Files
- `main.cjs` - Main process entry point (creates windows, app lifecycle)
- `preload.cjs` - Secure bridge between main and renderer processes

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

## Common Tasks

### Adding IPC Handlers
```javascript
// main.cjs
ipcMain.handle('get-data', async (event, key) => {
  return await storage.get(key)
})

// preload.cjs
electronAPI: {
  getData: (key) => ipcRenderer.invoke('get-data', key)
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