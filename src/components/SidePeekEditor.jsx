import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Check,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Code,
  Quote,
  FileCode,
  Tag,
  Plus,
  Sparkles,
  Type,
  ChevronDown,
  FileText
} from 'lucide-react';
import { extractSummary } from '../api';
import { COLOR_THEMES } from './NoteNode';

// 슬래시(/) 명령어 정의 목록
const SLASH_COMMANDS = [
  {
    id: 'text',
    label: '일반 텍스트',
    desc: '일반 문단 텍스트를 작성합니다.',
    icon: Type,
    keywords: ['text', '일반', '텍스트', '글', '본문', 'p']
  },
  {
    id: 'todo',
    label: '할 일 목록',
    desc: '체크박스가 있는 할 일 항목을 생성합니다.',
    icon: CheckSquare,
    keywords: ['todo', '할일', '체크', 'checkbox', '체크박스', '목록', 'task']
  },
  {
    id: 'h1',
    label: '제목 1',
    desc: '가장 큰 섹션 대제목입니다.',
    icon: Heading1,
    keywords: ['h1', '제목1', 'heading1', '대제목', '1', 'header']
  },
  {
    id: 'h2',
    label: '제목 2',
    desc: '중간 크기의 하위 제목입니다.',
    icon: Heading2,
    keywords: ['h2', '제목2', 'heading2', '중제목', '2']
  },
  {
    id: 'h3',
    label: '제목 3',
    desc: '작은 크기의 소제목입니다.',
    icon: Heading3,
    keywords: ['h3', '제목3', 'heading3', '소제목', '3']
  },
  {
    id: 'bullet',
    label: '글머리 기호 목록',
    desc: '원형 글머리 기호 목록을 만듭니다.',
    icon: List,
    keywords: ['bullet', '목록', '리스트', '점', '불릿', 'ul']
  },
  {
    id: 'quote',
    label: '인용구',
    desc: '강조할 문구나 인용문을 작성합니다.',
    icon: Quote,
    keywords: ['quote', '인용', '인용구', '강조']
  },
  {
    id: 'code',
    label: '코드 블록',
    desc: '프로그래밍 코드 스니펫을 작성합니다.',
    icon: Code,
    keywords: ['code', '코드', '프로그래밍', '개발']
  }
];

// 마크다운 문자열을 실시간 편집 블록 목록으로 파싱
function parseMarkdownToBlocks(markdown = '') {
  if (!markdown) {
    return [{ id: `b_0_${Date.now()}`, type: 'text', text: '' }];
  }
  const lines = markdown.split('\n');
  const blocks = [];
  let inCode = false;
  let codeBuffer = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({
          id: `b_code_${blocks.length}_${Math.random()}`,
          type: 'code',
          lang: codeLang,
          text: codeBuffer.join('\n')
        });
        codeBuffer = [];
        codeLang = '';
        inCode = false;
      } else {
        inCode = true;
        codeLang = line.replace(/^```/, '').trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'todo',
        checked: true,
        text: line.replace(/^- \[[xX]\] /, '')
      });
    } else if (line.startsWith('- [ ] ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'todo',
        checked: false,
        text: line.replace(/^- \[ \] /, '')
      });
    } else if (line.startsWith('# ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'h1',
        text: line.replace(/^# /, '')
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'h2',
        text: line.replace(/^## /, '')
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'h3',
        text: line.replace(/^### /, '')
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'bullet',
        text: line.replace(/^[-*] /, '')
      });
    } else if (line.startsWith('> ')) {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'quote',
        text: line.replace(/^> /, '')
      });
    } else {
      blocks.push({
        id: `b_${blocks.length}_${Math.random()}`,
        type: 'text',
        text: line
      });
    }
  }

  if (inCode) {
    blocks.push({
      id: `b_code_${blocks.length}_${Math.random()}`,
      type: 'code',
      lang: codeLang,
      text: codeBuffer.join('\n')
    });
  }

  return blocks.length > 0 ? blocks : [{ id: `b_0_${Date.now()}`, type: 'text', text: '' }];
}

// 블록 목록을 다시 마크다운 문자열로 변환 (코드 블록은 ``` 백틱으로 감싸서 표준 마크다운 저장)
function blocksToMarkdown(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'todo':
        return `- [${block.checked ? 'x' : ' '}] ${block.text}`;
      case 'h1':
        return `# ${block.text}`;
      case 'h2':
        return `## ${block.text}`;
      case 'h3':
        return `### ${block.text}`;
      case 'bullet':
        return `- ${block.text}`;
      case 'quote':
        return `> ${block.text}`;
      case 'code':
        return `\`\`\`${block.lang || ''}\n${block.text || ''}\n\`\`\``;
      default:
        return block.text;
    }
  }).join('\n');
}

