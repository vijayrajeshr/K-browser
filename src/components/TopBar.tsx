import { ArrowLeft, ArrowRight, RotateCw, BookOpen, Search } from 'lucide-preact'
import { useBrowserStore } from '../store/browser-store'
import { useState, useEffect } from 'preact/hooks'

export function TopBar() {
    const { tabs } = useBrowserStore()
    const activeTab = tabs.find(t => t.isActive)
    const [urlInput, setUrlInput] = useState('')

    useEffect(() => {
        if (activeTab) setUrlInput(activeTab.url)
    }, [activeTab?.id, activeTab?.url])

    const handleNavigate = (e: any) => {
        if (e.key === 'Enter') {
            // IPC would go here
            console.log('Navigate to:', urlInput)
            // Mock update for UI immediate feedback
            // In real app: Main process confirms navigation -> Store update
        }
    }

    return (
        <header className="h-14 w-full flex items-center px-4 gap-4 glass shrink-0 z-40 drag-region">
            {/* Navigation Controls */}
            <div className="flex items-center gap-1 text-white/70 no-drag">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white" disabled={!activeTab}>
                    <ArrowLeft size={18} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white" disabled={!activeTab}>
                    <ArrowRight size={18} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white" disabled={!activeTab}>
                    <RotateCw size={18} />
                </button>
            </div>

            {/* Address Bar */}
            <div className="flex-1 max-w-2xl mx-auto relative group no-drag">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/30 group-focus-within:text-pink-400 transition-colors">
                    <Search size={14} />
                </div>
                <input
                    type="text"
                    value={urlInput}
                    onInput={(e) => setUrlInput(e.currentTarget.value)}
                    onKeyDown={handleNavigate}
                    className="w-full bg-black/20 text-white text-sm py-2.5 pl-9 pr-10 rounded-xl border border-white/5 focus:outline-none focus:bg-black/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-light shadow-inner"
                    placeholder="Search or enter website name"
                />
                <div className="absolute inset-y-0 right-1 flex items-center">
                    <button className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Reader Mode">
                        <BookOpen size={14} />
                    </button>
                </div>
            </div>

            {/* Spacer for Drag Region */}
            <div className="w-[100px]" />
        </header>
    )
}
