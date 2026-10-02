import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MindmapCanvas from './components/MindmapCanvas';
import SidePeekEditor from './components/SidePeekEditor';
import SettingsModal from './components/SettingsModal';
import SearchModal from './components/SearchModal';
import { api } from './api';

export default function App() {
  const [maps, setMaps] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(null);
  const [currentMap, setCurrentMap] = useState(null);
  const [mapHistory, setMapHistory] = useState([]); // 상위 마인드맵 이동 히스토리

  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCanvasNoteId, setSelectedCanvasNoteId] = useState(null);
  const [updateReady, setUpdateReady] = useState(null); // { version }

  const currentSelectedNoteId = activeNote?.id || selectedCanvasNoteId;

  // 캔버스 노드 추가 핸들러 Ref
  const canvasAddNoteRef = useRef(null);

  // 현재 열린 마인드맵 파일에서 사용된 태그 목록 추출 (추천 태그용)
  const currentMapTags = useMemo(() => {
    if (!currentMap?.nodes) return [];
    const noteIdSet = new Set(currentMap.nodes.map(n => n.data?.noteId).filter(Boolean));
    const tagSet = new Set();
    notes.forEach(n => {
      if (noteIdSet.has(n.id) && Array.isArray(n.tags)) {
        n.tags.forEach(t => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [currentMap?.nodes, notes]);

  // 검색 모달 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 테마 및 설정 모달 상태
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mindnote_theme') || 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindnote_theme', theme);
  }, [theme]);

  // 글로벌 단축키: Ctrl + , (설정), Ctrl + F / Ctrl + K (빠른 검색 모달)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Windows 한/영(Alt) 키 포커스 탈취 및 입력 먹통 방지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') {
        e.preventDefault();
      }
    };
    const handleMouseDown = () => {
      api.refocus();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const currentMapIdRef = useRef(currentMapId);
  currentMapIdRef.current = currentMapId;

  const activeNoteRef = useRef(activeNote);
  activeNoteRef.current = activeNote;

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 실시간 파일 변경 감지 (외부 추가/수정 시 새로고침 없이 즉시 자동 동기화!)
  useEffect(() => {
    let unsubscribe = null;
    if (window.mindnoteAPI?.onDataUpdated) {
      unsubscribe = window.mindnoteAPI.onDataUpdated(async () => {
        try {
          const [fetchedMaps, fetchedNotes] = await Promise.all([
            api.getMaps(),
            api.getNotes()
          ]);
          setMaps(fetchedMaps);
          setNotes(fetchedNotes);

          // 현재 열려있는 마인드맵 데이터 조용히 갱신
          if (currentMapIdRef.current) {
            const latestMap = await api.getMap(currentMapIdRef.current);
            if (latestMap) {
              setCurrentMap(latestMap);
            }
          }

          // 현재 열려있는 사이드 메모가 있다면 최신 내용 갱신
          if (activeNoteRef.current) {
            const latestNote = await api.getNote(activeNoteRef.current.id);
            if (latestNote) {
              setActiveNote(latestNote);
            }
          }
        } catch (err) {
          console.error('Failed to auto-sync external file changes:', err);
        }
      });
    }

    // 창 포커스 복귀 시 무소음 동기화
    const handleWindowFocus = async () => {
      try {
        const [fetchedMaps, fetchedNotes] = await Promise.all([
          api.getMaps(),
          api.getNotes()
        ]);
        setMaps(fetchedMaps);
        setNotes(fetchedNotes);
      } catch (_) {}
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // 자동 업데이트 완료 감지 (알림 배너용)
  useEffect(() => {
    const unsub = api.onUpdateStatus((data) => {
      if (data?.status === 'downloaded') {
        setUpdateReady({ version: data.version });
      }
    });
    return () => unsub?.();
  }, []);

  const loadInitialData = async () => {
    try {
      const [fetchedMaps, fetchedNotes] = await Promise.all([
        api.getMaps(),
        api.getNotes()
      ]);
      setMaps(fetchedMaps);
      setNotes(fetchedNotes);

      if (fetchedMaps.length > 0) {
        const firstMap = await api.getMap(fetchedMaps[0].id);
        setCurrentMapId(fetchedMaps[0].id);
        setCurrentMap(firstMap);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleSelectMap = async (mapId, clearHistory = false) => {
    try {
      const map = await api.getMap(mapId);
      if (clearHistory) setMapHistory([]);
      setCurrentMapId(mapId);
      setCurrentMap(map);
    } catch (err) {
      console.error('Failed to load map:', err);
    }
  };

  // 하위 마인드맵으로 들어가기 (진입)
  const handleOpenSubmap = async (submapId) => {
    if (submapId === currentMapId) return;
    setMapHistory(prev => [...prev, currentMapId]);
    await handleSelectMap(submapId, false);
  };

  // 상위 마인드맵으로 돌아가기 (뒤로가기)
  const handleBackMap = async () => {
    if (mapHistory.length === 0) return;
    const prevMapId = mapHistory[mapHistory.length - 1];
    setMapHistory(prev => prev.slice(0, -1));
    await handleSelectMap(prevMapId, false);
  };

  // 새 마인드맵 생성 (prompt 완전 제거, 즉시 생성)
  const handleNewMap = async () => {
    const mapCount = maps.length + 1;
    const newTitle = `새 마인드맵 ${mapCount}`;
    const newMap = {
      id: `map-${Date.now()}`,
      title: newTitle,
      nodes: [],
      edges: []
    };
    await api.saveMap(newMap);
    const updatedMaps = await api.getMaps();
    setMaps(updatedMaps);
    setCurrentMapId(newMap.id);
    setCurrentMap(newMap);
  };

  // 마인드맵 제목 변경
  const handleRenameMap = async (mapId, newTitle) => {
    if (!newTitle || !currentMap) return;
    const updated = { ...currentMap, title: newTitle };
    await api.saveMap(updated);
    const updatedMaps = await api.getMaps();
    setMaps(updatedMaps);
    setCurrentMap(updated);
  };

  const handleDeleteMap = async (mapId) => {
    const ok = await api.confirm('이 마인드맵을 삭제하시겠습니까? (연결된 메모 파일은 유지됩니다)');
    if (!ok) return;
    await api.deleteMap(mapId);
    const updatedMaps = await api.getMaps();
    setMaps(updatedMaps);
    if (currentMapId === mapId) {
      if (updatedMaps.length > 0) {
        handleSelectMap(updatedMaps[0].id);
      } else {
        setCurrentMapId(null);
        setCurrentMap(null);
      }
    }
  };

  const handleSaveMap = async (mapData) => {
    try {
      const saved = await api.saveMap(mapData);
      setCurrentMap(saved);
      const currentNoteIds = (saved.nodes || []).map(n => n.data?.noteId).filter(Boolean);
      setMaps(prev => {
        const found = prev.find(m => m.id === saved.id);
        if (found && found.title === saved.title && found.noteIds?.length === currentNoteIds.length) {
          return prev;
        }
        return prev.map(m => m.id === saved.id ? { ...m, title: saved.title, noteIds: currentNoteIds } : m);
      });
      return saved;
    } catch (err) {
      console.error('Failed to save map:', err);
      throw err;
    }
  };

  // 메모 선택 (사이드 피크 열기 - 부드러운 슬라이드 인)
  const handleSelectNote = async (noteId) => {
    let note = notes.find(n => n.id === noteId);
    if (!note) {
      note = await api.getNote(noteId);
    }
    if (note) {
      setActiveNote(note);
      // 다음 틱에서 열어서 확실한 CSS transition 발동
      requestAnimationFrame(() => {
        setIsEditorOpen(true);
      });
    }
  };

  // 메모 닫기 (부드러운 슬라이드 아웃)
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setTimeout(() => {
      setActiveNote(null);
      setIsMaximized(false);
    }, 300);
  };

  // 노드 클릭 시
  const handleNodeClick = (noteId) => {
    handleSelectNote(noteId);
  };

  // 새 메모 생성 (글자 옆 + 버튼)
  const handleNewNote = async () => {
    const noteCount = notes.length + 1;
    const newNote = {
      id: `note-${Date.now()}`,
      title: `새 메모 ${noteCount}`,
      content: `# 새 메모 ${noteCount}\n\n여기에 내용을 입력하세요.`
    };
    const saved = await api.saveNote(newNote);
    const updatedNotes = await api.getNotes();
    setNotes(updatedNotes);
    setActiveNote(saved);
    requestAnimationFrame(() => {
      setIsEditorOpen(true);
    });
    return saved;
  };

  // 마인드맵에서 "노드 추가" 버튼 클릭 시
  const handleNewNoteAndAddNode = async (position, callback) => {
    const noteCount = notes.length + 1;
    const newNote = {
      id: `note-${Date.now()}`,
      title: `새 메모 ${noteCount}`,
      content: `# 새 메모 ${noteCount}\n\n내용을 입력하세요.`
    };
    const saved = await api.saveNote(newNote);
    const updatedNotes = await api.getNotes();
    setNotes(updatedNotes);
    setActiveNote(saved);
    requestAnimationFrame(() => {
      setIsEditorOpen(true);
    });
    if (callback) callback(saved);
  };

  // 캔버스에 새 하위 마인드맵 생성 및 노드 추가
  const handleNewSubmapAndAddNode = async (position, callback) => {
    const mapCount = maps.length + 1;
    const newTitle = `하위 마인드맵 ${mapCount}`;
    const newMap = {
      id: `map-${Date.now()}`,
      title: newTitle,
      nodes: [],
      edges: []
    };
    await api.saveMap(newMap);
    const updatedMaps = await api.getMaps();
    setMaps(updatedMaps);
    if (callback) callback(newMap);
  };

  // 포스트잇 -> 정식 메모 파일 승격 시 실제 .md 저장 및 notes 상태 갱신
  const handlePromoteStickyToNote = async ({ title, content, color }) => {
    try {
      const newNote = {
        id: `note-${Date.now()}`,
        title,
        content,
        color: color || 'default',
        tags: []
      };
      const saved = await api.saveNote(newNote);
      const updatedNotes = await api.getNotes();
      setNotes(updatedNotes);
      return saved;
    } catch (err) {
      console.error('Failed to promote sticky to note:', err);
      throw err;
    }
  };

  // 메모 저장 (에디터에서 실시간 변경 시)
  const handleSaveNote = async (updatedNote) => {
    try {
      const saved = await api.saveNote(updatedNote);
      setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
      // activeNote의 참조가 매번 바뀌어 textarea 한글 조합이 깨지지 않도록 id 일치 시에만 업데이트
      setActiveNote(prev => (prev && prev.id === saved.id ? { ...prev, ...saved } : prev));

      // 마인드맵 노드에 반영
      if (currentMap) {
        const nextNodes = (currentMap.nodes || []).map(node => {
          if (node.data?.noteId === saved.id) {
            return {
              ...node,
              data: {
                ...node.data,
                title: saved.title,
                summary: saved.summary,
                color: saved.color,
                tags: saved.tags || []
              }
            };
          }
          return node;
        });
        const updatedMap = { ...currentMap, nodes: nextNodes };
        setCurrentMap(updatedMap);
        api.saveMap(updatedMap).catch(e => console.error('Failed to auto-update map on note save:', e));
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // 메모 삭제
  const handleDeleteNote = async (noteId) => {
    const ok = await api.confirm('정말로 이 메모 파일을 삭제하시겠습니까?');
    if (!ok) return;
    await api.deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) {
      handleCloseEditor();
    }
    if (selectedCanvasNoteId === noteId) {
      setSelectedCanvasNoteId(null);
    }

    if (currentMap) {
      const filteredNodes = (currentMap.nodes || []).filter(n => n.data?.noteId !== noteId);
      const remainingNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = (currentMap.edges || []).filter(
        e => remainingNodeIds.has(e.source) && remainingNodeIds.has(e.target)
      );
      const updatedMap = { ...currentMap, nodes: filteredNodes, edges: filteredEdges };
      handleSaveMap(updatedMap);
    }
  };

  const handleOpenFolder = () => {
    api.openNotesFolder();
  };

  return (
    <div className={`theme-${theme} flex h-screen w-screen overflow-hidden`} style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* 좌측 사이드바 */}
      <Sidebar
        maps={maps}
        currentMapId={currentMapId}
        onSelectMap={handleSelectMap}
        onNewMap={handleNewMap}
        onDeleteMap={handleDeleteMap}
        notes={notes}
        onSelectNote={handleSelectNote}
        onNewNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
        onOpenFolder={handleOpenFolder}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        selectedNoteId={currentSelectedNoteId}
      />

      {/* 중앙 캔버스 영역 */}
      <main
        className={`flex-1 h-full relative transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } ${isEditorOpen && activeNote && !isMaximized ? 'mr-[560px]' : ''}`}
      >
        {currentMap ? (
          <MindmapCanvas
            mapData={currentMap}
            maps={maps}
            mapHistory={mapHistory}
            onBackMap={handleBackMap}
            onOpenSubmap={handleOpenSubmap}
            onSaveMap={handleSaveMap}
            onRenameMap={(newTitle) => handleRenameMap(currentMap.id, newTitle)}
            onNodeClick={handleNodeClick}
            onNewNoteAndAddNode={handleNewNoteAndAddNode}
            onNewSubmapAndAddNode={handleNewSubmapAndAddNode}
            onPromoteStickyToNote={handlePromoteStickyToNote}
            onRegisterAddNoteHandler={(handler) => {
              canvasAddNoteRef.current = handler;
            }}
            onSelectCanvasNodeNoteId={(noteId) => setSelectedCanvasNoteId(noteId)}
            activeNoteId={activeNote?.id}
            notes={notes}
            theme={theme}
            isSidebarOpen={isSidebarOpen}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-60 gap-3">
            <p className="text-sm">선택된 마인드맵이 없습니다.</p>
            <button
              onClick={handleNewMap}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-blue-700 transition"
            >
              새 마인드맵 만들기
            </button>
          </div>
        )}
      </main>

      {/* 우측 사이드 피크 / 전체화면 메모 에디터 (항상 렌더링되어 부드럽게 슬라이드 인/아웃) */}
      <SidePeekEditor
        note={activeNote}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveNote}
        onDelete={(id) => {
          handleDeleteNote(id);
          handleCloseEditor();
        }}
        isMaximized={isMaximized}
        setIsMaximized={setIsMaximized}
        availableTags={currentMapTags}
      />

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
        onOpenFolder={handleOpenFolder}
        onOpenMapsFolder={() => api.openMapsFolder()}
      />

      {/* 중앙 빠른 검색 모달 (Ctrl+F / Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        maps={maps}
        currentMap={currentMap}
        onSelectNote={handleSelectNote}
        onAddNoteToCanvas={(note, pos) => canvasAddNoteRef.current?.(note, pos)}
      />

      {/* 새 버전 백그라운드 다운로드 완료 알림 배너 */}
      {updateReady && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3.5 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-400/40">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-sm">
              MindNote 새 버전{updateReady.version ? ` (v${updateReady.version})` : ''} 준비 완료!
            </div>
            <div className="text-emerald-100 mt-0.5">
              앱을 재시작하면 새 버전으로 즉시 업데이트됩니다.
            </div>
          </div>
          <button
            onClick={() => api.quitAndInstall()}
            className="px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition ml-2 shrink-0 cursor-pointer"
          >
            지금 재시작
          </button>
          <button
            onClick={() => setUpdateReady(null)}
            className="p-1 text-white/70 hover:text-white rounded-lg transition shrink-0"
            title="나중에 적용 (앱을 닫을 때 자동으로 설치됩니다)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
