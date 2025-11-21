import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">应用遇到了一点问题</h2>
            <p className="text-gray-500 mb-6 text-sm">
              为了保护您的数据，我们暂停了运行。这通常是因为数据冲突或网络波动引起的。
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} />
                重新加载
              </button>
              <button 
                onClick={this.handleClearCache}
                className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                清除缓存并重置 (如果重载无效)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}