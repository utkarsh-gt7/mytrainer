import { cn } from '@/utils/cn';

/**
 * Progress bar — a single slim, accent-coloured fill.
 *
 * The optional `tone` switches the fill colour for semantic meaning
 * (e.g. amber when over-budget, emerald when on-target).
 */
export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export default function Progress({
  value,
  max = 100,
  tone = 'accent',
  className,
}: {
  value: number;
  max?: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-1.5 w-full rounded-full bg-surface-2 overflow-hidden', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300 ease-out-quart', toneClasses[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
