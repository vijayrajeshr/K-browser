export { }

declare global {
    interface Window {
        api: {
            send: (channel: string, data?: any) => void
            on: (channel: string, func: (...args: any[]) => void) => () => void
        }
    }
}
