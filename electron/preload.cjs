const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("northDesktop", {
  isDesktop: true,
  saveFile: (content, defaultName, extensions) =>
    ipcRenderer.invoke("north:save-file", { content, defaultName, extensions }),
  closeWindow: () => ipcRenderer.send("north:close-window"),
  onCloseRequested: (callback) => {
    ipcRenderer.on("north:close-requested", () => callback());
  },
});
