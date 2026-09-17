const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let currentFilePath = null;
let isDirty = false;

// Basit JSON tabanlı store (electron-store bağımlılığı olmadan)
const storePath = path.join(app.getPath("userData"), "north-store.json");
function readStore() {
  try {
    if (fs.existsSync(storePath)) return JSON.parse(fs.readFileSync(storePath, "utf-8"));
  } catch {}
  return {};
}
function writeStore(data) {
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("store write failed", e);
  }
}
function getStoreValue(key) {
  return readStore()[key];
}
function setStoreValue(key, value) {
  const s = readStore();
  s[key] = value;
  writeStore(s);
}

// Son dosyalar
function pushRecent(filePath) {
  const s = readStore();
  let recents = s.recentFiles || [];
  recents = [filePath, ...recents.filter((p) => p !== filePath)].slice(0, 10);
  s.recentFiles = recents;
  writeStore(s);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: "#F5F1E8",
    title: "North",
    icon: fs.existsSync(path.join(__dirname, "icon.ico"))
      ? path.join(__dirname, "icon.ico")
      : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
      spellcheck: true,
    },
    show: false,
  });

  // Güvenlik: harici linkler tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Navigasyonu engelle (file:// dışı)
  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) e.preventDefault();
  });

  mainWindow.loadFile("north.html");
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Pencere kapatılmadan önce kaydetme onayı
  mainWindow.on("close", async (e) => {
    if (!isDirty) return;
    e.preventDefault();
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["Kaydet", "Kaydetme", "İptal"],
      defaultId: 0,
      cancelId: 2,
      message: "Kaydedilmemiş değişiklikler var",
      detail: "Değişiklikleri kaydetmek ister misiniz?",
    });
    if (response === 2) return; // İptal
    if (response === 0) {
      const saved = await handleSave();
      if (!saved) return;
    }
    isDirty = false;
    mainWindow.destroy();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const recents = getStoreValue("recentFiles") || [];
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "Dosya",
      submenu: [
        {
          label: "Yeni",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow.webContents.send("menu-action", "new"),
        },
        { label: "Aç...", accelerator: "CmdOrCtrl+O", click: () => handleOpen() },
        ...(recents.length
          ? [
              { type: "separator" },
              ...recents.slice(0, 5).map((p) => ({
                label: path.basename(p),
                click: () => handleOpenRecent(p),
              })),
            ]
          : []),
        { type: "separator" },
        { label: "Kaydet", accelerator: "CmdOrCtrl+S", click: () => handleSave() },
        {
          label: "Farklı Kaydet...",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => handleSaveAs(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Çıkış" },
      ],
    },
    {
      label: "Düzen",
      submenu: [
        { role: "undo", label: "Geri Al" },
        { role: "redo", label: "Yinele" },
        { type: "separator" },
        { role: "cut", label: "Kes" },
        { role: "copy", label: "Kopyala" },
        { role: "paste", label: "Yapıştır" },
        { role: "selectAll", label: "Tümünü Seç" },
        { type: "separator" },
        {
          label: "Bul",
          accelerator: "CmdOrCtrl+F",
          click: () => mainWindow.webContents.send("menu-action", "find"),
        },
      ],
    },
    {
      label: "Görünüm",
      submenu: [
        { role: "toggleDevTools", label: "Geliştirici Araçları" },
        { type: "separator" },
        { role: "resetZoom", label: "Yakınlaştırmayı Sıfırla" },
        { role: "zoomIn", label: "Yakınlaştır" },
        { role: "zoomOut", label: "Uzaklaştır" },
        { role: "togglefullscreen", label: "Tam Ekran" },
      ],
    },
    {
      label: "Yardım",
      submenu: [
        {
          label: "North Hakkında",
          click: async () => {
            await dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "North",
              message: `North v${app.getVersion()}`,
              detail: "Akış modu, dallanma ve canlı taslak destekli yazı editörü.",
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Dosya işlemleri
async function handleSave() {
  if (!mainWindow) return false;
  if (currentFilePath) {
    const content = await mainWindow.webContents.executeJavaScript(
      "window.__northGetContent && window.__northGetContent()",
    );
    if (content == null) return false;
    try {
      fs.writeFileSync(currentFilePath, content, "utf-8");
      isDirty = false;
      pushRecent(currentFilePath);
      buildMenu();
      mainWindow.webContents.send("file-opened", { filePath: currentFilePath, saved: true });
      return true;
    } catch (e) {
      dialog.showErrorBox("Kaydetme Hatası", String(e.message || e));
      return false;
    }
  } else {
    return handleSaveAs();
  }
}

async function handleSaveAs() {
  if (!mainWindow) return false;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: currentFilePath || path.join(app.getPath("documents"), "belge.north.html"),
    filters: [
      { name: "North Belgesi", extensions: ["north.html", "html"] },
      { name: "HTML", extensions: ["html", "htm"] },
      { name: "Markdown", extensions: ["md"] },
      { name: "Tüm Dosyalar", extensions: ["*"] },
    ],
  });
  if (canceled || !filePath) return false;
  const content = await mainWindow.webContents.executeJavaScript(
    "window.__northGetContent && window.__northGetContent()",
  );
  if (content == null) return false;
  try {
    fs.writeFileSync(filePath, content, "utf-8");
    currentFilePath = filePath;
    isDirty = false;
    pushRecent(filePath);
    buildMenu();
    mainWindow.setTitle(`North — ${path.basename(filePath)}`);
    mainWindow.webContents.send("file-opened", { filePath, saved: true });
    return true;
  } catch (e) {
    dialog.showErrorBox("Kaydetme Hatası", String(e.message || e));
    return false;
  }
}

async function handleOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "North / HTML / Markdown", extensions: ["north.html", "html", "htm", "md", "txt"] },
      { name: "Tüm Dosyalar", extensions: ["*"] },
    ],
  });
  if (canceled || !filePaths[0]) return;
  await handleOpenRecent(filePaths[0]);
}

