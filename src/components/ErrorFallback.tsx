import { AlertTriangle, RefreshCw, CloudOff } from 'lucide-react';

interface ErrorFallbackProps {
  title: string;
  message: string;
  showReload?: boolean;
  /** Optional in-app retry that doesn't do a full reload. */
  onReset?: () => void;
}

export default function ErrorFallback({ title, message, showReload = true, onReset }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
          <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 break-words">{message}</p>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 text-left mb-6">
          <div className="flex items-start gap-3">
            <CloudOff className="h-5 w-5 text-primary-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Cloud-only mode is enabled</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This app requires a working Firebase configuration and Firestore access to load your data.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-iron-200 dark:bg-iron-800 px-4 py-2 text-sm font-medium text-iron-900 dark:text-white hover:bg-iron-300 dark:hover:bg-iron-700"
            >
              Try again
            </button>
          )}
          {showReload && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 active:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
