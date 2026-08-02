const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");

const isDev = !app.isPackaged;
let mainWindow = null;
let allowClose = false;
let serverPort = 3147;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 500,
    show: false,
    backgroundColor: "#F5F1E8",
    title: "North",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 16, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!allowClose) {
      event.preventDefault();
      mainWindow.webContents.send("north:close-requested");
    }
  });

  // External links open in the system browser, not inside North
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    const devUrl = process.env.NORTH_DEV_URL || "http://localhost:3000";
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadURL(`http://localhost:${serverPort}`);
  }
}

app.whenReady().then(async () => {
  if (!isDev) {
    try {
      const { startNorthServer } = require("./server-wrapper.cjs");
      serverPort = await startNorthServer(0);
    } catch (err) {
      console.error("Failed to start North server:", err);
    }
  }
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/* --- IPC: native file save dialog --- */
ipcMain.handle("north:save-file", async (event, { content, defaultName, extensions }) => {
  if (!mainWindow) return false;

  const filters = [];
  if (extensions && extensions.length > 0) {
    filters.push({ name: "Desteklenen formatlar", extensions });
    filters.push({ name: "Tüm dosyalar", extensions: ["*"] });
  } else {
    filters.push({ name: "Tüm dosyalar", extensions: ["*"] });
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters,
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (result.canceled || !result.filePath) return false;

  const { writeFile } = require("node:fs/promises");
  await writeFile(result.filePath, content, "utf-8");
  return true;
});

/* --- IPC: window close (called by renderer after exit dialog) --- */
ipcMain.on("north:close-window", () => {
  allowClose = true;
  if (mainWindow) mainWindow.close();
});
