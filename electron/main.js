// Electron main process — wraps the Next.js web app in a desktop window
const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const PORT = 13000;
const DEV_URL = `http://localhost:${PORT}`;
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let nextServer = null;
let tray = null;

// ── Wait for Next.js server to be ready ──────────────────────────────────────
function waitForServer(url, retries = 30) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (retries-- <= 0) return reject(new Error('Server did not start in time'));
      setTimeout(attempt, 500);
    };
    attempt();
  });
}

// ── Start the bundled Next.js server (production mode) ───────────────────────
function startNextServer() {
  if (isDev) return Promise.resolve(); // dev: assume `pnpm dev` already running

  const serverScript = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
  nextServer = spawn(process.execPath, [serverScript], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
  });

  nextServer.on('error', (err) => console.error('Next.js server error:', err));
  return waitForServer(DEV_URL);
}

// ── Create the main window ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'NexusChat',
    backgroundColor: '#1a1b1e',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // shown after ready-to-show
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  mainWindow.loadURL(DEV_URL);

  // Show once paint is ready (no white flash)
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in OS browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Custom menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'NexusChat',
      submenu: [
        { label: 'About NexusChat', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' },
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

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await startNextServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (nextServer) nextServer.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextServer) nextServer.kill();
});
