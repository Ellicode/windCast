const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
    updateApps: (callback) => ipcRenderer.on('getApps', (_event, value) => callback(value)),
    loadPackages: (callback) => ipcRenderer.on("loadPackages",(_event,value) => callback(value)),
    closeWindow: () => ipcRenderer.send("close"),
    openApp: (app) => ipcRenderer.send("openApp", app),
    openBrowser: (url) => ipcRenderer.send("openBrowser", url),
    askApps: () => ipcRenderer.send("apps"),
    setSize: (height) => ipcRenderer.send("setSize", height),
});
