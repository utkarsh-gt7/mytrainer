import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

/**
 * Page header — the calm replacement for the old gradient hero panels.
 *
 * Layout:
 *   - Tiny `eyebrow` label (uppercase, fg-subtle)
 *   - Page title (h1, semibold, no caps)
 *   - Optional one-line subtitle (fg-muted)
 *   - Optional trailing action slot, right-aligned on desktop
 *
 * The icon is now subtle (fg-muted on a surface-2 square) so it
 * complements rather than dominates the title.
 */

/**
 * `PageTheme` is retained as a public prop so callers don't have to
 * change their imports, but it no longer drives visual chrome — the
 * header is now identical across themes. Future variants (e.g. a
 * compact tinted icon background) can hook into this if needed.
 */
export type PageTheme =
  | 'workout'
  | 'nutrition'
  | 'metrics'
  | 'progress'
  | 'plan'
  | 'library'
  | 'dashboard'
  | 'settings';

interface PageHeaderProps {
  /** Kept for backwards compatibility — currently unused visually. */
  theme?: PageTheme;
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Compact mode tightens spacing for nested or stacked headers. */
  compact?: boolean;
  className?: string;
}

export default function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
  compact = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4',
        compact ? 'pb-3' : 'pb-4 sm:pb-5',
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-surface-2 border border-line flex items-center justify-center">
            <Icon className="text-fg-muted" size={18} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              'font-semibold text-fg leading-tight tracking-tight truncate',
              compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl',
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-fg-muted mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:justify-end">
          {children}
        </div>
      )}
    </header>
  );
}
