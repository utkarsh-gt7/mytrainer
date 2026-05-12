import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * StatTile — a single compact metric card.
 *
 * Replaces the per-color gradient StatCards from the old design. The
 * surface stays neutral; the icon carries the meaning via colour.
 */
export interface StatTileProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  /** Optional icon tint when emphasis is desired. */
  tone?: 'fg' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const toneIcon: Record<NonNullable<StatTileProps['tone']>, string> = {
  fg: 'text-fg-muted',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

export default function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'fg',
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-line rounded-lg p-3 sm:p-4 flex flex-col gap-1',
        className,
      )}
    >
      <div className="flex items-center justify-between text-fg-muted">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          {label}
        </span>
        {Icon && <Icon size={16} className={toneIcon[tone]} strokeWidth={2} />}
      </div>
      <p className="text-2xl font-semibold text-fg tabular-nums leading-tight">
        {value}
      </p>
      {hint && <p className="text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
