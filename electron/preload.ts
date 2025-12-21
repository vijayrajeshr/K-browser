import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  send: (channel: string, data?: any) => {
    const validChannels = [
      'create-tab',
      'close-tab',
      'switch-tab',
      'load-url',
      'window-minimize',
      'window-maximize',
      'window-close',
      'toggle-reader',
      'go-back',
      'go-forward',
      'reload'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [
      'url-updated',
      'title-updated',
      'reader-data',
      'shortcut-create-tab',
      'shortcut-close-tab',
      'shortcut-focus-address'
    ]
    if (validChannels.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => func(...args)
      ipcRenderer.on(channel, subscription)

      // Return cleanup function
      return () => ipcRenderer.removeListener(channel, subscription)
    }
    return () => { }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.api = api
}
