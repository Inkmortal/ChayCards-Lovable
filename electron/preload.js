
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),
  readFile: () => ipcRenderer.invoke('read-file')
});
