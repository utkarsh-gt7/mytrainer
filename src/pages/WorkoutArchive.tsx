import { useMemo, useState } from 'react';
import {
  Archive,
  Search,
  Filter,
  Calendar,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  History,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import {
  collectMuscleGroups,
  DAY_NAMES,
  filterWorkoutLogs,
  summarizeLog,
  topSetsByExercise,
  type ArchiveFilters,
  type DayName,
} from '@/utils/archiveFilters';
import { formatDuration } from '@/utils/calculations';
import { cn } from '@/utils/cn';
import type { MuscleGroup } from '@/types';
import PageHeader from '@/components/PageHeader';
import PreviousLogsModal from '@/components/workout/PreviousLogsModal';

const FOCUS_BADGE: Record<string, string> = {
  strength:
    'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-900/60',
  hypertrophy:
    'bg-metrics-100 text-metrics-700 border-metrics-200 dark:bg-metrics-900/30 dark:text-metrics-200 dark:border-metrics-900/60',
  athletic:
    'bg-nutrition-100 text-nutrition-700 border-nutrition-200 dark:bg-nutrition-900/30 dark:text-nutrition-200 dark:border-nutrition-900/60',
};

function formatLongDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WorkoutArchive() {
  const { workoutLogs, workoutPlan } = useAppStore();
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);

  const muscleGroups = useMemo(() => collectMuscleGroups(workoutLogs), [workoutLogs]);
  const filteredLogs = useMemo(() => filterWorkoutLogs(workoutLogs, filters), [workoutLogs, filters]);

  const totalSets = filteredLogs.reduce((s, log) => s + summarizeLog(log).totalSets, 0);
  const totalVolume = filteredLogs.reduce((s, log) => s + summarizeLog(log).totalVolumeKg, 0);
  const totalPRs = filteredLogs.reduce((s, log) => s + summarizeLog(log).prCount, 0);

  const activeFilterCount =
    (filters.exerciseQuery ? 1 : 0) +
    (filters.muscleGroup ? 1 : 0) +
    (filters.dayOfWeek ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const clearFilters = () => setFilters({});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        theme="library"
        icon={Archive}
        eyebrow="Receipts"
        title="Workout Archive"
        subtitle="Every session you've banked. Filter by exercise, day, muscle or date — and revisit the receipts."
      >
        <button
          type="button"
          onClick={() => setFilterPanelOpen((o) => !o)}
          aria-expanded={filterPanelOpen}
          aria-controls="archive-filters"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-sm text-white transition-colors"
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/30 tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>
      </PageHeader>

      {/* Filter Panel */}
      <div
        id="archive-filters"
        className={cn(
          'rounded-2xl border border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 overflow-hidden transition-all',
          filterPanelOpen || activeFilterCount > 0 ? 'opacity-100' : 'opacity-100',
        )}
      >
        {(filterPanelOpen || activeFilterCount > 0) && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Exercise search */}
              <label className="block">
                <span className="text-[10px] font-display uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">
                  Exercise
                </span>
                <div className="relative mt-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-iron-400" />
                  <input
                    type="text"
                    value={filters.exerciseQuery ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, exerciseQuery: e.target.value || undefined }))
                    }
                    placeholder="Bench, RDL, …"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </label>

              {/* Muscle group */}
              <label className="block">
                <span className="text-[10px] font-display uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">
                  Muscle Group
                </span>
                <select
                  value={filters.muscleGroup ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      muscleGroup: (e.target.value || undefined) as MuscleGroup | undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white capitalize focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">All muscles</option>
                  {muscleGroups.map((m) => (
                    <option key={m} value={m} className="capitalize">
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>

              {/* Day of week */}
              <label className="block">
                <span className="text-[10px] font-display uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">
                  Day
                </span>
                <select
                  value={filters.dayOfWeek ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dayOfWeek: (e.target.value || undefined) as DayName | undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Any day</option>
                  {DAY_NAMES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-display uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">
                    From
                  </span>
                  <input
                    type="date"
                    value={filters.dateFrom ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-2 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-display uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">
                    To
                  </span>
                  <input
                    type="date"
                    value={filters.dateTo ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-2 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline"
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filtered summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border-l-4 border-l-primary-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-4">
          <Dumbbell size={16} className="text-primary-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">
            {filteredLogs.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Sessions</p>
        </div>
        <div className="rounded-2xl border-l-4 border-l-metrics-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-4">
          <Calendar size={16} className="text-metrics-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">
            {totalSets}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Working Sets</p>
        </div>
        <div className="rounded-2xl border-l-4 border-l-nutrition-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-4">
          <History size={16} className="text-nutrition-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">
            {Math.round(totalVolume / 1000)}k
          </p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Volume (kg)</p>
        </div>
        <div className="rounded-2xl border-l-4 border-l-gold-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-4">
          <Trophy size={16} className="text-gold-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">{totalPRs}</p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">PRs Hit</p>
        </div>
      </div>

      {/* Empty state */}
      {filteredLogs.length === 0 && (
        <div className="rounded-2xl border border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-10 text-center">
          <Archive className="mx-auto text-iron-400 dark:text-iron-500 mb-3" size={36} />
          <h3 className="font-display uppercase tracking-wide font-bold text-lg dark:text-white">
            No sessions match these filters
          </h3>
          <p className="text-sm text-iron-500 dark:text-iron-400 mt-1">
            {activeFilterCount > 0
              ? 'Try widening the date range or clearing a filter.'
              : 'Start logging workouts and they\'ll show up here.'}
          </p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const summary = summarizeLog(log);
          const day = workoutPlan.find((d) => d.id === log.dayId);
          const isExpanded = expandedLogId === log.id;
          const tops = topSetsByExercise(log);
          const focusKey = day?.focus ?? 'strength';

          return (
            <article
              key={log.id}
              className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} session from ${formatLongDate(log.date)}`}
                className="w-full text-left p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-flame-500 text-white flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold dark:text-white truncate">
                      {day?.label ?? log.dayId}{' '}
                      <span className="text-iron-400">·</span>{' '}
                      <span className="text-iron-500 font-mono text-sm">
                        {formatLongDate(log.date)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {day && (
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold border',
                            FOCUS_BADGE[focusKey],
                          )}
                        >
                          {day.focus}
                        </span>
                      )}
                      <span className="text-xs font-mono text-iron-500 tabular-nums">
                        {summary.exerciseCount} ex · {summary.totalSets} sets
                      </span>
                      {summary.prCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gold-600 dark:text-gold-300">
                          <Trophy size={12} /> {summary.prCount} PR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {log.duration !== undefined && (
                    <span className="text-xs font-mono text-iron-500 hidden sm:inline tabular-nums">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Always-visible top-set summary row */}
              {!isExpanded && tops.length > 0 && (
                <div className="px-4 pb-4 -mt-1 flex flex-wrap gap-1.5">
                  {tops.slice(0, 4).map((t) => (
                    <span
                      key={t.exerciseId}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums border',
                        t.isPR
                          ? 'bg-gold-50 text-gold-700 border-gold-200 dark:bg-gold-900/20 dark:text-gold-200 dark:border-gold-900/60'
                          : 'bg-iron-50 text-iron-700 border-iron-200 dark:bg-iron-800/60 dark:text-iron-200 dark:border-iron-700',
                      )}
                    >
                      {(t.exercise?.name ?? t.exerciseId).split(' ').slice(0, 2).join(' ')} ·{' '}
                      {t.weight} × {t.reps}
                      {t.isPR && <Trophy size={10} />}
                    </span>
                  ))}
                  {tops.length > 4 && (
                    <span className="text-[11px] text-iron-400 self-center">
                      +{tops.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-iron-200/60 dark:border-iron-800 bg-iron-50/40 dark:bg-iron-950/40">
                  <div className="mt-3 space-y-3">
                    {log.exercises
                      .filter((ex) => ex.sets.length > 0)
                      .map((ex) => {
                        const exercise = getExerciseById(ex.exerciseId);
                        return (
                          <div
                            key={ex.exerciseId}
                            className="rounded-lg border border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm dark:text-white truncate">
                                {exercise?.name ?? ex.exerciseId}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryExerciseId(ex.exerciseId);
                                }}
                                aria-label={`View previous logs for ${exercise?.name ?? ex.exerciseId}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-display uppercase tracking-wider font-bold border border-primary-200 dark:border-primary-900/60 text-primary-700 dark:text-primary-200 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                              >
                                <History size={11} /> History
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {ex.sets
                                .slice()
                                .sort((a, b) => a.setNumber - b.setNumber)
                                .map((s) => (
                                  <span
                                    key={s.setNumber}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums border',
                                      s.isPersonalRecord
                                        ? 'bg-gold-50 text-gold-700 border-gold-200 dark:bg-gold-900/20 dark:text-gold-200 dark:border-gold-900/60'
                                        : 'bg-iron-50 text-iron-700 border-iron-200 dark:bg-iron-800/60 dark:text-iron-200 dark:border-iron-700',
                                    )}
                                  >
                                    S{s.setNumber}: {s.weight} × {s.reps}
                                    {s.isPersonalRecord && <Trophy size={10} />}
                                  </span>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    {log.notes && (
                      <p className="text-xs text-iron-500 dark:text-iron-400 italic">
                        “{log.notes}”
                      </p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Previous Logs popup — re-used here so the user can pivot from any
          archived exercise straight into its full history + suggestion. */}
      {historyExerciseId && (
        <PreviousLogsModal
          exerciseId={historyExerciseId}
          onClose={() => setHistoryExerciseId(null)}
        />
      )}
    </div>
  );
}
