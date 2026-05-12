import { AlertTriangle, RefreshCw, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorFallbackProps {
  title: string;
  message: string;
  showReload?: boolean;
  /** Optional in-app retry that doesn't do a full reload. */
  onReset?: () => void;
}

/**
 * Full-screen fallback shown for fatal startup failures (missing
 * Firebase config, hydration error). Uses the new design tokens and
 * the shared Button primitive so the look stays consistent with the
 * rest of the app.
 */
export default function ErrorFallback({ title, message, showReload = true, onReset }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 sm:p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-danger-100 dark:bg-danger-700/20">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <h1 className="text-lg font-semibold text-fg mb-2 tracking-tight">{title}</h1>
        <p className="text-sm text-fg-muted mb-6 break-words">{message}</p>

        <div className="rounded-lg border border-line bg-surface-2 p-4 text-left mb-6">
          <div className="flex items-start gap-3">
            <CloudOff className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-fg">Cloud-only mode is enabled</p>
              <p className="text-sm text-fg-muted mt-1">
                This app requires a working Firebase configuration and Firestore access to load your data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {onReset && (
            <Button variant="secondary" onClick={onReset}>
              Try again
            </Button>
          )}
          {showReload && (
            <Button variant="primary" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Reload app
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
