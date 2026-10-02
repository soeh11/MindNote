// MindNote API Adapter (Electron IPC with LocalStorage Fallback)

const isElectron = typeof window !== 'undefined' && window.mindnoteAPI;

// 메모 본문에서 요약문(2줄) 추출 함수
export function extractSummary(content) {
  if (!content) return '내용 없음';
  const lines = content.split('\n')
    .map(line => line.replace(/^[#*->\s\[\]x0-9.]+/g, '').trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) return '내용 없음';
  return lines.slice(0, 2).join(' ');
}

export const api = {
  async getNotes() {
    if (isElectron) return await window.mindnoteAPI.getNotes();
    const data = localStorage.getItem('mindnote_notes');
    return data ? JSON.parse(data) : [];
  },

  async getNote(id) {
    if (isElectron) return await window.mindnoteAPI.getNote(id);
    const notes = await this.getNotes();
    return notes.find(n => n.id === id) || null;
  },

  async saveNote({ id, title, content, color, tags, summary }) {
    if (isElectron) return await window.mindnoteAPI.saveNote({ id, title, content, color, tags, summary });
    const notes = await this.getNotes();
    const noteId = id || `note-${Date.now()}`;
    const safeTitle = title || '제목 없는 메모';
    const safeColor = color || 'default';
    const safeTags = Array.isArray(tags) ? tags : [];
    const finalSummary = (summary !== undefined && summary !== null && summary.trim() !== '')
      ? summary.trim()
      : extractSummary(content);
    const updated = {
      id: noteId,
      title: safeTitle,
      color: safeColor,
      tags: safeTags,
      content,
      summary: finalSummary,
      updatedAt: new Date().toISOString()
    };
    const idx = notes.findIndex(n => n.id === noteId);
    if (idx >= 0) notes[idx] = updated;
    else notes.unshift(updated);
    localStorage.setItem('mindnote_notes', JSON.stringify(notes));
    return updated;
  },

  async deleteNote(id) {
    if (isElectron) return await window.mindnoteAPI.deleteNote(id);
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    localStorage.setItem('mindnote_notes', JSON.stringify(filtered));
    return { success: true };
  },

  async getMaps() {
    if (isElectron) return await window.mindnoteAPI.getMaps();
    const data = localStorage.getItem('mindnote_maps_list');
    return data ? JSON.parse(data) : [];
  },

  async getMap(id) {
    if (isElectron) return await window.mindnoteAPI.getMap(id);
    const data = localStorage.getItem(`mindnote_map_${id}`);
    return data ? JSON.parse(data) : null;
  },

  async saveMap(mapData) {
    if (isElectron) return await window.mindnoteAPI.saveMap(mapData);
    const mapId = mapData.id || `map-${Date.now()}`;
    const toSave = {
      ...mapData,
      id: mapId,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`mindnote_map_${mapId}`, JSON.stringify(toSave));
    
    // update list
    const noteIds = Array.isArray(toSave.nodes)
      ? toSave.nodes.map(n => n.data?.noteId).filter(Boolean)
      : [];
    const item = { id: mapId, title: toSave.title, updatedAt: toSave.updatedAt, noteIds };
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    localStorage.setItem('mindnote_maps_list', JSON.stringify(list));
    return toSave;
  },

  async deleteMap(id) {
    if (isElectron) return await window.mindnoteAPI.deleteMap(id);
    localStorage.removeItem(`mindnote_map_${id}`);
    const list = await this.getMaps();
    const filtered = list.filter(m => m.id !== id);
    localStorage.setItem('mindnote_maps_list', JSON.stringify(filtered));
    return { success: true };
  },

  async openNotesFolder() {
    if (isElectron) return await window.mindnoteAPI.openNotesFolder();
    alert('이 기능은 데스크톱 Electron 앱에서 작동합니다.');
  },

  async openMapsFolder() {
    if (isElectron) return await window.mindnoteAPI.openMapsFolder();
    alert('이 기능은 데스크톱 Electron 앱에서 작동합니다.');
  },

  async getDataPaths() {
    if (isElectron && window.mindnoteAPI?.getDataPaths) {
      return await window.mindnoteAPI.getDataPaths();
    }
    return { dataDir: 'C:\\MM\\data', notesDir: 'C:\\MM\\data\\notes', mapsDir: 'C:\\MM\\data\\maps' };
  },

  async confirm(message) {
    if (isElectron && window.mindnoteAPI?.confirmDialog) {
      return await window.mindnoteAPI.confirmDialog(message);
    }
    return window.confirm(message);
  },

  refocus() {
    if (isElectron && window.mindnoteAPI?.refocus) {
      window.mindnoteAPI.refocus();
    }
  },

  // Auto Updater API
  async checkForUpdates() {
    if (isElectron && window.mindnoteAPI?.checkForUpdates) {
      return await window.mindnoteAPI.checkForUpdates();
    }
    return { status: 'web', message: '웹 브라우저 환경에서는 항상 최신 버전을 사용합니다.' };
  },

  quitAndInstall() {
    if (isElectron && window.mindnoteAPI?.quitAndInstall) {
      window.mindnoteAPI.quitAndInstall();
    }
  },

  async getAppVersion() {
    if (isElectron && window.mindnoteAPI?.getAppVersion) {
      return await window.mindnoteAPI.getAppVersion();
    }
    return '1.0.0';
  },

  onUpdateStatus(callback) {
    if (isElectron && window.mindnoteAPI?.onUpdateStatus) {
      return window.mindnoteAPI.onUpdateStatus(callback);
    }
    return () => {};
  }
};
