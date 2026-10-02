import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  getBezierPath,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NoteNode from './NoteNode';
import MapNode from './MapNode';
import SectionNode from './SectionNode';
import StickyNode from './StickyNode';
import DeletableEdge from './DeletableEdge';
import { Plus, Edit2, Check, Save, ArrowLeft, Network, Trash2, StickyNote, LayoutGrid, MapPin } from 'lucide-react';
import { api } from '../api';

const nodeTypes = {
  noteNode: NoteNode,
  mapNode: MapNode,
  sectionNode: SectionNode,
  stickyNode: StickyNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

let globalEdges = [];

// 실시간 연결선 피드백 (유효할 때는 초록색, 금지/중복/자기자신 연결 시 빨간 점선 + 금지 뱃지 표시)
function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionStatus,
  fromNode,
  toNode,
  toHandle
}) {
  const fromId = fromNode?.id;
  const toId = toNode?.id;

  let isSelf = Boolean(fromId && toId && fromId === toId);
  let isDup = false;
  if (fromId && toId && !isSelf) {
    isDup = (globalEdges || []).some(
      (e) => (e.source === fromId && e.target === toId) || (e.source === toId && e.target === fromId)
    );
  }

  const isInvalid = connectionStatus === 'invalid' || isSelf || isDup;
  const isValid = !isInvalid && connectionStatus === 'valid';

  // toHandle이 있을 때 핸들의 정확한 중심 좌표로 스냅
  const targetX = (toHandle && typeof toHandle.x === 'number') ? toHandle.x : (typeof toX === 'number' ? toX : 0);
  const targetY = (toHandle && typeof toHandle.y === 'number') ? toHandle.y : (typeof toY === 'number' ? toY : 0);
  const safeFromX = typeof fromX === 'number' ? fromX : 0;
  const safeFromY = typeof fromY === 'number' ? fromY : 0;

  const targetPos = (toHandle && toHandle.position) ? toHandle.position : (toPosition || Position.Top);
  const sourcePos = fromPosition || Position.Bottom;

  let edgePath = '';
  try {
    const [path] = getBezierPath({
      sourceX: safeFromX,
      sourceY: safeFromY,
      sourcePosition: sourcePos,
      targetX,
      targetY,
      targetPosition: targetPos
    });
    edgePath = path;
  } catch (_) {
    edgePath = `M${safeFromX},${safeFromY} L${targetX},${targetY}`;
  }

  const strokeColor = isInvalid ? '#EF4444' : isValid ? '#10B981' : '#2383E2';

  return (
    <g>
      <path
        fill="none"
        stroke={strokeColor}
        strokeWidth={isInvalid || isValid ? 3 : 2}
        strokeDasharray={isInvalid ? '6 4' : undefined}
        d={edgePath}
      />
      {isInvalid && (
        <g transform={`translate(${targetX}, ${targetY})`}>
          <circle r={10} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
          <line x1={-4} y1={-4} x2={4} y2={4} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          <line x1={4} y1={-4} x2={-4} y2={4} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// 순수 JSON 데이터만 추출
function sanitizeNodes(nodes) {
  return (nodes || []).map(node => {
    let w = node.style?.width ?? node.width ?? node.measured?.width;
    let h = node.style?.height ?? node.height ?? node.measured?.height;
    if (node.type === 'sectionNode') {
      w = w ? Math.round(w) : 360;
      h = h ? Math.round(h) : 260;
    } else {
      w = w ? Math.round(w) : undefined;
      h = h ? Math.round(h) : undefined;
    }

    return {
      id: node.id,
      type: node.type || 'noteNode',
      position: {
        x: Math.round(node.position?.x || 0),
        y: Math.round(node.position?.y || 0)
      },
      style: (w || h) ? { width: w, height: h, pointerEvents: node.type === 'sectionNode' ? 'none' : undefined } : undefined,
      width: node.type === 'sectionNode' ? w : undefined,
      height: node.type === 'sectionNode' ? h : undefined,
      zIndex: node.type === 'sectionNode' ? -1 : undefined,
      data: {
        noteId: node.data?.noteId,
        mapId: node.data?.mapId,
        title: node.data?.title || '',
        summary: node.data?.summary || '',
        color: node.data?.color || 'default',
        tags: Array.isArray(node.data?.tags) ? node.data.tags : [],
        text: node.data?.text || '',
        nodeCount: node.data?.nodeCount || 0
      }
    };
  });
}

function sanitizeEdges(edges) {
  return (edges || []).map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    type: 'deletable',
    animated: false,
    style: edge.style || { stroke: '#2383E2', strokeWidth: 2 },
    data: {
      label: edge.data?.label || ''
    }
  }));
}

export default function MindmapCanvas({
  mapData,
  maps = [],
  mapHistory = [],
  onBackMap,
  onOpenSubmap,
  onSaveMap,
  onRenameMap,
  onNodeClick,
  onNewNoteAndAddNode,
  onNewSubmapAndAddNode,
  onPromoteStickyToNote,
  onRegisterAddNoteHandler,
  onSelectCanvasNodeNoteId,
  activeNoteId,
  notes,
  theme,
  isSidebarOpen
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  globalEdges = edges;
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // 휴지통 드래그 영역 캐시 (Reflow 방지용)
  const trashRef = useRef(null);
  const trashRectRef = useRef(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const isOverTrashRef = useRef(false);

  // Ref 관리
  const mapDataRef = useRef(mapData);
  mapDataRef.current = mapData;

  const mapsRef = useRef(maps);
  mapsRef.current = maps;

  const onSaveMapRef = useRef(onSaveMap);
  onSaveMapRef.current = onSaveMap;

  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  const onOpenSubmapRef = useRef(onOpenSubmap);
  onOpenSubmapRef.current = onOpenSubmap;

  // 저장 상태 표시
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // 마인드맵 제목 인라인 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [mapTitle, setMapTitle] = useState(mapData?.title || '마인드맵');

  // 디바운스 저장 타이머 Ref
  const saveDebounceRef = useRef(null);

  // 안전한 상태 저장 함수 (300ms 디바운스로 연속 디스크 쓰기 병목 완전 제거!)
  const saveCurrentState = useCallback((currentNodes, currentEdges, immediate = false) => {
    const currentMap = mapDataRef.current;
    if (!currentMap) return;

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }

    const doSave = async () => {
      setSaveStatus('saving');
      try {
        const cleanNodes = sanitizeNodes(currentNodes);
        const cleanEdges = sanitizeEdges(currentEdges);
        if (onSaveMapRef.current) {
          await onSaveMapRef.current({
            ...currentMap,
            nodes: cleanNodes,
            edges: cleanEdges
          });
        }
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to save mindmap:', err);
        setSaveStatus('error');
      }
    };

    if (immediate) {
      doSave();
    } else {
      setSaveStatus('saving');
      saveDebounceRef.current = setTimeout(doSave, 350);
    }
  }, []);

  // 외부(중앙 검색창 드래그 앤 드롭 등)에서 노드 추가 요청 처리 등록
  useEffect(() => {
    if (onRegisterAddNoteHandler) {
      onRegisterAddNoteHandler((note, screenPos) => {
        let position = { x: 250, y: 250 };
        if (reactFlowInstance.current && screenPos) {
          try {
            position = reactFlowInstance.current.screenToFlowPosition({
              x: screenPos.x,
              y: screenPos.y
            });
          } catch (_) {
            position = { x: 250, y: 250 };
          }
        }
        const newNode = {
          id: `node-${Date.now()}`,
          type: 'noteNode',
          position,
          data: {
            noteId: note.id,
            title: note.title,
            summary: note.summary,
            color: note.color || 'default',
            tags: note.tags || []
          }
        };

        setNodes((nds) => {
          const nextNodes = nds.concat(newNode);
          setEdges((eds) => {
            saveCurrentState(nextNodes, eds, true);
            return eds;
          });
          return nextNodes;
        });
      });
    }
  }, [saveCurrentState, setEdges, setNodes, onRegisterAddNoteHandler]);

  // 섹션 제목 변경
  const handleUpdateSectionTitle = useCallback((sectionId, newTitle) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === sectionId ? { ...n, data: { ...n.data, title: newTitle } } : n
      );
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 섹션 색상 변경
  const handleUpdateSectionColor = useCallback((sectionId, newColor) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === sectionId ? { ...n, data: { ...n.data, color: newColor } } : n
      );
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 섹션 삭제 (내부 노드는 유지)
  const handleDeleteSection = useCallback((sectionId) => {
    setNodes((nds) => {
      const next = nds.filter((n) => n.id !== sectionId);
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 섹션 크기 변경 핸들러
  const handleResizeSection = useCallback((sectionId, width, height) => {
    const roundW = Math.round(width);
    const roundH = Math.round(height);
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === sectionId) {
          return {
            ...n,
            style: {
              ...(n.style || {}),
              width: roundW,
              height: roundH
            },
            width: roundW,
            height: roundH
          };
        }
        return n;
      });
      setEdges((eds) => {
        saveCurrentState(next, eds, true);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 포스트잇 텍스트 변경
  const handleUpdateStickyText = useCallback((stickyId, newText) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === stickyId ? { ...n, data: { ...n.data, text: newText } } : n
      );
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 포스트잇 색상 변경
  const handleUpdateStickyColor = useCallback((stickyId, newColor) => {
    setNodes((nds) => {
      const next = nds.map((n) =>
        n.id === stickyId ? { ...n, data: { ...n.data, color: newColor } } : n
      );
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 포스트잇 삭제
  const handleDeleteSticky = useCallback((stickyId) => {
    setNodes((nds) => {
      const next = nds.filter((n) => n.id !== stickyId);
      setEdges((eds) => {
        const remainingEdges = eds.filter(
          (e) => e.source !== stickyId && e.target !== stickyId
        );
        saveCurrentState(next, remainingEdges);
        return remainingEdges;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 포스트잇을 정식 마크다운 파일(.md)로 승격
  const handlePromoteStickyToNote = useCallback(async (stickyId, stickyText, stickyColor) => {
    const lines = (stickyText || '').trim().split('\n');
    const firstLine = lines[0]?.replace(/^[#*->\s\[\]x0-9.]+/g, '').trim();
    const title = firstLine || `메모 ${Date.now()}`;
    const content = `# ${title}\n\n${stickyText || ''}`;
    const colorMap = { yellow: 'orange', green: 'green', pink: 'red', blue: 'blue', purple: 'purple' };

    let saved = null;
    if (onPromoteStickyToNote) {
      saved = await onPromoteStickyToNote({
        title,
        content,
        color: colorMap[stickyColor] || 'default'
      });
    } else {
      saved = await api.saveNote({
        title,
        content,
        color: colorMap[stickyColor] || 'default'
      });
    }

    if (!saved) return;

    const newNodeId = `node-${Date.now()}`;

    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === stickyId) {
          return {
            id: newNodeId,
            type: 'noteNode',
            position: n.position,
            data: {
              noteId: saved.id,
              title: saved.title,
              summary: saved.summary,
              color: saved.color,
              tags: saved.tags || []
            }
          };
        }
        return n;
      });

      setEdges((eds) => {
        // 기존 포스트잇에 연결되어 있던 엣지들의 source/target을 새 노드 ID로 끊김없이 이어줌
        const rewiredEdges = eds.map((e) => ({
          ...e,
          source: e.source === stickyId ? newNodeId : e.source,
          target: e.target === stickyId ? newNodeId : e.target
        }));
        saveCurrentState(next, rewiredEdges);
        return rewiredEdges;
      });

      return next;
    });
  }, [onPromoteStickyToNote, saveCurrentState, setEdges, setNodes]);

  // 엣지 라벨 변경
  const handleUpdateEdgeLabel = useCallback((edgeId, newLabel) => {
    setEdges((eds) => {
      const next = eds.map((e) =>
        e.id === edgeId ? { ...e, data: { ...(e.data || {}), label: newLabel } } : e
      );
      setNodes((nds) => {
        saveCurrentState(nds, next);
        return nds;
      });
      return next;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  // 섹션 뷰포인트 점프 포커스
  const handleFocusSection = useCallback((sectionId) => {
    if (!reactFlowInstance.current) return;
    reactFlowInstance.current.fitView({
      nodes: [{ id: sectionId }],
      padding: 0.25,
      duration: 600,
    });
  }, []);

  // 1. 마인드맵 ID 변경 시에만 노드/엣지 로드
  useEffect(() => {
    if (mapData) {
      setMapTitle(mapData.title || '마인드맵');
      const loadedNodes = (mapData.nodes || []).map(node => {
        if (node.type === 'sectionNode') {
          const w = Math.round(node.style?.width || node.width || 360);
          const h = Math.round(node.style?.height || node.height || 260);
          return {
            ...node,
            style: {
              ...(node.style || {}),
              width: w,
              height: h,
              pointerEvents: 'none'
            },
            width: w,
            height: h,
            zIndex: -1,
            dragHandle: '.section-drag-handle',
            data: {
              ...node.data,
              title: node.data?.title || '새 섹션',
              color: node.data?.color || 'blue',
              onUpdateSectionTitle: handleUpdateSectionTitle,
              onUpdateSectionColor: handleUpdateSectionColor,
              onDeleteSection: handleDeleteSection,
              onResizeSection: handleResizeSection
            }
          };
        }

        if (node.type === 'stickyNode') {
          return {
            ...node,
            data: {
              ...node.data,
              text: node.data?.text || '',
              color: node.data?.color || 'yellow',
              onUpdateStickyText: handleUpdateStickyText,
              onUpdateStickyColor: handleUpdateStickyColor,
              onDeleteSticky: handleDeleteSticky,
              onPromoteToNote: handlePromoteStickyToNote
            }
          };
        }

        if (node.type === 'mapNode') {
          const targetMap = mapsRef.current.find(m => m.id === node.data?.mapId);
          return {
            ...node,
            data: {
              ...node.data,
              title: targetMap ? targetMap.title : (node.data?.title || '하위 마인드맵')
            }
          };
        }

        const matchedNote = (notes || []).find(n => n.id === node.data?.noteId);
        return {
          ...node,
          data: {
            ...node.data,
            title: matchedNote ? matchedNote.title : (node.data?.title || '제목 없는 메모'),
            summary: matchedNote ? matchedNote.summary : (node.data?.summary || ''),
            color: matchedNote?.color || node.data?.color || 'default',
            tags: matchedNote?.tags || node.data?.tags || [],
            activeNoteId
          }
        };
      });

      const loadedEdges = (mapData.edges || []).map(edge => ({
        ...edge,
        type: 'deletable',
        animated: false,
        style: edge.style || { stroke: '#2383E2', strokeWidth: 2 },
        data: {
          label: edge.data?.label || '',
          onUpdateLabel: handleUpdateEdgeLabel
        }
      }));

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setSaveStatus('saved');
    }
  }, [mapData?.id, handleUpdateSectionTitle, handleUpdateSectionColor, handleDeleteSection, handleResizeSection, handleUpdateStickyText, handleUpdateStickyColor, handleDeleteSticky, handlePromoteStickyToNote, handleUpdateEdgeLabel]);

  // activeNoteId 변경 시 캔버스 노드 강조 동기화
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'noteNode' && n.data?.activeNoteId !== activeNoteId) {
          return {
            ...n,
            data: {
              ...n.data,
              activeNoteId
            }
          };
        }
        return n;
      })
    );
  }, [activeNoteId, setNodes]);

  // 혹시라도 렌더링 노드가 0개가 되었을 때 원본 맵 데이터가 존재하면 즉시 복원
  useEffect(() => {
    if (nodes.length === 0 && mapData?.nodes && mapData.nodes.length > 0) {
      const recoveredNodes = (mapData.nodes || []).map((node) => {
        if (node.type === 'sectionNode') {
          const w = Math.round(node.style?.width || node.width || 360);
          const h = Math.round(node.style?.height || node.height || 260);
          return {
            ...node,
            style: { ...(node.style || {}), width: w, height: h, pointerEvents: 'none' },
            width: w,
            height: h,
            zIndex: -1,
            dragHandle: '.section-drag-handle',
            data: {
              ...node.data,
              onUpdateSectionTitle: handleUpdateSectionTitle,
              onUpdateSectionColor: handleUpdateSectionColor,
              onDeleteSection: handleDeleteSection,
              onResizeSection: handleResizeSection
            }
          };
        }
        if (node.type === 'stickyNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onUpdateStickyText: handleUpdateStickyText,
              onUpdateStickyColor: handleUpdateStickyColor,
              onDeleteSticky: handleDeleteSticky,
              onPromoteToNote: handlePromoteStickyToNote
            }
          };
        }
        const matchedNote = (notes || []).find((n) => n.id === node.data?.noteId);
        return {
          ...node,
          data: {
            ...node.data,
            title: matchedNote ? matchedNote.title : (node.data?.title || '제목 없는 메모'),
            summary: matchedNote ? matchedNote.summary : (node.data?.summary || ''),
            color: matchedNote?.color || node.data?.color || 'default',
            tags: matchedNote?.tags || node.data?.tags || [],
            activeNoteId
          }
        };
      });
      setNodes(recoveredNodes);
    }
  }, [nodes.length, mapData?.nodes]);

  // 2. 메모 내용/제목/색상 수정 시 노드 상태 갱신
  useEffect(() => {
    setNodes((currentNodes) => {
      let hasChanges = false;
      const nextNodes = currentNodes.map(node => {
        if (node.type === 'mapNode') return node;
        const matchedNote = (notes || []).find(n => n.id === node.data?.noteId);
        if (!matchedNote) return node;
        const noteColor = matchedNote.color || 'default';
        const noteTags = matchedNote.tags || [];
        if (
          node.data?.title === matchedNote.title &&
          node.data?.summary === matchedNote.summary &&
          node.data?.color === noteColor &&
          JSON.stringify(node.data?.tags || []) === JSON.stringify(noteTags)
        ) {
          return node;
        }
        hasChanges = true;
        return {
          ...node,
          data: {
            ...node.data,
            title: matchedNote.title,
            summary: matchedNote.summary,
            color: noteColor,
            tags: noteTags
          }
        };
      });

      if (hasChanges) {
        setEdges((eds) => {
          saveCurrentState(nextNodes, eds);
          return eds;
        });
      }

      return nextNodes;
    });
  }, [notes, saveCurrentState, setEdges]);

  // 연결선 유효성 검사 (자기 자신으로의 연결 및 양방향 중복 연결 완전 방지: A-B, B-A)
  const isValidConnection = useCallback(
    (connection) => {
      if (!connection) return false;
      const { source, target } = connection;
      // 1. 자기 자신으로 돌아오는 간선 방지
      if (!source || !target || source === target) return false;
      // 2. 두 노드 간 이미 간선이 존재하는 경우(A->B, B->A 양방향 모두) 중복 연결 방지
      const currentEdges = edgesRef.current || [];
      const isDuplicate = currentEdges.some(
        (e) =>
          (e.source === source && e.target === target) ||
          (e.source === target && e.target === source)
      );
      return !isDuplicate;
    },
    []
  );

  // 연결선(Edge) 연결 시
  const onConnect = useCallback(
    (params) => {
      if (!params) return;
      const { source, target } = params;
      // 1. 자기 자신으로 돌아오는 간선(Self-loop) 방지
      if (!source || !target || source === target) return;

      setEdges((eds) => {
        // 2. 두 노드 간 이미 간선이 존재하는 경우(A->B, B->A 양방향 모두) 중복 연결 방지
        const isDuplicate = (eds || []).some(
          (e) =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        if (isDuplicate) return eds;

        const nextEdges = addEdge({
          ...params,
          type: 'deletable',
          animated: false,
          style: { stroke: '#2383E2', strokeWidth: 2 }
        }, eds);
        setNodes((nds) => {
          saveCurrentState(nds, nextEdges);
          return nds;
        });
        return nextEdges;
      });
    },
    [saveCurrentState, setEdges, setNodes]
  );

  // --- 드래그 삭제(휴지통) 및 섹션 동반 이동 로직 ---
  const sectionDragRef = useRef(null);

  const onNodeDragStart = useCallback((event, node) => {
    setIsDraggingNode(true);
    setIsOverTrash(false);
    isOverTrashRef.current = false;
    if (trashRef.current) {
      trashRectRef.current = trashRef.current.getBoundingClientRect();
    }

    if (node?.type === 'sectionNode') {
      const secW = node.style?.width || node.measured?.width || 300;
      const secH = node.style?.height || node.measured?.height || 200;
      const secL = node.position.x;
      const secT = node.position.y;
      const secR = secL + secW;
      const secB = secT + secH;

      setNodes((currentNodes) => {
        const childOffsets = [];
        currentNodes.forEach((n) => {
          if (n.id !== node.id && n.type !== 'sectionNode') {
            if (
              n.position.x >= secL &&
              n.position.x <= secR &&
              n.position.y >= secT &&
              n.position.y <= secB
            ) {
              childOffsets.push({
                id: n.id,
                dx: n.position.x - secL,
                dy: n.position.y - secT,
              });
            }
          }
        });
        sectionDragRef.current = {
          sectionId: node.id,
          childOffsets,
        };
        return currentNodes;
      });
    } else {
      sectionDragRef.current = null;
    }
  }, [setNodes]);

  const onNodeDrag = useCallback((event, node) => {
    const trashRect = trashRectRef.current;
    if (trashRect) {
      const isInside =
        event.clientX >= trashRect.left - 20 &&
        event.clientX <= trashRect.right + 20 &&
        event.clientY >= trashRect.top - 20 &&
        event.clientY <= trashRect.bottom + 20;

      if (isInside !== isOverTrashRef.current) {
        isOverTrashRef.current = isInside;
        setIsOverTrash(isInside);
      }
    }

    // 섹션 드래그 시 내부 노드 함께 이동
    if (sectionDragRef.current && sectionDragRef.current.sectionId === node?.id) {
      const { childOffsets } = sectionDragRef.current;
      if (childOffsets.length > 0) {
        setNodes((nds) =>
          nds.map((n) => {
            const found = childOffsets.find((c) => c.id === n.id);
            if (found) {
              return {
                ...n,
                position: {
                  x: Math.round(node.position.x + found.dx),
                  y: Math.round(node.position.y + found.dy),
                },
              };
            }
            return n;
          })
        );
      }
    }
  }, [setNodes]);

  const onNodeDragStop = useCallback(
    (event, node) => {
      setIsDraggingNode(false);
      const shouldDelete = isOverTrashRef.current;
      setIsOverTrash(false);
      isOverTrashRef.current = false;
      trashRectRef.current = null;
      sectionDragRef.current = null;

      if (shouldDelete) {
        setNodes((nds) => {
          const remainingNodes = nds.filter((n) => n.id !== node.id);
          setEdges((eds) => {
            const remainingEdges = eds.filter(
              (e) => e.source !== node.id && e.target !== node.id
            );
            saveCurrentState(remainingNodes, remainingEdges);
            return remainingEdges;
          });
          return remainingNodes;
        });
      } else {
        setNodes((nds) => {
          setEdges((eds) => {
            saveCurrentState(nds, eds);
            return eds;
          });
          return nds;
        });
      }
    },
    [saveCurrentState, setEdges, setNodes]
  );

  // 노드 클릭 처리
  const handleFlowElementClick = useCallback((event, node) => {
    if (node.type === 'mapNode') {
      if (onOpenSubmapRef.current && node.data?.mapId) {
        onOpenSubmapRef.current(node.data.mapId);
      }
    } else if (node.type === 'noteNode') {
      if (onNodeClickRef.current && node.data?.noteId) {
        onNodeClickRef.current(node.data.noteId, node.id);
      }
    }
  }, []);

  // 캔버스 노드 선택 상태 변경 시 (사이드바 선택 하이라이트 동기화)
  const onSelectionChangeHandler = useCallback(
    ({ nodes: selectedNodes }) => {
      const selectedNote = selectedNodes?.find((n) => n.type === 'noteNode' && n.data?.noteId);
      if (onSelectCanvasNodeNoteId) {
        onSelectCanvasNodeNoteId(selectedNote ? selectedNote.data.noteId : null);
      }
    },
    [onSelectCanvasNodeNoteId]
  );

  // 노드 변경 시 (삭제 등)
  const onNodesChangeHandler = useCallback(
    (changes) => {
      onNodesChange(changes);
      if (changes.some(c => c.type === 'remove' || (c.type === 'dimensions' && c.resizing === false))) {
        setTimeout(() => {
          saveCurrentState(nodesRef.current, edgesRef.current);
        }, 50);
      }
    },
    [onNodesChange, saveCurrentState]
  );

  // 엣지 삭제 시
  const onEdgesChangeHandler = useCallback(
    (changes) => {
      onEdgesChange(changes);
      if (changes.some(c => c.type === 'remove')) {
        setTimeout(() => {
          saveCurrentState(nodesRef.current, edgesRef.current);
        }, 50);
      }
    },
    [onEdgesChange, saveCurrentState]
  );

  // 엣지 우클릭 시 끊기
  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setEdges((eds) => {
      const nextEdges = eds.filter((e) => e.id !== edge.id);
      setNodes((nds) => {
        saveCurrentState(nds, nextEdges);
        return nds;
      });
      return nextEdges;
    });
  }, [saveCurrentState, setEdges, setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // 사이드바에서 드래그 앤 드롭
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance.current) return;
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const rawMap = event.dataTransfer.getData('application/mindnote-map');
      if (rawMap) {
        const droppedMap = JSON.parse(rawMap);
        if (droppedMap.id === mapData?.id) {
          return;
        }

        const newMapNode = {
          id: `node-${Date.now()}`,
          type: 'mapNode',
          position,
          data: {
            mapId: droppedMap.id,
            title: droppedMap.title,
            nodeCount: 0
          }
        };

        setNodes((nds) => {
          const nextNodes = nds.concat(newMapNode);
          setEdges((eds) => {
            saveCurrentState(nextNodes, eds);
            return eds;
          });
          return nextNodes;
        });
        return;
      }

      const rawNote = event.dataTransfer.getData('application/mindnote-note');
      if (rawNote) {
        const note = JSON.parse(rawNote);
        const newNode = {
          id: `node-${Date.now()}`,
          type: 'noteNode',
          position,
          data: {
            noteId: note.id,
            title: note.title,
            summary: note.summary,
            color: note.color || 'default',
            tags: note.tags || []
          }
        };

        setNodes((nds) => {
          const nextNodes = nds.concat(newNode);
          setEdges((eds) => {
            saveCurrentState(nextNodes, eds);
            return eds;
          });
          return nextNodes;
        });
      }
    },
    [mapData?.id, saveCurrentState, setEdges, setNodes]
  );

  // 새 일반 메모 노드 생성 버튼
  const handleAddNewNode = () => {
    if (!reactFlowInstance.current) return;
    const center = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    onNewNoteAndAddNode(center, (newNote) => {
      const newNode = {
        id: `node-${Date.now()}`,
        type: 'noteNode',
        position: center,
        data: {
          noteId: newNote.id,
          title: newNote.title,
          summary: newNote.summary,
          color: newNote.color || 'default',
          tags: newNote.tags || []
        }
      };
      setNodes((nds) => {
        const next = nds.concat(newNode);
        setEdges((eds) => {
          saveCurrentState(next, eds);
          return eds;
        });
        return next;
      });
    });
  };

  // 새 하위 마인드맵 노드 생성 버튼
  const handleAddNewSubmap = () => {
    if (!reactFlowInstance.current) return;
    const center = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    if (onNewSubmapAndAddNode) {
      onNewSubmapAndAddNode(center, (newMap) => {
        const newMapNode = {
          id: `node-${Date.now()}`,
          type: 'mapNode',
          position: center,
          data: {
            mapId: newMap.id,
            title: newMap.title,
            nodeCount: 0
          }
        };
        setNodes((nds) => {
          const next = nds.concat(newMapNode);
          setEdges((eds) => {
            saveCurrentState(next, eds);
            return eds;
          });
          return next;
        });
      });
    }
  };

  // 새 포스트잇 노드 생성 버튼
  const handleAddNewSticky = () => {
    if (!reactFlowInstance.current) return;
    const center = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const newSticky = {
      id: `sticky-${Date.now()}`,
      type: 'stickyNode',
      position: center,
      data: {
        text: '',
        color: 'yellow',
        onUpdateStickyText: handleUpdateStickyText,
        onUpdateStickyColor: handleUpdateStickyColor,
        onDeleteSticky: handleDeleteSticky,
        onPromoteToNote: handlePromoteStickyToNote
      }
    };

    setNodes((nds) => {
      const next = nds.concat(newSticky);
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  };

  // 새 섹션 영역 노드 생성 버튼
  const handleAddNewSection = () => {
    if (!reactFlowInstance.current) return;
    const center = reactFlowInstance.current.screenToFlowPosition({
      x: window.innerWidth / 2 - 175,
      y: window.innerHeight / 2 - 125
    });

    const newSection = {
      id: `section-${Date.now()}`,
      type: 'sectionNode',
      dragHandle: '.section-drag-handle',
      position: center,
      style: { width: 360, height: 260, pointerEvents: 'none' },
      zIndex: -1,
      data: {
        title: '새 그룹 섹션',
        color: 'blue',
        onUpdateSectionTitle: handleUpdateSectionTitle,
        onUpdateSectionColor: handleUpdateSectionColor,
        onDeleteSection: handleDeleteSection,
        onResizeSection: handleResizeSection
      }
    };

    setNodes((nds) => {
      // 섹션은 맨 앞에 두어 낮은 z-index로 렌더
      const next = [newSection, ...nds];
      setEdges((eds) => {
        saveCurrentState(next, eds);
        return eds;
      });
      return next;
    });
  };

  const handleFinishRename = () => {
    setIsEditingTitle(false);
    if (mapTitle.trim() && onRenameMap) {
      onRenameMap(mapTitle.trim());
    }
  };

  const handleManualSave = () => {
    saveCurrentState(nodes, edges, true);
  };

  const dotColor = theme === 'dark' ? '#333333' : theme === 'sepia' ? '#D5C8A8' : '#DCDCDA';

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper} style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* 상단 좌측: 이전 맵 뒤로가기 버튼 + 마인드맵 제목 */}
      <div
        className={`absolute top-4 z-10 flex items-center gap-2 select-none transition-all duration-300 ${
          isSidebarOpen ? 'left-4' : 'left-16'
        }`}
      >
        {mapHistory.length > 0 && (
          <button
            onClick={onBackMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm backdrop-blur-xs font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title="상위 마인드맵으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>이전 맵</span>
          </button>
        )}

        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border shadow-sm backdrop-blur-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={mapTitle}
                onChange={(e) => setMapTitle(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleFinishRename();
                }}
                autoFocus
                className="px-2 py-0.5 text-xs font-bold rounded border border-blue-400 outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleFinishRename}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-blue-500 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="클릭하여 마인드맵 이름 변경"
            >
              <span className="text-xs font-bold tracking-tight">{mapTitle}</span>
              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" />
            </div>
          )}
        </div>

        {/* 섹션 뷰포인트 점프 드롭다운 */}
        {nodes.some((n) => n.type === 'sectionNode') && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleFocusSection(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer pr-1"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="" disabled className="text-gray-400">
                섹션 바로가기 ({nodes.filter((n) => n.type === 'sectionNode').length})
              </option>
              {nodes
                .filter((n) => n.type === 'sectionNode')
                .map((sec) => (
                  <option
                    key={sec.id}
                    value={sec.id}
                    className="text-gray-800 dark:text-gray-200 bg-white dark:bg-[#202020]"
                  >
                    📍 {sec.data?.title || '새 섹션'}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* 상단 우측: 저장 상태 및 툴바 */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm backdrop-blur-xs select-none"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="flex items-center gap-1 text-xs mr-1 opacity-70">
          {saveStatus === 'saving' ? (
            <span className="text-blue-500 animate-pulse text-[11px]">저장 중...</span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500 text-[11px]">
              <Check className="w-3.5 h-3.5" />
              자동 저장됨 {lastSavedTime && `(${lastSavedTime})`}
            </span>
          )}
        </div>

        <button
          onClick={handleManualSave}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-500 hover:text-blue-500 transition cursor-pointer"
          title="마인드맵 지금 저장하기"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3.5 bg-black/10 dark:bg-white/10" />

        <button
          onClick={handleAddNewSticky}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          title="캔버스에 바로 쓸 수 있는 가벼운 포스트잇 메모 추가"
        >
          <StickyNote className="w-3.5 h-3.5" />
          <span>포스트잇</span>
        </button>

        <button
          onClick={handleAddNewSection}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          title="노드들을 묶어서 이동/정리하는 섹션 영역 추가"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>섹션</span>
        </button>

        <button
          onClick={handleAddNewSubmap}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          title="이 캔버스 안에 하위 마인드맵 노드 만들기"
        >
          <Network className="w-3.5 h-3.5" />
          <span>하위 맵</span>
        </button>

        <button
          onClick={handleAddNewNode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>노드 추가</span>
        </button>
      </div>

      {/* 하단 중앙 드래그 삭제 휴지통 UI */}
      <div
        ref={trashRef}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl border transition-all duration-150 select-none ${
          isDraggingNode
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
        } ${
          isOverTrash
            ? 'bg-red-600 text-white border-red-500 scale-110 shadow-red-500/40 ring-4 ring-red-400/30'
            : 'bg-white/95 dark:bg-[#202020]/95 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-700 backdrop-blur-md'
        }`}
      >
        <div
          className={`p-2 rounded-xl transition-all ${
            isOverTrash ? 'bg-red-700 text-white animate-bounce' : 'bg-red-50 text-red-500 dark:bg-red-950/40'
          }`}
        >
          <Trash2 className="w-5 h-5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight">
            {isOverTrash ? '여기에 놓으면 삭제됩니다!' : '노드 삭제'}
          </span>
          <span className={`text-[10px] ${isOverTrash ? 'text-red-100' : 'text-gray-400'}`}>
            여기로 드래그해서 버리세요
          </span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleFlowElementClick}
        onSelectionChange={onSelectionChangeHandler}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onEdgeContextMenu={onEdgeContextMenu}
        onInit={(instance) => { reactFlowInstance.current = instance; }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'deletable',
          animated: false,
          style: { stroke: '#2383E2', strokeWidth: 2 }
        }}
        elevateEdgesOnSelect={true}
        connectionLineComponent={CustomConnectionLine}
        connectOnClick={false}
        edgesReconnectable={false}
        onlyRenderVisibleElements={false}
        fitView
        fitViewOptions={{ duration: 400, padding: 0.2, includeHiddenNodes: true }}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        panOnDrag={[0, 1, 2]}
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode={['Delete']}
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1} color={dotColor} />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          nodeColor={(node) => node.type === 'mapNode' ? '#4F46E5' : '#2383E2'}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(240, 240, 240, 0.7)'}
          pannable={false}
          zoomable={false}
          className="!bottom-4 !left-4 !m-0 !rounded-xl !border-gray-200 !shadow-sm"
          style={{
            width: 140,
            height: 90,
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        />
      </ReactFlow>
    </div>
  );
}
