import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

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
        <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 text-center max-w-lg mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-danger-100 dark:bg-danger-700/20">
            <AlertTriangle className="h-6 w-6 text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-fg tracking-tight mb-2">
            {label ? `This ${label} page hit a snag` : 'This page hit a snag'}
          </h2>
          <p className="text-sm text-fg-muted mb-5">
            Nothing else in the app is affected — retry the page or jump somewhere else from the navigation.
          </p>
          {error?.message && (
            <p className="text-xs font-mono text-fg-subtle mb-5 break-all bg-surface-2 px-3 py-2 rounded-md">
              {error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button variant="primary" onClick={this.handleRetry}>
              <RefreshCw size={14} /> Try again
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
