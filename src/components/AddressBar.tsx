import { useBrowserStore } from '../store/useBrowserStore'
import { useState, useEffect } from 'preact/hooks'
import { Search, RotateCw, ArrowLeft, ArrowRight, BookOpen, StickyNote } from 'lucide-preact'

export function AddressBar() {
    const { tabs, navigate, toggleNotes } = useBrowserStore()
    const activeTab = tabs.find(t => t.isActive)
    const [inputVal, setInputVal] = useState('')

    useEffect(() => {
        if (activeTab) setInputVal(activeTab.url)
    }, [activeTab?.id, activeTab?.url])

    // Listen for shortcut focus
    useEffect(() => {
        const handleFocus = () => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement
            if (input) input.select()
        }
        window.addEventListener('focus-address-bar', handleFocus)
        return () => window.removeEventListener('focus-address-bar', handleFocus)
    }, [])

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            e.preventDefault() // Prevent form submission if in form
            if (activeTab) {
                console.log('AddressBar: Navigating to', inputVal)
                let url = inputVal
                if (!url.startsWith('http') && !url.startsWith('about:')) {
                    if (url.includes('.') && !url.includes(' ')) {
                        url = 'https://' + url
                    } else {
                        url = 'https://google.com/search?q=' + encodeURIComponent(url)
                    }
                }
                navigate(activeTab.id, url)
            } else {
                console.warn('AddressBar: No active tab found')
            }
        }
    }

    return (
        <div className="h-16 flex items-center px-6 gap-4 drag-region z-40">
            {/* Navigation */}
            <div className="flex items-center gap-1 no-drag">
                <button
                    onClick={() => activeTab && window.api.send('go-back', activeTab.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white disabled:opacity-30"
                    disabled={!activeTab}
                    title="Back"
                >
                    <ArrowLeft size={18} />
                </button>
                <button
                    onClick={() => activeTab && window.api.send('go-forward', activeTab.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white disabled:opacity-30"
                    disabled={!activeTab}
                    title="Forward"
                >
                    <ArrowRight size={18} />
                </button>
                <button
                    onClick={() => activeTab && window.api.send('reload', activeTab.id)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white disabled:opacity-30"
                    disabled={!activeTab}
                    title="Reload"
                >
                    <RotateCw size={16} />
                </button>
            </div>

            {/* Input */}
            <div className="flex-1 max-w-3xl mx-auto relative group no-drag">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-pink-400 transition-colors">
                    <Search size={16} />
                </div>
                <input
                    type="text"
                    value={inputVal}
                    onInput={(e) => setInputVal(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-black/20 text-white/90 text-sm py-3 pl-11 pr-10 rounded-2xl border border-transparent focus:border-white/10 focus:bg-black/40 focus:outline-none transition-all shadow-inner font-light tracking-wide backdrop-blur-sm"
                    placeholder="Search or enter website name"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                        onClick={toggleNotes}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                        title="Notes"
                    >
                        <StickyNote size={16} />
                    </button>
                    <button
                        onClick={() => window.api.send('toggle-reader')}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                        title="Reader View"
                    >
                        <BookOpen size={16} />
                    </button>
                </div>
            </div>

            {/* Spacer for drag */}
            <div className="w-10" />
        </div>
    )
}
