import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

/**
 * Compact label for status, tags, focus indicators.
 *
 * Tones map to semantic colours (success / warning / danger / info)
 * plus a neutral fallback used for category tags.
 */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'solid' | 'soft' | 'outline';

const tones: Record<BadgeTone, Record<BadgeVariant, string>> = {
  neutral: {
    solid: 'bg-fg text-canvas',
    soft: 'bg-surface-2 text-fg',
    outline: 'border border-line text-fg',
  },
  accent: {
    solid: 'bg-accent text-white',
    soft: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    outline: 'border border-accent text-accent-700 dark:text-accent-400',
  },
  success: {
    solid: 'bg-success text-white',
    soft: 'bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-500',
    outline: 'border border-success text-success-700 dark:text-success-500',
  },
  warning: {
    solid: 'bg-warning text-white',
    soft: 'bg-warning-100 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500',
    outline: 'border border-warning text-warning-700 dark:text-warning-500',
  },
  danger: {
    solid: 'bg-danger text-white',
    soft: 'bg-danger-100 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500',
    outline: 'border border-danger text-danger-700 dark:text-danger-500',
  },
  info: {
    solid: 'bg-info text-white',
    soft: 'bg-info-100 text-info-700 dark:bg-info-700/20 dark:text-info-500',
    outline: 'border border-info text-info-700 dark:text-info-500',
  },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
}

export default function Badge({
  tone = 'neutral',
  variant = 'soft',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tabular-nums',
        tones[tone][variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
