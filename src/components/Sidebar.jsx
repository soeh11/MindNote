import React, { useState } from 'react';
import {
  Network,
  FileText,
  Plus,
  FolderOpen,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  maps,
  currentMapId,
  onSelectMap,
  onNewMap,
  onDeleteMap,
  notes,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onOpenFolder,
  onOpenSettings,
  onOpenSearch,
  isOpen,
  setIsOpen,
  selectedNoteId
}) {
  const handleDragStart = (e, note) => {
    e.dataTransfer.setData('application/mindnote-note', JSON.stringify(note));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <>
      {/* 접혔을 때 펼치기 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 rounded-lg shadow-sm border transition"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
          title="사이드바 열기"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <aside
        className={`fixed top-0 left-0 h-full border-r z-20 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0 -translate-x-full overflow-hidden'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* 앱 타이틀 및 헤더 */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">MindNote</h1>
              <span className="text-[10px] flex items-center gap-0.5 opacity-60">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> 로컬 마크다운
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSearch}
              className="p-1.5 rounded-md transition opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              title="빠른 검색 (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md transition opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              title="환경 설정 (테마 변경)"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md transition opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              title="사이드바 닫기"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 마인드맵 목록 섹션 (글자 옆 + 버튼) */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-1.5 opacity-70">
            <div className="flex items-center gap-1.5">
              <span>마인드맵</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 opacity-70">
                {maps.length}
              </span>
            </div>
            {/* 글자 옆 + 버튼 */}
            <button
              onClick={onNewMap}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 transition"
              title="새 마인드맵 추가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-40 overflow-y-auto px-1 py-0.5">
            {maps.map(m => (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/mindnote-map', JSON.stringify(m));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onSelectMap(m.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                  currentMapId === m.id
                    ? 'bg-blue-500/10 font-semibold text-blue-500'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
                title="클릭하여 이동, 캔버스로 드래그하여 하위 맵으로 연결"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Network className={`w-3.5 h-3.5 shrink-0 ${currentMapId === m.id ? 'text-blue-500' : 'opacity-50'}`} />
                  <span className="truncate">{m.title}</span>
                </div>
                {maps.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMap(m.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                    title="마인드맵 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px mx-3 my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />

        {/* 메모 목록 섹션 (글자 옆 + 버튼) */}
        <div className="flex-1 flex flex-col min-h-0 px-3 pt-2 pb-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-2 opacity-70">
            <div className="flex items-center gap-1.5">
              <span>메모장 목록</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 opacity-70">
                {notes.length}
              </span>
            </div>
            {/* 글자 옆 + 버튼 */}
            <button
              onClick={onNewNote}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 transition"
              title="새 메모 추가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 컴팩트 빠른 검색 버튼 (화면 중앙 모달 호출) */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-md text-xs border transition hover:bg-black/5 dark:hover:bg-white/5 opacity-75 hover:opacity-100 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
            title="중앙 검색창 열기 (Ctrl+F)"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 opacity-60 text-blue-500" />
              <span className="opacity-70">빠른 검색...</span>
            </span>
            <kbd className="text-[10px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 opacity-70 font-mono">
              Ctrl+F
            </kbd>
          </button>

          {/* 메모 리스트 (슬림 1줄 목록) */}
          <div className="flex-1 overflow-y-auto space-y-0.5 px-1 py-0.5">
            {notes.map(n => {
              const isSelected = selectedNoteId === n.id;
              return (
                <div
                  key={n.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, n)}
                  onClick={() => onSelectNote(n.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-500/15 font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/35 shadow-xs opacity-100'
                      : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    color: isSelected ? undefined : 'var(--text-primary)'
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${
                          isSelected ? 'ring-2 ring-blue-500/60 ring-offset-1 ring-offset-[var(--bg-sidebar)] shadow-xs' : ''
                        }`}
                        style={{
                          backgroundColor:
                            n.color === 'blue' ? '#2563EB' :
                            n.color === 'green' ? '#10B981' :
                            n.color === 'purple' ? '#8B5CF6' :
                            n.color === 'orange' ? '#F59E0B' :
                            n.color === 'red' ? '#EF4444' : '#9B9A97'
                        }}
                      />
                    </div>
                    <span className="truncate">{n.title}</span>
                  </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(n.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition cursor-pointer"
                  title="메모 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
            {notes.length === 0 && (
              <div className="text-center py-6 text-xs opacity-40">
                메모가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 하단 메모 폴더 열기 & 설정 */}
        <div className="p-3 border-t flex flex-col gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border transition shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="환경 설정 (테마 변경)"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span>환경 설정 (테마)</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium border transition shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="C:\MM\data\notes 폴더 열기"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <span>메모 폴더 열기 (.md)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
