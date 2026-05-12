/**
 * Pure migration utilities for upgrading persisted workout data when the
 * exercise catalog changes shape.
 *
 * Why a dedicated module:
 *  - Keeps the persist `migrate` callback short and readable.
 *  - Lets every transformation be unit-tested in isolation against
 *    representative fixtures, including edge cases the live store would
 *    otherwise hide.
 */

import type {
  ExerciseLog,
  PersonalRecord,
  WorkoutDay,
  WorkoutLog,
} from '@/types';
import { generateId } from './calculations';

/**
 * Split a legacy combined `forearm-curls` log (which packed both wrist
 * flexion and extension into one entry) into two distinct logs.
 *
 * The user historically logged set 1 as curls and set 2 as extensions.
 * Generalising that pattern: odd-numbered sets stay as curls, even-numbered
 * sets become forearm extensions. Sets are renumbered from 1 in each
 * resulting log so set numbers stay contiguous.
 */
export function splitForearmExerciseLog(combined: ExerciseLog): {
  curls?: ExerciseLog;
  ext?: ExerciseLog;
} {
  if (combined.exerciseId !== 'forearm-curls') {
    throw new Error(
      `splitForearmExerciseLog expected exerciseId='forearm-curls', got '${combined.exerciseId}'`,
    );
  }
  const sortedSets = [...combined.sets].sort((a, b) => a.setNumber - b.setNumber);
  const oddSets = sortedSets
    .filter((s) => s.setNumber % 2 === 1)
    .map((s, i) => ({ ...s, setNumber: i + 1 }));
  const evenSets = sortedSets
    .filter((s) => s.setNumber % 2 === 0)
    .map((s, i) => ({ ...s, setNumber: i + 1 }));

  return {
    curls:
      oddSets.length > 0
        ? { exerciseId: 'forearm-curls', sets: oddSets, notes: combined.notes }
        : undefined,
    ext:
      evenSets.length > 0
        ? { exerciseId: 'forearm-ext', sets: evenSets, notes: combined.notes }
        : undefined,
  };
}

/**
 * If an ExerciseLog with the same `exerciseId` already exists in `list`,
 * merge the incoming sets into it (and renumber them contiguously); else
 * push the incoming log as-is.
 */
function mergeOrPush(list: ExerciseLog[], incoming: ExerciseLog): void {
  const existing = list.find((e) => e.exerciseId === incoming.exerciseId);
  if (!existing) {
    list.push(incoming);
    return;
  }
  const allSets = [...existing.sets, ...incoming.sets]
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((s, i) => ({ ...s, setNumber: i + 1 }));
  existing.sets = allSets;
  if (!existing.notes && incoming.notes) existing.notes = incoming.notes;
}

/**
 * Apply the v2→v3 transformations to a single workout log:
 *  1. Split combined `forearm-curls` into `forearm-curls` + `forearm-ext`.
 *  2. Rename Saturday `standing-calf` entries to `seated-calf`
 *     (Wednesday standing-calf is preserved).
 *  3. Rename `leg-ext-sat` (the duplicate id) to the canonical `leg-ext`.
 *
 * `isPersonalRecord` flags are reset; they get re-derived chronologically
 * by `recomputePersonalRecords`.
 */
export function migrateWorkoutLogV3(log: WorkoutLog): WorkoutLog {
  const next: ExerciseLog[] = [];
  for (const ex of log.exercises) {
    const cleanSets = ex.sets.map((s) => {
      const { isPersonalRecord: _drop, ...rest } = s;
      void _drop;
      return rest;
    });
    const cleanLog: ExerciseLog = { ...ex, sets: cleanSets };

    if (cleanLog.exerciseId === 'forearm-curls') {
      const { curls, ext } = splitForearmExerciseLog(cleanLog);
      if (curls) mergeOrPush(next, curls);
      if (ext) mergeOrPush(next, ext);
      continue;
    }
    if (cleanLog.exerciseId === 'leg-ext-sat') {
      mergeOrPush(next, { ...cleanLog, exerciseId: 'leg-ext' });
      continue;
    }
    if (cleanLog.exerciseId === 'standing-calf' && log.dayId === 'saturday') {
      mergeOrPush(next, { ...cleanLog, exerciseId: 'seated-calf' });
      continue;
    }
    mergeOrPush(next, cleanLog);
  }
  return { ...log, exercises: next };
}

/**
 * Walk the migrated workout logs in chronological order and:
 *  - flag the set that established each new max as `isPersonalRecord: true`
 *  - return one `PersonalRecord` per exerciseId reflecting the all-time
 *    best (with `previousBest` being the prior max, or 0 if first).
 *
 * The returned `logs` are new objects; the input is not mutated.
 */
