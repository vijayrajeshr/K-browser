import { app, BrowserWindow, BrowserView, ipcMain, screen, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// ============================================================
// PERFORMANCE CONFIGURATION
// ============================================================

// Max active views (LRU eviction when exceeded) - saves RAM
const MAX_ACTIVE_VIEWS = 3

// Suspension timeout: 10 minutes for background tabs
const SUSPENSION_TIMEOUT = 10 * 60 * 1000

// Debounce delay for resize events (ms)
const RESIZE_DEBOUNCE_MS = 15

// ============================================================
// VIEW MANAGEMENT SYSTEM
// ============================================================

// Active BrowserViews (in memory) - limited to MAX_ACTIVE_VIEWS
const activeViews = new Map<string, BrowserView>()

// Tab metadata (survives suspension - stores URL, title, lastAccessed)
const tabMetadata = new Map<string, { url: string; title: string; lastAccessed: number }>()

// Suspension timers (10 min timeout after tab becomes inactive)
const suspensionTimers = new Map<string, NodeJS.Timeout>()

// Currently active tab ID
let activeTabId: string | null = null

// Debounce timer for resize
let resizeDebounceTimer: NodeJS.Timeout | null = null

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Debounce function for resize events
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

// ============================================================
// TAB MANAGER - LRU Eviction Logic
// ============================================================

function enforceLRULimit() {
  // If we have more views than allowed, evict LRU
  if (activeViews.size <= MAX_ACTIVE_VIEWS) return

  // Find least recently used tab (excluding active)
  let lruTabId: string | null = null
  let lruTime = Infinity

  for (const [tabId] of activeViews) {
    if (tabId === activeTabId) continue // Don't evict active tab

    const meta = tabMetadata.get(tabId)
    const lastAccessed = meta?.lastAccessed || 0

    if (lastAccessed < lruTime) {
      lruTime = lastAccessed
      lruTabId = tabId
    }
  }

  // Evict LRU tab
  if (lruTabId) {
    console.log(`[Main] LRU evicting tab: ${lruTabId} (${activeViews.size} active views)`)
    suspendTab(lruTabId)
  }
}

// ============================================================
// BROWSERVIEW MANAGEMENT
// ============================================================

function createBrowserView(tabId: string, url: string = 'https://google.com'): BrowserView {
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })
  view.setBackgroundColor('#ffffff')

  // Listen for navigation events
  const handleUrlUpdate = (newUrl: string) => {
    const meta = tabMetadata.get(tabId)
    tabMetadata.set(tabId, {
      url: newUrl,
      title: meta?.title || 'Loading...',
      lastAccessed: Date.now()
    })
    win?.webContents.send('url-updated', { id: tabId, url: newUrl })
  }

  const handleTitleUpdate = (title: string) => {
    const meta = tabMetadata.get(tabId)
    tabMetadata.set(tabId, {
      url: meta?.url || url,
      title,
      lastAccessed: Date.now()
    })
    win?.webContents.send('title-updated', { id: tabId, title })
  }

  view.webContents.on('did-navigate', (_, u) => handleUrlUpdate(u))
  view.webContents.on('did-navigate-in-page', (_, u) => handleUrlUpdate(u))
  view.webContents.on('page-title-updated', (_, title) => handleTitleUpdate(title))

  view.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load ${tabId}: ${errorCode} - ${errorDescription}`)
  })

  // Load URL
  view.webContents.loadURL(url).catch(e => console.error(`[Main] Load error:`, e))

  return view
}

function switchTab(tabId: string) {
  if (!win) return

  const view = activeViews.get(tabId)
  console.log(`[Main] switchTab: ${tabId}, view exists: ${!!view}`)

  // Clear suspension timer for this tab (it's now active)
  clearSuspensionTimer(tabId)

  // Start suspension timer for previously active tab
  if (activeTabId && activeTabId !== tabId) {
    startSuspensionTimer(activeTabId)
  }

  // Update last accessed time
  const meta = tabMetadata.get(tabId)
  if (meta) {
    tabMetadata.set(tabId, { ...meta, lastAccessed: Date.now() })
  }

  activeTabId = tabId

  if (view) {
    win.setBrowserView(view)
    updateViewBounds(view)
  }
}

function startSuspensionTimer(tabId: string) {
  clearSuspensionTimer(tabId)

  console.log(`[Main] Starting 10-min suspension timer for tab: ${tabId}`)

  const timer = setTimeout(() => {
    suspendTab(tabId)
  }, SUSPENSION_TIMEOUT)

  suspensionTimers.set(tabId, timer)
}

function clearSuspensionTimer(tabId: string) {
  const timer = suspensionTimers.get(tabId)
  if (timer) {
    clearTimeout(timer)
    suspensionTimers.delete(tabId)
  }
}

function suspendTab(tabId: string) {
  console.log(`[Main] Suspending tab: ${tabId}`)

  const view = activeViews.get(tabId)
  if (!view) return

  // Store current URL before destroying
  const currentUrl = view.webContents.getURL()
  const currentTitle = view.webContents.getTitle()
  const meta = tabMetadata.get(tabId)
  tabMetadata.set(tabId, {
    url: currentUrl,
    title: currentTitle,
    lastAccessed: meta?.lastAccessed || Date.now()
  })

  // Remove from window if it's the active view
  if (win?.getBrowserView() === view) {
    win.setBrowserView(null)
  }

  // Destroy the view to free memory
  try {
    (view.webContents as any).destroy()
  } catch (e) { /* ignore */ }

  activeViews.delete(tabId)

  // Notify renderer
  win?.webContents.send('tab-suspended', tabId)
  console.log(`[Main] Tab ${tabId} suspended. Active views: ${activeViews.size}`)
}

function unsuspendTab(tabId: string, url?: string) {
  console.log(`[Main] Unsuspending tab: ${tabId}`)

  // Get stored metadata or use provided URL
  const meta = tabMetadata.get(tabId)
  const loadUrl = url || meta?.url || 'https://google.com'

  // Create new view
  const view = createBrowserView(tabId, loadUrl)
  activeViews.set(tabId, view)

  // Update metadata
  tabMetadata.set(tabId, {
    url: loadUrl,
    title: meta?.title || 'Loading...',
    lastAccessed: Date.now()
  })

  // Enforce LRU limit after adding new view
  enforceLRULimit()

  // Notify renderer
  win?.webContents.send('tab-unsuspended', tabId)
}

// Debounced resize handler
const debouncedUpdateBounds = debounce(() => {
  if (!win) return
  const view = win.getBrowserView()
  if (view) updateViewBounds(view)
}, RESIZE_DEBOUNCE_MS)

function updateViewBounds(view: BrowserView) {
  if (!win) return
  const bounds = win.getContentBounds()

  const SIDEBAR_WIDTH = 256
  const TOPBAR_HEIGHT = 64

  view.setBounds({
    x: SIDEBAR_WIDTH,
    y: TOPBAR_HEIGHT,
    width: Math.max(0, bounds.width - SIDEBAR_WIDTH),
    height: Math.max(0, bounds.height - TOPBAR_HEIGHT)
  })

  view.setAutoResize({ width: true, height: true, horizontal: true, vertical: true })
}

// ============================================================
// LAZY LOADING - Reader Mode
// ============================================================

// Lazy loaded modules (not imported at startup)
let readerModules: { JSDOM: any; Readability: any } | null = null

async function lazyLoadReaderModules() {
  if (readerModules) return readerModules

  console.log('[Main] Lazy loading reader modules...')
  const start = Date.now()

  const [jsdomModule, readabilityModule] = await Promise.all([
    import('jsdom'),
    import('@mozilla/readability')
  ])

  readerModules = {
    JSDOM: jsdomModule.JSDOM,
    Readability: readabilityModule.Readability
  }

  console.log(`[Main] Reader modules loaded in ${Date.now() - start}ms`)
  return readerModules
}

async function parseReaderContent(htmlString: string, url: string = 'https://example.com') {
  try {
    const { JSDOM, Readability } = await lazyLoadReaderModules()
    const dom = new JSDOM(htmlString, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    return article
  } catch (error) {
    console.error('Reader parsing failed:', error)
    return null
  }
}

// ============================================================
// MAIN WINDOW CREATION
// ============================================================

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    frame: false,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    vibrancy: 'sidebar',
    backgroundMaterial: 'acrylic',
    backgroundColor: '#00000000'
  })

  // Load UI
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const distPath = process.env.DIST as string
    win.loadFile(path.join(distPath, 'index.html'))
  }

  // DEBOUNCED resize listeners (prevents UI lag)
  win.on('resize', debouncedUpdateBounds)
  win.on('maximize', debouncedUpdateBounds)
  win.on('unmaximize', debouncedUpdateBounds)

  // ============================================================
  // IPC HANDLERS
  // ============================================================

  // Window Controls
  ipcMain.on('window-minimize', () => win?.minimize())
  ipcMain.on('window-maximize', () => {
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })
  ipcMain.on('window-close', () => win?.close())

  // --- TAB MANAGEMENT ---

  // Create Tab
  ipcMain.on('create-tab', (_, tabId: string) => {
    console.log(`[Main] Creating tab: ${tabId}`)
    if (!win) return

    if (activeViews.has(tabId)) {
      console.log(`[Main] Tab ${tabId} already exists, switching`)
      switchTab(tabId)
      return
    }

    const view = createBrowserView(tabId)
    activeViews.set(tabId, view)
    tabMetadata.set(tabId, {
      url: 'https://google.com',
      title: 'New Tab',
      lastAccessed: Date.now()
    })

    // Enforce LRU limit
    enforceLRULimit()

    switchTab(tabId)
  })

  // Switch Tab
  ipcMain.on('switch-tab', (_, tabId: string) => {
    console.log(`[Main] Switch to tab: ${tabId}`)
    switchTab(tabId)
  })

  // Close Tab
  ipcMain.on('close-tab', (_, tabId: string) => {
    console.log(`[Main] Closing tab: ${tabId}`)

    clearSuspensionTimer(tabId)

    const view = activeViews.get(tabId)
    if (view) {
      if (win?.getBrowserView() === view) {
        win.setBrowserView(null)
      }
      try {
        (view.webContents as any).destroy()
      } catch (e) { /* ignore */ }
      activeViews.delete(tabId)
    }

    tabMetadata.delete(tabId)
  })

  // Load URL
  ipcMain.on('load-url', (_, { id, url }: { id: string; url: string }) => {
    console.log(`[Main] Loading URL: ${url} for tab ${id}`)

    let view = activeViews.get(id)

    if (!view) {
      console.warn(`[Main] View not found for tab ${id}, creating...`)
      view = createBrowserView(id, url)
      activeViews.set(id, view)
      enforceLRULimit()
    } else {
      view.webContents.loadURL(url).catch(e => console.error('Load error:', e))
    }

    const meta = tabMetadata.get(id)
    tabMetadata.set(id, {
      url,
      title: meta?.title || 'Loading...',
      lastAccessed: Date.now()
    })
  })

  // Suspend Tab
  ipcMain.on('suspend-tab', (_, tabId: string) => {
    suspendTab(tabId)
  })

  // Unsuspend Tab
  ipcMain.on('unsuspend-tab', (_, { id, url }: { id: string; url?: string }) => {
    unsuspendTab(id, url)
  })

  // --- NAVIGATION ---

  ipcMain.on('go-back', (_, id: string) => {
    const view = activeViews.get(id)
    if (view?.webContents.canGoBack()) view.webContents.goBack()
  })

  ipcMain.on('go-forward', (_, id: string) => {
    const view = activeViews.get(id)
    if (view?.webContents.canGoForward()) view.webContents.goForward()
  })

  ipcMain.on('reload', (_, id: string) => {
    const view = activeViews.get(id)
    view?.webContents.reload()
  })

  // --- READER MODE (Lazy Loaded) ---

  ipcMain.on('toggle-reader', async () => {
    if (!win) return
    const view = win.getBrowserView()
    if (!view) return

    try {
      const html = await view.webContents.executeJavaScript('document.documentElement.outerHTML')
      const url = view.webContents.getURL()

      // Lazy load and parse
      const article = await parseReaderContent(html, url)

      if (article) {
        win.webContents.send('reader-data', article)
      }
    } catch (e) {
      console.error('Reader Mode Error:', e)
    }
  })

  // --- KEYBOARD SHORTCUTS ---

  const registerShortcuts = () => {
    globalShortcut.register('CommandOrControl+T', () => {
      win?.webContents.send('shortcut-create-tab')
    })
    globalShortcut.register('CommandOrControl+W', () => {
      win?.webContents.send('shortcut-close-tab')
    })

    const reload = () => {
      const view = win?.getBrowserView()
      view?.webContents.reload()
    }
    globalShortcut.register('CommandOrControl+R', reload)
    globalShortcut.register('F5', reload)

    globalShortcut.register('CommandOrControl+L', () => {
      win?.webContents.send('shortcut-focus-address')
    })
  }

  const unregisterShortcuts = () => {
    globalShortcut.unregisterAll()
  }

  win.on('focus', registerShortcuts)
  win.on('blur', unregisterShortcuts)

  if (win.isFocused()) registerShortcuts()
}

// ============================================================
// APP LIFECYCLE
// ============================================================

app.on('window-all-closed', () => {
  // Clear all suspension timers
  suspensionTimers.forEach(timer => clearTimeout(timer))
  suspensionTimers.clear()

  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(createWindow)
