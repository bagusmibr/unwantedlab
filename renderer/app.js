/* UNWANTED LAB — Renderer Logic
   Made by Bagus (Shifted) MIBR */

const api = window.electronAPI;

// ── State ─────────────────────────────────────────────────
let selectedFilePath = null;
let outputFilePath   = null;
let selectedMode     = 'hq';

// ── DOM refs ───────────────────────────────────────────────
const screens = {
  pick:       document.getElementById('screen-pick'),
  processing: document.getElementById('screen-processing'),
  done:       document.getElementById('screen-done'),
  error:      document.getElementById('screen-error'),
};

const dropZone   = document.getElementById('drop-zone');
const dzLabel    = document.getElementById('dz-label');
const dzSub      = document.getElementById('dz-sub');
const infoPanel  = document.getElementById('info-panel');
const infoFile   = document.getElementById('info-filename');
const btnProcess = document.getElementById('btn-process');

const statRes    = document.getElementById('stat-res');
const statFps    = document.getElementById('stat-fps');
const statBr     = document.getElementById('stat-br');
const statSize   = document.getElementById('stat-size');

const procPct    = document.getElementById('proc-pct');
const progFill   = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const terminal   = document.getElementById('terminal-body');

const donePath   = document.getElementById('done-path');
const btnFolder  = document.getElementById('btn-open-folder');
const btnReset   = document.getElementById('btn-reset');

const errorMsg   = document.getElementById('error-msg');
const btnErrReset= document.getElementById('btn-error-reset');

// ── Mode selector ──────────────────────────────────────────
const modeButtons = document.querySelectorAll('.mode-btn');
const hqBadge     = document.getElementById('engine-hq-badge');

function setMode(mode) {
  selectedMode = mode;
  modeButtons.forEach(b => {
    const isSelected = b.dataset.mode === mode;
    b.classList.toggle('selected', isSelected);
    b.querySelector('.mode-sel').textContent = isSelected ? '[*]' : '[ ]';
  });
  if (mode === 'hq' || mode === 'combo') {
    hqBadge.textContent = '[OK]';
    hqBadge.className = 'eng-badge active';
  } else {
    hqBadge.textContent = '[--]';
    hqBadge.className = 'eng-badge';
  }
}

modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
setMode('hq');

// ── Titlebar controls ──────────────────────────────────────
document.getElementById('btn-min').addEventListener('click',   () => api.minimize());
document.getElementById('btn-close').addEventListener('click', () => api.close());

// ── Screen switcher ────────────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Drop Zone ──────────────────────────────────────────────
// Click to open file picker
dropZone.addEventListener('click', async () => {
  const filePath = await api.pickFile();
  if (filePath) await loadFile(filePath);
});

// Drag events — fix for macOS using webUtils.getPathForFile
dropZone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  // Only remove class if leaving the drop zone itself (not a child)
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  const filePath = file.path; // Natively populated by Electron on file drop

  if (!filePath) {
    // Show error directly on the UI instead of terminal
    dzLabel.textContent = 'ERROR';
    dzSub.textContent = 'Gagal membaca file. Coba klik untuk browse.';
    return;
  }

  await loadFile(filePath);
});

// ── Load file & get video info ─────────────────────────────
async function loadFile(filePath) {
  selectedFilePath = filePath;

  const fileName = filePath.split(/[/\\]/).pop();
  dzLabel.textContent = '✓ ' + fileName;
  dzSub.textContent   = 'File siap diproses';
  dropZone.classList.add('has-file');

  // Show info panel
  statRes.textContent  = '...';
  statFps.textContent  = '...';
  statBr.textContent   = '...';
  statSize.textContent = '...';
  infoFile.textContent = filePath;
  infoPanel.classList.remove('hidden');
  btnProcess.disabled = true;

  // Fetch video metadata
  const info = await api.getVideoInfo(filePath);
  if (info) {
    statRes.textContent  = info.width + '×' + info.height;
    statFps.textContent  = info.fps + ' fps';
    statBr.textContent   = info.bitrate > 0 ? info.bitrate + ' kbps' : '—';
    statSize.textContent = info.sizeMB + ' MB';
  } else {
    statRes.textContent  = '—';
    statFps.textContent  = '—';
    statBr.textContent   = '—';
    statSize.textContent = '—';
  }

  btnProcess.disabled = false;
}

