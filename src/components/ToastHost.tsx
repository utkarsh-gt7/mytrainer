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

/**
 * Toast skin per kind — neutral surface with a 4px coloured left bar
 * for affordance instead of a tinted background. Keeps toasts legible
 * on either theme without recolouring text.
 */
const KIND_STYLES: Record<Notification['kind'], string> = {
  info: 'border-l-info',
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-danger',
};

const KIND_ICON: Record<Notification['kind'], string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
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
              'pointer-events-auto rounded-md border border-line border-l-4 bg-surface text-fg px-4 py-3 shadow-md animate-slide-up',
              KIND_STYLES[n.kind],
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className={cn('flex-shrink-0 mt-0.5', KIND_ICON[n.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{n.title}</p>
                {n.description && (
                  <p className="text-xs mt-1 text-fg-muted break-words">{n.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded text-fg-muted hover:text-fg hover:bg-surface-2 touch-target-sm"
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
