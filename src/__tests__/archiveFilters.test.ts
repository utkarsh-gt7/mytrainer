import { describe, it, expect } from 'vitest';
import type { WorkoutLog } from '@/types';
import {
  collectMuscleGroups,
  filterWorkoutLogs,
  summarizeLog,
  topSetsByExercise,
} from '@/utils/archiveFilters';

const log = (
  id: string,
  date: string,
  dayId: string,
  exercises: WorkoutLog['exercises'],
  completed = true,
): WorkoutLog => ({ id, date, dayId, exercises, completed });

describe('filterWorkoutLogs', () => {
  const fixtures: WorkoutLog[] = [
    log('mon', '2026-04-13', 'monday', [
      { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
    ]),
    log('wed', '2026-04-15', 'wednesday', [
      { exerciseId: 'back-squat', sets: [{ setNumber: 1, weight: 100, reps: 5 }] },
    ]),
    log('fri', '2026-04-17', 'friday', [
      { exerciseId: 'lat-pulldown', sets: [{ setNumber: 1, weight: 60, reps: 12 }] },
      { exerciseId: 'bb-curl', sets: [{ setNumber: 1, weight: 25, reps: 10 }] },
    ]),
    log('sat', '2026-04-18', 'saturday', [
      { exerciseId: 'hack-squat', sets: [{ setNumber: 1, weight: 120, reps: 10 }] },
    ]),
    log('inprog', '2026-05-08', 'friday', [
      { exerciseId: 'bb-curl', sets: [{ setNumber: 1, weight: 27.5, reps: 8 }] },
    ], false),
  ];

  it('orders results newest-first', () => {
    const out = filterWorkoutLogs(fixtures, {});
    expect(out[0].id).toBe('sat');
    expect(out[out.length - 1].id).toBe('mon');
  });

  it('drops in-progress sessions by default', () => {
    const out = filterWorkoutLogs(fixtures, {});
    expect(out.find((l) => l.id === 'inprog')).toBeUndefined();
  });

  it('opts back into in-progress sessions when completedOnly is false', () => {
    const out = filterWorkoutLogs(fixtures, { completedOnly: false });
    expect(out.find((l) => l.id === 'inprog')).toBeDefined();
  });

  it('filters by exercise name (case-insensitive substring)', () => {
    const out = filterWorkoutLogs(fixtures, { exerciseQuery: 'curl' });
    expect(out.map((l) => l.id)).toEqual(['fri']);
  });

  it('filters by muscle group via the exercise catalog', () => {
    const out = filterWorkoutLogs(fixtures, { muscleGroup: 'quads' });
    // back-squat is quads/glutes; hack-squat is quads.
    expect(out.map((l) => l.id).sort()).toEqual(['sat', 'wed']);
  });

  it('filters by day of the week (Saturday)', () => {
    const out = filterWorkoutLogs(fixtures, { dayOfWeek: 'Saturday' });
    expect(out.map((l) => l.id)).toEqual(['sat']);
  });

  it('filters by inclusive date range', () => {
    const out = filterWorkoutLogs(fixtures, {
      dateFrom: '2026-04-15',
      dateTo: '2026-04-17',
    });
    expect(out.map((l) => l.id).sort()).toEqual(['fri', 'wed']);
  });

  it('combines multiple filters with AND semantics', () => {
    const out = filterWorkoutLogs(fixtures, {
      muscleGroup: 'biceps',
      dayOfWeek: 'Friday',
    });
    expect(out.map((l) => l.id)).toEqual(['fri']);
  });

  it('returns an empty list when nothing matches', () => {
    const out = filterWorkoutLogs(fixtures, { dayOfWeek: 'Sunday' });
    expect(out).toEqual([]);
  });

  it('drops sessions whose exercises have no working sets', () => {
    const empty: WorkoutLog = log('empty', '2026-04-20', 'monday', [
      { exerciseId: 'bb-bench', sets: [] },
    ]);
    const out = filterWorkoutLogs([empty], {});
    expect(out).toEqual([]);
  });
});

describe('collectMuscleGroups', () => {
  it('returns the distinct, sorted set of muscle groups across all logs', () => {
    const logs: WorkoutLog[] = [
      log('a', '2026-04-13', 'monday', [
        { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
      ]),
      log('b', '2026-04-15', 'wednesday', [
        { exerciseId: 'back-squat', sets: [{ setNumber: 1, weight: 100, reps: 5 }] },
      ]),
    ];
    const groups = collectMuscleGroups(logs);
    expect(groups).toContain('chest');
    expect(groups).toContain('quads');
    // sorted → alphabetical
    expect([...groups]).toEqual([...groups].sort());
  });
});

describe('summarizeLog', () => {
  it('counts sets, volume (kg) and PRs across exercises', () => {
    const sample = log('s', '2026-04-13', 'monday', [
      {
        exerciseId: 'bb-bench',
        sets: [
          { setNumber: 1, weight: 80, reps: 5, isPersonalRecord: true },
          { setNumber: 2, weight: 80, reps: 5 },
        ],
      },
      {
        exerciseId: 'pec-deck',
        sets: [{ setNumber: 1, weight: 50, reps: 12 }],
      },
    ]);
    const out = summarizeLog(sample);
    expect(out.totalSets).toBe(3);
    expect(out.totalVolumeKg).toBe(80 * 5 + 80 * 5 + 50 * 12);
    expect(out.prCount).toBe(1);
    expect(out.exerciseCount).toBe(2);
  });
});

describe('topSetsByExercise', () => {
  it('returns the heaviest-weight × reps set per exercise', () => {
    const sample = log('s', '2026-04-13', 'monday', [
      {
        exerciseId: 'bb-bench',
        sets: [
          { setNumber: 1, weight: 80, reps: 5 },
          { setNumber: 2, weight: 82.5, reps: 5 },
          { setNumber: 3, weight: 80, reps: 8 },
        ],
      },
    ]);
    const tops = topSetsByExercise(sample);
    expect(tops).toHaveLength(1);
    // 80×8 = 640 vs 82.5×5 = 412.5 → 80×8 wins by total volume.
    expect(tops[0].weight).toBe(80);
    expect(tops[0].reps).toBe(8);
  });
});
