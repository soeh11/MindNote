const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// 자동 업데이트 기본 설정 (백그라운드 자동 다운로드 및 종료 시 자동 설치)
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Windows에서 한/영(Alt) 키나 단축키로 인한 메뉴바 포커스 탈취 및 키보드 먹통 현상 100% 방지!
Menu.setApplicationMenu(null);

// GPU 하드웨어 가속 플래그 (안정적인 표준 플래그만 적용)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let DATA_DIR = path.join('C:', 'MM', 'data');
let NOTES_DIR = path.join(DATA_DIR, 'notes');
let MAPS_DIR = path.join(DATA_DIR, 'maps');

function initDataPaths() {
  if (app.isPackaged) {
    // 실제 배포본(설치본 .exe)에서는 사용자의 [내 문서\MindNote\data] 폴더를 사용합니다.
    DATA_DIR = path.join(app.getPath('documents'), 'MindNote', 'data');
  } else {
    // 로컬 개발 환경에서는 C:\MM\data 를 사용합니다.
    DATA_DIR = path.join('C:', 'MM', 'data');
  }
  NOTES_DIR = path.join(DATA_DIR, 'notes');
  MAPS_DIR = path.join(DATA_DIR, 'maps');
}

let lastInternalSaveTime = 0;
let fileWatchDebounce = null;

// 디렉토리 초기화
function ensureDirectories() {
  initDataPaths();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
  if (!fs.existsSync(MAPS_DIR)) fs.mkdirSync(MAPS_DIR, { recursive: true });

  initSampleData();
}

