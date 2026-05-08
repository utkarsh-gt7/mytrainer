import { useEffect, useMemo } from 'react';
import { History, Trophy, X, TrendingUp, Target, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import {
  computeOverloadSuggestion,
  findPreviousSession,
  getRecentSessions,
  type OverloadStrategy,
} from '@/utils/exerciseHistory';
import { cn } from '@/utils/cn';

interface PreviousLogsModalProps {
  exerciseId: string;
  /** ISO date (YYYY-MM-DD). Defaults to today; sessions on/after are excluded. */
  beforeDate?: string;
  /** Active workout id, so the in-progress session never shadows itself. */
  excludeWorkoutId?: string;
  /** Optional rep target (e.g. "5-8") used to drive the suggestion. */
  targetReps?: string;
  onClose: () => void;
}

const STRATEGY_STYLES: Record<
  OverloadStrategy,
  { label: string; pillClass: string }
> = {
  'increase-weight': {
    label: 'Add weight',
    pillClass:
      'bg-flame-100 text-flame-700 border-flame-300 dark:bg-flame-900/30 dark:text-flame-200 dark:border-flame-900/60',
  },
  'increase-reps': {
    label: 'Push reps',
    pillClass:
      'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-900/60',
  },
  consolidate: {
    label: 'Consolidate',
    pillClass:
      'bg-iron-100 text-iron-700 border-iron-300 dark:bg-iron-800/70 dark:text-iron-200 dark:border-iron-700',
  },
  'first-time': {
    label: 'New lift',
    pillClass:
      'bg-metrics-100 text-metrics-700 border-metrics-300 dark:bg-metrics-900/30 dark:text-metrics-200 dark:border-metrics-900/60',
  },
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatSessionDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PreviousLogsModal({
  exerciseId,
  beforeDate,
  excludeWorkoutId,
  targetReps,
  onClose,
}: PreviousLogsModalProps) {
  const { workoutLogs, personalRecords } = useAppStore();
  const exercise = getExerciseById(exerciseId);

  const lookup = useMemo(
    () => ({ beforeDate, excludeWorkoutId, completedOnly: true }),
    [beforeDate, excludeWorkoutId],
  );

  const previous = useMemo(
    () => findPreviousSession(workoutLogs, exerciseId, lookup),
    [workoutLogs, exerciseId, lookup],
  );
  const recent = useMemo(
    () => getRecentSessions(workoutLogs, exerciseId, 5, lookup),
    [workoutLogs, exerciseId, lookup],
  );
  const pr = useMemo(
    () => personalRecords.find((p) => p.exerciseId === exerciseId),
    [personalRecords, exerciseId],
  );

  const suggestion = useMemo(
    () => computeOverloadSuggestion({ previous, pr, targetReps }),
    [previous, pr, targetReps],
  );

  /* Lock body scroll while the modal is open. */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const strategyStyle = STRATEGY_STYLES[suggestion.strategy];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Previous logs for ${exercise?.name ?? exerciseId}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-iron-900 border border-iron-200/60 dark:border-iron-800 shadow-2xl animate-slide-up"
      >
        {/* Header */}
        <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-iron-900 via-primary-700 to-flame-600 text-white">
          <div
            aria-hidden
            className="absolute inset-0 bg-grid-iron opacity-30 pointer-events-none"
            style={{ backgroundSize: '24px 24px' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <History size={22} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Last Logs
                </p>
                <h2 className="font-display font-bold uppercase tracking-wide text-2xl leading-tight truncate">
                  {exercise?.name ?? 'Exercise'}
                </h2>
                {exercise?.muscleGroups && (
                  <p className="text-xs text-white/80 mt-0.5 capitalize">
                    {exercise.muscleGroups.join(' · ')}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close previous logs"
              className="flex-shrink-0 p-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Suggestion */}
          <div className="rounded-xl border border-primary-200 dark:border-primary-900/60 bg-gradient-to-br from-primary-50 via-white to-flame-50 dark:from-primary-900/30 dark:via-iron-900 dark:to-flame-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-primary-500" />
              <span className="font-display text-xs uppercase tracking-wider font-bold text-primary-700 dark:text-primary-200">
                Smart Overload
              </span>
              <span
                className={cn(
                  'ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold border',
                  strategyStyle.pillClass,
                )}
              >
                {strategyStyle.label}
              </span>
            </div>
            <p className="text-lg font-display font-bold dark:text-white">
              {suggestion.headline}
            </p>
            <p className="text-sm text-iron-600 dark:text-iron-300 mt-1 leading-relaxed">
              {suggestion.rationale}
            </p>
          </div>

          {/* Personal Record */}
          {pr ? (
            <div className="rounded-xl border border-gold-200 dark:border-gold-900/60 bg-gold-50/70 dark:bg-gold-900/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-500 text-white flex items-center justify-center shadow-glow-gold flex-shrink-0">
                <Trophy size={18} strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gold-700 dark:text-gold-300">
                  All-Time PR
                </p>
                <p className="font-mono font-bold text-base text-gold-800 dark:text-gold-100 tabular-nums">
                  {pr.weight} kg × {pr.reps}
                </p>
              </div>
              <p className="text-xs text-iron-500 dark:text-iron-400 flex-shrink-0">
                {formatSessionDate(pr.date)}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-iron-200 dark:border-iron-800 bg-iron-50 dark:bg-iron-900/40 p-4 text-center">
              <Trophy size={18} className="mx-auto text-iron-400 dark:text-iron-500 mb-1" />
              <p className="text-xs text-iron-500 dark:text-iron-400">
                No PR yet — your first solid set will set the benchmark.
              </p>
            </div>
          )}

          {/* Previous session detail */}
          {previous ? (
            <div className="rounded-xl border border-iron-200 dark:border-iron-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-primary-500" />
                  <span className="font-display text-xs uppercase tracking-wider font-bold text-iron-600 dark:text-iron-200">
                    Last Session
                  </span>
                </div>
                <p className="text-xs text-iron-500 dark:text-iron-400">
                  {formatSessionDate(previous.log.date)}
                  {' · '}
                  <span className="capitalize">
                    {DAYS[new Date(`${previous.log.date}T00:00:00`).getDay()]}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {previous.exerciseLog.sets
                  .slice()
                  .sort((a, b) => a.setNumber - b.setNumber)
                  .map((s) => (
                    <span
                      key={s.setNumber}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold tabular-nums border',
                        s.isPersonalRecord
                          ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-200 border-gold-300 dark:border-gold-800'
                          : 'bg-iron-50 dark:bg-iron-800/70 text-iron-700 dark:text-iron-200 border-iron-200 dark:border-iron-700',
                      )}
                    >
                      S{s.setNumber}: {s.weight} × {s.reps}
                      {s.isPersonalRecord && <Trophy size={10} />}
                    </span>
                  ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-iron-200 dark:border-iron-800 p-4 text-center">
              <p className="text-sm text-iron-500 dark:text-iron-400">
                No prior logs found for this exercise.
              </p>
            </div>
          )}

          {/* Trend (older sessions) */}
          {recent.length > 1 && (
            <div className="rounded-xl border border-iron-200 dark:border-iron-800 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-iron-200/60 dark:border-iron-800 bg-iron-50/60 dark:bg-iron-900/40">
                <TrendingUp size={14} className="text-metrics-500" />
                <span className="font-display text-xs uppercase tracking-wider font-bold text-iron-600 dark:text-iron-200">
                  Recent Trend
                </span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-iron-500">
                  Last {recent.length}
                </span>
              </div>
              <ul className="divide-y divide-iron-100 dark:divide-iron-800">
                {recent.slice(1).map(({ log, exerciseLog }) => {
                  const top = exerciseLog.sets.reduce(
                    (best, s) => (s.weight * s.reps > best.weight * best.reps ? s : best),
                    exerciseLog.sets[0],
                  );
                  return (
                    <li
                      key={log.id}
                      className="px-4 py-2.5 flex items-center justify-between text-sm"
                    >
                      <span className="text-iron-600 dark:text-iron-300">
                        {formatSessionDate(log.date)}
                      </span>
                      <span className="font-mono tabular-nums text-iron-700 dark:text-iron-200">
                        {top.weight} kg × {top.reps}
                        <span className="text-iron-400 ml-2">({exerciseLog.sets.length} sets)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