async function handleOpenRecent(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    currentFilePath = filePath;
    isDirty = false;
    pushRecent(filePath);
    buildMenu();
    mainWindow.setTitle(`North — ${path.basename(filePath)}`);
    mainWindow.webContents.send("file-opened", { filePath, content: data });
  } catch (e) {
    dialog.showErrorBox("Dosya Açılamadı", String(e.message || e));
  }
}

// IPC
ipcMain.handle("save-file", async () => handleSave());
ipcMain.handle("save-file-as", async () => handleSaveAs());
ipcMain.handle("open-file", async () => {
  await handleOpen();
  return null;
});
ipcMain.handle("get-recent-files", async () => getStoreValue("recentFiles") || []);
ipcMain.handle("open-recent-file", async (_e, p) => handleOpenRecent(p));
ipcMain.handle("get-app-version", async () => app.getVersion());
ipcMain.handle("get-app-path", async () => app.getPath("userData"));
ipcMain.handle("store-get", async (_e, key) => getStoreValue(key));
ipcMain.handle("store-set", async (_e, key, value) => {
  setStoreValue(key, value);
  return true;
});
ipcMain.handle("show-save-dialog", async (_e, defaultName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
  });
  return { canceled, filePath };
});
ipcMain.handle("show-message-box", async (_e, opts) => dialog.showMessageBox(mainWindow, opts));
ipcMain.handle("flow-get-config", async () => {
  const s = readStore();
  return {
    apiKey: s.flowApiKey || "",
    model: s.flowModel || "claude-sonnet-4-6",
    enabled: s.flowEnabled || false,
  };
});
ipcMain.handle("flow-set-config", async (_e, cfg) => {
  const s = readStore();
  if (cfg.apiKey !== undefined) s.flowApiKey = cfg.apiKey;
  if (cfg.model !== undefined) s.flowModel = cfg.model;
  if (cfg.enabled !== undefined) s.flowEnabled = cfg.enabled;
  writeStore(s);
  return true;
});
ipcMain.handle("flow-suggest", async (_e, context) => {
  const s = readStore();
  const apiKey = s.flowApiKey || process.env.ANTHROPIC_API_KEY || "";
  const model = s.flowModel || "claude-sonnet-4-6";
  if (!apiKey)
    return { error: "API anahtarı ayarlı değil. Ayarlar > Akış Modu bölümünden ekleyin." };
  if (!context || context.trim().length < 20) return { suggestion: "" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 60,
        messages: [
          {
            role: "user",
            content: `Aşağıdaki metnin sesini ve tonunu koru. Sadece devam eden 1 kısa cümle yaz, tırnak, açıklama veya başlık ekleme, sadece devam metnini ver:\n\n${context.slice(-800)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { error: `API hatası ${res.status}: ${t.slice(0, 400)}` };
    }
    const data = await res.json();
    const suggestion = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return { suggestion };
  } catch (err) {
    return { error: String(err.message || err) };
  }
});
ipcMain.on("set-dirty", (_e, dirty) => {
  isDirty = !!dirty;
  if (mainWindow) {
    const base = currentFilePath ? path.basename(currentFilePath) : "Yeni Belge";
    mainWindow.setTitle(`North — ${base}${isDirty ? " •" : ""}`);
  }
});

// Tek instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Güvenlik: CSP için ek header
app.on("web-contents-created", (_e, contents) => {
  contents.on("will-attach-webview", (ev) => ev.preventDefault());
});