function extractSummary(content) {
  if (!content) return '';
  const lines = content.split('\n')
    .map(line => line.replace(/^[#*->\s\[\]x]+/, '').trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) return '내용 없음';
  return lines.slice(0, 2).join(' ') || '내용 없음';
}

function initSampleData() {
  const existingNotes = fs.readdirSync(NOTES_DIR);
  if (existingNotes.length === 0) {
    const sampleNotes = [
      {
        id: 'note-welcome',
        title: '🌟 MindNote에 오신 것을 환영해요',
        content: `# 🌟 MindNote 시작하기\n\nMindNote는 **생각의 숲(마인드맵)**과 **디테일한 메모(노트)**를 연결해주는 신개념 메모장이에요!\n\n### 💡 주요 기능\n- 마인드맵 노드를 클릭하면 이 사이드 패널이 열려요.\n- 여기서 글을 수정하면 마인드맵 노드의 요약도 자동으로 업데이트됩니다.\n- 모든 메모는 C:\\MM\\data\\notes 에 실제 마크다운 파일로 안전하게 저장돼요.`
      },
      {
        id: 'note-ideas',
        title: '💡 신규 프로젝트 브레인스토밍',
        content: `# 💡 신규 프로젝트 브레인스토밍\n\n- 목표: 사용하기 쉬운 메모 도구 개발\n- 타겟층: 기획자, 개발자, 대학생, 연구원\n- 차별점: 마인드맵의 시각적 연결 + 노션 스타일의 깔끔한 글쓰기\n- 일정: 1차 프로토타입 완성 후 바로 피드백 수렴`
      },
      {
        id: 'note-tech',
        title: '⚙️ 기술 스택 및 아키텍처',
        content: `# ⚙️ 기술 스택 및 아키텍처\n\n- **데스크톱 엔진**: Electron\n- **화면 구성**: React, Vite, Tailwind CSS\n- **마인드맵 캔버스**: React Flow (xyflow)\n- **저장소**: 로컬 파일 시스템 (.md 및 .json)`
      }
    ];

    sampleNotes.forEach(n => {
      const filePath = path.join(NOTES_DIR, `${n.id}.md`);
      const fileData = `---
id: ${n.id}
title: ${n.title}
color: default
updatedAt: ${new Date().toISOString()}
---
${n.content}`;
      fs.writeFileSync(filePath, fileData, 'utf-8');
    });

    const sampleMap = {
      id: 'map-default',
      title: '내 첫 번째 마인드맵',
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node-1',
          type: 'noteNode',
          position: { x: 250, y: 100 },
          data: {
            noteId: 'note-welcome',
            title: '🌟 MindNote에 오신 것을 환영해요',
            summary: 'MindNote는 생각의 숲(마인드맵)과 디테일한 메모(노트)를 연결해주는 신개념 메모장이에요!',
            color: 'default'
          }
        },
        {
          id: 'node-2',
          type: 'noteNode',
          position: { x: 50, y: 320 },
          data: {
            noteId: 'note-ideas',
            title: '💡 신규 프로젝트 브레인스토밍',
            summary: '목표: 사용하기 쉬운 메모 도구 개발 타겟층: 기획자, 개발자, 연구원',
            color: 'blue'
          }
        },
        {
          id: 'node-3',
          type: 'noteNode',
          position: { x: 450, y: 320 },
          data: {
            noteId: 'note-tech',
            title: '⚙️ 기술 스택 및 아키텍처',
            summary: '데스크톱 엔진: Electron, 마인드맵 캔버스: React Flow',
            color: 'purple'
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'node-1', target: 'node-2', animated: false, style: { stroke: '#2383E2', strokeWidth: 2 } },
        { id: 'e1-3', source: 'node-1', target: 'node-3', animated: false, style: { stroke: '#2383E2', strokeWidth: 2 } }
      ]
    };

    fs.writeFileSync(path.join(MAPS_DIR, 'map-default.json'), JSON.stringify(sampleMap, null, 2), 'utf-8');
  }
}

function parseNoteFile(filename) {
  const filePath = path.join(NOTES_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  let meta = {};
  let content = raw;

  if (match) {
    const metaStr = match[1];
    content = match[2];
    metaStr.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        meta[key] = val;
      }
    });
  }

  const id = meta.id || path.basename(filename, '.md');
  const title = meta.title || '제목 없는 메모';
  const color = meta.color || 'default';
  const updatedAt = meta.updatedAt || new Date().toISOString();
  let customSummary = '';
  if (meta.summary) {
    try {
      customSummary = JSON.parse(meta.summary);
    } catch (_) {
      customSummary = meta.summary.replace(/^["']|["']$/g, '').trim();
    }
  }
  const summary = customSummary || extractSummary(content);

  let tags = [];
  if (meta.tags) {
    const rawTags = meta.tags.trim();
    if (rawTags.startsWith('[') && rawTags.endsWith(']')) {
      try {
        tags = JSON.parse(rawTags);
      } catch (_) {
        tags = rawTags.slice(1, -1).split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      }
    } else {
      tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  return { id, title, color, tags, content, summary, updatedAt, filename };
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: 'MindNote',
    backgroundColor: '#FBFBFA',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  // 메뉴바 완전 비활성화 (Windows Alt/한영키 포커스 탈취 방지)
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // 윈도우 활성화 시 webContents로 키보드 포커스 즉시 인계
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC 핸들러 등록 (완전 비동기 논블로킹 파일 I/O로 교체하여 프레임 드랍 100% 방지)
function setupIpc() {
  // 키보드 포커스 복원 요청
  ipcMain.handle('refocus-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
    return true;
  });

  // 포커스 깨짐 없는 안전한 네이티브 확인 다이얼로그
  ipcMain.handle('confirm-dialog', async (_, message) => {
    if (!mainWindow || mainWindow.isDestroyed()) return true;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['확인', '취소'],
      defaultId: 0,
      cancelId: 1,
      title: 'MindNote 확인',
      message: message || ''
    });
    // 다이얼로그 닫힌 후 키보드 포커스 즉시 복원
    mainWindow.webContents.focus();
    return response === 0;
  });
  ipcMain.handle('get-notes', async () => {
    try {
      const files = await fs.promises.readdir(NOTES_DIR);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      return mdFiles.map(parseNoteFile);
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  ipcMain.handle('get-note', async (_, id) => {
    try {
      const filePath = path.join(NOTES_DIR, `${id}.md`);
      if (fs.existsSync(filePath)) {
        return parseNoteFile(`${id}.md`);
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  });

  // 비동기 쓰기로 메인 스레드 멈춤 현상(Jank) 완전 제거!
  ipcMain.handle('save-note', async (_, { id, title, content, color, tags, summary }) => {
    try {
      lastInternalSaveTime = Date.now();
      const noteId = id || `note-${Date.now()}`;
      const safeTitle = title || '제목 없는 메모';
      const safeColor = color || 'default';
      const safeTags = Array.isArray(tags) ? tags : [];
      const updatedAt = new Date().toISOString();
      const finalSummary = (summary !== undefined && summary !== null && summary.trim() !== '')
        ? summary.trim()
        : extractSummary(content);

      const fileData = `---
id: ${noteId}
title: ${safeTitle}
color: ${safeColor}
tags: [${safeTags.map(t => JSON.stringify(t)).join(', ')}]
summary: ${JSON.stringify(finalSummary)}
updatedAt: ${updatedAt}
---
${content || ''}`;

      const filePath = path.join(NOTES_DIR, `${noteId}.md`);
      await fs.promises.writeFile(filePath, fileData, 'utf-8');

      return { id: noteId, title: safeTitle, color: safeColor, tags: safeTags, content, summary: finalSummary, updatedAt, filename: `${noteId}.md` };
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  ipcMain.handle('delete-note', async (_, id) => {
    try {
      lastInternalSaveTime = Date.now();
      const filePath = path.join(NOTES_DIR, `${id}.md`);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-maps', async () => {
    try {
      const files = await fs.promises.readdir(MAPS_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      const maps = [];
      for (const f of jsonFiles) {
        try {
          const content = await fs.promises.readFile(path.join(MAPS_DIR, f), 'utf-8');
          const data = JSON.parse(content);
          const noteIds = Array.isArray(data.nodes)
            ? data.nodes.map(n => n.data?.noteId).filter(Boolean)
            : [];
          maps.push({
            id: data.id || path.basename(f, '.json'),
            title: data.title || '새 마인드맵',
            updatedAt: data.updatedAt,
            noteIds
          });
        } catch (err) {
          console.error('Error reading map file:', f, err);
        }
      }
      return maps;
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  ipcMain.handle('get-map', async (_, id) => {
    try {
      const filePath = path.join(MAPS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  });

  // 비동기 쓰기로 맵 저장 시 메인 스레드 멈춤 현상(Jank) 완전 제거!
  ipcMain.handle('save-map', async (_, mapData) => {
    try {
      lastInternalSaveTime = Date.now();
      const mapId = mapData.id || `map-${Date.now()}`;
      const toSave = {
        ...mapData,
        id: mapId,
        updatedAt: new Date().toISOString()
      };
      const filePath = path.join(MAPS_DIR, `${mapId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
      return toSave;
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  ipcMain.handle('delete-map', async (_, id) => {
    try {
      lastInternalSaveTime = Date.now();
      const filePath = path.join(MAPS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('open-notes-folder', async () => {
    shell.openPath(NOTES_DIR);
    return true;
  });

  ipcMain.handle('open-maps-folder', async () => {
    shell.openPath(MAPS_DIR);
    return true;
  });

  ipcMain.handle('get-data-paths', () => {
    return {
      dataDir: DATA_DIR,
      notesDir: NOTES_DIR,
      mapsDir: MAPS_DIR
    };
  });
}

// 실시간 파일 감시 (외부 변경 또는 스크립트 수정 시 새로고침 없이 즉시 화면 동기화!)
function setupFileWatchers() {
  const notify = (type) => {
    // 앱 자체의 저장으로 인한 이벤트는 600ms 동안 무시하여 중복 갱신/루프 방지
    if (Date.now() - lastInternalSaveTime < 600) return;

    if (fileWatchDebounce) clearTimeout(fileWatchDebounce);
    fileWatchDebounce = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('data-updated', { type, timestamp: Date.now() });
      }
    }, 200);
  };

  try {
    fs.watch(NOTES_DIR, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        notify('notes');
      }
    });
  } catch (err) {
    console.error('Failed to watch notes dir:', err);
  }

  try {
    fs.watch(MAPS_DIR, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        notify('maps');
      }
    });
  } catch (err) {
    console.error('Failed to watch maps dir:', err);
  }
}

// 자동 업데이트 이벤트 및 IPC 핸들러 등록
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'checking', message: '최신 버전 확인 중...' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'available', 
        version: info.version,
        releaseNotes: info.releaseNotes,
        message: `새로운 버전(v${info.version})을 발견했습니다. 백그라운드에서 다운로드를 시작합니다.` 
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'not-available', 
        version: app.getVersion(),
        message: '현재 최신 버전을 사용하고 있습니다.' 
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'downloading',
        percent: Math.floor(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
        message: `업데이트 다운로드 중... (${Math.floor(progressObj.percent)}%)`
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version,
        message: `v${info.version} 다운로드가 완료되었습니다. 앱을 재시작하면 즉시 적용됩니다.`
      });
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: err == null ? '업데이트 확인 중 오류가 발생했습니다.' : (err.message || err.toString())
      });
    }
  });

  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
      return {
        status: 'dev-mode',
        version: app.getVersion(),
        message: '개발 모드에서는 자동 업데이트 확인을 시뮬레이션합니다 (배포 설치본에서 정상 동작).'
      };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { status: 'success', updateInfo: result?.updateInfo };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  });

  ipcMain.handle('quit-and-install', () => {
    // isSilent: true (설치 창 일절 없이 백그라운드 무소음 설치), isForceRunAfter: true (설치 후 즉시 자동 실행)
    autoUpdater.quitAndInstall(true, true);
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}

app.whenReady().then(() => {
  ensureDirectories();
  setupIpc();
  setupAutoUpdater();
  createWindow();
  setupFileWatchers();

  // 프로덕션 모드에서는 실행 5초 후 백그라운드 자동 업데이트 검사 실행
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Background update check:', err?.message || err);
      });
    }, 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
