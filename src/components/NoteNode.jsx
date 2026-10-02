import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, ArrowRight, ExternalLink } from 'lucide-react';

// 테마 컬러 프리셋 (SidePeekEditor와 공유)
export const COLOR_THEMES = {
  default: {
    name: '그레이',
    chip: '#9B9A97',
    border: 'var(--border-color)',
    headerBg: 'var(--bg-header)',
    accent: '#2383E2',
    handle: '!bg-blue-500'
  },
  blue: {
    name: '블루',
    chip: '#2383E2',
    border: '#BFDBFE',
    headerBg: 'rgba(219, 234, 254, 0.5)',
    accent: '#2563EB',
    handle: '!bg-blue-500'
  },
  green: {
    name: '그린',
    chip: '#10B981',
    border: '#A7F3D0',
    headerBg: 'rgba(209, 250, 229, 0.5)',
    accent: '#059669',
    handle: '!bg-emerald-500'
  },
  purple: {
    name: '퍼플',
    chip: '#8B5CF6',
    border: '#DDD6FE',
    headerBg: 'rgba(237, 233, 254, 0.5)',
    accent: '#7C3AED',
    handle: '!bg-purple-500'
  },
  orange: {
    name: '오렌지',
    chip: '#F59E0B',
    border: '#FDE68A',
    headerBg: 'rgba(254, 243, 199, 0.5)',
    accent: '#D97706',
    handle: '!bg-amber-500'
  },
  red: {
    name: '레드',
    chip: '#EF4444',
    border: '#FECDD3',
    headerBg: 'rgba(255, 228, 230, 0.5)',
    accent: '#E11D48',
    handle: '!bg-rose-500'
  }
};

function NoteNode({ id, data = {}, selected }) {
  const safeData = data || {};
  const {
    title = '제목 없는 메모',
    summary = '',
    onClickNode,
    color = 'default',
    activeNoteId
  } = safeData;

  const isSelected = selected || (safeData.noteId && safeData.noteId === activeNoteId);
  const themeConfig = COLOR_THEMES[color] || COLOR_THEMES.default;
  const handleClasses = `${themeConfig.handle} !w-3 !h-3 !border-2 !border-white opacity-85 hover:opacity-100 cursor-crosshair !transition-colors !z-20 shadow-xs`;

  return (
    <div
      onClick={() => onClickNode && onClickNode(safeData.noteId, id)}
      className={`group relative w-72 rounded-xl transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-xl brightness-105 ring-offset-2 ring-offset-[var(--bg-app)]'
          : 'border shadow-sm hover:shadow-md'
      }`}
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderColor: isSelected ? themeConfig.accent : (color !== 'default' ? themeConfig.border : 'var(--border-color)'),
        transform: 'none'
      }}
    >
      {/* 4방향 양방향 연결 핸들 */}
      <Handle type="target" position={Position.Top} id="top-target" className={handleClasses} onClick={(e) => e.stopPropagation()} />
      <Handle type="source" position={Position.Top} id="top-source" className={handleClasses} onClick={(e) => e.stopPropagation()} />

      <Handle type="target" position={Position.Bottom} id="bottom-target" className={handleClasses} onClick={(e) => e.stopPropagation()} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className={handleClasses} onClick={(e) => e.stopPropagation()} />

      <Handle type="target" position={Position.Left} id="left-target" className={handleClasses} onClick={(e) => e.stopPropagation()} />
      <Handle type="source" position={Position.Left} id="left-source" className={handleClasses} onClick={(e) => e.stopPropagation()} />

      <Handle type="target" position={Position.Right} id="right-target" className={handleClasses} onClick={(e) => e.stopPropagation()} />
      <Handle type="source" position={Position.Right} id="right-source" className={handleClasses} onClick={(e) => e.stopPropagation()} />

      {/* 헤더 */}
      <div
        className="relative flex items-center justify-between px-3.5 py-2.5 border-b rounded-t-xl transition-colors"
        style={{
          backgroundColor: themeConfig.headerBg,
          borderColor: color !== 'default' ? themeConfig.border : 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-1">
          <FileText
            className="w-4 h-4 shrink-0 transition-colors"
            style={{ color: themeConfig.accent }}
          />
          <span className="font-semibold text-sm truncate">
            {title || '제목 없는 메모'}
          </span>
        </div>

        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition"
          title="사이드 피크로 메모 열기"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 요약 내용 (2~3줄 프리뷰) */}
      <div className="p-3.5 text-xs opacity-75 leading-relaxed line-clamp-3">
        {summary ? (
          summary
        ) : (
          <span className="italic opacity-40">클릭하여 메모를 작성하세요...</span>
        )}
      </div>

      {/* 태그 목록 표시 */}
      {Array.isArray(safeData.tags) && safeData.tags.length > 0 && (
        <div className="px-3.5 pb-2.5 flex flex-wrap gap-1">
          {safeData.tags.slice(0, 4).map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-black/5 dark:bg-white/10 opacity-75"
            >
              #{t}
            </span>
          ))}
          {safeData.tags.length > 4 && (
            <span className="text-[10px] px-1 py-0.5 opacity-50">
              +{safeData.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 하단 푸터 힌트 */}
      <div
        className="px-3.5 py-1.5 rounded-b-xl border-t flex items-center justify-between text-[10px] opacity-50"
        style={{
          borderColor: color !== 'default' ? themeConfig.border : 'var(--border-subtle)'
        }}
      >
        <span>클릭하여 편집</span>
        <span
          className="flex items-center gap-0.5 group-hover:underline"
          style={{ color: themeConfig.accent }}
        >
          메모 보기 <ArrowRight className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}

export default memo(NoteNode);