// 자동 높이 조절 텍스트에어리어 컴포넌트
function AutoResizeTextarea({
  id,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onPaste,
  placeholder,
  className = '',
  style = {}
}) {
  const textareaRef = useRef(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e) => {
        resize();
        onChange(e);
      }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onPaste={onPaste}
      placeholder={placeholder}
      rows={1}
      className={`resize-none overflow-hidden outline-none bg-transparent w-full ${className}`}
      style={style}
    />
  );
}

export default function SidePeekEditor({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isMaximized,
  setIsMaximized,
  availableTags = []
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [summary, setSummary] = useState('');
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [color, setColor] = useState('default');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSummarySlide, setShowSummarySlide] = useState(false);

  // 슬래시(/) 명령어 메뉴 상태
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    blockIndex: null,
    query: '',
    selectedIndex: 0
  });

  const saveTimeoutRef = useRef(null);
  const currentNoteIdRef = useRef(null);

  // 컴팩트 시간 형식 포맷터 (2줄 넘침 방지)
  const formatCompactTime = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // 슬래시 메뉴 선택 항목 변경 시 드롭다운 내부 자동 스크롤 추적
  useEffect(() => {
    if (slashMenu.isOpen) {
      const selectedEl = document.getElementById(`slash-cmd-${slashMenu.selectedIndex}`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [slashMenu.selectedIndex, slashMenu.isOpen]);

  // 노트가 바뀔 때 상태 초기화
  useEffect(() => {
    if (note && note.id !== currentNoteIdRef.current) {
      currentNoteIdRef.current = note.id;
      setTitle(note.title || '');
      const rawContent = note.content || '';
      setContent(rawContent);
      setBlocks(parseMarkdownToBlocks(rawContent));
      setSummary(note.summary || '');
      setActiveBlockIndex(0);
      setColor(note.color || 'default');
      setTags(Array.isArray(note.tags) ? note.tags : []);
      setTagInput('');
      setIsSaving(false);
      setShowColorPicker(false);
      setShowSummarySlide(false);
      setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
    }
  }, [note?.id]);

  // 디바운스 자동 저장
  const triggerAutoSave = (newTitle, newContent, newColor = color, newTags = tags, newSummary = summary) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (note) {
        const finalSummary = (newSummary !== undefined && newSummary !== null && newSummary.trim() !== '')
          ? newSummary
          : extractSummary(newContent);

        await onSave({
          ...note,
          title: newTitle,
          content: newContent,
          color: newColor,
          tags: newTags,
          summary: finalSummary
        });
        setIsSaving(false);
        setLastSavedTime(formatCompactTime());
      }
    }, 350);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content, color, tags, summary);
  };

  const handleSummaryChange = (e) => {
    const val = e.target.value;
    setSummary(val);
    triggerAutoSave(title, content, color, tags, val);
  };

  // 체크박스 토글
  const handleToggleTodo = (index) => {
    const nextBlocks = blocks.map((b, i) => {
      if (i === index) {
        return { ...b, checked: !b.checked };
      }
      return b;
    });
    setBlocks(nextBlocks);
    const newMd = blocksToMarkdown(nextBlocks);
    setContent(newMd);
    triggerAutoSave(title, newMd, color, tags, summary);
  };

  // 슬래시 명령어 필터링
  const filteredCommands = slashMenu.isOpen
    ? SLASH_COMMANDS.filter((cmd) => {
        const q = slashMenu.query.toLowerCase();
        if (!q) return true;
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.id.toLowerCase().includes(q) ||
          cmd.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : [];

  // 슬래시 명령어 실행
  const executeSlashCommand = (commandId, targetIndex) => {
    const blockIdx = targetIndex !== undefined ? targetIndex : slashMenu.blockIndex;
    if (blockIdx === null || blockIdx < 0 || blockIdx >= blocks.length) return;

    const block = blocks[blockIdx];
    let cleanedText = block.text;

    // 슬래시(/) 명령어 텍스트 제거
    const slashPos = cleanedText.lastIndexOf('/');
    if (slashPos !== -1) {
      cleanedText = cleanedText.substring(0, slashPos).trim();
    }

    let nextType = commandId;
    let nextChecked = false;
    let nextLang = '';

    const nextBlocks = blocks.map((b, i) => {
      if (i === blockIdx) {
        return {
          ...b,
          type: nextType,
          lang: nextLang,
          checked: nextChecked,
          text: cleanedText
        };
      }
      return b;
    });

    setBlocks(nextBlocks);
    const newMd = blocksToMarkdown(nextBlocks);
    setContent(newMd);
    triggerAutoSave(title, newMd, color, tags, summary);
    setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });

    setTimeout(() => {
      const el = document.getElementById(`block-input-${blockIdx}`);
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 20);
  };

  // 블록 텍스트 변경 (마크다운 단축키 및 슬래시 감지)
  const handleBlockTextChange = (index, newText) => {
    const block = blocks[index];
    let type = block.type;
    let text = newText;
    let checked = block.checked;
    let lang = block.lang || '';

    // 슬래시(/) 명령어 감지
    const slashPos = text.lastIndexOf('/');
    if (slashPos !== -1 && (slashPos === 0 || text[slashPos - 1] === ' ')) {
      const query = text.slice(slashPos + 1).trim();
      if (!query.includes(' ')) {
        setSlashMenu({
          isOpen: true,
          blockIndex: index,
          query,
          selectedIndex: 0
        });
      } else {
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      }
    } else if (slashMenu.isOpen && slashMenu.blockIndex === index) {
      setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
    }

    // 일반 텍스트 상태에서 인라인 마크다운 단축키 입력 시 자동 변환
    if (type === 'text') {
      if (text.startsWith('- [ ] ') || text.startsWith('[] ')) {
        type = 'todo';
        checked = false;
        text = text.replace(/^(- \[ \] |\[\] )/, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('- [x] ') || text.startsWith('- [X] ')) {
        type = 'todo';
        checked = true;
        text = text.replace(/^- \[[xX]\] /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('- ') || text.startsWith('* ')) {
        type = 'bullet';
        text = text.replace(/^[-*] /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('# ')) {
        type = 'h1';
        text = text.replace(/^# /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('## ')) {
        type = 'h2';
        text = text.replace(/^## /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('### ')) {
        type = 'h3';
        text = text.replace(/^### /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      } else if (text.startsWith('> ')) {
        type = 'quote';
        text = text.replace(/^> /, '');
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      }
    }

    const nextBlocks = blocks.map((b, i) => {
      if (i === index) {
        return { ...b, type, text, checked, lang };
      }
      return b;
    });

    setBlocks(nextBlocks);
    const newMd = blocksToMarkdown(nextBlocks);
    setContent(newMd);
    triggerAutoSave(title, newMd, color, tags, summary);
  };

  // 키보드 인터랙션 (Enter, Backspace, 화살표, 슬래시 메뉴)
  const handleBlockKeyDown = (e, index) => {
    e.stopPropagation();

    // 슬래시 메뉴가 열려있을 때의 키 조작
    if (slashMenu.isOpen && slashMenu.blockIndex === index) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex: filteredCommands.length > 0 ? (prev.selectedIndex + 1) % filteredCommands.length : 0
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex:
            filteredCommands.length > 0
              ? (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length
              : 0
        }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          const selected = filteredCommands[slashMenu.selectedIndex] || filteredCommands[0];
          executeSlashCommand(selected.id, index);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
        return;
      }
    }

    const block = blocks[index];
    const isCursorAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;

    // Enter 입력 시
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // 내용이 비어있는 할 일/목록/인용구에서 엔터를 누르면 일반 텍스트로 변환
      if ((block.type === 'todo' || block.type === 'bullet' || block.type === 'quote') && block.text.trim() === '') {
        const nextBlocks = blocks.map((b, i) => (i === index ? { ...b, type: 'text' } : b));
        setBlocks(nextBlocks);
        const newMd = blocksToMarkdown(nextBlocks);
        setContent(newMd);
        triggerAutoSave(title, newMd, color, tags, summary);
        return;
      }

      // 커서 위치 기준으로 텍스트 분할
      const cursor = e.target.selectionStart;
      const textBefore = block.text.slice(0, cursor);
      const textAfter = block.text.slice(cursor);

      // 다음 블록 타입 결정 (할 일/목록은 연속 생성, 헤딩/인용구는 일반 텍스트로 전환)
      const nextType = block.type === 'todo' ? 'todo' : (block.type === 'bullet' ? 'bullet' : 'text');
      const newBlock = {
        id: `b_${Date.now()}_${Math.random()}`,
        type: nextType,
        checked: false,
        text: textAfter
      };

      const nextBlocks = [
        ...blocks.slice(0, index),
        { ...block, text: textBefore },
        newBlock,
        ...blocks.slice(index + 1)
      ];

      setBlocks(nextBlocks);
      const newMd = blocksToMarkdown(nextBlocks);
      setContent(newMd);
      triggerAutoSave(title, newMd, color, tags, summary);

      setTimeout(() => {
        const el = document.getElementById(`block-input-${index + 1}`);
        if (el) {
          el.focus();
          el.setSelectionRange(0, 0);
          setActiveBlockIndex(index + 1);
        }
      }, 20);
      return;
    }

    // Backspace 입력 시
    if (e.key === 'Backspace') {
      // 빈 코드 블록인 경우 백스페이스 누르면 바로 삭제
      if (block.type === 'code' && (!block.text || block.text === '')) {
        e.preventDefault();
        if (blocks.length > 1) {
          const prevIndex = Math.max(0, index - 1);
          const nextBlocks = blocks.filter((_, i) => i !== index);
          setBlocks(nextBlocks);
          const newMd = blocksToMarkdown(nextBlocks);
          setContent(newMd);
          triggerAutoSave(title, newMd, color, tags, summary);

          setTimeout(() => {
            const el = document.getElementById(`block-input-${prevIndex}`);
            if (el) {
              el.focus();
              const len = el.value.length;
              el.setSelectionRange(len, len);
              setActiveBlockIndex(prevIndex);
            }
          }, 20);
        } else {
          const nextBlocks = [{ id: block.id || `b_${Date.now()}`, type: 'text', text: '' }];
          setBlocks(nextBlocks);
          const newMd = blocksToMarkdown(nextBlocks);
          setContent(newMd);
          triggerAutoSave(title, newMd, color, tags, summary);
        }
        return;
      }

      if (isCursorAtStart) {
        // 특수 서식 블록의 맨 앞에서 백스페이스 누르면 일반 텍스트로 변환
        if (block.type !== 'text') {
          e.preventDefault();
          const nextBlocks = blocks.map((b, i) => (i === index ? { ...b, type: 'text' } : b));
          setBlocks(nextBlocks);
          const newMd = blocksToMarkdown(nextBlocks);
          setContent(newMd);
          triggerAutoSave(title, newMd, color, tags, summary);
          return;
        }

      // 빈 일반 텍스트 블록이고 블록이 여러 개일 때 삭제 후 이전 블록으로 포커스
      if (block.text === '' && blocks.length > 1) {
        e.preventDefault();
        const prevIndex = Math.max(0, index - 1);
        const nextBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(nextBlocks);
        const newMd = blocksToMarkdown(nextBlocks);
        setContent(newMd);
        triggerAutoSave(title, newMd, color, tags, summary);

        setTimeout(() => {
          const el = document.getElementById(`block-input-${prevIndex}`);
          if (el) {
            el.focus();
            const len = el.value.length;
            el.setSelectionRange(len, len);
            setActiveBlockIndex(prevIndex);
          }
        }, 20);
        return;
      }

      // 맨 앞에서 이전 블록과 합치기
      if (index > 0 && block.type === 'text') {
        e.preventDefault();
        const prevIndex = index - 1;
        const prevBlock = blocks[prevIndex];
        const prevLen = prevBlock.text.length;
        const mergedText = prevBlock.text + block.text;

        const nextBlocks = blocks
          .map((b, i) => (i === prevIndex ? { ...b, text: mergedText } : b))
          .filter((_, i) => i !== index);

        setBlocks(nextBlocks);
        const newMd = blocksToMarkdown(nextBlocks);
        setContent(newMd);
        triggerAutoSave(title, newMd, color, tags, summary);

        setTimeout(() => {
          const el = document.getElementById(`block-input-${prevIndex}`);
          if (el) {
            el.focus();
            el.setSelectionRange(prevLen, prevLen);
            setActiveBlockIndex(prevIndex);
          }
        }, 20);
        return;
      }
    }
  }

    // 화살표 키로 블록 간 부드러운 이동
    if (e.key === 'ArrowUp' && isCursorAtStart && index > 0) {
      e.preventDefault();
      const el = document.getElementById(`block-input-${index - 1}`);
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
        setActiveBlockIndex(index - 1);
      }
    } else if (e.key === 'ArrowDown' && e.target.selectionEnd === block.text.length && index < blocks.length - 1) {
      e.preventDefault();
      const el = document.getElementById(`block-input-${index + 1}`);
      if (el) {
        el.focus();
        el.setSelectionRange(0, 0);
        setActiveBlockIndex(index + 1);
      }
    }
  };

  // 멀티라인 붙여넣기 지원
  const handleBlockPaste = (e, index) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n')) {
      e.preventDefault();
      const pastedBlocks = parseMarkdownToBlocks(text);
      const before = blocks.slice(0, index);
      const after = blocks.slice(index + 1);

      const nextBlocks = [...before, ...pastedBlocks, ...after];
      setBlocks(nextBlocks);
      const newMd = blocksToMarkdown(nextBlocks);
      setContent(newMd);
      triggerAutoSave(title, newMd, color, tags, summary);
    }
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);
    triggerAutoSave(title, content, newColor, tags, summary);
    setShowColorPicker(false);
  };

  const handleAddTag = (rawTag) => {
    const clean = rawTag.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean)) return;
    const nextTags = [...tags, clean];
    setTags(nextTags);
    triggerAutoSave(title, content, color, nextTags, summary);
  };

  const handleRemoveTag = (tagToRemove) => {
    const nextTags = tags.filter(t => t !== tagToRemove);
    setTags(nextTags);
    triggerAutoSave(title, content, color, nextTags, summary);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
  };

  const currentThemeConfig = COLOR_THEMES[color] || COLOR_THEMES.default;

  return (
    <aside
      className={`fixed top-0 right-0 h-full border-l shadow-2xl z-40 flex flex-col select-text nodrag nopan transition-transform duration-300 ease-in-out ${
        isMaximized ? 'w-full' : 'w-[560px] max-w-full'
      } ${
        isOpen && note ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
      }}
      onKeyDown={handleKeyDown}
    >
      {/* 상단 컨트롤 바 (1줄 고정, 줄바꿈 완전 방지) */}
      <div
        className="flex items-center justify-between px-6 py-2.5 border-b select-none transition-colors whitespace-nowrap min-h-[46px]"
        style={{
          backgroundColor: currentThemeConfig.headerBg,
          borderColor: color !== 'default' ? currentThemeConfig.border : 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2.5 text-xs opacity-85 shrink-0">
          <span
            className="flex items-center gap-1 font-mono text-[11px] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded max-w-[130px] truncate"
            title={note?.id ? `${note.id}.md` : '문서 없음'}
          >
            <FileCode className="w-3 h-3 shrink-0" />
            <span className="truncate">{note?.id ? `${note.id}.md` : '문서 없음'}</span>
          </span>

          {/* 색상/그룹 선택 드롭다운 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition border border-black/10 dark:border-white/10"
              title="노드 그룹 색상 변경"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentThemeConfig.chip }}
              />
              <span className="text-[11px] font-medium">{currentThemeConfig.name}</span>
            </button>

            {/* 색상 선택 팝업 */}
            {showColorPicker && (
              <div
                className="absolute left-0 top-full mt-1.5 p-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(COLOR_THEMES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => handleColorChange(key)}
                    className="relative w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 border border-black/10 shadow-2xs"
                    style={{ backgroundColor: item.chip }}
                    title={item.name}
                  >
                    {color === key && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 마인드맵 노드 요약 슬라이드 토글 버튼 */}
          <button
            onClick={() => setShowSummarySlide(!showSummarySlide)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition border shrink-0 ${
              showSummarySlide
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'hover:bg-black/10 dark:hover:bg-white/10 border-black/10 dark:border-white/10'
            }`}
            title={showSummarySlide ? '노드 요약창 접기' : '마인드맵에 표시될 요약본 작성창 열기'}
          >
            <Sparkles className={`w-3 h-3 ${showSummarySlide ? 'text-amber-300' : 'text-amber-500'}`} />
            <span>노드 요약</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                showSummarySlide ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* 저장 상태 표시 (간결한 1줄 시간 포맷) */}
          {isSaving ? (
            <span className="text-blue-500 animate-pulse text-[11px] shrink-0 font-medium">저장 중...</span>
          ) : (
            <span
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] shrink-0 font-medium"
              title={lastSavedTime ? `마지막 저장: ${lastSavedTime}` : ''}
            >
              <Check className="w-3 h-3 shrink-0" />
              <span>{lastSavedTime ? `${lastSavedTime}` : '저장됨'}</span>
            </span>
          )}
        </div>

        {/* 우측 컨트롤 (확대/축소 및 닫기) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100"
            title={isMaximized ? '사이드 피크로 축소' : '전체 화면으로 확대'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100 ml-1"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 상단 슬라이드 창: 마인드맵 노드 표시 요약 작성 (부드러운 CSS Grid 높이 보간) */}
      <div
        className={`grid transition-all duration-300 ease-in-out border-b ${
          showSummarySlide
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 border-transparent pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: showSummarySlide ? 'var(--border-subtle)' : 'transparent'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden">
          <div className="px-8 py-3.5 select-text">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>마인드맵 노드 표시 요약</span>
                <span className="text-[11px] font-normal opacity-50 ml-1">
                  (마인드맵 노드 카드에 2~3줄로 표시됩니다)
                </span>
              </div>
            </div>

            <textarea
              value={summary}
              onChange={handleSummaryChange}
              placeholder="마인드맵 노드 카드에 표시될 요약을 작성하세요... (비워두면 본문 첫 문장이 자동으로 표시됩니다)"
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a1a1a] outline-none focus:border-blue-500 transition resize-none leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* 에디터 본문 영역 (클릭 시 줄 선택 및 포커스 완전 지원) */}
      <div
        className="flex-1 overflow-y-auto px-10 py-8 max-w-4xl mx-auto w-full flex flex-col cursor-text"
        onClick={(e) => {
          // 블록 바깥 빈 영역을 클릭한 경우 맨 마지막 줄 포커스 또는 새 블록 생성
          if (!e.target.closest('.group\\/block') && !e.target.closest('input') && !e.target.closest('button')) {
            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
            const lastIdx = blocks.length - 1;
            const lastBlock = blocks[lastIdx];
            if (lastBlock && lastBlock.text.trim() === '') {
              const el = document.getElementById(`block-input-${lastIdx}`);
              if (el) el.focus();
            } else {
              const newBlock = { id: `b_${Date.now()}`, type: 'text', text: '' };
              const nextBlocks = [...blocks, newBlock];
              setBlocks(nextBlocks);
              setTimeout(() => {
                const el = document.getElementById(`block-input-${nextBlocks.length - 1}`);
                if (el) el.focus();
              }, 10);
            }
          }
        }}
      >
        {/* 대형 제목 */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onClick={(e) => {
            e.stopPropagation();
            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
          }}
          onKeyDown={handleKeyDown}
          placeholder="제목 없음"
          className="w-full text-3xl font-bold outline-none pb-4 mb-6 border-b border-transparent focus:border-blue-500/20 bg-transparent transition cursor-text"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* 실시간 라이브 블록 리스트 */}
        <div className="space-y-1.5 w-full flex-1 flex flex-col pb-36">
          {blocks.map((block, idx) => {
            const isSlashMenuTarget = slashMenu.isOpen && slashMenu.blockIndex === idx;

            return (
              <div
                key={block.id}
                className="relative group/block w-full cursor-text"
                onClick={(e) => {
                  // 버튼(체크박스)이나 팝업 메뉴 클릭이 아닐 때, 해당 줄의 인풋으로 즉시 포커스 인계
                  if (e.target.closest('button')) return;
                  const el = document.getElementById(`block-input-${idx}`);
                  if (el && document.activeElement !== el) {
                    el.focus();
                  }
                }}
              >
                {/* 슬래시(/) 명령어 드롭다운 팝업 (선택 항목 자동 스크롤 추적) */}
                {isSlashMenuTarget && (
                  <div
                    className="absolute left-0 top-full mt-1.5 z-50 w-72 max-h-64 overflow-y-auto rounded-xl shadow-2xl p-1.5 border animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.12)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider opacity-40 select-none">
                      기본 블록
                    </div>
                    {filteredCommands.length > 0 ? (
                      filteredCommands.map((cmd, cIdx) => {
                        const Icon = cmd.icon;
                        const isSelected = cIdx === slashMenu.selectedIndex;
                        return (
                          <button
                            key={cmd.id}
                            id={`slash-cmd-${cIdx}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              executeSlashCommand(cmd.id, idx);
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition select-none cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                            style={{
                              color: isSelected ? '#ffffff' : 'var(--text-primary)'
                            }}
                          >
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'border-white/20 bg-white/10 text-white'
                                  : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-80'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold leading-tight truncate">
                                {cmd.label}
                              </div>
                              <div
                                className={`text-[10px] leading-tight truncate mt-0.5 ${
                                  isSelected ? 'text-white/80' : 'opacity-50'
                                }`}
                              >
                                {cmd.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs opacity-50 text-center select-none">
                        일치하는 명령어가 없습니다.
                      </div>
                    )}
                  </div>
                )}

                {/* 할 일 블록 */}
                {block.type === 'todo' && (
                  <div className="flex items-start gap-2.5 py-1 w-full">
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(idx)}
                      className={`mt-0.5 w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        block.checked
                          ? 'bg-blue-600 border border-blue-600 text-white shadow-xs hover:bg-blue-700'
                          : 'border-2 border-gray-400/80 dark:border-gray-500 hover:border-blue-500 hover:bg-blue-500/10'
                      }`}
                      title={block.checked ? '완료 취소' : '완료로 표시'}
                    >
                      {block.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="할 일..."
                        className={`w-full text-[15px] leading-relaxed transition-all ${
                          block.checked ? 'line-through opacity-45 text-gray-500 dark:text-gray-400' : ''
                        }`}
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 제목 1 블록 */}
                {block.type === 'h1' && (
                  <div className="flex items-start gap-2 pt-3 pb-1 w-full">
                    <span className="text-[11px] font-mono font-bold opacity-30 select-none mt-2.5 w-4 shrink-0">H1</span>
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="제목 1"
                        className="w-full text-2xl font-bold leading-snug"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 제목 2 블록 */}
                {block.type === 'h2' && (
                  <div className="flex items-start gap-2 pt-2.5 pb-0.5 w-full">
                    <span className="text-[11px] font-mono font-bold opacity-30 select-none mt-1.5 w-4 shrink-0">H2</span>
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="제목 2"
                        className="w-full text-xl font-bold leading-snug"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 제목 3 블록 */}
                {block.type === 'h3' && (
                  <div className="flex items-start gap-2 pt-2 pb-0.5 w-full">
                    <span className="text-[11px] font-mono font-bold opacity-30 select-none mt-1 w-4 shrink-0">H3</span>
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="제목 3"
                        className="w-full text-lg font-semibold leading-snug"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 글머리 기호 목록 블록 */}
                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2.5 py-1 w-full">
                    <span className="w-4 h-6 flex items-center justify-center shrink-0 select-none opacity-60 text-lg leading-none">
                      •
                    </span>
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="목록 항목..."
                        className="w-full text-[15px] leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 인용구 블록 */}
                {block.type === 'quote' && (
                  <div className="flex items-start gap-3 py-1 w-full pl-3.5 border-l-4 border-blue-500/60 my-1 bg-blue-500/5 rounded-r">
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder="인용구..."
                        className="w-full text-[15px] leading-relaxed italic opacity-90"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}

                {/* 코드 블록 (``` 기호 숨김 및 깔끔한 코드 카드 에디터) */}
                {block.type === 'code' && (
                  <div className="py-2 w-full font-mono text-sm">
                    <div className="rounded-xl border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-black/40 overflow-hidden shadow-2xs transition-colors focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/30">
                      {/* 코드 본문 (``` 백틱 기호 없이 순수 코드만 편집) */}
                      <div className="p-3.5">
                        <AutoResizeTextarea
                          id={`block-input-${idx}`}
                          value={block.text}
                          onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            // 코드 블록 내부에서 Tab 키 입력 시 2칸 들여쓰기 지원
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const el = e.target;
                              const start = el.selectionStart;
                              const end = el.selectionEnd;
                              const val = block.text || '';
                              const newText = val.substring(0, start) + '  ' + val.substring(end);
                              handleBlockTextChange(idx, newText);
                              setTimeout(() => {
                                el.selectionStart = el.selectionEnd = start + 2;
                              }, 0);
                              return;
                            }
                            // 빈 코드 블록에서 백스페이스 누르면 삭제
                            if (e.key === 'Backspace' && (!block.text || block.text === '')) {
                              handleBlockKeyDown(e, idx);
                              return;
                            }
                            // 코드 블록 내부에서 Enter는 개행 유지
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.stopPropagation();
                            }
                          }}
                          onFocus={() => {
                            setActiveBlockIndex(idx);
                            if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                              setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                            }
                          }}
                          placeholder="여기에 코드를 입력하세요... (Tab 들여쓰기 지원)"
                          className="w-full text-xs font-mono leading-relaxed"
                          style={{
                            color: 'var(--text-primary)',
                            tabSize: 2
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 일반 텍스트 블록 */}
                {block.type === 'text' && (
                  <div className="flex items-start py-0.5 w-full">
                    <div className="flex-1 min-w-0">
                      <AutoResizeTextarea
                        id={`block-input-${idx}`}
                        value={block.text}
                        onChange={(e) => handleBlockTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                        onFocus={() => {
                          setActiveBlockIndex(idx);
                          if (slashMenu.isOpen && slashMenu.blockIndex !== idx) {
                            setSlashMenu({ isOpen: false, blockIndex: null, query: '', selectedIndex: 0 });
                          }
                        }}
                        onPaste={(e) => handleBlockPaste(e, idx)}
                        placeholder={idx === 0 ? "자유롭게 생각을 적어보세요... ('/' 입력 시 명령어 메뉴)" : ""}
                        className="w-full text-[15px] leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 태그 관리 바 */}
      <div
        className="border-t p-3 px-8 flex flex-col gap-2 shrink-0 transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* 태그 목록 & 추가 인풋 */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
          <div className="flex items-center gap-1.5 text-xs opacity-60 mr-1 shrink-0">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">태그</span>
          </div>

          {tags.map((t) => (
            <span
              key={t}
              className="group inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium transition"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}
            >
              <span>#{t}</span>
              <button
                onClick={() => handleRemoveTag(t)}
                className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 opacity-50 group-hover:opacity-100 transition cursor-pointer"
                title="태그 삭제"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {/* 새 태그 입력 인풋 */}
          <div className="inline-flex items-center">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  if (tagInput.trim()) {
                    handleAddTag(tagInput);
                    setTagInput('');
                  }
                }
              }}
              placeholder="+ 태그 입력 (Enter)..."
              className="text-xs px-2.5 py-1 rounded-md outline-none border border-dashed hover:border-solid focus:border-solid border-black/20 dark:border-white/20 focus:border-blue-500 bg-transparent transition w-36 focus:w-44"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* 현재 마인드맵 추천 태그 */}
        {availableTags.filter(t => !tags.includes(t)).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-dashed" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-[11px] opacity-50 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              마인드맵 추천:
            </span>
            {availableTags
              .filter(t => !tags.includes(t))
              .map((t) => (
                <button
                  key={t}
                  onClick={() => handleAddTag(t)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 opacity-70 hover:opacity-100 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-500/5 transition cursor-pointer"
                  title="클릭하여 태그 추가"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>#{t}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </aside>
  );
}
