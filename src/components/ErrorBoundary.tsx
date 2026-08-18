import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CineFlow AI Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    (this as unknown as React.Component<Props, State>).setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    const componentThis = this as unknown as React.Component<Props, State>;
    if (componentThis.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h2 className="text-xl font-bold">Application Notice</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              CineFlow AI encountered an unexpected interface issue. Your local production data remains preserved and safely stored.
            </p>
            {componentThis.state.error && (
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-red-300 overflow-x-auto max-h-32">
                {componentThis.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return componentThis.props.children;
  }
}
