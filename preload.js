const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  plataforma: process.platform,
  setTab: (tabName) => ipcRenderer.send('set-active-tab', { tabName }),
  reloadDeepSeek: () => ipcRenderer.send('reload-deepseek')
});
