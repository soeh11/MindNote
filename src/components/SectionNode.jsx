import React, { memo, useState } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Trash2, GripHorizontal, Palette } from 'lucide-react';

export const SECTION_COLORS = {
  blue: {
    name: '블루',
    border: 'border-blue-500/40',
    headerBg: 'bg-blue-500/15',
    contentBg: 'bg-blue-500/5',
    text: 'text-blue-600 dark:text-blue-400',
    chip: '#3B82F6'
  },
  green: {
    name: '그린',
    border: 'border-emerald-500/40',
    headerBg: 'bg-emerald-500/15',
    contentBg: 'bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
    chip: '#10B981'
  },
  purple: {
    name: '퍼플',
    border: 'border-purple-500/40',
    headerBg: 'bg-purple-500/15',
    contentBg: 'bg-purple-500/5',
    text: 'text-purple-600 dark:text-purple-400',
    chip: '#8B5CF6'
  },
  amber: {
    name: '앰버',
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-500/15',
    contentBg: 'bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
    chip: '#F59E0B'
  },
  rose: {
    name: '로즈',
    border: 'border-rose-500/40',
    headerBg: 'bg-rose-500/15',
    contentBg: 'bg-rose-500/5',
    text: 'text-rose-600 dark:text-rose-400',
    chip: '#F43F5E'
  },
  gray: {
    name: '그레이',
    border: 'border-gray-500/30',
    headerBg: 'bg-gray-500/10',
    contentBg: 'bg-gray-500/5',
    text: 'text-gray-600 dark:text-gray-300',
    chip: '#6B7280'
  }
};

function SectionNode({ id, data = {}, selected }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.title || '새 섹션');
  const [showPalette, setShowPalette] = useState(false);

  const color = data.color || 'blue';
  const colorTheme = SECTION_COLORS[color] || SECTION_COLORS.blue;

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (data.onUpdateSectionTitle) {
      data.onUpdateSectionTitle(id, title);
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  const handleChangeColor = (newColor) => {
    setShowPalette(false);
    if (data.onUpdateSectionColor) {
      data.onUpdateSectionColor(id, newColor);
    }
  };

  return (
    <div
      className={`w-full h-full rounded-2xl border-2 border-dashed transition-colors relative flex flex-col pointer-events-none ${colorTheme.border} ${colorTheme.contentBg} ${
        selected ? 'ring-2 ring-blue-500/50 shadow-lg' : ''
      }`}
      style={{
        minWidth: 260,
        minHeight: 180,
      }}
    >
      <div className="pointer-events-auto">
        <NodeResizer
          isVisible={selected}
          minWidth={240}
          minHeight={160}
          handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
          lineStyle={{ borderStyle: 'dashed' }}
          onResizeEnd={(event, { width, height }) => {
            if (data.onResizeSection) {
              data.onResizeSection(id, width, height);
            }
          }}
        />
      </div>

      {/* 섹션 상단 헤더 바 (드래그 핸들 역할: 오직 이 윗부분을 잡아야 이동) */}
      <div
        className={`section-drag-handle pointer-events-auto cursor-move px-3 py-2 rounded-t-2xl flex items-center justify-between border-b ${colorTheme.border} ${colorTheme.headerBg} backdrop-blur-xs select-none`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2 pointer-events-none">
          <GripHorizontal className={`w-4 h-4 opacity-50 shrink-0 ${colorTheme.text}`} />
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              className="pointer-events-auto bg-transparent border-b border-blue-500 outline-none text-xs font-bold px-0.5 py-0 w-full nodrag"
              style={{ color: 'var(--text-primary)' }}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingTitle(true)}
              className={`pointer-events-auto text-xs font-bold truncate cursor-text ${colorTheme.text}`}
              title="더블클릭하여 섹션 이름 변경"
            >
              {data.title || title}
            </span>
          )}
        </div>

        {/* 우측 조작 버튼: 팔레트, 삭제 */}
        <div className="flex items-center gap-1 shrink-0 relative nodrag">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPalette(!showPalette);
            }}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition cursor-pointer"
            title="섹션 색상 변경"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {showPalette && (
            <div
              className="absolute right-0 top-7 z-50 p-1.5 rounded-lg border shadow-lg flex gap-1 animate-in fade-in"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(SECTION_COLORS).map(([cKey, cVal]) => (
                <button
                  key={cKey}
                  onClick={() => handleChangeColor(cKey)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    color === cKey ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: cVal.chip }}
                  title={cVal.name}
                />
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onDeleteSection) {
                data.onDeleteSection(id);
              }
            }}
            className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition cursor-pointer"
            title="섹션 삭제 (내부 노드는 유지됨)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 내부 영역은 투명하게 비우고 nodrag, pointer-events-none 지정 */}
      <div className="flex-1 pointer-events-none nodrag" />
    </div>
  );
}

export default memo(SectionNode);
