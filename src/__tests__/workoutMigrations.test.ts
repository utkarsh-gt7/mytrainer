import { describe, it, expect } from 'vitest';
import type { ExerciseLog, WorkoutLog, WorkoutDay } from '@/types';
import {
  splitForearmExerciseLog,
  migrateWorkoutLogV3,
  recomputePersonalRecords,
  migrateWorkoutPlanV3,
} from '@/utils/workoutMigrations';

const buildLog = (
  overrides: Partial<WorkoutLog> & {
    exercises: ExerciseLog[];
    date: string;
    dayId: string;
  },
): WorkoutLog => ({
  id: overrides.id ?? `log-${overrides.date}`,
  date: overrides.date,
  dayId: overrides.dayId,
  exercises: overrides.exercises,
  completed: overrides.completed ?? true,
  duration: overrides.duration,
  startedAt: overrides.startedAt,
  notes: overrides.notes,
});

describe('splitForearmExerciseLog', () => {
  it('routes odd sets to curls and even sets to extensions, renumbered from 1', () => {
    const combined: ExerciseLog = {
      exerciseId: 'forearm-curls',
      sets: [
        { setNumber: 1, weight: 10, reps: 12 },
        { setNumber: 2, weight: 10, reps: 12 },
      ],
    };
    const { curls, ext } = splitForearmExerciseLog(combined);
    expect(curls?.exerciseId).toBe('forearm-curls');
    expect(curls?.sets).toEqual([{ setNumber: 1, weight: 10, reps: 12 }]);
    expect(ext?.exerciseId).toBe('forearm-ext');
    expect(ext?.sets).toEqual([{ setNumber: 1, weight: 10, reps: 12 }]);
  });

  it('renumbers when the user logged more than two sets', () => {
    const combined: ExerciseLog = {
      exerciseId: 'forearm-curls',
      sets: [
        { setNumber: 1, weight: 12, reps: 12 },
        { setNumber: 2, weight: 12, reps: 12 },
        { setNumber: 3, weight: 14, reps: 10 },
        { setNumber: 4, weight: 14, reps: 10 },
      ],
    };
    const { curls, ext } = splitForearmExerciseLog(combined);
    expect(curls?.sets.map((s) => s.setNumber)).toEqual([1, 2]);
    expect(ext?.sets.map((s) => s.setNumber)).toEqual([1, 2]);
    expect(curls?.sets.map((s) => s.weight)).toEqual([12, 14]);
    expect(ext?.sets.map((s) => s.weight)).toEqual([12, 14]);
  });

  it('returns only curls when there are no even sets to migrate', () => {
    const combined: ExerciseLog = {
      exerciseId: 'forearm-curls',
      sets: [{ setNumber: 1, weight: 10, reps: 12 }],
    };
    const { curls, ext } = splitForearmExerciseLog(combined);
    expect(curls).toBeDefined();
    expect(ext).toBeUndefined();
  });

  it('throws if called on the wrong exercise id', () => {
    expect(() =>
      splitForearmExerciseLog({ exerciseId: 'bb-bench', sets: [] }),
    ).toThrow(/forearm-curls/);
  });
});

describe('migrateWorkoutLogV3 — Saturday calf swap', () => {
  it('renames standing-calf to seated-calf only on Saturday logs', () => {
    const sat = buildLog({
      date: '2026-05-02',
      dayId: 'saturday',
      exercises: [
        { exerciseId: 'standing-calf', sets: [{ setNumber: 1, weight: 80, reps: 12 }] },
      ],
    });
    const wed = buildLog({
      date: '2026-04-29',
      dayId: 'wednesday',
      exercises: [
        { exerciseId: 'standing-calf', sets: [{ setNumber: 1, weight: 80, reps: 12 }] },
      ],
    });
    const migratedSat = migrateWorkoutLogV3(sat);
    const migratedWed = migrateWorkoutLogV3(wed);
    expect(migratedSat.exercises[0].exerciseId).toBe('seated-calf');
    expect(migratedWed.exercises[0].exerciseId).toBe('standing-calf');
  });
});

describe('migrateWorkoutLogV3 — leg extension consolidation', () => {
  it('renames leg-ext-sat to canonical leg-ext on every day', () => {
    const log = buildLog({
      date: '2026-05-02',
      dayId: 'saturday',
      exercises: [
        { exerciseId: 'leg-ext-sat', sets: [{ setNumber: 1, weight: 60, reps: 15 }] },
      ],
    });
    const migrated = migrateWorkoutLogV3(log);
    expect(migrated.exercises[0].exerciseId).toBe('leg-ext');
  });

  it('merges sets when both leg-ext and leg-ext-sat were logged in the same session', () => {
    const log = buildLog({
      date: '2026-05-02',
      dayId: 'saturday',
      exercises: [
        { exerciseId: 'leg-ext', sets: [{ setNumber: 1, weight: 60, reps: 15 }] },
        { exerciseId: 'leg-ext-sat', sets: [{ setNumber: 1, weight: 65, reps: 12 }] },
      ],
    });
    const migrated = migrateWorkoutLogV3(log);
    expect(migrated.exercises).toHaveLength(1);
    const merged = migrated.exercises[0];
    expect(merged.exerciseId).toBe('leg-ext');
    expect(merged.sets.map((s) => s.setNumber)).toEqual([1, 2]);
    expect(merged.sets.map((s) => s.weight)).toEqual([60, 65]);
  });
});

