const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close:    () => ipcRenderer.send('window-close'),

  // File operations
  pickFile:    () => ipcRenderer.invoke('pick-file'),
  openFolder:  (p) => ipcRenderer.send('open-folder', p),

  // FIX: macOS drag & drop — webUtils.getPathForFile is reliable on all platforms
  getFilePath: (file) => webUtils.getPathForFile(file),

  // Video
  getVideoInfo: (p) => ipcRenderer.invoke('get-video-info', p),
  processVideo: (p, mode) => ipcRenderer.invoke('process-video', p, mode),

  // FFmpeg progress listener
  onProgress: (callback) => {
    ipcRenderer.on('ffmpeg-progress', (_, data) => callback(data));
  },
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('ffmpeg-progress');
  },
});
