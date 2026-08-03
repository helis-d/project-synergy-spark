const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require("electron");
const path = require("node:path");

// Dev mode means "load from the Vite dev server". `electron:preview` runs
// unpackaged but without NORTH_DEV_URL so it exercises the production
// server-wrapper path (static assets from .output/public + Nitro SSR).
const isDev = !app.isPackaged && Boolean(process.env.NORTH_DEV_URL);
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
    const devUrl = process.env.NORTH_DEV_URL;
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
      // In a packaged app process.cwd() is the launch directory, not the app
      // bundle, so the .output location must be derived from Electron paths.
      const baseDir = app.isPackaged ? process.resourcesPath : app.getAppPath();
      serverPort = await startNorthServer(0, baseDir);
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

/* --- IPC: encrypted secret storage (AI API key) --- */
const secretsFile = () => path.join(app.getPath("userData"), "north-secrets.json");

function readSecretStore() {
  try {
    return JSON.parse(require("node:fs").readFileSync(secretsFile(), "utf-8"));
  } catch {
    return {};
  }
}

function writeSecretStore(store) {
  require("node:fs").writeFileSync(secretsFile(), JSON.stringify(store), "utf-8");
}

ipcMain.handle("north:get-secret", (event, { name }) => {
  const store = readSecretStore();
  const entry = store[name];
  if (!entry) return null;
  try {
    if (entry.encrypted && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(entry.value, "base64"));
    }
    return entry.encrypted ? null : entry.value;
  } catch {
    return null;
  }
});

ipcMain.handle("north:set-secret", (event, { name, value }) => {
  const store = readSecretStore();
  if (safeStorage.isEncryptionAvailable()) {
    store[name] = { encrypted: true, value: safeStorage.encryptString(value).toString("base64") };
  } else {
    store[name] = { encrypted: false, value };
  }
  writeSecretStore(store);
  return true;
});

ipcMain.handle("north:delete-secret", (event, { name }) => {
  const store = readSecretStore();
  delete store[name];
  writeSecretStore(store);
  return true;
});

/* --- IPC: window close (called by renderer after exit dialog) --- */
ipcMain.on("north:close-window", () => {
  allowClose = true;
  if (mainWindow) mainWindow.close();
});
