import { useEffect, useState } from 'preact/hooks'
import { X, Type, Sun, Moon, AlignJustify } from 'lucide-preact'
import DOMPurify from 'dompurify'
import clsx from 'clsx'

export function ReaderModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [article, setArticle] = useState<any>(null)
    const [fontSize, setFontSize] = useState(18)
    const [spacing, setSpacing] = useState(1.8)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')

    useEffect(() => {
        // Listen for data from Main Process
        const removeListener = window.api.on('reader-data', (data) => {
            if (data) {
                setArticle(data)
                setIsOpen(true)
            }
        })
        return removeListener
    }, [])

    if (!isOpen || !article) return null

    // Sanitize HTML content for safety
    const cleanContent = DOMPurify.sanitize(article.content)

    const isDark = theme === 'dark'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={clsx(
                "relative w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col scale-100 animate-in zoom-in-95 duration-200 transition-colors",
                isDark 
                    ? "bg-[#1a1a1a] border-white/10" 
                    : "bg-[#fafafa] border-black/10"
            )}>

                {/* Header */}
                <div className={clsx(
                    "h-16 shrink-0 flex items-center justify-between px-8 border-b select-none transition-colors",
                    isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5"
                )}>
                    <div className="flex items-center gap-4">
                        <span className={clsx(
                            "text-xs font-bold uppercase tracking-widest",
                            isDark ? "text-white/40" : "text-black/40"
                        )}>Reader View</span>

                        {/* Font Size Control */}
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                            isDark 
                                ? "text-white/50 bg-black/30 border-white/5" 
                                : "text-black/50 bg-white/50 border-black/5"
                        )}>
                            <Type size={14} />
                            <input
                                type="range"
                                min="14"
                                max="32"
                                step="2"
                                value={fontSize}
                                onInput={(e) => setFontSize(parseInt(e.currentTarget.value))}
                                className="w-20 h-1 bg-current/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="text-xs w-4 font-mono">{fontSize}</span>
                        </div>

                        {/* Spacing Control */}
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
                            isDark 
                                ? "text-white/50 bg-black/30 border-white/5" 
                                : "text-black/50 bg-white/50 border-black/5"
                        )}>
                            <AlignJustify size={14} />
                            <input
                                type="range"
                                min="1.4"
                                max="2.4"
                                step="0.2"
                                value={spacing}
                                onInput={(e) => setSpacing(parseFloat(e.currentTarget.value))}
                                className="w-16 h-1 bg-current/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className={clsx(
                                "p-2 rounded-full transition-colors",
                                isDark 
                                    ? "hover:bg-white/10 text-white/50 hover:text-white" 
                                    : "hover:bg-black/10 text-black/50 hover:text-black"
                            )}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className={clsx(
                            "p-2 rounded-full transition-colors",
                            isDark 
                                ? "hover:bg-white/10 text-white/50 hover:text-white" 
                                : "hover:bg-black/10 text-black/50 hover:text-black"
                        )}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 scroll-smooth">
                    <div className="max-w-2xl mx-auto">
                        <h1 className={clsx(
                            "text-3xl md:text-5xl font-bold mb-8 leading-tight tracking-tight transition-colors",
                            isDark ? "text-white" : "text-gray-900"
                        )}>{article.title}</h1>
                        <div className={clsx(
                            "flex items-center gap-4 mb-10 text-sm border-b pb-6 transition-colors",
                            isDark ? "text-white/40 border-white/5" : "text-black/40 border-black/5"
                        )}>
                            {article.byline && <span className="italic">{article.byline}</span>}
                            <span>•</span>
                            <span>{article.siteName || 'Article'}</span>
                        </div>

                        <div
                            className={clsx(
                                "prose prose-lg max-w-none reader-content transition-colors",
                                isDark ? "prose-invert text-gray-300" : "text-gray-700"
                            )}
                            style={{ fontSize: `${fontSize}px`, lineHeight: spacing }}
                            dangerouslySetInnerHTML={{ __html: cleanContent }}
                        />

                        <div className="h-20" /> {/* Spacer */}
                    </div>
                </div>
            </div>
        </div>
    )
}
