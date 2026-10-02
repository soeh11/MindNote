import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Coffee, FolderOpen, Info, Palette, RefreshCw, DownloadCloud, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function SettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onOpenFolder,
  onOpenMapsFolder
}) {
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [updaterState, setUpdaterState] = useState({
    status: 'idle', // 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | 'dev-mode'
    message: '',
    percent: 0,
    newVersion: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [dataPaths, setDataPaths] = useState({
    notesDir: 'C:\\MM\\data\\notes',
    mapsDir: 'C:\\MM\\data\\maps'
  });

  useEffect(() => {
    if (isOpen) {
      api.getAppVersion().then(v => setAppVersion(v || '1.0.0'));
      api.getDataPaths().then(p => {
        if (p) setDataPaths(p);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = api.onUpdateStatus((data) => {
      if (!data) return;
      if (data.status === 'checking') {
        setUpdaterState(prev => ({ ...prev, status: 'checking', message: data.message || '업데이트 확인 중...' }));
      } else if (data.status === 'available') {
        setUpdaterState(prev => ({
          ...prev,
          status: 'available',
          newVersion: data.version,
          message: data.message || `새 버전(v${data.version}) 다운로드 중...`
        }));
      } else if (data.status === 'not-available') {
        setIsChecking(false);
        setUpdaterState(prev => ({
          ...prev,
          status: 'not-available',
          message: '현재 최신 버전을 사용하고 있습니다.'
        }));
      } else if (data.status === 'downloading') {
        setUpdaterState(prev => ({
          ...prev,
          status: 'downloading',
          percent: data.percent || 0,
          message: data.message || `다운로드 중 (${data.percent}%)`
        }));
      } else if (data.status === 'downloaded') {
        setIsChecking(false);
        setUpdaterState(prev => ({
          ...prev,
          status: 'downloaded',
          newVersion: data.version,
          message: `v${data.version} 다운로드 완료! 재시작하여 바로 적용할 수 있습니다.`
        }));
      } else if (data.status === 'error') {
        setIsChecking(false);
        setUpdaterState(prev => ({
          ...prev,
          status: 'error',
          message: data.message || '업데이트 확인 중 오류가 발생했습니다.'
        }));
      }
    });
    return () => unsub?.();
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setUpdaterState({ status: 'checking', message: '최신 버전 확인 중...', percent: 0, newVersion: '' });
    try {
      const res = await api.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setIsChecking(false);
        setUpdaterState({
          status: 'dev-mode',
          message: '개발 모드 환경입니다. GitHub 릴리즈로 빌드 배포 후 자동 업데이트가 활성화됩니다.'
        });
      }
    } catch (err) {
      setIsChecking(false);
      setUpdaterState({
        status: 'error',
        message: err?.message || '업데이트 서버에 연결할 수 없습니다.'
      });
    }
  };

  const handleRestartToUpdate = () => {
    api.quitAndInstall();
  };

  // ESC 키 누르면 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themes = [
    {
      id: 'light',
      name: '라이트 모드',
      desc: '기본 깔끔한 모던 화이트 스타일',
      icon: Sun,
      bgColor: 'bg-white',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-200'
    },
    {
      id: 'dark',
      name: '다크 모드',
      desc: '눈이 편안한 모던 다크 그레이 스타일',
      icon: Moon,
      bgColor: 'bg-[#191919]',
      textColor: 'text-gray-100',
      borderColor: 'border-gray-700'
    },
    {
      id: 'sepia',
      name: '세피아 모드',
      desc: '따뜻한 종이 질감의 아늑한 스타일',
      icon: Coffee,
      bgColor: 'bg-[#F4EEDD]',
      textColor: 'text-[#433422]',
      borderColor: 'border-[#DCD0B6]'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold">환경 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 테마 설정 섹션 */}
        <div className="py-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-60">
              테마 선택
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme(t.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-gray-200/50 hover:border-gray-300'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--hover-bg)' : 'transparent',
                      borderColor: isSelected ? '#2383E2' : 'var(--border-color)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${t.bgColor} ${t.borderColor}`}>
                        <Icon className={`w-4 h-4 ${t.id === 'dark' ? 'text-amber-400' : t.id === 'sepia' ? 'text-amber-700' : 'text-blue-500'}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs opacity-60">{t.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        적용 중
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 저장 경로 정보 */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">
              데이터 저장 경로 (로컬 파일)
            </h3>
            <div className="space-y-2">
              <div
                className="flex items-center justify-between p-3 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-mono truncate opacity-80" title={dataPaths.notesDir}>
                    메모: {dataPaths.notesDir}
                  </span>
                </div>
                <button
                  onClick={onOpenFolder}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shrink-0 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>메모 폴더</span>
                </button>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-mono truncate opacity-80" title={dataPaths.mapsDir}>
                    마인드맵: {dataPaths.mapsDir}
                  </span>
                </div>
                <button
                  onClick={onOpenMapsFolder}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shrink-0 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>마인드맵 폴더</span>
                </button>
              </div>
            </div>
          </div>

          {/* 소프트웨어 버전 및 자동 업데이트 */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">
              소프트웨어 업데이트
            </h3>
            <div
              className="p-3.5 rounded-xl border space-y-2.5 text-xs"
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <span>MindNote</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      v{appVersion}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-60 mt-0.5">
                    GitHub Releases 기반 자동 업데이트
                  </div>
                </div>

                {updaterState.status === 'downloaded' ? (
                  <button
                    onClick={handleRestartToUpdate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>재시작 후 적용</span>
                  </button>
                ) : (
                  <button
                    onClick={handleManualCheck}
                    disabled={isChecking || updaterState.status === 'downloading'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isChecking || updaterState.status === 'downloading'
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>{isChecking ? '확인 중...' : '업데이트 확인'}</span>
                  </button>
                )}
              </div>

              {/* 다운로드 진행률 바 */}
              {updaterState.status === 'downloading' && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] opacity-80">
                    <span>새 버전 다운로드 중...</span>
                    <span>{updaterState.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${updaterState.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 상태 메시지 배너 */}
              {updaterState.message && updaterState.status !== 'downloading' && (
                <div className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
                  updaterState.status === 'downloaded'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : updaterState.status === 'error'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : updaterState.status === 'not-available'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                  {updaterState.status === 'downloaded' ? (
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : updaterState.status === 'error' ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : updaterState.status === 'not-available' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{updaterState.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
