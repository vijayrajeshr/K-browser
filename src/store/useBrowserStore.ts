import { create } from 'zustand'

// Suspension timeout (10 minutes)
export const SUSPENSION_TIMEOUT = 10 * 60 * 1000

export interface Tab {
    id: string
    title: string
    url: string
    isActive: boolean
    isSuspended: boolean
    lastActive: number  // timestamp
}

interface BrowserState {
    tabs: Tab[]
    activeTabId: string | null
    readerModeActive: boolean

    // Tab Actions
    addTab: () => void
    closeTab: (id: string) => void
    switchTab: (id: string) => void
    updateUrl: (id: string, url: string) => void
    updateTitle: (id: string, title: string) => void

    // Suspension
    suspendTab: (id: string) => void
    unsuspendTab: (id: string) => void

    // Reader Mode
    setReaderMode: (active: boolean) => void

    // Notes
    notes: string
    isNotesOpen: boolean
    setNotes: (text: string) => void
    toggleNotes: () => void

    // Legacy compatibility
    navigate: (id: string, url: string) => void
    handleUrlUpdate: (id: string, url: string) => void
    setActiveTab: (id: string) => void
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
    tabs: [
        {
            id: '1',
            title: 'New Tab',
            url: 'https://google.com',
            isActive: true,
            isSuspended: false,
            lastActive: Date.now()
        }
    ],
    activeTabId: '1',
    readerModeActive: false,

    addTab: () => {
        const newTab: Tab = {
            id: crypto.randomUUID(),
            title: 'New Tab',
            url: 'https://google.com',
            isActive: true,
            isSuspended: false,
            lastActive: Date.now()
        }

        set((state) => ({
            tabs: state.tabs.map(t => ({
                ...t,
                isActive: false,
                lastActive: t.isActive ? Date.now() : t.lastActive
            })).concat(newTab),
            activeTabId: newTab.id
        }))

        // IPC: Create the BrowserView
        window.api.send('create-tab', newTab.id)
    },

    closeTab: (id) => {
        const state = get()
        const idx = state.tabs.findIndex(t => t.id === id)
        if (idx === -1) return

        const wasActive = state.tabs[idx].isActive
        const remaining = state.tabs.filter(t => t.id !== id)

        let nextActiveId: string | null = null

        if (wasActive && remaining.length > 0) {
            const newActiveIdx = Math.max(0, idx - 1)
            remaining[newActiveIdx].isActive = true
            remaining[newActiveIdx].lastActive = Date.now()
            nextActiveId = remaining[newActiveIdx].id
        }

        set({
            tabs: remaining,
            activeTabId: nextActiveId
        })

        // IPC: Switch to next tab if needed
        if (nextActiveId) {
            window.api.send('switch-tab', nextActiveId)
        }

        // IPC: Destroy view
        window.api.send('close-tab', id)
    },

    switchTab: (id) => {
        const state = get()
        const tab = state.tabs.find(t => t.id === id)
        if (!tab) return

        // If suspended, unsuspend first
        if (tab.isSuspended) {
            get().unsuspendTab(id)
        }

        set((state) => ({
            tabs: state.tabs.map(t => ({
                ...t,
                isActive: t.id === id,
                lastActive: t.id === id ? Date.now() : t.lastActive
            })),
            activeTabId: id
        }))

        // IPC: Switch view
        window.api.send('switch-tab', id)
    },

    updateUrl: (id, url) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, url } : t)
        }))
    },

    updateTitle: (id, title) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, title } : t)
        }))
    },

    suspendTab: (id) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, isSuspended: true } : t)
        }))
        // IPC: Tell main process to destroy view but keep metadata
        window.api.send('suspend-tab', id)
    },

    unsuspendTab: (id) => {
        const tab = get().tabs.find(t => t.id === id)
        if (!tab) return

        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, isSuspended: false, lastActive: Date.now() } : t)
        }))
        // IPC: Recreate the BrowserView
        window.api.send('unsuspend-tab', { id, url: tab.url })
    },

    setReaderMode: (active) => set({ readerModeActive: active }),

    // Notes
    notes: '',
    isNotesOpen: false,
    setNotes: (text) => set({ notes: text }),
    toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),

    // Legacy compatibility aliases
    navigate: (id, url) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, url } : t)
        }))
        window.api.send('load-url', { id, url })
    },

    handleUrlUpdate: (id, url) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, url } : t)
        }))
    },

    setActiveTab: (id) => get().switchTab(id)
}))

