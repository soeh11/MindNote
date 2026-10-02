import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, Folder, ArrowRight, CornerDownRight } from 'lucide-react';

function MapNode({ id, data, selected }) {
  const { title = '하위 마인드맵', mapId, nodeCount = 0, onOpenMap } = data || {};

  const handleClasses = "!bg-indigo-500 !w-3 !h-3 !border-2 !border-white opacity-85 hover:opacity-100 cursor-crosshair !transition-colors !z-20 shadow-xs";

  return (
    <div
      onDoubleClick={() => onOpenMap && onOpenMap(mapId)}
      className={`group relative w-72 rounded-2xl transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg border-2 ${
        selected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-indigo-200/80 hover:border-indigo-400'
      }`}
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
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

      {/* 헤더 (폴더/마인드맵 스타일) */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl transition-colors"
        style={{
          backgroundColor: 'rgba(238, 242, 255, 0.65)',
          borderColor: 'rgba(224, 231, 255, 0.8)'
        }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200 truncate block">
              {title}
            </span>
            <span className="text-[10px] text-indigo-500 font-medium">하위 마인드맵</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenMap && onOpenMap(mapId);
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
          title="이 마인드맵으로 들어가기"
        >
          <span>열기</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 본문 안내 */}
      <div className="p-3.5 flex items-center justify-between text-xs opacity-75">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>더블클릭하여 진입</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-medium">
          {nodeCount}개 노드
        </span>
      </div>

      {/* 하단 푸터 */}
      <div
        className="px-4 py-1.5 rounded-b-2xl border-t flex items-center justify-between text-[10px] opacity-60 text-indigo-600 bg-indigo-50/30"
        style={{ borderColor: 'rgba(224, 231, 255, 0.4)' }}
      >
        <span className="flex items-center gap-1">
          <CornerDownRight className="w-3 h-3" /> 하위 폴더 맵
        </span>
        <span>더블클릭 또는 [열기]</span>
      </div>
    </div>
  );
}

export default memo(MapNode);
