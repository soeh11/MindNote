import React, { useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow
} from '@xyflow/react';
import { X, Tag, Plus, Check } from 'lucide-react';

const PRESET_LABELS = ['원인 ➔ 결과', '하위 항목', '참조', '반대 의견', '대안'];

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data = {}
}) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || '');
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setLabelText(data?.label || '');
  }, [data?.label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // 배경 또는 외부 클릭 시 라벨 편집 창 닫기
  useEffect(() => {
    if (!isEditing) return;
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [isEditing]);

  const onEdgeDelete = (evt) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
    if (data?.onDeleteEdge) {
      data.onDeleteEdge(id);
    }
  };

  // 라벨만 지우기 (연결선은 유지)
  const onRemoveLabel = (evt) => {
    evt.stopPropagation();
    handleSaveLabel('');
  };

  const handleSaveLabel = (newVal) => {
    setIsEditing(false);
    const trimmed = (newVal ?? labelText).trim();
    setLabelText(trimmed);
    setEdges((edges) =>
      edges.map((e) =>
        e.id === id
          ? { ...e, data: { ...(e.data || {}), label: trimmed } }
          : e
      )
    );
    if (data?.onUpdateLabel) {
      data.onUpdateLabel(id, trimmed);
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveLabel(e.target.value);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabelText(data?.label || '');
    }
  };

  const hasLabel = Boolean(labelText && labelText.trim());

  return (
    <>
      {/* 선택되었을 때 노드 위에서 선명하게 경로를 보여주는 외곽 글로우 패스 */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="rgba(37, 99, 235, 0.3)"
          strokeWidth={8}
          className="pointer-events-none"
        />
      )}

      {/* 기본 엣지 패스 */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#2563EB' : style.stroke || '#2383E2',
          strokeWidth: selected ? 3.5 : 2,
          filter: selected ? 'drop-shadow(0 0 5px rgba(37, 99, 235, 0.7))' : undefined,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease'
        }}
      />

      {/* 중앙 라벨 & 삭제 버튼 (겹침 없이 자연스러운 캡슐 배치) */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: selected ? 1001 : 10,
          }}
          className="nodrag nopan group"
        >
          {isEditing ? (
            /* 인라인 라벨 편집 팝오버 (외부 클릭 시 자동 닫힘) */
            <div
              ref={popoverRef}
              className="p-1.5 rounded-lg border shadow-xl flex flex-col gap-1.5 animate-in fade-in"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="관계 라벨 입력..."
                  className="px-2 py-0.5 text-xs rounded border outline-none bg-transparent w-32 font-medium"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
                <button
                  onClick={() => handleSaveLabel(labelText)}
                  className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                  title="저장"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>

              {/* 빠른 프리셋 라벨 */}
              <div className="flex flex-wrap gap-1 max-w-[170px]">
                {PRESET_LABELS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSaveLabel(preset)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-blue-500 hover:text-white opacity-80 hover:opacity-100 transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : hasLabel ? (
            /* 라벨이 있는 경우: 말풍선 캡슐 + 마우스 호버 시에만 나타나는 삭제(×) 버튼 */
            <div
              className={`flex items-center px-2.5 py-1 rounded-full border shadow-sm transition-all duration-150 ${
                selected
                  ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/90 text-blue-600 dark:text-blue-400 ring-2 ring-blue-400/20'
                  : 'hover:border-blue-400 hover:shadow-md'
              }`}
              style={{
                backgroundColor: selected ? undefined : 'var(--bg-card)',
                borderColor: selected ? undefined : 'var(--border-subtle)',
                color: selected ? undefined : 'var(--text-primary)'
              }}
            >
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-[11px] font-semibold tracking-tight cursor-text select-none"
                title="더블클릭하여 라벨 수정"
              >
                {labelText}
              </span>

              {/* 커서를 올리지 않으면 X 표시가 자리를 차지하지 않고, 올렸을 때 부드럽게 나타남. 클릭 시 라벨만 삭제! */}
              <button
                onClick={onRemoveLabel}
                className="flex items-center justify-center max-w-0 opacity-0 overflow-hidden group-hover:max-w-[28px] group-hover:opacity-100 group-hover:ml-1 p-0.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all duration-200 ease-out cursor-pointer"
                title="라벨 지우기 (연결선은 유지됨)"
              >
                <X className="w-3 h-3 shrink-0" />
              </button>
            </div>
          ) : (
            /* 라벨이 없는 경우: 마우스 호버 시 [+ 라벨]과 [× 삭제] 버튼 나란히 노출 */
            <div
              className={`flex items-center gap-1 p-0.5 rounded-full border shadow-sm transition-all duration-150 ${
                selected
                  ? 'opacity-100 bg-white dark:bg-zinc-800 border-blue-500 scale-105'
                  : 'opacity-0 group-hover:opacity-100 bg-white/95 dark:bg-zinc-800/95 border-gray-300 dark:border-zinc-600 hover:scale-105'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                title="관계 라벨 추가"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>라벨</span>
              </button>

              <span className="w-px h-2.5 bg-gray-300 dark:bg-zinc-600" />

              <button
                onClick={onEdgeDelete}
                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                title="연결선 끊기 (삭제)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
