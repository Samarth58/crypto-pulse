import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Something went wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe. Please try refreshing the page.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <RefreshCw size={18} />
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Try again
              </button>
            </div>
            {import.meta.env.DEV && (
              <div className="mt-8 text-left p-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto max-h-40">
                <p className="text-xs font-mono text-rose-500">{this.state.error?.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
