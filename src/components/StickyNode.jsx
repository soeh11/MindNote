import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, Palette, FileText, StickyNote } from 'lucide-react';

export const STICKY_COLORS = {
  yellow: {
    name: '노랑',
    bg: 'bg-[#FEF9C3] dark:bg-[#422006]/60',
    border: 'border-[#FDE047] dark:border-[#713F12]',
    text: 'text-[#713F12] dark:text-[#FEF08A]',
    chip: '#FACC15',
    handle: '!bg-amber-400'
  },
  green: {
    name: '민트/그린',
    bg: 'bg-[#DCFCE7] dark:bg-[#052E16]/60',
    border: 'border-[#86EFAC] dark:border-[#14532D]',
    text: 'text-[#14532D] dark:text-[#BBF7D0]',
    chip: '#4ADE80',
    handle: '!bg-emerald-400'
  },
  pink: {
    name: '핑크',
    bg: 'bg-[#FCE7F3] dark:bg-[#500724]/60',
    border: 'border-[#F472B6] dark:border-[#831843]',
    text: 'text-[#831843] dark:text-[#FBCFE8]',
    chip: '#F472B6',
    handle: '!bg-rose-400'
  },
  blue: {
    name: '하늘',
    bg: 'bg-[#E0F2FE] dark:bg-[#082F49]/60',
    border: 'border-[#7DD3FC] dark:border-[#0C4A6E]',
    text: 'text-[#0C4A6E] dark:text-[#BAE6FD]',
    chip: '#38BDF8',
    handle: '!bg-sky-400'
  },
  purple: {
    name: '라벤더',
    bg: 'bg-[#F3E8FF] dark:bg-[#3B0764]/60',
    border: 'border-[#D8B4FE] dark:border-[#581C87]',
    text: 'text-[#581C87] dark:text-[#E9D5FF]',
    chip: '#C084FC',
    handle: '!bg-purple-400'
  }
};

function StickyNode({ id, data = {}, selected }) {
  const [text, setText] = useState(data.text || '');
  const [showPalette, setShowPalette] = useState(false);
  const debounceRef = useRef(null);

  const color = data.color || 'yellow';
  const colorTheme = STICKY_COLORS[color] || STICKY_COLORS.yellow;
  const handleClasses = `${colorTheme.handle} !w-2.5 !h-2.5 !border-2 !border-white opacity-80 hover:opacity-100 cursor-crosshair !z-20 shadow-xs`;

  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (data.onUpdateStickyText) {
        data.onUpdateStickyText(id, val);
      }
    }, 300);
  };

  const handleChangeColor = (newColor) => {
    setShowPalette(false);
    if (data.onUpdateStickyColor) {
      data.onUpdateStickyColor(id, newColor);
    }
  };

  const handlePromote = (e) => {
    e.stopPropagation();
    if (data.onPromoteToNote) {
      data.onPromoteToNote(id, text, color);
    }
  };

  return (
    <div
      className={`group w-56 h-52 rounded-xl shadow-md border transition-all duration-150 flex flex-col p-3 relative ${colorTheme.bg} ${colorTheme.border} ${
        selected ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02]' : 'hover:shadow-lg'
      }`}
    >
      {/* 4방향 연결 핸들 */}
      <Handle type="target" position={Position.Top} id="top-target" className={handleClasses} />
      <Handle type="source" position={Position.Top} id="top-source" className={handleClasses} />

      <Handle type="target" position={Position.Bottom} id="bottom-target" className={handleClasses} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className={handleClasses} />

      <Handle type="target" position={Position.Left} id="left-target" className={handleClasses} />
      <Handle type="source" position={Position.Left} id="left-source" className={handleClasses} />

      <Handle type="target" position={Position.Right} id="right-target" className={handleClasses} />
      <Handle type="source" position={Position.Right} id="right-source" className={handleClasses} />

      {/* 포스트잇 상단 바 */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5 dark:border-white/10 select-none">
        <div className="flex items-center gap-1.5 opacity-60">
          <StickyNote className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">포스트잇</span>
        </div>

        <div className="flex items-center gap-0.5 relative">
          {/* 정식 메모 파일로 승격 버튼 */}
          <button
            onClick={handlePromote}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition cursor-pointer"
            title="정식 메모 파일(.md)로 승격하기"
          >
            <FileText className="w-3 h-3" />
          </button>

          {/* 색상 팔레트 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPalette(!showPalette);
            }}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition cursor-pointer"
            title="포스트잇 색상 변경"
          >
            <Palette className="w-3 h-3" />
          </button>

          {showPalette && (
            <div
              className="absolute right-0 top-6 z-50 p-1.5 rounded-lg border shadow-lg flex gap-1 animate-in fade-in"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(STICKY_COLORS).map(([cKey, cVal]) => (
                <button
                  key={cKey}
                  onClick={() => handleChangeColor(cKey)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    color === cKey ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: cVal.chip }}
                  title={cVal.name}
                />
              ))}
            </div>
          )}

          {/* 삭제 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onDeleteSticky) {
                data.onDeleteSticky(id);
              }
            }}
            className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 opacity-60 hover:opacity-100 transition cursor-pointer"
            title="포스트잇 삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 인라인 직접 텍스트 입력 에디터 */}
      <textarea
        value={text}
        onChange={handleTextChange}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        placeholder="생각을 바로 적어보세요...&#10;- [ ] 할 일 목록 지원"
        className={`nodrag nopan flex-1 w-full bg-transparent resize-none outline-none text-xs leading-relaxed font-sans placeholder:opacity-40 ${colorTheme.text}`}
      />
    </div>
  );
}

export default memo(StickyNode);
