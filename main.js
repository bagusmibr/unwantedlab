const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let ffmpegPath;
try { 
  ffmpegPath = require('ffmpeg-static'); 
  if (ffmpegPath.includes('app.asar')) ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
} catch { ffmpegPath = 'ffmpeg'; }

let ffprobePath;
try { 
  ffprobePath = require('ffprobe-static').path; 
  if (ffprobePath.includes('app.asar')) ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked');
} catch { ffprobePath = 'ffprobe'; }

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 400,
    minHeight: 600,
    resizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Minimize / Close window ─────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close', () => app.quit());

// ── IPC: Pilih file video via dialog ─────────────────────────────────────────
ipcMain.handle('pick-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Pilih Video',
    filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ── IPC: Buka folder output di Finder/Explorer ───────────────────────────────
ipcMain.on('open-folder', (_, folderPath) => {
  shell.showItemInFolder(folderPath);
});

// ── IPC: Ambil info video via ffprobe ────────────────────────────────────────
ipcMain.handle('get-video-info', async (_, inputPath) => {
  return new Promise((resolve) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      inputPath,
    ];

    let output = '';
    try {
      const proc = spawn(ffprobePath, args);
      proc.stdout.on('data', (d) => { output += d.toString(); });
      proc.on('close', () => {
        try {
          const info = JSON.parse(output);
          const video = info.streams.find(s => s.codec_type === 'video');
          const format = info.format;

          const fpsRaw = video?.r_frame_rate || '0/1';
          const [num, den] = fpsRaw.split('/').map(Number);
          const fps = den > 0 ? Math.round(num / den) : 0;

          const sizeBytes = parseInt(format?.size || '0');
          const sizeMB = (sizeBytes / 1024 / 1024).toFixed(1);
          const duration = parseFloat(format?.duration || '0');
          const bitrate = Math.round(parseInt(format?.bit_rate || '0') / 1000);

          resolve({
            width: video?.width || 0,
            height: video?.height || 0,
            fps,
            sizeMB,
            duration: duration.toFixed(1),
            bitrate,
            codec: video?.codec_name || 'unknown',
          });
        } catch {
          resolve(null);
        }
      });
      proc.on('error', () => resolve(null));
    } catch (e) {
      resolve(null);
    }
  });
});

// ── IPC: Proses video dengan FFmpeg ──────────────────────────────────────────
// mode: 'fast' = metadata trick only (instant)
// mode: 'hq'   = full re-encode dengan kualitas tertinggi (recommended)
ipcMain.handle('process-video', async (_, inputPath, mode) => {
  const ext  = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  const dir  = path.dirname(inputPath);

  const runFfmpeg = (inPath, outPath, modeArg) => {
    return new Promise((resolve) => {
      let args = [];
      if (modeArg === 'fast') {
        args = [
          '-y', '-itsscale', '2', '-i', inPath,
          '-c:v', 'copy', '-c:a', 'copy',
          '-movflags', '+faststart', outPath
        ];
      } else {
        args = [
          '-y', '-i', inPath,
          '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
          '-profile:v', 'high', '-level:v', '4.2',
          '-pix_fmt', 'yuv420p', '-b:v', '0',
          '-c:a', 'aac', '-b:a', '192k',
          '-movflags', '+faststart', outPath
        ];
      }

      let logLines = [];
      let progress = 0;
      let duration = 0;

      try {
        const proc = spawn(ffmpegPath, args);

        proc.stderr.on('data', (data) => {
          const text = data.toString();
          logLines.push(text);

          const durMatch = text.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
          if (durMatch) {
            const h = parseInt(durMatch[1]), m = parseInt(durMatch[2]), s = parseFloat(durMatch[3]);
            duration = h * 3600 + m * 60 + s;
          }

          const timeMatch = text.match(/time=(\d+):(\d+):([\d.]+)/);
          if (timeMatch && duration > 0) {
            const h = parseInt(timeMatch[1]), m = parseInt(timeMatch[2]), s = parseFloat(timeMatch[3]);
            const elapsed = h * 3600 + m * 60 + s;
            progress = Math.min(99, Math.round((elapsed / duration) * 100));
          }

          let prefix = modeArg === 'fast' ? '[FAST] ' : '[HQ] ';
          mainWindow.webContents.send('ffmpeg-progress', { progress, line: prefix + text.trim() });
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true, outputPath: outPath });
          } else {
            resolve({ success: false, error: logLines.slice(-20).join('\n') });
          }
        });

        proc.on('error', (err) => resolve({ success: false, error: err.message }));
      } catch (err) {
        resolve({ success: false, error: 'Gagal menjalankan FFmpeg: ' + err.message });
      }
    });
  };

  if (mode === 'combo') {
    const hqOut = path.join(dir, `${base}_hq.mp4`);
    const finalOut = path.join(dir, `${base}_shifted.mp4`);
    
    mainWindow.webContents.send('ffmpeg-progress', { progress: 0, line: '▶ Memulai Step 1/2: HQ_REENCODE...' });
    const res1 = await runFfmpeg(inputPath, hqOut, 'hq');
    if (!res1.success) return res1;
    
    mainWindow.webContents.send('ffmpeg-progress', { progress: 0, line: '▶ Memulai Step 2/2: FAST_TRICK...' });
    const res2 = await runFfmpeg(hqOut, finalOut, 'fast');
    
    // Cleanup temporary HQ file if successful
    if (res2.success) {
      try { fs.unlinkSync(hqOut); } catch (e) {}
      mainWindow.webContents.send('ffmpeg-progress', { progress: 100, line: '✓ COMBO Selesai!' });
    }
    return res2;
  } else {
    const outputPath = path.join(dir, `${base}_shifted.mp4`);
    const res = await runFfmpeg(inputPath, outputPath, mode);
    if (res.success) {
      mainWindow.webContents.send('ffmpeg-progress', { progress: 100, line: '✓ Selesai!' });
    }
    return res;
  }
});
