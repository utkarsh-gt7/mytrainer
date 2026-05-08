/**
 * Helpers for surfacing prior performance on a given exercise so the user
 * can progressively overload from session to session — even when an
 * exercise appears on multiple training days in the same week.
 */

import type { ExerciseLog, PersonalRecord, WorkoutLog } from '@/types';

export interface PreviousSession {
  log: WorkoutLog;
  exerciseLog: ExerciseLog;
}

interface LookupOptions {
  /** ISO date (YYYY-MM-DD). Logs on or after this date are excluded. */
  beforeDate?: string;
  /** Skip a specific workout id (e.g. the in-progress one). */
  excludeWorkoutId?: string;
  /** When true, only consider completed sessions. Defaults to true. */
  completedOnly?: boolean;
}

function isLogEligible(
  log: WorkoutLog,
  exerciseId: string,
  { beforeDate, excludeWorkoutId, completedOnly = true }: LookupOptions,
): boolean {
  if (completedOnly && !log.completed) return false;
  if (excludeWorkoutId && log.id === excludeWorkoutId) return false;
  if (beforeDate && log.date >= beforeDate) return false;
  return log.exercises.some((e) => e.exerciseId === exerciseId && e.sets.length > 0);
}

function compareLogsDescending(a: WorkoutLog, b: WorkoutLog): number {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return (b.startedAt ?? 0) - (a.startedAt ?? 0);
}

/**
 * Find the most recent session that actually contains *this* exercise.
 * Crucially, this is exercise-scoped (not day-scoped), so an exercise
 * trained on both Tue and Fri returns the freshest of the two — never
 * "the same day last week" alone.
 */
export function findPreviousSession(
  workoutLogs: WorkoutLog[],
  exerciseId: string,
  options: LookupOptions = {},
): PreviousSession | null {
  const candidates = workoutLogs.filter((l) => isLogEligible(l, exerciseId, options));
  if (candidates.length === 0) return null;
  candidates.sort(compareLogsDescending);
  const log = candidates[0];
  const exerciseLog = log.exercises.find((e) => e.exerciseId === exerciseId)!;
  return { log, exerciseLog };
}

/** The N most recent sessions for an exercise, newest first. */
export function getRecentSessions(
  workoutLogs: WorkoutLog[],
  exerciseId: string,
  limit = 5,
  options: LookupOptions = {},
): PreviousSession[] {
  const sessions = workoutLogs
    .filter((l) => isLogEligible(l, exerciseId, options))
    .map((log) => ({
      log,
      exerciseLog: log.exercises.find((e) => e.exerciseId === exerciseId)!,
    }));
  sessions.sort((a, b) => compareLogsDescending(a.log, b.log));
  return sessions.slice(0, Math.max(0, limit));
}

/**
 * Parse a target reps spec into a {min, max} range. Accepts:
 *   "5"           → { min: 5, max: 5 }
 *   "5-8"         → { min: 5, max: 8 }
 *   "12 each"     → { min: 12, max: 12 }
 *   "12 each side"→ { min: 12, max: 12 }
 *   "12/leg"      → { min: 12, max: 12 }
 *   "AMRAP"       → null
 */
export function parseRepTarget(targetReps: string): { min: number; max: number } | null {
  const numbers = targetReps.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  const first = parseInt(numbers[0], 10);
  const second = numbers.length > 1 ? parseInt(numbers[1], 10) : first;
  if (!Number.isFinite(first) || first <= 0) return null;
  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

export type OverloadStrategy =
  | 'increase-weight'
  | 'increase-reps'
  | 'consolidate'
  | 'first-time';

export interface OverloadSuggestion {
  /** Suggested working weight in kg. */
  weight: number;
  /** Suggested reps for the suggested weight. */
  reps: number;
  /** Short verdict the UI can render as a headline. */
  headline: string;
  /** One-paragraph rationale for the user. */
  rationale: string;
  strategy: OverloadStrategy;
}

/** Smallest practical load step on machine + free-weight work, in kg. */
const SMALLEST_INCREMENT_KG = 2.5;

/**
 * Double-progression overload calculator.
 *
 *  - Hit top of the rep range across every working set ⇒ add weight, reset reps to the floor.
 *  - Inside the range ⇒ keep weight, push for one more rep.
 *  - Below the floor ⇒ repeat the load and focus on form / bar speed.
 *
 * Falls back to a friendly "first time" message when there is no prior data.
 */
export function computeOverloadSuggestion(args: {
  previous?: PreviousSession | null;
  pr?: PersonalRecord;
  targetReps?: string;
}): OverloadSuggestion {
  const { previous, pr, targetReps } = args;
  const target = targetReps ? parseRepTarget(targetReps) : null;

  if (!previous || previous.exerciseLog.sets.length === 0) {
    return {
      weight: pr?.weight ?? 0,
      reps: target?.min ?? 8,
      headline: 'First time logging this exercise',
      rationale:
        'Start light, prioritise form, and leave 2-3 reps in reserve. We will track everything from here.',
      strategy: 'first-time',
    };
  }

  const sets = [...previous.exerciseLog.sets].sort((a, b) => a.setNumber - b.setNumber);
  const topSet = sets.reduce((best, s) =>
    s.weight * s.reps > best.weight * best.reps ? s : best,
  );
  const minReps = Math.min(...sets.map((s) => s.reps));
  const prTail = pr ? ` Your all-time PR is ${pr.weight} kg × ${pr.reps}.` : '';

  if (target && minReps >= target.max) {
    const newWeight = roundIncrement(topSet.weight + SMALLEST_INCREMENT_KG);
    return {
      weight: newWeight,
      reps: target.min,
      headline: `Add ${SMALLEST_INCREMENT_KG} kg → ${newWeight} kg × ${target.min}`,
      rationale:
        `You smoked every set at the top of the rep range last session ` +
        `(${topSet.weight} kg × ${topSet.reps}). Bump the load by ${SMALLEST_INCREMENT_KG} kg and reset to the bottom of the range.${prTail}`,
      strategy: 'increase-weight',
    };
  }

  if (target && minReps >= target.min) {
    const newReps = target.max ? Math.min(target.max, topSet.reps + 1) : topSet.reps + 1;
    return {
      weight: topSet.weight,
      reps: newReps,
      headline: `Same weight → ${topSet.weight} kg × ${newReps}`,
      rationale:
        `Last time you hit ${topSet.weight} kg × ${topSet.reps}. Hold the load and squeeze ` +
        `one more rep this week before moving up.${prTail}`,
      strategy: 'increase-reps',
    };
  }

  return {
    weight: topSet.weight,
    reps: target?.min ?? topSet.reps,
    headline: `Repeat ${topSet.weight} kg × ${target?.min ?? topSet.reps}`,
    rationale:
      `Last session fell short of the ${target ? `${target.min}-rep floor` : 'target'}. ` +
      `Stay at ${topSet.weight} kg, dial in form and bar speed, and aim for the bottom of the range before adding weight.${prTail}`,
    strategy: 'consolidate',
  };
}

/** Round to the nearest 0.5 kg so numbers look sensible on the bar. */
function roundIncrement(weight: number): number {
  return Math.round(weight * 2) / 2;
}
