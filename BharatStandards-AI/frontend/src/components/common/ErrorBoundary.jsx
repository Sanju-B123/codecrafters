import React from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Antigravity React ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 text-center">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 text-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Temporary Interface Notice
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                An unexpected component condition occurred while loading this view. You can reload the section or navigate back to the main console.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left font-mono text-[11px] text-slate-600 overflow-x-auto">
                <span className="font-bold text-rose-600">Notice:</span> {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-bharat-900 hover:bg-bharat-800 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                Reload Page
              </button>

              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                Console
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
