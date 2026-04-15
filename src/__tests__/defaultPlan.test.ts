import { describe, it, expect } from 'vitest';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { getExerciseById } from '@/data/exercises';

describe('defaultWorkoutPlan', () => {
  it('has 6 training days', () => {
    expect(defaultWorkoutPlan.length).toBe(6);
  });

  it('covers Monday through Saturday', () => {
    const days = defaultWorkoutPlan.map((d) => d.dayName);
    expect(days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  });

  it('each day has exercises', () => {
    defaultWorkoutPlan.forEach((day) => {
      expect(day.exercises.length).toBeGreaterThan(0);
    });
  });

  it('all exercise references are valid', () => {
    defaultWorkoutPlan.forEach((day) => {
      day.exercises.forEach((ex) => {
        const found = getExerciseById(ex.exerciseId);
        expect(found).toBeDefined();
      });
    });
  });

  it('exercises are ordered sequentially', () => {
    defaultWorkoutPlan.forEach((day) => {
      day.exercises.forEach((ex, i) => {
        expect(ex.order).toBe(i + 1);
      });
    });
  });

  it('has Push days on Monday and Thursday', () => {
    expect(defaultWorkoutPlan[0].label).toBe('Push');
    expect(defaultWorkoutPlan[3].label).toBe('Push');
  });

  it('has Pull days on Tuesday and Friday', () => {
    expect(defaultWorkoutPlan[1].label).toBe('Pull');
    expect(defaultWorkoutPlan[4].label).toBe('Pull');
  });

  it('has Leg days on Wednesday and Saturday', () => {
    expect(defaultWorkoutPlan[2].label).toContain('Legs');
    expect(defaultWorkoutPlan[5].label).toContain('Legs');
  });

  it('Monday is strength focus', () => {
    expect(defaultWorkoutPlan[0].focus).toBe('strength');
  });

  it('Thursday is hypertrophy focus', () => {
    expect(defaultWorkoutPlan[3].focus).toBe('hypertrophy');
  });

  it('Saturday is athletic focus', () => {
    expect(defaultWorkoutPlan[5].focus).toBe('athletic');
  });

  it('each exercise has valid targetSets', () => {
    defaultWorkoutPlan.forEach((day) => {
      day.exercises.forEach((ex) => {
        expect(ex.targetSets).toBeGreaterThan(0);
        expect(ex.targetSets).toBeLessThanOrEqual(4);
      });
    });
  });

  it('each exercise has targetReps string', () => {
    defaultWorkoutPlan.forEach((day) => {
      day.exercises.forEach((ex) => {
        expect(ex.targetReps).toBeTruthy();
        expect(typeof ex.targetReps).toBe('string');
      });
    });
  });
});
