import { useBrowserStore } from '../store/useBrowserStore'
import { X, StickyNote } from 'lucide-preact'
import clsx from 'clsx'

export function NoteModal() {
    const { notes, setNotes, isNotesOpen, toggleNotes } = useBrowserStore()

    if (!isNotesOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[500px] h-[400px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2 text-white/80">
                        <StickyNote size={18} className="text-yellow-400" />
                        <span className="font-medium text-sm">Quick Notes</span>
                    </div>
                    <button
                        onClick={toggleNotes}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-0">
                    <textarea
                        value={notes}
                        onInput={(e) => setNotes(e.currentTarget.value)}
                        placeholder="Type your thoughts here..."
                        className="w-full h-full bg-transparent resize-none p-4 text-white/90 focus:outline-none font-light leading-relaxed placeholder:text-white/20"
                        spellcheck={false}
                    />
                </div>

                {/* Footer */}
                <div className="h-8 flex items-center justify-end px-4 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-widest bg-black/20">
                    Auto-saving
                </div>
            </div>
        </div>
    )
}
