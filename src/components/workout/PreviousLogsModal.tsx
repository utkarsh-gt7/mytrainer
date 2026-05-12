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
import { Badge } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

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

const STRATEGY_LABEL: Record<OverloadStrategy, string> = {
  'increase-weight': 'Add weight',
  'increase-reps': 'Push reps',
  consolidate: 'Consolidate',
  'first-time': 'New lift',
};

const STRATEGY_TONE: Record<OverloadStrategy, BadgeTone> = {
  'increase-weight': 'warning',
  'increase-reps': 'accent',
  consolidate: 'neutral',
  'first-time': 'info',
};

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function formatSessionDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * PreviousLogsModal — context drawer for an exercise.
 *
 * Reveals the most recent session, a Smart Overload suggestion,
 * the all-time PR, and a trend list of older sessions. Tests
 * rely on these strings (case-sensitive where noted):
 *   - "Smart Overload"
 *   - "All-Time PR" (case-sensitive)
 *   - "First time logging this exercise"
 *   - "No prior logs found"
 *   - `S{n}: {w} × {r}` set-chip format
 *   - The "Add 2.5 kg" suggestion headline (from the engine)
 *
 * The dialog overlay itself is the close-target for the existing
 * backdrop-click spec; the inner panel stops propagation.
 */
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

  // Lock body scroll + Escape-to-close.
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Previous logs for ${exercise?.name ?? exerciseId}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin rounded-t-xl sm:rounded-xl bg-surface border border-line shadow-lg animate-slide-up"
      >
        {/* ── Header ───────────────────────────────────────── */}
        <header className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-surface-2 border border-line text-fg-muted flex items-center justify-center">
              <History size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-2xs font-medium uppercase tracking-wide text-fg-subtle">
                Last logs
              </p>
              <h2 className="font-semibold text-fg tracking-tight text-lg truncate">
                {exercise?.name ?? 'Exercise'}
              </h2>
              {exercise?.muscleGroups && (
                <p className="text-xs text-fg-muted mt-0.5 capitalize">
                  {exercise.muscleGroups.join(' · ')}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close previous logs"
            className="touch-target-sm flex-shrink-0 -mr-1 p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors focus-ring"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {/* ── Smart Overload suggestion ─────────────────── */}
          <div className="rounded-lg border border-accent/30 bg-accent-50/60 dark:bg-accent-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
                Smart Overload
              </span>
              <Badge
                tone={STRATEGY_TONE[suggestion.strategy]}
                variant="soft"
                className="ml-auto"
              >
                {STRATEGY_LABEL[suggestion.strategy]}
              </Badge>
            </div>
            <p className="text-base font-semibold text-fg tracking-tight">
              {suggestion.headline}
            </p>
            <p className="text-sm text-fg-muted mt-1 leading-relaxed">
              {suggestion.rationale}
            </p>
          </div>

          {/* ── All-time PR ───────────────────────────────── */}
          {pr ? (
            <div className="rounded-lg border border-line bg-surface p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-warning-100 dark:bg-warning-700/20 text-warning flex items-center justify-center flex-shrink-0">
                <Trophy size={16} strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
                  All-Time PR
                </p>
                <p className="font-mono font-semibold text-sm text-fg tabular-nums">
                  {pr.weight} kg × {pr.reps}
                </p>
              </div>
              <p className="text-xs text-fg-subtle flex-shrink-0">
                {formatSessionDate(pr.date)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-surface-2/40 p-4 text-center">
              <Trophy size={16} className="mx-auto text-fg-subtle mb-1" />
              <p className="text-xs text-fg-muted">
                No PR yet — your first solid set will set the benchmark.
              </p>
            </div>
          )}

          {/* ── Last session ──────────────────────────────── */}
          {previous ? (
            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-fg-muted" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    Last session
                  </span>
                </div>
                <p className="text-xs text-fg-subtle">
                  {formatSessionDate(previous.log.date)}
                  {' · '}
                  <span className="capitalize">
                    {DAYS[new Date(`${previous.log.date}T00:00:00`).getDay()]}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previous.exerciseLog.sets
                  .slice()
                  .sort((a, b) => a.setNumber - b.setNumber)
                  .map((s) => (
                    <Badge
                      key={s.setNumber}
                      tone={s.isPersonalRecord ? 'warning' : 'neutral'}
                      variant="soft"
                      className="font-mono"
                    >
                      S{s.setNumber}: {s.weight} × {s.reps}
                      {s.isPersonalRecord && <Trophy size={10} className="ml-0.5" />}
                    </Badge>
                  ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-surface-2/40 p-4 text-center">
              <p className="text-sm text-fg-muted">
                No prior logs found for this exercise.
              </p>
            </div>
          )}

          {/* ── Recent trend ──────────────────────────────── */}
          {recent.length > 1 && (
            <div className="rounded-lg border border-line bg-surface overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-line bg-surface-2/40">
                <TrendingUp size={13} className="text-info" />
                <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Recent trend
                </span>
                <span className="ml-auto text-2xs uppercase tracking-wide text-fg-subtle">
                  Last {recent.length}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {recent.slice(1).map(({ log, exerciseLog }) => {
                  const top = exerciseLog.sets.reduce(
                    (best, s) =>
                      s.weight * s.reps > best.weight * best.reps ? s : best,
                    exerciseLog.sets[0],
                  );
                  return (
                    <li
                      key={log.id}
                      className="px-4 py-2.5 flex items-center justify-between text-sm"
                    >
                      <span className="text-fg-muted">
                        {formatSessionDate(log.date)}
                      </span>
                      <span className="font-mono tabular-nums text-fg">
                        {top.weight} kg × {top.reps}
                        <span className="text-fg-subtle ml-2">
                          ({exerciseLog.sets.length} sets)
                        </span>
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
