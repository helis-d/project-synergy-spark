const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("northDesktop", {
  isDesktop: true,
  saveFile: (content, defaultName, extensions) =>
    ipcRenderer.invoke("north:save-file", { content, defaultName, extensions }),
  closeWindow: () => ipcRenderer.send("north:close-window"),
  onCloseRequested: (callback) => {
    ipcRenderer.on("north:close-requested", () => callback());
  },
  /* Encrypted-at-rest AI key storage (electron safeStorage), never localStorage. */
  getSecret: (name) => ipcRenderer.invoke("north:get-secret", { name }),
  setSecret: (name, value) => ipcRenderer.invoke("north:set-secret", { name, value }),
  deleteSecret: (name) => ipcRenderer.invoke("north:delete-secret", { name }),
});
