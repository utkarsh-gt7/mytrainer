import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Short label used in the fallback UI (e.g. "Today's Workout"). */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Page-scoped error boundary. A crash inside a single page shows a friendly
 * inline fallback without breaking the sidebar, bottom nav, or the rest of
 * the shell. The user can retry without a full page reload.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a breadcrumb in the console for diagnostics.
    // We intentionally don't throw further — the sibling shell must keep running.
    console.error('Route render failed:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label } = this.props;
    const { error } = this.state;

    return (
      <div className="animate-fade-in">
        <div className="rounded-2xl border border-primary-200 dark:border-primary-900/60 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-iron-900/60 p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/15 border border-primary-500/30">
            <AlertTriangle className="h-7 w-7 text-primary-600 dark:text-primary-300" />
          </div>
          <h2 className="font-display uppercase tracking-wide text-2xl font-bold text-iron-900 dark:text-white mb-2">
            {label ? `This ${label} page hit a snag` : 'This page hit a snag'}
          </h2>
          <p className="text-sm text-iron-600 dark:text-iron-300 mb-5 max-w-md mx-auto">
            Nothing else in the app is affected — you can retry the page or jump somewhere else from the navigation.
          </p>
          {error?.message && (
            <p className="text-xs font-mono text-iron-500 dark:text-iron-400 mb-5 break-all">
              {error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-primary"
            >
              <RefreshCw size={16} /> Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-iron-200 dark:bg-iron-800 hover:bg-iron-300 dark:hover:bg-iron-700 px-4 py-2 text-sm font-semibold text-iron-900 dark:text-white"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
