"use strict";
const electron = require("electron");
const api = {
  send: (channel, data) => {
    const validChannels = [
      "create-tab",
      "close-tab",
      "switch-tab",
      "load-url",
      "window-minimize",
      "window-maximize",
      "window-close",
      "toggle-reader",
      "go-back",
      "go-forward",
      "reload"
    ];
    if (validChannels.includes(channel)) {
      electron.ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = [
      "url-updated",
      "title-updated",
      "reader-data",
      "shortcut-create-tab",
      "shortcut-close-tab",
      "shortcut-focus-address"
    ];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => func(...args);
      electron.ipcRenderer.on(channel, subscription);
      return () => electron.ipcRenderer.removeListener(channel, subscription);
    }
    return () => {
    };
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
