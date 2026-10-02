const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mindnoteAPI', {
  // Notes API
  getNotes: () => ipcRenderer.invoke('get-notes'),
  getNote: (id) => ipcRenderer.invoke('get-note', id),
  saveNote: (noteData) => ipcRenderer.invoke('save-note', noteData),
  deleteNote: (id) => ipcRenderer.invoke('delete-note', id),
  
  // Maps API
  getMaps: () => ipcRenderer.invoke('get-maps'),
  getMap: (id) => ipcRenderer.invoke('get-map', id),
  saveMap: (mapData) => ipcRenderer.invoke('save-map', mapData),
  deleteMap: (id) => ipcRenderer.invoke('delete-map', id),

  // System
  openNotesFolder: () => ipcRenderer.invoke('open-notes-folder'),
  openMapsFolder: () => ipcRenderer.invoke('open-maps-folder'),
  getDataPaths: () => ipcRenderer.invoke('get-data-paths'),
  confirmDialog: (message) => ipcRenderer.invoke('confirm-dialog', message),
  refocus: () => ipcRenderer.invoke('refocus-window'),

  // Live File Watcher Event (새로고침 없는 실시간 데이터 갱신)
  onDataUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('data-updated', handler);
    return () => ipcRenderer.removeListener('data-updated', handler);
  },

  // Auto Updater API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  }
});
