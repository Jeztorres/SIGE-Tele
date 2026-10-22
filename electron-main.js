const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

let mainWindow = null;
let deepseekView = null;
let currentTab = 'dashboard';
let serverProcess = null;

const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// Iniciar servidor Express en segundo plano si no está activo
function startServer() {
  const checkReq = http.get('http://localhost:5000/api/config', () => {
    console.log('Servidor Express ya activo en el puerto 5000.');
  });

  checkReq.on('error', () => {
    const serverPath = path.join(__dirname, 'server', 'server.js');
    serverProcess = fork(serverPath, [], { silent: false });
    serverProcess.on('error', (err) => {
      console.error('Error iniciando proceso del servidor:', err);
    });
  });
}

function initDeepSeekView() {
  if (deepseekView || !mainWindow) return;

  const deepseekSession = session.fromPartition('persist:deepseek_user');
  deepseekSession.setUserAgent(CHROME_USER_AGENT);

  deepseekView = new BrowserView({
    webPreferences: {
      partition: 'persist:deepseek_user',
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  deepseekView.webContents.setUserAgent(CHROME_USER_AGENT);
  deepseekView.webContents.loadURL('https://chat.deepseek.com/');

  // Permitir popup oficial de Google OAuth para que el docente elija su cuenta
  deepseekView.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 550,
        height: 720,
        autoHideMenuBar: true,
        webPreferences: {
          partition: 'persist:deepseek_user',
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    };
  });
}

function updateDeepSeekBounds() {
  if (!mainWindow || !deepseekView) return;

  if (currentTab === 'deepseek') {
    const [w, h] = mainWindow.getContentSize();
    // La barra superior de navegación ocupa aprox 95px
    const navbarHeight = 96;
    deepseekView.setBounds({
      x: 0,
      y: navbarHeight,
      width: w,
      height: Math.max(0, h - navbarHeight)
    });
    deepseekView.setAutoResize({ width: true, height: true });
    mainWindow.setBrowserView(deepseekView);
  } else {
    mainWindow.setBrowserView(null);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    title: 'Sistema de Control Escolar Telesecundaria',
    icon: path.join(__dirname, 'client', 'public', 'favicon.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });


  // Escuchar redimensionamiento de ventana
  mainWindow.on('resize', () => {
    updateDeepSeekBounds();
  });

  // Cargar app
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
    deepseekView = null;
  });
}

// IPC para cambiar de pestaña
ipcMain.on('set-active-tab', (event, { tabName }) => {
  currentTab = tabName;
  updateDeepSeekBounds();
});

ipcMain.on('reload-deepseek', () => {
  if (deepseekView) {
    deepseekView.webContents.reload();
  }
});

app.whenReady().then(() => {
  startServer();

  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
