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
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/today', icon: Dumbbell, label: "Today's Workout" },
  { to: '/plan', icon: CalendarDays, label: 'Weekly Plan' },
  { to: '/exercises', icon: Library, label: 'Exercise Library' },
  { to: '/metrics', icon: Scale, label: 'Body Metrics' },
  { to: '/nutrition', icon: Utensils, label: 'Calorie Tracker' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const bottomTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/today', icon: Dumbbell, label: 'Workout' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/more', icon: MoreHorizontal, label: 'More' },
];

const moreItems = [
  { to: '/plan', icon: CalendarDays, label: 'Weekly Plan' },
  { to: '/exercises', icon: Library, label: 'Exercise Library' },
  { to: '/metrics', icon: Scale, label: 'Body Metrics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { darkMode, streak } = useAppStore();

  const isMoreActive = moreItems.some((item) => item.to === location.pathname);

  const navAccent: Record<string, { active: string; icon: string }> = {
    '/': { active: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border-primary-200 dark:border-primary-900/60', icon: 'text-primary-500' },
    '/today': { active: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border-primary-200 dark:border-primary-900/60', icon: 'text-primary-500' },
    '/plan': { active: 'bg-iron-100 dark:bg-iron-900/60 text-iron-900 dark:text-white border-iron-300 dark:border-iron-700', icon: 'text-iron-600 dark:text-iron-200' },
    '/exercises': { active: 'bg-iron-100 dark:bg-iron-900/60 text-iron-900 dark:text-white border-iron-300 dark:border-iron-700', icon: 'text-iron-600 dark:text-iron-200' },
    '/metrics': { active: 'bg-metrics-50 dark:bg-metrics-900/30 text-metrics-700 dark:text-metrics-300 border-metrics-200 dark:border-metrics-900/60', icon: 'text-metrics-500' },
    '/nutrition': { active: 'bg-nutrition-50 dark:bg-nutrition-900/30 text-nutrition-700 dark:text-nutrition-300 border-nutrition-200 dark:border-nutrition-900/60', icon: 'text-nutrition-500' },
    '/progress': { active: 'bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300 border-gold-200 dark:border-gold-900/60', icon: 'text-gold-500' },
    '/settings': { active: 'bg-iron-100 dark:bg-iron-900/60 text-iron-900 dark:text-white border-iron-300 dark:border-iron-700', icon: 'text-iron-500' },
  };
  const defaultAccent = navAccent['/'];

  return (
    <div className={cn('min-h-screen bg-iron-50 dark:bg-iron-950 transition-colors', darkMode && 'dark')}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-iron-950/90 backdrop-blur-md border-b border-iron-200 dark:border-iron-800 px-4 h-14 flex items-center justify-between safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-flame-500 flex items-center justify-center shadow-glow-primary">
            <Dumbbell className="text-white" size={16} strokeWidth={2.5} />
          </div>
          <span className="font-display uppercase tracking-wide font-bold text-lg dark:text-white">FitTracker</span>
        </div>
        {streak.current > 0 && (
          <div className="flex items-center gap-1 text-flame-500">
            <Flame size={16} className="touch-target-sm" />
            <span className="text-sm font-bold tabular-nums">{streak.current}</span>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-iron-950 border-r border-iron-200 dark:border-iron-800 transform transition-transform duration-200 ease-in-out',
          'hidden lg:block lg:translate-x-0',
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-flame-500 flex items-center justify-center shadow-glow-primary">
            <Dumbbell className="text-white" size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display uppercase tracking-wide font-bold text-lg dark:text-white leading-none">FitTracker</h1>
            <p className="text-[11px] uppercase tracking-wider text-iron-500 dark:text-iron-400 mt-1">Body Recomp Plan</p>
          </div>
        </div>

        {streak.current > 0 && (
          <div className="mx-4 mb-4 px-4 py-2 rounded-lg bg-flame-50 dark:bg-flame-900/20 border border-flame-200 dark:border-flame-900/50">
            <div className="flex items-center gap-2 text-flame-600 dark:text-flame-300">
              <Flame size={16} />
              <span className="text-sm font-display uppercase tracking-wider font-bold">{streak.current} day streak</span>
            </div>
            <p className="text-xs text-flame-500/80 dark:text-flame-400/70 mt-0.5 font-mono tabular-nums">
              Best: {streak.longest} days
            </p>
          </div>
        )}

        <nav className="px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const accent = navAccent[to] ?? defaultAccent;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border',
                    isActive || (to === '/' && location.pathname === '/')
                      ? accent.active
                      : 'border-transparent text-iron-600 dark:text-iron-300 hover:bg-iron-100 dark:hover:bg-iron-900 hover:text-iron-900 dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? accent.icon : ''} />
                    {label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile "More" Sheet */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden animate-slide-up">
            <div className="mx-3 mb-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-5 py-4 text-sm font-medium border-b border-gray-100 dark:border-gray-800 last:border-0',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-800',
                    )
                  }
                >
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-iron-950/90 backdrop-blur-md border-t border-iron-200 dark:border-iron-800 safe-bottom">
        <div className="flex items-stretch justify-around h-16">
          {bottomTabs.map(({ to, icon: Icon, label }) => {
            if (to === '/more') {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-display uppercase tracking-wider font-bold transition-colors',
                    isMoreActive || moreOpen
                      ? 'text-iron-900 dark:text-white'
                      : 'text-iron-400 dark:text-iron-500',
                  )}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </button>
              );
            }
            const accent = navAccent[to] ?? defaultAccent;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-display uppercase tracking-wider font-bold transition-colors',
                    isActive
                      ? accent.icon
                      : 'text-iron-400 dark:text-iron-500 active:text-iron-600',
                  )
                }
              >
                <Icon size={22} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Content — padded for mobile header + bottom nav */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
