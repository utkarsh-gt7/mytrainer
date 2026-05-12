import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

/**
 * Page banner — the colored gradient hero that gives each section its
 * identity. Sits at the top of every routed page so the user always
 * knows where they are without reading the URL.
 *
 *   workout      iron red               (training / strength)
 *   nutrition    leaf green             (meals / macros)
 *   metrics      blueprint blue         (body composition)
 *   progress     trophy gold            (PRs / charts)
 *   dashboard    red → orange → gold    (welcome / overview)
 *   plan         charcoal               (weekly plan)
 *   library      graphite               (exercise library)
 *   archive      charcoal               (workout history)
 *   settings     charcoal               (personal setup)
 *
 * Layout (left-to-right):
 *   - White-tinted icon badge
 *   - Uppercase eyebrow + stamped-steel display title + subtitle
 *   - Optional `children` action slot, right-aligned on desktop
 */

export type PageTheme =
  | 'workout'
  | 'nutrition'
  | 'metrics'
  | 'progress'
  | 'plan'
  | 'library'
  | 'archive'
  | 'dashboard'
  | 'settings';

const themeBg: Record<PageTheme, string> = {
  workout: 'bg-hero-workout',
  nutrition: 'bg-hero-nutrition',
  metrics: 'bg-hero-metrics',
  progress: 'bg-hero-progress',
  dashboard: 'bg-hero-dashboard',
  plan: 'bg-hero-plan',
  library: 'bg-hero-library',
  archive: 'bg-hero-archive',
  settings: 'bg-hero-settings',
};

const themeGlow: Record<PageTheme, string> = {
  workout: 'shadow-glow-workout',
  nutrition: 'shadow-glow-nutrition',
  metrics: 'shadow-glow-metrics',
  progress: 'shadow-glow-gold',
  dashboard: 'shadow-glow-flame',
  plan: 'shadow-glow-iron',
  library: 'shadow-glow-iron',
  archive: 'shadow-glow-iron',
  settings: 'shadow-glow-iron',
};

interface PageHeaderProps {
  /** Page identity — drives gradient + glow. Defaults to `workout`. */
  theme?: PageTheme;
  /** Optional lucide icon shown in the white-tinted badge. */
  icon?: LucideIcon;
  /** Uppercase label rendered above the title. */
  eyebrow?: string;
  /** Banner title (rendered in Oswald display font). */
  title: string;
  /** Optional one-line subtitle below the title. */
  subtitle?: string;
  /** Right-aligned action slot — typically Buttons / Badges. */
  children?: React.ReactNode;
  /** Compact mode tightens spacing for stacked headers. */
  compact?: boolean;
  className?: string;
}

export default function PageHeader({
  theme = 'workout',
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
        'relative overflow-hidden rounded-xl border border-white/10 text-white',
        themeBg[theme],
        themeGlow[theme],
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-7',
        className,
      )}
    >
      {/* Subtle grid texture — pulls the gradient out of "flat colour" */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-iron opacity-40 pointer-events-none"
        style={{ backgroundSize: '28px 28px' }}
      />
      {/* Soft radial highlight in the top-right corner */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center',
                compact ? 'w-11 h-11' : 'w-12 h-12 sm:w-14 sm:h-14',
              )}
            >
              <Icon
                className="text-white"
                size={compact ? 20 : 24}
                strokeWidth={2.25}
              />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                'font-display font-bold uppercase tracking-wide text-white leading-tight truncate',
                compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl',
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-white/80 mt-1 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:justify-end">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