export function recomputePersonalRecords(logs: WorkoutLog[]): {
  logs: WorkoutLog[];
  personalRecords: PersonalRecord[];
} {
  const sorted = [...logs].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startedAt ?? 0) - (b.startedAt ?? 0);
  });

  const runningMax = new Map<string, number>();
  const prByExercise = new Map<string, PersonalRecord>();

  const updatedLogs: WorkoutLog[] = sorted.map((log) => ({
    ...log,
    exercises: log.exercises.map((ex) => {
      const sortedSets = [...ex.sets].sort((a, b) => a.setNumber - b.setNumber);
      const newSets = sortedSets.map((s) => {
        const cur = runningMax.get(ex.exerciseId) ?? 0;
        if (s.weight > cur) {
          const previousBest = cur;
          runningMax.set(ex.exerciseId, s.weight);
          prByExercise.set(ex.exerciseId, {
            id: generateId(),
            exerciseId: ex.exerciseId,
            date: log.date,
            weight: s.weight,
            reps: s.reps,
            previousBest,
          });
          return { ...s, isPersonalRecord: true };
        }
        return s;
      });
      return { ...ex, sets: newSets };
    }),
  }));

  return { logs: updatedLogs, personalRecords: [...prByExercise.values()] };
}

/**
 * v2→v3 transformations to the persisted workoutPlan: only surgical
 * renames on the canonical defaults so a custom plan stays intact.
 *
 *  - leg-ext-sat → leg-ext (everywhere)
 *  - Saturday standing-calf → seated-calf
 *
 * Forearm entries are left untouched here; the v3→v4 step below inserts
 * the missing `forearm-ext` entry so users coming from any prior version
 * end up with the decoupled split.
 */
export function migrateWorkoutPlanV3(plan: WorkoutDay[]): WorkoutDay[] {
  return plan.map((day) => ({
    ...day,
    exercises: day.exercises.map((ex) => {
      if (ex.exerciseId === 'leg-ext-sat') return { ...ex, exerciseId: 'leg-ext' };
      if (ex.exerciseId === 'standing-calf' && day.id === 'saturday') {
        return { ...ex, exerciseId: 'seated-calf' };
      }
      return ex;
    }),
  }));
}

/**
 * Target-set caps for the leg-day exercises whose volume was deliberately
 * trimmed to the MAV (Maximum Adaptive Volume) range. The v3 migration
 * shipped the new `defaultWorkoutPlan` but left users' persisted plans
 * carrying the older higher set counts; this lookup lets v4 clamp them.
 *
 * The map is intentionally exercise-keyed (not day-keyed) because the
 * same id may appear on multiple days and we want consistent volume.
 */
const LEG_DAY_TARGET_SETS_CAP: Readonly<Record<string, number>> = {
  'back-squat': 3,
  'leg-press': 3,
  'leg-ext': 2,
  'rdl': 3,
  'seated-ham': 3,
  'hack-squat': 3,
  'walking-lunge': 3,
  'hip-thrust': 3,
  'lying-ham': 3,
};

/**
 * v3→v4 plan migration. Two fixes for users who completed the v3 step
 * before these corrections landed:
 *
 *  1. **Insert `forearm-ext` after `forearm-curls`.** The v3 step only
 *     renamed log entries, never amended the persisted plan, so the
 *     decoupled pair never appeared on the Tuesday / Friday cards.
 *  2. **Clamp leg-day target sets to the new MAV defaults.** The trimmed
 *     volume only existed in the shipped `defaultWorkoutPlan`; existing
 *     users kept their old higher set counts. We only ever clamp *down*
 *     so a user who manually pushed volume above MAV isn't accidentally
 *     reduced — but if their persisted value matches the legacy default,
 *     they get the reduction they asked for.
 *
 * The function is idempotent: re-running on a v4 plan is a no-op.
 */
export function migrateWorkoutPlanV4(plan: WorkoutDay[]): WorkoutDay[] {
  return plan.map((day) => {
    const clamped = day.exercises.map((ex) => {
      const cap = LEG_DAY_TARGET_SETS_CAP[ex.exerciseId];
      if (cap !== undefined && ex.targetSets > cap) {
        return { ...ex, targetSets: cap };
      }
      return ex;
    });

    const hasCurls = clamped.some((e) => e.exerciseId === 'forearm-curls');
    const hasExt = clamped.some((e) => e.exerciseId === 'forearm-ext');
    if (!hasCurls || hasExt) {
      return { ...day, exercises: clamped };
    }

    const curlsIdx = clamped.findIndex((e) => e.exerciseId === 'forearm-curls');
    const extEntry = {
      id: generateId(),
      exerciseId: 'forearm-ext',
      // Order is recomputed contiguously below; this is just a placeholder.
      order: clamped[curlsIdx].order,
      targetSets: 2,
      targetReps: '12-15',
    };
    const inserted = [
      ...clamped.slice(0, curlsIdx + 1),
      extEntry,
      ...clamped.slice(curlsIdx + 1),
    ].map((e, i) => ({ ...e, order: i + 1 }));

    return { ...day, exercises: inserted };
  });
}
