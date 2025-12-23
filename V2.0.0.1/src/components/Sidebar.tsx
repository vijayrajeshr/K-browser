import { useBrowserStore } from '../store/useBrowserStore'
import { Plus, X, Globe, Minus, Square, Moon } from 'lucide-preact'
import clsx from 'clsx'

export function Sidebar() {
    const { tabs, addTab, switchTab, closeTab } = useBrowserStore()

    return (
        <aside className="w-64 h-full flex flex-col bg-white/10 backdrop-blur-xl border-r border-white/20 z-50">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5 px-4 pt-4 pb-2 no-drag">
                <button
                    onClick={() => window.api.send('window-close')}
                    className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 shadow-inner group flex items-center justify-center transition-all"
                >
                    <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                </button>
                <button
                    onClick={() => window.api.send('window-minimize')}
                    className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 shadow-inner group flex items-center justify-center transition-all"
                >
                    <Minus size={8} className="text-black/50 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                </button>
                <button
                    onClick={() => window.api.send('window-maximize')}
                    className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 shadow-inner group flex items-center justify-center transition-all"
                >
                    <Square size={6} className="text-black/50 opacity-0 group-hover:opacity-100" fill="currentColor" strokeWidth={0} />
                </button>
            </div>

            {/* Header */}
            <div className="h-10 flex items-center justify-between px-4 mt-1 select-none drag-region">
                <span className="font-medium text-white/50 text-xs tracking-wider uppercase">Tabs</span>
                <button
                    onClick={addTab}
                    className="p-1.5 rounded-lg transition-colors no-drag hover:bg-white/10 text-white/70 hover:text-white"
                    title="New Tab"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Tab List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 no-scrollbar">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => switchTab(tab.id)}
                        className={clsx(
                            "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm select-none border border-transparent",
                            tab.isActive
                                ? "bg-white/15 text-white shadow-sm border-white/10"
                                : tab.isSuspended
                                    ? "text-white/30 hover:bg-white/5 hover:text-white/50"
                                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                        )}
                    >
                        {/* Icon - shows sleep icon if suspended */}
                        {tab.isSuspended ? (
                            <Moon size={14} className="shrink-0 text-purple-400/60" />
                        ) : (
                            <Globe size={14} className={clsx("shrink-0", tab.isActive ? "text-blue-400" : "opacity-50")} />
                        )}

                        {/* Title */}
                        <span className={clsx(
                            "truncate flex-1 font-light",
                            tab.isSuspended && "italic"
                        )}>
                            {tab.title}
                        </span>

                        {/* Suspended Badge */}
                        {tab.isSuspended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300/70 uppercase tracking-wide">
                                Sleep
                            </span>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                            className={clsx(
                                "p-1 rounded transition-all focus:opacity-100",
                                "hover:bg-red-500/20 hover:text-red-400",
                                tab.isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </aside>
    )
}

