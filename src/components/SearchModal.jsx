import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Network, GripVertical, CornerDownLeft, Filter } from 'lucide-react';

export default function SearchModal({
  isOpen,
  onClose,
  notes = [],
  maps = [],
  currentMap = null,
  onSelectNote,
  onAddNoteToCanvas
}) {
  const [query, setQuery] = useState('');
  const [selectedMapId, setSelectedMapId] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 모달이 열릴 때마다 검색창 포커스 및 상태 초기화 (다중 타이머로 포커스 누락 100% 방지)
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setIsDragging(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      const t1 = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      const t2 = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 모달이 열려 있는 동안 어디서든 문자를 치면 즉시 검색창으로 포커스 연결
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalTyping = (e) => {
      if (document.activeElement === inputRef.current || document.activeElement?.tagName === 'SELECT') {
        return;
      }
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalTyping);
    return () => window.removeEventListener('keydown', handleGlobalTyping);
  }, [isOpen]);

  // 각 마인드맵별 포함된 noteId Set 맵핑
  const mapNoteIdsLookup = useMemo(() => {
    const lookup = {};
    maps.forEach(m => {
      let ids = m.noteIds || [];
      // 현재 열려있는 맵인 경우 실시간 nodes 데이터 반영
      if (currentMap && currentMap.id === m.id && currentMap.nodes) {
        ids = currentMap.nodes.map(n => n.data?.noteId).filter(Boolean);
      }
      lookup[m.id] = new Set(ids);
    });
    return lookup;
  }, [maps, currentMap]);

  // 각 노트가 속한 마인드맵 목록 찾기 (뱃지 표시용)
  const getNoteBelongingMaps = (noteId) => {
    const belonging = [];
    maps.forEach(m => {
      const set = mapNoteIdsLookup[m.id];
      if (set && set.has(noteId)) {
        belonging.push(m.title);
      }
    });
    return belonging;
  };

  // 필터링된 노트 목록 (태그는 #태그 로 검색, 복수 태그는 AND 조건)
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // 1. 마인드맵 필터 적용
      if (selectedMapId !== 'all') {
        const targetSet = mapNoteIdsLookup[selectedMapId];
        if (!targetSet || !targetSet.has(n.id)) {
          return false;
        }
      }

      // 2. 검색어 필터 적용
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return true;

      // 공백 및 쉼표 기준으로 검색 토큰 분리
      const tokens = trimmedQuery.split(/[\s,]+/).filter(Boolean);
      if (tokens.length === 0) return true;

      const tagTokens = [];
      const textTokens = [];

      tokens.forEach(tok => {
        if (tok.startsWith('#')) {
          const cleanTag = tok.slice(1).trim().toLowerCase();
          tagTokens.push(cleanTag);
        } else {
          textTokens.push(tok.toLowerCase());
        }
      });

      const noteTags = Array.isArray(n.tags) ? n.tags.map(t => t.toLowerCase()) : [];

      // #태그 검색: 모든 입력된 태그가 반드시 노트에 포함되어야 함 (AND 조건)
      if (tagTokens.length > 0) {
        const allTagsMatch = tagTokens.every(targetTag => {
          if (!targetTag) {
            // '#'만 단독 입력된 경우 태그가 1개 이상 있는 모든 노트 검색
            return noteTags.length > 0;
          }
          return noteTags.some(t => t.includes(targetTag));
        });
        if (!allTagsMatch) return false;
      }

      // 일반 텍스트 검색: 모든 일반 검색어 단어가 제목/요약/본문에 포함되어야 함 (AND 조건)
      if (textTokens.length > 0) {
        const titleLower = (n.title || '').toLowerCase();
        const summaryLower = (n.summary || '').toLowerCase();
        const contentLower = (n.content || '').toLowerCase();

        const allTextsMatch = textTokens.every(term =>
          titleLower.includes(term) ||
          summaryLower.includes(term) ||
          contentLower.includes(term)
        );
        if (!allTextsMatch) return false;
      }

      return true;
    });
  }, [notes, query, selectedMapId, mapNoteIdsLookup]);

  // 필터나 검색어가 변경되면 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedMapId]);

  // 키보드 위/아래 이동 및 엔터로 열기 (타이핑 시 포커스 뺏기지 않도록 scrollIntoView는 방향키 누를 때만!)
  const handleInputKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev + 1 < filteredNotes.length ? prev + 1 : prev;
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev - 1 >= 0 ? prev - 1 : 0;
        listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter') {
      if (e.nativeEvent?.isComposing) return;
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        onSelectNote(filteredNotes[selectedIndex].id);
        onClose();
      }
    }
  };

  // 노트 드래그 시작 (캔버스로 드롭 지원)
  const handleDragStart = (e, note) => {
    e.dataTransfer.setData('application/mindnote-note', JSON.stringify(note));
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 transition-colors duration-200 bg-black/45 backdrop-blur-xs cursor-default"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const rawNote = e.dataTransfer.getData('application/mindnote-note');
        if (rawNote) {
          const note = JSON.parse(rawNote);
          onAddNoteToCanvas?.(note, { x: e.clientX, y: e.clientY });
          setIsDragging(false);
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDragging) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95 ${
          isDragging ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 검색창 + 필터 바 */}
        <div className="p-3 border-b flex flex-col gap-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
          <div
            className="flex items-center gap-2 px-1 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <Search className="w-5 h-5 opacity-50 shrink-0 text-blue-500" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.focus();
              }}
              placeholder="제목, 내용 검색... (#태그1 #태그2 로 복수 태그 AND 검색)"
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:opacity-40"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-50 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded border opacity-50 font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
              ESC
            </kbd>
          </div>

          {/* 마인드맵 폴더 필터 바 */}
          <div className="flex items-center gap-2 pt-1 border-t px-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-1.5 text-xs opacity-60 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>마인드맵 범위:</span>
            </div>
            <select
              value={selectedMapId}
              onChange={(e) => setSelectedMapId(e.target.value)}
              className="text-xs px-2 py-1 rounded-md border outline-none cursor-pointer flex-1 font-medium transition"
              style={{
                backgroundColor: 'var(--bg-sidebar)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">🌐 전체 마인드맵 (모든 메모)</option>
              {currentMap && (
                <option value={currentMap.id}>
                  📍 현재 마인드맵: {currentMap.title}
                </option>
              )}
              {maps
                .filter(m => m.id !== currentMap?.id)
                .map(m => (
                  <option key={m.id} value={m.id}>
                    📁 {m.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* 검색 결과 리스트 */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-1"
        >
          {filteredNotes.map((note, index) => {
            const isSelected = index === selectedIndex;
            const belongingMaps = getNoteBelongingMaps(note.id);

            return (
              <div
                key={note.id}
                draggable
                onDragStart={(e) => handleDragStart(e, note)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  onSelectNote(note.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-grab active:cursor-grabbing transition ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
                } border`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition cursor-grab" />
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          note.color === 'blue' ? '#2563EB' :
                          note.color === 'green' ? '#10B981' :
                          note.color === 'purple' ? '#8B5CF6' :
                          note.color === 'orange' ? '#F59E0B' :
                          note.color === 'red' ? '#EF4444' : '#9B9A97'
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-500' : ''}`}>
                        {note.title}
                      </span>
                      {/* 속해있는 마인드맵 뱃지 */}
                      {belongingMaps.map((mapTitle, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full opacity-70 bg-black/5 dark:bg-white/10 shrink-0"
                        >
                          <Network className="w-2.5 h-2.5 text-blue-500" />
                          <span className="truncate max-w-[90px]">{mapTitle}</span>
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] opacity-60 line-clamp-1 mt-0.5 leading-relaxed">
                      {note.summary || '내용 없음'}
                    </p>

                    {/* 태그 목록 표시 (클릭 시 검색창에 #태그 추가) */}
                    {Array.isArray(note.tags) && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {note.tags.map((t, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuery(prev => {
                                const tagStr = `#${t}`;
                                const parts = prev.trim().split(/\s+/).filter(Boolean);
                                if (parts.includes(tagStr)) return prev;
                                return parts.length > 0 ? `${parts.join(' ')} ${tagStr}` : tagStr;
                              });
                              inputRef.current?.focus();
                            }}
                            className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 cursor-pointer transition"
                            title={`클릭하여 #${t} 태그 검색에 추가`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-[10px] opacity-60 hidden sm:inline">캔버스로 드래그</span>
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-500 opacity-80" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="text-center py-10 opacity-50 text-xs">
              {query
                ? '검색된 메모가 없습니다.'
                : '선택한 마인드맵에 등록된 메모가 없습니다.'}
            </div>
          )}
        </div>

        {/* 하단 툴팁 푸터 */}
        <div
          className="px-3 py-2 border-t flex items-center justify-between text-[11px] opacity-60"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)' }}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded border mr-1 font-mono text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>↑↓</kbd>
              이동
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border mr-1 font-mono text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>Enter</kbd>
              열기
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded border mr-1 font-mono text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>Drag</kbd>
              화면으로 드래그
            </span>
          </div>
          <span className="text-[10px]">총 {filteredNotes.length}개</span>
        </div>
      </div>
    </div>
  );
}
