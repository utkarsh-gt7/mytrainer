import { describe, it, expect } from 'vitest';
import type { PersonalRecord, WorkoutLog } from '@/types';
import {
  computeOverloadSuggestion,
  findPreviousSession,
  getRecentSessions,
  parseRepTarget,
} from '@/utils/exerciseHistory';

const makeLog = (
  date: string,
  dayId: string,
  exerciseId: string,
  setReps: Array<[number, number]>,
  overrides: Partial<WorkoutLog> = {},
): WorkoutLog => ({
  id: overrides.id ?? `${dayId}-${date}`,
  date,
  dayId,
  exercises: [
    {
      exerciseId,
      sets: setReps.map(([weight, reps], i) => ({ setNumber: i + 1, weight, reps })),
    },
  ],
  completed: overrides.completed ?? true,
  duration: overrides.duration,
  startedAt: overrides.startedAt,
  notes: overrides.notes,
});

describe('parseRepTarget', () => {
  it('parses single-rep targets', () => {
    expect(parseRepTarget('5')).toEqual({ min: 5, max: 5 });
  });
  it('parses ranges', () => {
    expect(parseRepTarget('5-8')).toEqual({ min: 5, max: 8 });
    expect(parseRepTarget('15-20')).toEqual({ min: 15, max: 20 });
  });
  it('extracts the first number from "12 each side"', () => {
    expect(parseRepTarget('12 each side')).toEqual({ min: 12, max: 12 });
  });
  it('extracts numbers from compound suffixes', () => {
    expect(parseRepTarget('12/leg')).toEqual({ min: 12, max: 12 });
  });
  it('returns null for non-numeric targets', () => {
    expect(parseRepTarget('AMRAP')).toBeNull();
    expect(parseRepTarget('')).toBeNull();
  });
});

describe('findPreviousSession', () => {
  const logs: WorkoutLog[] = [
    /* Tuesday — biceps-leaning pull session */
    makeLog('2026-04-28', 'tuesday', 'incline-curl', [
      [10, 10],
      [10, 9],
    ]),
    /* Friday — same exercise, more recent */
    makeLog('2026-05-01', 'friday', 'incline-curl', [
      [12, 8],
      [12, 7],
    ]),
    /* Saturday — different exercise */
    makeLog('2026-05-02', 'saturday', 'hack-squat', [[100, 10]]),
    /* In-progress today */
    {
      id: 'today',
      date: '2026-05-08',
      dayId: 'friday',
      exercises: [
        { exerciseId: 'incline-curl', sets: [{ setNumber: 1, weight: 13, reps: 8 }] },
      ],
      completed: false,
    },
  ];

  it('returns the absolute most recent prior session for the exercise (across days)', () => {
    const prev = findPreviousSession(logs, 'incline-curl', { beforeDate: '2026-05-08' });
    expect(prev).not.toBeNull();
    expect(prev!.log.date).toBe('2026-05-01');
    expect(prev!.exerciseLog.sets[0].weight).toBe(12);
  });

  it('skips the in-progress workout when its id is excluded', () => {
    const prev = findPreviousSession(logs, 'incline-curl', {
      excludeWorkoutId: 'today',
      beforeDate: '2026-05-09',
    });
    expect(prev?.log.date).toBe('2026-05-01');
  });

  it('only counts completed sessions by default', () => {
    const prev = findPreviousSession([logs[3]], 'incline-curl');
    expect(prev).toBeNull();
  });

  it('returns null when no prior session exists', () => {
    const prev = findPreviousSession([], 'incline-curl', { beforeDate: '2026-05-08' });
    expect(prev).toBeNull();
  });

  it('only matches logs that actually contain working sets for the exercise', () => {
    const empty: WorkoutLog = {
      id: 'empty-session',
      date: '2026-05-01',
      dayId: 'friday',
      exercises: [{ exerciseId: 'incline-curl', sets: [] }],
      completed: true,
    };
    expect(findPreviousSession([empty], 'incline-curl', { beforeDate: '2026-05-08' })).toBeNull();
  });
});

