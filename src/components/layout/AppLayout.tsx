import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  LayoutDashboard,
  CalendarDays,
  Library,
  Scale,
  Utensils,
  TrendingUp,
  Settings,
  Flame,
  MoreHorizontal,
  Archive,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Short label used in the mobile bottom tab bar. */
  short?: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', short: 'Home' },
  { to: '/today', icon: Dumbbell, label: "Today's Workout", short: 'Workout' },
  { to: '/plan', icon: CalendarDays, label: 'Weekly Plan' },
  { to: '/exercises', icon: Library, label: 'Exercise Library' },
  { to: '/metrics', icon: Scale, label: 'Body Metrics' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition', short: 'Nutrition' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', short: 'Progress' },
  { to: '/archive', icon: Archive, label: 'Workout Archive' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const bottomTabs = navItems.filter((item) => item.short);
const moreItems = navItems.filter((item) => !item.short && item.to !== '/');

/**
 * AppLayout — the application shell.
 *
 * Desktop: a fixed 256px sidebar holds the brand mark, a streak chip,
 * and the full nav. Mobile: a slim header on top, a 5-slot bottom tab
 * bar, and a slide-up sheet for items that don't fit in the tabs.
 *
 * All chrome uses the new design tokens (canvas / surface / line / fg
 * / accent) so light/dark mode flips with the root `.dark` class only.
 */
export default function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { darkMode, streak } = useAppStore();

  const isMoreActive = moreItems.some((item) => item.to === location.pathname);

  return (
    <div className={cn('min-h-screen bg-canvas text-fg', darkMode && 'dark')}>
      {/* ─── Mobile Top Bar ──────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur border-b border-line px-4 h-14 flex items-center justify-between safe-top">
        <BrandMark size="sm" />
        {streak.current > 0 && <StreakBadge value={streak.current} compact />}
      </header>

      {/* ─── Desktop Sidebar ────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-surface border-r border-line',
          'hidden lg:flex lg:flex-col',
        )}
      >
        <div className="px-5 py-5">
          <BrandMark />
        </div>

        {streak.current > 0 && (
          <div className="mx-3 mb-3">
            <StreakCard current={streak.current} longest={streak.longest} />
          </div>
        )}

        <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 h-9 rounded-md text-sm font-medium transition-colors focus-ring',
                  isActive
                    ? 'bg-surface-2 text-fg'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={isActive ? 'text-accent' : 'text-fg-subtle'}
                  />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-line">
          <p className="text-xs text-fg-subtle">FitTracker · v1</p>
        </div>
      </aside>

      {/* ─── Mobile "More" Sheet ─────────────────────────────────── */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden animate-slide-up">
            <div className="mx-3 mb-2 bg-surface rounded-lg border border-line shadow-lg overflow-hidden">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b border-line last:border-0 transition-colors',
                      isActive
                        ? 'text-accent bg-accent-50 dark:bg-accent-950/30'
                        : 'text-fg active:bg-surface-2',
                    )
                  }
                >
                  <Icon size={18} className="text-fg-muted" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile Bottom Tab Bar ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/80 backdrop-blur border-t border-line safe-bottom">
        <div className="flex items-stretch justify-around h-16">
          {bottomTabs.map(({ to, icon: Icon, short }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-fg-subtle hover:text-fg',
                )
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span>{short}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors',
              isMoreActive || moreOpen ? 'text-accent' : 'text-fg-subtle hover:text-fg',
            )}
            aria-label="More navigation items"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** Brand mark — small accent square + wordmark. */
function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 14 : 16;
  const squareSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={cn('rounded-md bg-accent text-white flex items-center justify-center flex-shrink-0', squareSize)}>
        <Dumbbell size={iconSize} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <h1 className="font-semibold text-fg leading-none tracking-tight">
          FitTracker
        </h1>
        {size === 'md' && (
          <p className="text-xs text-fg-subtle mt-1">Body recomp companion</p>
        )}
      </div>
    </div>
  );
}

/** Slim streak indicator for the mobile top bar. */
function StreakBadge({ value, compact }: { value: number; compact?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 border border-line text-fg',
        compact ? 'text-xs' : 'text-sm',
      )}
    >
      <Flame size={14} className="text-accent touch-target-sm" />
      <span className="tabular-nums font-semibold">{value}</span>
    </div>
  );
}

/** Streak card for the desktop sidebar. */
function StreakCard({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="px-3 py-2.5 rounded-md bg-surface-2 border border-line">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-fg">
          <Flame size={14} className="text-accent" />
          <span className="text-sm font-semibold tabular-nums">{current}</span>
          <span className="text-xs text-fg-muted">day streak</span>
        </div>
      </div>
      <p className="text-xs text-fg-subtle mt-1 tabular-nums">Best: {longest}</p>
    </div>
  );
}