describe('migrateWorkoutLogV3 — forearm split', () => {
  it('replaces a combined forearm-curls log with a curls + ext pair', () => {
    const log = buildLog({
      date: '2026-05-08',
      dayId: 'friday',
      exercises: [
        {
          exerciseId: 'forearm-curls',
          sets: [
            { setNumber: 1, weight: 12, reps: 12 },
            { setNumber: 2, weight: 12, reps: 12 },
          ],
        },
      ],
    });
    const migrated = migrateWorkoutLogV3(log);
    expect(migrated.exercises.map((e) => e.exerciseId).sort()).toEqual([
      'forearm-curls',
      'forearm-ext',
    ]);
    expect(migrated.exercises.find((e) => e.exerciseId === 'forearm-curls')!.sets).toHaveLength(1);
    expect(migrated.exercises.find((e) => e.exerciseId === 'forearm-ext')!.sets).toHaveLength(1);
  });

  it('strips stale isPersonalRecord flags so PRs can be re-derived chronologically', () => {
    const log = buildLog({
      date: '2026-05-08',
      dayId: 'friday',
      exercises: [
        {
          exerciseId: 'forearm-curls',
          sets: [
            { setNumber: 1, weight: 12, reps: 12, isPersonalRecord: true },
            { setNumber: 2, weight: 12, reps: 12, isPersonalRecord: false },
          ],
        },
      ],
    });
    const migrated = migrateWorkoutLogV3(log);
    migrated.exercises.forEach((ex) =>
      ex.sets.forEach((s) => expect(s.isPersonalRecord).toBeUndefined()),
    );
  });
});

describe('recomputePersonalRecords', () => {
  it('walks logs chronologically and emits one PR per exercise (latest max)', () => {
    const logs: WorkoutLog[] = [
      buildLog({
        date: '2026-04-15',
        dayId: 'monday',
        exercises: [
          { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
        ],
      }),
      buildLog({
        date: '2026-04-22',
        dayId: 'monday',
        exercises: [
          {
            exerciseId: 'bb-bench',
            sets: [
              { setNumber: 1, weight: 82.5, reps: 5 },
              { setNumber: 2, weight: 80, reps: 8 },
            ],
          },
        ],
      }),
    ];
    const { personalRecords, logs: outLogs } = recomputePersonalRecords(logs);
    expect(personalRecords).toHaveLength(1);
    expect(personalRecords[0].exerciseId).toBe('bb-bench');
    expect(personalRecords[0].weight).toBe(82.5);
    expect(personalRecords[0].previousBest).toBe(80);
    expect(personalRecords[0].date).toBe('2026-04-22');

    // Only the new max (82.5) gets the per-set PR flag.
    const flagged = outLogs
      .flatMap((l) => l.exercises)
      .flatMap((e) => e.sets)
      .filter((s) => s.isPersonalRecord);
    expect(flagged).toHaveLength(2); // 80 (first ever) + 82.5 (new max)
  });

  it('returns empty PR list when no logs exist', () => {
    const { personalRecords } = recomputePersonalRecords([]);
    expect(personalRecords).toEqual([]);
  });

  it('handles logs sorted out of order and respects startedAt as a tiebreaker', () => {
    const logs: WorkoutLog[] = [
      buildLog({
        id: 'b',
        date: '2026-05-01',
        dayId: 'friday',
        startedAt: 2,
        exercises: [
          { exerciseId: 'bb-curl', sets: [{ setNumber: 1, weight: 25, reps: 10 }] },
        ],
      }),
      buildLog({
        id: 'a',
        date: '2026-05-01',
        dayId: 'friday',
        startedAt: 1,
        exercises: [
          { exerciseId: 'bb-curl', sets: [{ setNumber: 1, weight: 22.5, reps: 10 }] },
        ],
      }),
    ];
    const { personalRecords } = recomputePersonalRecords(logs);
    expect(personalRecords[0].weight).toBe(25);
    expect(personalRecords[0].previousBest).toBe(22.5);
  });
});

describe('migrateWorkoutPlanV3', () => {
  const samplePlan: WorkoutDay[] = [
    {
      id: 'wednesday',
      dayName: 'Wednesday',
      label: 'Legs + Abs',
      focus: 'strength',
      exercises: [
        { id: 'wed-1', exerciseId: 'standing-calf', order: 1, targetSets: 4, targetReps: '10' },
      ],
    },
    {
      id: 'saturday',
      dayName: 'Saturday',
      label: 'Legs + Athletic',
      focus: 'athletic',
      exercises: [
        { id: 'sat-1', exerciseId: 'leg-ext-sat', order: 1, targetSets: 3, targetReps: '15' },
        { id: 'sat-2', exerciseId: 'standing-calf', order: 2, targetSets: 4, targetReps: '15' },
      ],
    },
  ];

  it('renames retired exercise ids in the persisted plan', () => {
    const out = migrateWorkoutPlanV3(samplePlan);
    const wed = out.find((d) => d.id === 'wednesday')!;
    const sat = out.find((d) => d.id === 'saturday')!;
    expect(wed.exercises[0].exerciseId).toBe('standing-calf'); // untouched
    expect(sat.exercises[0].exerciseId).toBe('leg-ext');
    expect(sat.exercises[1].exerciseId).toBe('seated-calf');
  });

  it('preserves planning metadata (id, order, sets, reps) when renaming', () => {
    const out = migrateWorkoutPlanV3(samplePlan);
    const sat = out.find((d) => d.id === 'saturday')!;
    expect(sat.exercises[1]).toMatchObject({
      id: 'sat-2',
      order: 2,
      targetSets: 4,
      targetReps: '15',
    });
  });

  it('is idempotent — already-migrated plans pass through untouched', () => {
    const once = migrateWorkoutPlanV3(samplePlan);
    const twice = migrateWorkoutPlanV3(once);
    expect(twice).toEqual(once);
  });
});
