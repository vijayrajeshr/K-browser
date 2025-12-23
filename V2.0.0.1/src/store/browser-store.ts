import { create } from 'zustand'

export interface Tab {
    id: string
    url: string
    title: string
    isActive: boolean
    lastActiveTime: number // For suspension
}

interface BrowserState {
    tabs: Tab[]
    addTab: () => void
    removeTab: (id: string) => void
    setActiveTab: (id: string) => void
    updateTab: (id: string, data: Partial<Tab>) => void
}

export const useBrowserStore = create<BrowserState>((set) => ({
    tabs: [
        { id: '1', url: 'https://google.com', title: 'New Tab', isActive: true, lastActiveTime: Date.now() }
    ],
    addTab: () => set((state) => {
        const newTab: Tab = {
            id: crypto.randomUUID(),
            url: 'about:blank',
            title: 'New Tab',
            isActive: true,
            lastActiveTime: Date.now()
        }
        // Deactivate others
        const newTabs = state.tabs.map(t => ({ ...t, isActive: false }))
        return { tabs: [...newTabs, newTab] }
    }),
    removeTab: (id) => set((state) => {
        const remaining = state.tabs.filter((t) => t.id !== id)
        // If we closed active tab, activate the last one
        let newTabs = remaining
        if (state.tabs.find(t => t.id === id)?.isActive && remaining.length > 0) {
            newTabs = remaining.map((t, idx) =>
                idx === remaining.length - 1 ? { ...t, isActive: true } : t
            )
        }
        return { tabs: newTabs }
    }),
    setActiveTab: (id) => set((state) => ({
        tabs: state.tabs.map((t) => ({
            ...t,
            isActive: t.id === id,
            lastActiveTime: t.id === id ? Date.now() : t.lastActiveTime
        }))
    })),
    updateTab: (id, data) => set((state) => ({
        tabs: state.tabs.map((t) => t.id === id ? { ...t, ...data } : t)
    }))
}))
