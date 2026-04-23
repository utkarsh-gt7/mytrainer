import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

export type PageTheme =
  | 'workout'
  | 'nutrition'
  | 'metrics'
  | 'progress'
  | 'plan'
  | 'library'
  | 'dashboard'
  | 'settings';

const themeBg: Record<PageTheme, string> = {
  workout: 'bg-hero-workout',
  nutrition: 'bg-hero-nutrition',
  metrics: 'bg-hero-metrics',
  progress: 'bg-hero-progress',
  plan: 'bg-hero-plan',
  library: 'bg-hero-library',
  dashboard: 'bg-hero-dashboard',
  settings: 'bg-hero-settings',
};

const themeGlow: Record<PageTheme, string> = {
  workout: 'shadow-glow-primary',
  nutrition: 'shadow-glow-nutrition',
  metrics: 'shadow-glow-metrics',
  progress: 'shadow-glow-gold',
  plan: 'shadow-iron',
  library: 'shadow-iron',
  dashboard: 'shadow-glow-primary',
  settings: 'shadow-iron',
};

interface PageHeaderProps {
  theme: PageTheme;
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export default function PageHeader({
  theme,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
  compact = false,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 text-white',
        themeBg[theme],
        themeGlow[theme],
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-8',
        className,
      )}
    >
      {/* subtle grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-iron opacity-40 pointer-events-none"
        style={{ backgroundSize: '28px 28px' }}
      />
      {/* decorative radial glow */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Icon className="text-white" size={compact ? 22 : 26} strokeWidth={2.25} />
          </div>
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
              <p className="text-sm sm:text-base text-white/80 mt-1 max-w-xl">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-2 sm:justify-end">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
