const { contextBridge, ipcRenderer } = require("electron");

// Whitelist tabanlı güvenli API köprüsü
contextBridge.exposeInMainWorld("northAPI", {
  // Dosya işlemleri
  saveFile: (data) => ipcRenderer.invoke("save-file", data),
  saveFileAs: (data) => ipcRenderer.invoke("save-file-as", data),
  openFile: () => ipcRenderer.invoke("open-file"),
  getRecentFiles: () => ipcRenderer.invoke("get-recent-files"),
  openRecentFile: (filePath) => ipcRenderer.invoke("open-recent-file", filePath),

  // Uygulama bilgileri
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // Ayarlar / Persist
  getStoreValue: (key) => ipcRenderer.invoke("store-get", key),
  setStoreValue: (key, value) => ipcRenderer.invoke("store-set", key, value),

  // Flow Mode - güvenli main-process proxy (API anahtarı renderer'da tutulmuyor)
  fetchFlowSuggestion: (context) => ipcRenderer.invoke("flow-suggest", context),
  getFlowConfig: () => ipcRenderer.invoke("flow-get-config"),
  setFlowConfig: (config) => ipcRenderer.invoke("flow-set-config", config),

  // Olay dinleyiciler (main -> renderer)
  onMenuAction: (callback) => ipcRenderer.on("menu-action", (_e, action) => callback(action)),
  onFileOpened: (callback) => ipcRenderer.on("file-opened", (_e, data) => callback(data)),
  onBeforeClose: (callback) => ipcRenderer.on("before-close", () => callback()),

  // Sistem
  showSaveDialog: (defaultName) => ipcRenderer.invoke("show-save-dialog", defaultName),
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),
  setDirty: (dirty) => ipcRenderer.send("set-dirty", dirty),

  // Platform
  platform: process.platform,
});
