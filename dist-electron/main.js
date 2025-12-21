import { app, screen, BrowserWindow, ipcMain, BrowserView, globalShortcut } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win;
const MAX_ACTIVE_VIEWS = 3;
const SUSPENSION_TIMEOUT = 10 * 60 * 1e3;
const RESIZE_DEBOUNCE_MS = 15;
const activeViews = /* @__PURE__ */ new Map();
const tabMetadata = /* @__PURE__ */ new Map();
const suspensionTimers = /* @__PURE__ */ new Map();
let activeTabId = null;
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function enforceLRULimit() {
  if (activeViews.size <= MAX_ACTIVE_VIEWS) return;
  let lruTabId = null;
  let lruTime = Infinity;
  for (const [tabId] of activeViews) {
    if (tabId === activeTabId) continue;
    const meta = tabMetadata.get(tabId);
    const lastAccessed = (meta == null ? void 0 : meta.lastAccessed) || 0;
    if (lastAccessed < lruTime) {
      lruTime = lastAccessed;
      lruTabId = tabId;
    }
  }
  if (lruTabId) {
    console.log(`[Main] LRU evicting tab: ${lruTabId} (${activeViews.size} active views)`);
    suspendTab(lruTabId);
  }
}
function createBrowserView(tabId, url = "https://google.com") {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  view.setBackgroundColor("#ffffff");
  const handleUrlUpdate = (newUrl) => {
    const meta = tabMetadata.get(tabId);
    tabMetadata.set(tabId, {
      url: newUrl,
      title: (meta == null ? void 0 : meta.title) || "Loading...",
      lastAccessed: Date.now()
    });
    win == null ? void 0 : win.webContents.send("url-updated", { id: tabId, url: newUrl });
  };
  const handleTitleUpdate = (title) => {
    const meta = tabMetadata.get(tabId);
    tabMetadata.set(tabId, {
      url: (meta == null ? void 0 : meta.url) || url,
      title,
      lastAccessed: Date.now()
    });
    win == null ? void 0 : win.webContents.send("title-updated", { id: tabId, title });
  };
  view.webContents.on("did-navigate", (_, u) => handleUrlUpdate(u));
  view.webContents.on("did-navigate-in-page", (_, u) => handleUrlUpdate(u));
  view.webContents.on("page-title-updated", (_, title) => handleTitleUpdate(title));
  view.webContents.on("did-fail-load", (_, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load ${tabId}: ${errorCode} - ${errorDescription}`);
  });
  view.webContents.loadURL(url).catch((e) => console.error(`[Main] Load error:`, e));
  return view;
}
function switchTab(tabId) {
  if (!win) return;
  const view = activeViews.get(tabId);
  console.log(`[Main] switchTab: ${tabId}, view exists: ${!!view}`);
  clearSuspensionTimer(tabId);
  if (activeTabId && activeTabId !== tabId) {
    startSuspensionTimer(activeTabId);
  }
  const meta = tabMetadata.get(tabId);
  if (meta) {
    tabMetadata.set(tabId, { ...meta, lastAccessed: Date.now() });
  }
  activeTabId = tabId;
  if (view) {
    win.setBrowserView(view);
    updateViewBounds(view);
  }
}
function startSuspensionTimer(tabId) {
  clearSuspensionTimer(tabId);
  console.log(`[Main] Starting 10-min suspension timer for tab: ${tabId}`);
  const timer = setTimeout(() => {
    suspendTab(tabId);
  }, SUSPENSION_TIMEOUT);
  suspensionTimers.set(tabId, timer);
}
function clearSuspensionTimer(tabId) {
  const timer = suspensionTimers.get(tabId);
  if (timer) {
    clearTimeout(timer);
    suspensionTimers.delete(tabId);
  }
}
function suspendTab(tabId) {
  console.log(`[Main] Suspending tab: ${tabId}`);
  const view = activeViews.get(tabId);
  if (!view) return;
  const currentUrl = view.webContents.getURL();
  const currentTitle = view.webContents.getTitle();
  const meta = tabMetadata.get(tabId);
  tabMetadata.set(tabId, {
    url: currentUrl,
    title: currentTitle,
    lastAccessed: (meta == null ? void 0 : meta.lastAccessed) || Date.now()
  });
  if ((win == null ? void 0 : win.getBrowserView()) === view) {
    win.setBrowserView(null);
  }
  try {
    view.webContents.destroy();
  } catch (e) {
  }
  activeViews.delete(tabId);
  win == null ? void 0 : win.webContents.send("tab-suspended", tabId);
  console.log(`[Main] Tab ${tabId} suspended. Active views: ${activeViews.size}`);
}
function unsuspendTab(tabId, url) {
  console.log(`[Main] Unsuspending tab: ${tabId}`);
  const meta = tabMetadata.get(tabId);
  const loadUrl = url || (meta == null ? void 0 : meta.url) || "https://google.com";
  const view = createBrowserView(tabId, loadUrl);
  activeViews.set(tabId, view);
  tabMetadata.set(tabId, {
    url: loadUrl,
    title: (meta == null ? void 0 : meta.title) || "Loading...",
    lastAccessed: Date.now()
  });
  enforceLRULimit();
  win == null ? void 0 : win.webContents.send("tab-unsuspended", tabId);
}
const debouncedUpdateBounds = debounce(() => {
  if (!win) return;
  const view = win.getBrowserView();
  if (view) updateViewBounds(view);
}, RESIZE_DEBOUNCE_MS);
function updateViewBounds(view) {
  if (!win) return;
  const bounds = win.getContentBounds();
  const SIDEBAR_WIDTH = 256;
  const TOPBAR_HEIGHT = 64;
  view.setBounds({
    x: SIDEBAR_WIDTH,
    y: TOPBAR_HEIGHT,
    width: Math.max(0, bounds.width - SIDEBAR_WIDTH),
    height: Math.max(0, bounds.height - TOPBAR_HEIGHT)
  });
  view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true });
}
let readerModules = null;
async function lazyLoadReaderModules() {
  if (readerModules) return readerModules;
  console.log("[Main] Lazy loading reader modules...");
  const start = Date.now();
  const [jsdomModule, readabilityModule] = await Promise.all([
    import("jsdom"),
    import("@mozilla/readability")
  ]);
  readerModules = {
    JSDOM: jsdomModule.JSDOM,
    Readability: readabilityModule.Readability
  };
  console.log(`[Main] Reader modules loaded in ${Date.now() - start}ms`);
  return readerModules;
}
async function parseReaderContent(htmlString, url = "https://example.com") {
  try {
    const { JSDOM, Readability } = await lazyLoadReaderModules();
    const dom = new JSDOM(htmlString, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return article;
  } catch (error) {
    console.error("Reader parsing failed:", error);
    return null;
  }
}
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    frame: false,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    },
    vibrancy: "sidebar",
    backgroundMaterial: "acrylic",
    backgroundColor: "#00000000"
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const distPath = process.env.DIST;
    win.loadFile(path.join(distPath, "index.html"));
  }
  win.on("resize", debouncedUpdateBounds);
  win.on("maximize", debouncedUpdateBounds);
  win.on("unmaximize", debouncedUpdateBounds);
  ipcMain.on("window-minimize", () => win == null ? void 0 : win.minimize());
  ipcMain.on("window-maximize", () => {
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });
  ipcMain.on("window-close", () => win == null ? void 0 : win.close());
  ipcMain.on("create-tab", (_, tabId) => {
    console.log(`[Main] Creating tab: ${tabId}`);
    if (!win) return;
    if (activeViews.has(tabId)) {
      console.log(`[Main] Tab ${tabId} already exists, switching`);
      switchTab(tabId);
      return;
    }
    const view = createBrowserView(tabId);
    activeViews.set(tabId, view);
    tabMetadata.set(tabId, {
      url: "https://google.com",
      title: "New Tab",
      lastAccessed: Date.now()
    });
    enforceLRULimit();
    switchTab(tabId);
  });
  ipcMain.on("switch-tab", (_, tabId) => {
    console.log(`[Main] Switch to tab: ${tabId}`);
    switchTab(tabId);
  });
  ipcMain.on("close-tab", (_, tabId) => {
    console.log(`[Main] Closing tab: ${tabId}`);
    clearSuspensionTimer(tabId);
    const view = activeViews.get(tabId);
    if (view) {
      if ((win == null ? void 0 : win.getBrowserView()) === view) {
        win.setBrowserView(null);
      }
      try {
        view.webContents.destroy();
      } catch (e) {
      }
      activeViews.delete(tabId);
    }
    tabMetadata.delete(tabId);
  });
  ipcMain.on("load-url", (_, { id, url }) => {
    console.log(`[Main] Loading URL: ${url} for tab ${id}`);
    let view = activeViews.get(id);
    if (!view) {
      console.warn(`[Main] View not found for tab ${id}, creating...`);
      view = createBrowserView(id, url);
      activeViews.set(id, view);
      enforceLRULimit();
    } else {
      view.webContents.loadURL(url).catch((e) => console.error("Load error:", e));
    }
    const meta = tabMetadata.get(id);
    tabMetadata.set(id, {
      url,
      title: (meta == null ? void 0 : meta.title) || "Loading...",
      lastAccessed: Date.now()
    });
  });
  ipcMain.on("suspend-tab", (_, tabId) => {
    suspendTab(tabId);
  });
  ipcMain.on("unsuspend-tab", (_, { id, url }) => {
    unsuspendTab(id, url);
  });
  ipcMain.on("go-back", (_, id) => {
    const view = activeViews.get(id);
    if (view == null ? void 0 : view.webContents.canGoBack()) view.webContents.goBack();
  });
  ipcMain.on("go-forward", (_, id) => {
    const view = activeViews.get(id);
    if (view == null ? void 0 : view.webContents.canGoForward()) view.webContents.goForward();
  });
  ipcMain.on("reload", (_, id) => {
    const view = activeViews.get(id);
    view == null ? void 0 : view.webContents.reload();
  });
  ipcMain.on("toggle-reader", async () => {
    if (!win) return;
    const view = win.getBrowserView();
    if (!view) return;
    try {
      const html = await view.webContents.executeJavaScript("document.documentElement.outerHTML");
      const url = view.webContents.getURL();
      const article = await parseReaderContent(html, url);
      if (article) {
        win.webContents.send("reader-data", article);
      }
    } catch (e) {
      console.error("Reader Mode Error:", e);
    }
  });
  const registerShortcuts = () => {
    globalShortcut.register("CommandOrControl+T", () => {
      win == null ? void 0 : win.webContents.send("shortcut-create-tab");
    });
    globalShortcut.register("CommandOrControl+W", () => {
      win == null ? void 0 : win.webContents.send("shortcut-close-tab");
    });
    const reload = () => {
      const view = win == null ? void 0 : win.getBrowserView();
      view == null ? void 0 : view.webContents.reload();
    };
    globalShortcut.register("CommandOrControl+R", reload);
    globalShortcut.register("F5", reload);
    globalShortcut.register("CommandOrControl+L", () => {
      win == null ? void 0 : win.webContents.send("shortcut-focus-address");
    });
  };
  const unregisterShortcuts = () => {
    globalShortcut.unregisterAll();
  };
  win.on("focus", registerShortcuts);
  win.on("blur", unregisterShortcuts);
  if (win.isFocused()) registerShortcuts();
}
app.on("window-all-closed", () => {
  suspensionTimers.forEach((timer) => clearTimeout(timer));
  suspensionTimers.clear();
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.whenReady().then(createWindow);