// ── Process button ─────────────────────────────────────────
btnProcess.addEventListener('click', async () => {
  if (!selectedFilePath) return;

  showScreen('processing');
  procPct.textContent = '0%';
  progFill.style.width = '0%';
  progFill.classList.remove('encoding-pulse');

  const fileName = selectedFilePath.split(/[/\\]/).pop();
  terminal.innerHTML = `
    <div class="log-line hi">&gt; UNWANTED LAB v1.0 — Engine Active</div>
    <div class="log-line hi">&gt; Made by Bagus (Shifted) MIBR</div>
    <div class="log-line">&gt; Input: ${fileName}</div>
    <div class="log-line">&gt; Mode: ${selectedMode === 'hq' ? 'HQ Re-encode (libx264 CRF 18 veryfast)' : selectedMode === 'combo' ? 'COMBO (HQ Re-encode + Fast Trick)' : 'Fast (metadata only)'}</div>
    <div class="log-line">&gt; Starting pipeline...</div>
  `;

  // Start elapsed timer (backup if no progress events)
  let encodeStarted = false;
  const timerStart = Date.now();
  const timerInterval = setInterval(() => {
    if (encodeStarted) {
      const sec = Math.floor((Date.now() - timerStart) / 1000);
      const m = Math.floor(sec / 60);
      const s = String(sec % 60).padStart(2, '0');
      progressText.textContent = `ENCODING ${m}:${s}`;
    }
  }, 1000);

  // Progress listener
  api.removeProgressListener();
  api.onProgress(({ progress, line }) => {
    if (!encodeStarted) {
      encodeStarted = true;
      progFill.classList.add('encoding-pulse');
    }

    // Update percentage
    const pct = Math.min(99, progress);
    procPct.textContent = pct + '%';
    if (!progFill.classList.contains('encoding-pulse')) {
      progFill.style.width = pct + '%';
    }

    // Show log line
    if (line && line.trim()) {
      addLogLine(line.trim());
    }
  });

  // Start encoding — show pulse if no progress within 1 second
  setTimeout(() => {
    if (!encodeStarted) {
      encodeStarted = true;
      progFill.classList.add('encoding-pulse');
    }
  }, 1000);

  const result = await api.processVideo(selectedFilePath, selectedMode);

  clearInterval(timerInterval);
  api.removeProgressListener();

  if (result.success) {
    outputFilePath = result.outputPath;
    donePath.textContent = result.outputPath;
    showScreen('done');
  } else {
    errorMsg.textContent = result.error || 'Unknown error occurred';
    showScreen('error');
  }
});

// ── Terminal helper ────────────────────────────────────────
function addLogLine(text, type) {
  const div = document.createElement('div');

  let cls = 'log-line';
  if (type === 'err' || text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
    cls += ' err';
  } else if (text.includes('✓') || text.includes('Done') || text.includes('selesai')) {
    cls += ' ok';
  }
  div.className = cls;
  div.textContent = '> ' + text;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;

  while (terminal.children.length > 300) {
    terminal.removeChild(terminal.firstChild);
  }
}

// ── Done actions ───────────────────────────────────────────
btnFolder.addEventListener('click', () => {
  if (outputFilePath) api.openFolder(outputFilePath);
});

btnReset.addEventListener('click', resetApp);
btnErrReset.addEventListener('click', resetApp);

function resetApp() {
  selectedFilePath = null;
  outputFilePath   = null;

  dropZone.classList.remove('has-file', 'drag-over');
  dzLabel.textContent = 'DROP_VIDEO_HERE';
  dzSub.innerHTML     = 'atau <span class="link-text">klik untuk browse</span> · MP4 MOV MKV AVI';
  infoPanel.classList.add('hidden');
  btnProcess.disabled = true;
  progFill.classList.remove('encoding-pulse');
  progressText.textContent = 'ENCODING';

  showScreen('pick');
}