describe('getRecentSessions', () => {
  it('returns up to N sessions newest first', () => {
    const logs: WorkoutLog[] = [
      makeLog('2026-04-15', 'monday', 'bb-bench', [[80, 5]]),
      makeLog('2026-04-22', 'monday', 'bb-bench', [[82.5, 5]]),
      makeLog('2026-04-29', 'monday', 'bb-bench', [[85, 5]]),
    ];
    const recent = getRecentSessions(logs, 'bb-bench', 2, { beforeDate: '2026-05-01' });
    expect(recent.map((r) => r.log.date)).toEqual(['2026-04-29', '2026-04-22']);
  });
});

describe('computeOverloadSuggestion', () => {
  it('emits a friendly first-time message when there is no prior session', () => {
    const out = computeOverloadSuggestion({ targetReps: '8-10' });
    expect(out.strategy).toBe('first-time');
    expect(out.reps).toBe(8);
  });

  it('adds weight when every set hit the top of the rep range', () => {
    const previous = {
      log: makeLog('2026-05-01', 'friday', 'bb-curl', [
        [25, 12],
        [25, 12],
        [25, 12],
      ]),
      exerciseLog: {
        exerciseId: 'bb-curl',
        sets: [
          { setNumber: 1, weight: 25, reps: 12 },
          { setNumber: 2, weight: 25, reps: 12 },
          { setNumber: 3, weight: 25, reps: 12 },
        ],
      },
    };
    const out = computeOverloadSuggestion({ previous, targetReps: '10-12' });
    expect(out.strategy).toBe('increase-weight');
    expect(out.weight).toBe(27.5);
    expect(out.reps).toBe(10);
    expect(out.headline).toMatch(/Add 2\.5 kg/);
  });

  it('pushes reps when inside the rep range', () => {
    const previous = {
      log: makeLog('2026-05-01', 'monday', 'bb-bench', [[80, 6]]),
      exerciseLog: {
        exerciseId: 'bb-bench',
        sets: [{ setNumber: 1, weight: 80, reps: 6 }],
      },
    };
    const out = computeOverloadSuggestion({ previous, targetReps: '5-8' });
    expect(out.strategy).toBe('increase-reps');
    expect(out.weight).toBe(80);
    expect(out.reps).toBe(7);
  });

  it('caps the rep push at the top of the range', () => {
    const previous = {
      log: makeLog('2026-05-01', 'monday', 'bb-bench', [[80, 8]]),
      exerciseLog: {
        exerciseId: 'bb-bench',
        sets: [{ setNumber: 1, weight: 80, reps: 8 }],
      },
    };
    // 8 reps already at the top of 5-8 → should add weight, not push reps to 9.
    const out = computeOverloadSuggestion({ previous, targetReps: '5-8' });
    expect(out.strategy).toBe('increase-weight');
    expect(out.reps).toBe(5);
  });

  it('consolidates when the user fell short of the rep floor', () => {
    const previous = {
      log: makeLog('2026-05-01', 'monday', 'bb-bench', [[100, 3]]),
      exerciseLog: {
        exerciseId: 'bb-bench',
        sets: [{ setNumber: 1, weight: 100, reps: 3 }],
      },
    };
    const out = computeOverloadSuggestion({ previous, targetReps: '5-8' });
    expect(out.strategy).toBe('consolidate');
    expect(out.weight).toBe(100);
    expect(out.reps).toBe(5);
  });

  it('weaves the all-time PR into the rationale when available', () => {
    const previous = {
      log: makeLog('2026-05-01', 'monday', 'bb-bench', [[80, 6]]),
      exerciseLog: {
        exerciseId: 'bb-bench',
        sets: [{ setNumber: 1, weight: 80, reps: 6 }],
      },
    };
    const pr: PersonalRecord = {
      id: 'pr1',
      exerciseId: 'bb-bench',
      date: '2026-04-01',
      weight: 90,
      reps: 5,
      previousBest: 85,
    };
    const out = computeOverloadSuggestion({ previous, pr, targetReps: '5-8' });
    expect(out.rationale).toMatch(/PR is 90 kg × 5/);
  });
});
