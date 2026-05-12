import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Modal — accessible centered dialog backed by the native `<dialog>`
 * element where supported, with a div fallback for SSR / older
 * runtimes. Closes on Escape, backdrop click, or the X icon.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Set width preset; defaults to `md`. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional footer slot (typically action buttons). */
  footer?: ReactNode;
  children: ReactNode;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      onMouseDown={(e) => {
        // Close when clicking the backdrop, not on inner content.
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={cn(
          'relative w-full bg-surface border border-line rounded-t-xl sm:rounded-xl shadow-lg flex flex-col max-h-[90vh] animate-slide-up',
          sizes[size],
        )}
      >
        {/* Header */}
        {(title || description) && (
          <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-line">
            <div className="min-w-0">
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-fg tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-sm text-fg-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="touch-target-sm -mr-1 -mt-1 p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors focus-ring"
            >
              <X size={18} />
            </button>
          </header>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="px-5 py-3 border-t border-line flex items-center justify-end gap-2 bg-surface-2/40 rounded-b-xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
