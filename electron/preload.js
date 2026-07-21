// Electron preload — exposes a safe bridge to the renderer (web app)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  // Add any native API bridges here in the future
  // e.g. desktop notifications, file-system pickers, etc.
});
