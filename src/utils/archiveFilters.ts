/**
 * Pure filter helpers for the Workout Archive page so the filtering logic
 * stays unit-testable independent of any React component.
 */

import type { Exercise, MuscleGroup, WorkoutLog } from '@/types';
import { getExerciseById } from '@/data/exercises';

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayName = (typeof DAY_NAMES)[number];

export interface ArchiveFilters {
  /** Free-text query against exercise name (case-insensitive substring match). */
  exerciseQuery?: string;
  /** Restrict to logs where any exercise targets this muscle group. */
  muscleGroup?: MuscleGroup;
  /** Restrict to logs that fell on this calendar day-of-week. */
  dayOfWeek?: DayName;
  /** ISO date inclusive lower bound (YYYY-MM-DD). */
  dateFrom?: string;
  /** ISO date inclusive upper bound (YYYY-MM-DD). */
  dateTo?: string;
  /** When true, hide in-progress / un-completed sessions. Defaults to true. */
  completedOnly?: boolean;
}

const dayOfWeekFor = (isoDate: string): DayName | null => {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
};

/**
 * Apply every active filter to the supplied workout logs. Returns the
 * matching logs sorted newest-first.
 */
export function filterWorkoutLogs(
  logs: WorkoutLog[],
  filters: ArchiveFilters,
): WorkoutLog[] {
  const completedOnly = filters.completedOnly ?? true;
  const query = filters.exerciseQuery?.trim().toLowerCase() ?? '';

  return logs
    .filter((log) => {
      if (completedOnly && !log.completed) return false;
      if (filters.dateFrom && log.date < filters.dateFrom) return false;
      if (filters.dateTo && log.date > filters.dateTo) return false;
      if (filters.dayOfWeek && dayOfWeekFor(log.date) !== filters.dayOfWeek) return false;

      if (query || filters.muscleGroup) {
        const matchesAtLeastOne = log.exercises.some((ex) => {
          if (ex.sets.length === 0) return false;
          const exercise = getExerciseById(ex.exerciseId);
          if (query) {
            const haystack = (exercise?.name ?? ex.exerciseId).toLowerCase();
            if (!haystack.includes(query)) return false;
          }
          if (filters.muscleGroup) {
            if (!exercise?.muscleGroups.includes(filters.muscleGroup)) return false;
          }
          return true;
        });
        if (!matchesAtLeastOne) return false;
      }

      // If no quality filters are set, still drop sessions with zero logged sets so
      // the archive doesn't show empty placeholders.
      const hasAnyWorkingSet = log.exercises.some((ex) => ex.sets.length > 0);
      return hasAnyWorkingSet;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.startedAt ?? 0) - (a.startedAt ?? 0);
    });
}

/** Distinct muscle groups present across the user's logged exercises. */
export function collectMuscleGroups(logs: WorkoutLog[]): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  for (const log of logs) {
    for (const ex of log.exercises) {
      if (ex.sets.length === 0) continue;
      const exercise = getExerciseById(ex.exerciseId);
      exercise?.muscleGroups.forEach((m) => set.add(m));
    }
  }
  return [...set].sort();
}

/** Per-log volume summary used by the archive cards. */
export interface LogSummary {
  totalSets: number;
  totalVolumeKg: number;
  prCount: number;
  exerciseCount: number;
}

export function summarizeLog(log: WorkoutLog): LogSummary {
  let totalSets = 0;
  let totalVolumeKg = 0;
  let prCount = 0;
  let exerciseCount = 0;
  for (const ex of log.exercises) {
    if (ex.sets.length === 0) continue;
    exerciseCount += 1;
    for (const s of ex.sets) {
      totalSets += 1;
      totalVolumeKg += s.weight * s.reps;
      if (s.isPersonalRecord) prCount += 1;
    }
  }
  return { totalSets, totalVolumeKg: Math.round(totalVolumeKg), prCount, exerciseCount };
}

/** Top set per exercise inside one log — used to surface highlight rows. */
export function topSetsByExercise(
  log: WorkoutLog,
): Array<{ exerciseId: string; exercise?: Exercise; weight: number; reps: number; isPR: boolean }> {
  return log.exercises
    .filter((ex) => ex.sets.length > 0)
    .map((ex) => {
      const top = ex.sets.reduce((best, s) =>
        s.weight * s.reps > best.weight * best.reps ? s : best,
      );
      return {
        exerciseId: ex.exerciseId,
        exercise: getExerciseById(ex.exerciseId),
        weight: top.weight,
        reps: top.reps,
        isPR: !!top.isPersonalRecord,
      };
    });
}
