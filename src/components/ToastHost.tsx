import { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { subscribe, dismiss, type Notification } from '@/services/notifier';
import { cn } from '@/utils/cn';

const ICONS: Record<Notification['kind'], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const KIND_STYLES: Record<Notification['kind'], string> = {
  info: 'border-metrics-300 dark:border-metrics-900/60 bg-metrics-50 dark:bg-metrics-900/30 text-metrics-700 dark:text-metrics-200',
  success: 'border-nutrition-300 dark:border-nutrition-900/60 bg-nutrition-50 dark:bg-nutrition-900/30 text-nutrition-700 dark:text-nutrition-200',
  warning: 'border-gold-300 dark:border-gold-900/60 bg-gold-50 dark:bg-gold-900/30 text-gold-800 dark:text-gold-200',
  error: 'border-primary-300 dark:border-primary-900/60 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200',
};

export default function ToastHost() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed z-[100] top-16 lg:top-4 right-3 sm:right-4 flex flex-col gap-2 w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-sm"
    >
      {items.map((n) => {
        const Icon = ICONS[n.kind];
        return (
          <div
            key={n.id}
            role="status"
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 shadow-iron backdrop-blur-md animate-slide-up',
              KIND_STYLES[n.kind],
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className="flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{n.title}</p>
                {n.description && (
                  <p className="text-xs mt-1 opacity-80 break-words">{n.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
