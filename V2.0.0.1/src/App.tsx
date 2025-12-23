import { Sidebar } from './components/Sidebar'
import { AddressBar } from './components/AddressBar'
import { useEffect } from 'preact/hooks'
import { useBrowserStore } from './store/useBrowserStore'
import { ReaderModal } from './components/ReaderModal'
import { NoteModal } from './components/NoteModal'
import { Sparkles } from './components/Sparkles'

export function App() {
  const { handleUrlUpdate, updateTitle, tabs } = useBrowserStore()

  // Listen for IPC events from Main Process
  useEffect(() => {
    // URL Updated (Navigation happened in BrowserView)
    const removeUrlListener = window.api.on('url-updated', ({ id, url }) => {
      console.log('IPC url-updated:', id, url)
      handleUrlUpdate(id, url)
    })

    // Title Updated
    const removeTitleListener = window.api.on('title-updated', ({ id, title }) => {
      console.log('IPC title-updated:', id, title)
      updateTitle(id, title)
    })

    // Tab Suspended (from main process auto-suspension)
    const removeSuspendListener = window.api.on('tab-suspended', (tabId: string) => {
      console.log('IPC tab-suspended:', tabId)
      useBrowserStore.setState(state => ({
        tabs: state.tabs.map(t => t.id === tabId ? { ...t, isSuspended: true } : t)
      }))
    })

    // Tab Unsuspended
    const removeUnsuspendListener = window.api.on('tab-unsuspended', (tabId: string) => {
      console.log('IPC tab-unsuspended:', tabId)
      useBrowserStore.setState(state => ({
        tabs: state.tabs.map(t => t.id === tabId ? { ...t, isSuspended: false } : t)
      }))
    })

    // Keyboard Shortcuts
    const removeCreateTab = window.api.on('shortcut-create-tab', () => {
      useBrowserStore.getState().addTab()
    })

    const removeCloseTab = window.api.on('shortcut-close-tab', () => {
      const activeId = useBrowserStore.getState().tabs.find(t => t.isActive)?.id
      if (activeId) useBrowserStore.getState().closeTab(activeId)
    })

    const removeFocusAddress = window.api.on('shortcut-focus-address', () => {
      window.dispatchEvent(new CustomEvent('focus-address-bar'))
    })

    return () => {
      removeUrlListener()
      removeTitleListener()
      removeSuspendListener()
      removeUnsuspendListener()
      removeCreateTab()
      removeCloseTab()
      removeFocusAddress()
    }
  }, [])

  // Initialize First Tab on Mount
  useEffect(() => {
    console.log('App: Syncing tabs to main process')
    tabs.forEach(tab => {
      window.api.send('create-tab', tab.id)
    })
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent font-sans text-white selection:bg-pink-500/30">
      <Sparkles />
      <ReaderModal />
      <NoteModal />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative">
        <AddressBar />

        {/* Main Content Area */}
        <main className="flex-1 relative m-2 mt-0 ml-0 rounded-tl-2xl overflow-hidden glass-panel border-0 border-t border-l border-white/10 shadow-2xl">
          {/* BrowserView Container */}
          <div id="browser-view-container" className="absolute inset-0 w-full h-full z-0" />

          {/* Empty State */}
          <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 bg-black/40">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl animate-pulse" />
            <p className="text-white/20 font-light tracking-[0.2em] text-sm">Waiting for Render...</p>
          </div>
        </main>
      </div>
    </div>
  )
}

