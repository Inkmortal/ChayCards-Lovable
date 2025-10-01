
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),
  readFile: () => ipcRenderer.invoke('read-file'),

  // Storage API - SQLite via IPC
  storage: {
    get: (key) => ipcRenderer.invoke('storage:get', key),
    set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
    delete: (key) => ipcRenderer.invoke('storage:delete', key),
    list: (prefix) => ipcRenderer.invoke('storage:list', prefix || ''),
    clear: () => ipcRenderer.invoke('storage:clear'),
    has: (key) => ipcRenderer.invoke('storage:has', key)
  }
});
