export function Sparkles() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Twinkling Stars - increased count and improved animation */}
            {[...Array(60)].map((_, i) => {
                const size = Math.random() * 4 + 2
                const delay = Math.random() * 3
                const duration = Math.random() * 2 + 1.5
                const initialOpacity = Math.random() * 0.3 + 0.1
                return (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: initialOpacity,
                            animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
                            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                        }}
                    />
                )
            })}

            {/* Shooting Stars - occasional streaks */}
            {[...Array(3)].map((_, i) => (
                <div
                    key={`shoot-${i}`}
                    className="absolute h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
                    style={{
                        top: `${10 + i * 25}%`,
                        left: '-10%',
                        width: '100px',
                        opacity: 0,
                        animation: `shootingStar ${6 + i * 3}s linear ${i * 4}s infinite`,
                        transform: 'rotate(-45deg)',
                        boxShadow: '0 0 8px rgba(255,255,255,0.9)',
                    }}
                />
            ))}

            {/* Gradient Orbs for ambient glow - made brighter */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

            {/* Inline keyframes for twinkling */}
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.1; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.3); }
                }
                @keyframes shootingStar {
                    0% { left: -10%; opacity: 0; }
                    3% { opacity: 1; }
                    12% { left: 110%; opacity: 0; }
                    100% { left: 110%; opacity: 0; }
                }
            `}</style>
        </div>
    )
}
