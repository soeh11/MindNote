import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MindNote Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#FBFBFA] text-[#37352F] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold mb-4">
            ⚠️
          </div>
          <h1 className="text-xl font-bold mb-2">화면을 불러오는 중 문제가 발생했습니다</h1>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition"
            >
              캐시 초기화 후 재시작
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
