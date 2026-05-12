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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  StatTile,
} from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

const focusTone: Record<string, BadgeTone> = {
  strength: 'accent',
  hypertrophy: 'info',
  athletic: 'success',
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

/**
 * WorkoutArchive — searchable history of every session.
 *
 * Tests rely on these strings: "No sessions match these filters",
 * `Expand session from {date}` aria-labels, the "Bench, RDL"
 * placeholder, the "Any day" select default, and the `S{n}: {w} × {r}`
 * set chip format. They are all preserved verbatim.
 */
export default function WorkoutArchive() {
  const { workoutLogs, workoutPlan } = useAppStore();
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);

  const muscleGroups = useMemo(() => collectMuscleGroups(workoutLogs), [workoutLogs]);
  const filteredLogs = useMemo(
    () => filterWorkoutLogs(workoutLogs, filters),
    [workoutLogs, filters],
  );

  const totalSets = filteredLogs.reduce((s, log) => s + summarizeLog(log).totalSets, 0);
  const totalVolume = filteredLogs.reduce(
    (s, log) => s + summarizeLog(log).totalVolumeKg,
    0,
  );
  const totalPRs = filteredLogs.reduce((s, log) => s + summarizeLog(log).prCount, 0);

  const activeFilterCount =
    (filters.exerciseQuery ? 1 : 0) +
    (filters.muscleGroup ? 1 : 0) +
    (filters.dayOfWeek ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  const clearFilters = () => setFilters({});
  const showPanel = filterPanelOpen || activeFilterCount > 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        theme="archive"
        icon={Archive}
        eyebrow="History"
        title="Workout archive"
        subtitle="Every session you've banked. Filter by exercise, day, muscle or date."
      >
        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'secondary'}
          onClick={() => setFilterPanelOpen((o) => !o)}
          aria-expanded={filterPanelOpen}
          aria-controls="archive-filters"
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 h-5 inline-flex items-center justify-center rounded text-2xs font-semibold tabular-nums bg-white/20">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PageHeader>

      {/* ── Filter panel ─────────────────────────────────────── */}
      {showPanel && (
        <Card bare id="archive-filters" className="animate-slide-down">
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Exercise" htmlFor="filter-ex">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
                  />
                  <Input
                    id="filter-ex"
                    type="text"
                    value={filters.exerciseQuery ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        exerciseQuery: e.target.value || undefined,
                      }))
                    }
                    placeholder="Bench, RDL, …"
                    className="pl-9"
                  />
                </div>
              </Field>

              <Field label="Muscle group" htmlFor="filter-muscle">
                <Select
                  id="filter-muscle"
                  value={filters.muscleGroup ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      muscleGroup: (e.target.value || undefined) as
                        | MuscleGroup
                        | undefined,
                    }))
                  }
                  className="capitalize"
                >
                  <option value="">All muscles</option>
                  {muscleGroups.map((m) => (
                    <option key={m} value={m} className="capitalize">
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Day" htmlFor="filter-day">
                <Select
                  id="filter-day"
                  value={filters.dayOfWeek ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dayOfWeek: (e.target.value || undefined) as DayName | undefined,
                    }))
                  }
                >
                  <option value="">Any day</option>
                  {DAY_NAMES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="From" htmlFor="filter-from">
                  <Input
                    id="filter-from"
                    type="date"
                    value={filters.dateFrom ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        dateFrom: e.target.value || undefined,
                      }))
                    }
                  />
                </Field>
                <Field label="To" htmlFor="filter-to">
                  <Input
                    id="filter-to"
                    type="date"
                    value={filters.dateTo ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        dateTo: e.target.value || undefined,
                      }))
                    }
                  />
                </Field>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} /> Clear all filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ── Summary tiles ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Dumbbell} label="Sessions" value={filteredLogs.length} />
        <StatTile icon={Calendar} label="Sets" value={totalSets} />
        <StatTile
          icon={History}
          label="Volume"
          value={`${Math.round(totalVolume / 1000)}k`}
          hint="kg lifted"
        />
        <StatTile
          icon={Trophy}
          tone={totalPRs > 0 ? 'warning' : 'fg'}
          label="PRs hit"
          value={totalPRs}
        />
      </div>

      {/* ── Empty state ──────────────────────────────────────── */}
      {filteredLogs.length === 0 && (
        <Card>
          <EmptyState
            icon={Archive}
            title="No sessions match these filters"
            description={
              activeFilterCount > 0
                ? 'Try widening the date range or clearing a filter.'
                : "Start logging workouts and they'll show up here."
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="primary" size="sm" onClick={clearFilters}>
                  <X size={14} /> Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {/* ── Session cards ────────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredLogs.map((log) => {
          const summary = summarizeLog(log);
          const day = workoutPlan.find((d) => d.id === log.dayId);
          const isExpanded = expandedLogId === log.id;
          const tops = topSetsByExercise(log);

          return (
            <article
              key={log.id}
              className="bg-surface rounded-lg border border-line overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} session from ${formatLongDate(log.date)}`}
                className="w-full text-left p-4 flex items-center justify-between gap-3 focus-ring rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-surface-2 border border-line text-fg-muted flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-fg truncate">
                      {day?.label ?? log.dayId}{' '}
                      <span className="text-fg-subtle font-normal">
                        · {formatLongDate(log.date)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {day && (
                        <Badge
                          tone={focusTone[day.focus] ?? 'neutral'}
                          variant="soft"
                          className="capitalize"
                        >
                          {day.focus}
                        </Badge>
                      )}
                      <span className="text-xs text-fg-muted tabular-nums">
                        {summary.exerciseCount} ex · {summary.totalSets} sets
                      </span>
                      {summary.prCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-warning">
                          <Trophy size={11} /> {summary.prCount} PR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {log.duration !== undefined && (
                    <span className="text-xs text-fg-muted hidden sm:inline tabular-nums">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-fg-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-fg-muted" />
                  )}
                </div>
              </button>

              {/* Collapsed: top-set chips strip */}
              {!isExpanded && tops.length > 0 && (
                <div className="px-4 pb-4 -mt-1 flex flex-wrap gap-1.5">
                  {tops.slice(0, 4).map((t) => (
                    <Badge
                      key={t.exerciseId}
                      tone={t.isPR ? 'warning' : 'neutral'}
                      variant="soft"
                      className="font-mono"
                    >
                      {(t.exercise?.name ?? t.exerciseId).split(' ').slice(0, 2).join(' ')} ·{' '}
                      {t.weight} × {t.reps}
                      {t.isPR && <Trophy size={10} className="ml-0.5" />}
                    </Badge>
                  ))}
                  {tops.length > 4 && (
                    <span className="text-xs text-fg-subtle self-center">
                      +{tops.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* Expanded: per-exercise sets */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-line bg-surface-2/40">
                  <div className="mt-3 space-y-2.5">
                    {log.exercises
                      .filter((ex) => ex.sets.length > 0)
                      .map((ex) => {
                        const exercise = getExerciseById(ex.exerciseId);
                        return (
                          <div
                            key={ex.exerciseId}
                            className="rounded-md border border-line bg-surface p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-fg truncate">
                                {exercise?.name ?? ex.exerciseId}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryExerciseId(ex.exerciseId);
                                }}
                                aria-label={`View previous logs for ${exercise?.name ?? ex.exerciseId}`}
                                className="touch-target-sm inline-flex items-center gap-1 px-2 h-7 rounded-md text-2xs font-medium border border-line bg-surface hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors focus-ring"
                              >
                                <History size={11} /> History
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {ex.sets
                                .slice()
                                .sort((a, b) => a.setNumber - b.setNumber)
                                .map((s) => (
                                  <Badge
                                    key={s.setNumber}
                                    tone={s.isPersonalRecord ? 'warning' : 'neutral'}
                                    variant="soft"
                                    className={cn(
                                      'font-mono',
                                      s.isPersonalRecord && 'border border-warning/40',
                                    )}
                                  >
                                    S{s.setNumber}: {s.weight} × {s.reps}
                                    {s.isPersonalRecord && (
                                      <Trophy size={10} className="ml-0.5" />
                                    )}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    {log.notes && (
                      <p className="text-xs text-fg-muted italic">“{log.notes}”</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {historyExerciseId && (
        <PreviousLogsModal
          exerciseId={historyExerciseId}
          onClose={() => setHistoryExerciseId(null)}
        />
      )}
    </div>
  );
}
