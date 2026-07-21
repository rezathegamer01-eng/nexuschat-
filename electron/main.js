const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// The app loads the hosted web version — no local server needed
// Change this URL to your own deployment if you self-host
const APP_URL = 'https://nexuschat.happyseeds.ai';
const FALLBACK_URL = 'data:text/html,<html style="background:%231a1b1e;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="color:%23dcddde;text-align:center"><h1 style="color:%235865f2">NexusChat</h1><p>Loading...</p></div></html>';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'NexusChat',
    backgroundColor: '#1a1b1e',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Try to load the app; show fallback if offline
  mainWindow.loadURL(APP_URL).catch(() => {
    mainWindow.loadURL(FALLBACK_URL);
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'NexusChat',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { label: 'Reset Zoom', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Fullscreen', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
