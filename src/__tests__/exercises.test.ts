import { describe, it, expect } from 'vitest';
import { exerciseDatabase, getExerciseById, searchExercises } from '@/data/exercises';

describe('exerciseDatabase', () => {
  it('contains exercises', () => {
    expect(exerciseDatabase.length).toBeGreaterThan(0);
  });

  it('all exercises have required fields', () => {
    exerciseDatabase.forEach((ex) => {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.muscleGroups.length).toBeGreaterThan(0);
      expect(ex.equipment).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = exerciseDatabase.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('getExerciseById', () => {
  it('returns exercise for valid ID', () => {
    const ex = getExerciseById('bb-bench');
    expect(ex).toBeDefined();
    expect(ex?.name).toBe('Barbell Bench Press');
  });

  it('returns undefined for invalid ID', () => {
    expect(getExerciseById('nonexistent')).toBeUndefined();
  });

  it('finds deadlift', () => {
    const ex = getExerciseById('deadlift');
    expect(ex?.name).toBe('Deadlift');
    expect(ex?.muscleGroups).toContain('back');
  });
});

describe('searchExercises', () => {
  it('finds exercises by name', () => {
    const results = searchExercises('bench');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((e) => e.name.toLowerCase().includes('bench'))).toBe(true);
  });

  it('finds exercises by muscle group', () => {
    const results = searchExercises('chest');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((e) => e.muscleGroups.includes('chest'))).toBe(true);
  });

  it('finds exercises by equipment', () => {
    const results = searchExercises('cable');
    expect(results.length).toBeGreaterThan(0);
  });

  it('is case insensitive', () => {
    const upper = searchExercises('BENCH');
    const lower = searchExercises('bench');
    expect(upper.length).toBe(lower.length);
  });

  it('returns empty for no match', () => {
    expect(searchExercises('zzzznonexistent')).toHaveLength(0);
  });
});
