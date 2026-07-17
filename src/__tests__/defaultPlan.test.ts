import { describe, it, expect } from 'vitest';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { getExerciseById } from '@/data/exercises';

describe('defaultWorkoutPlan', () => {
  it('has 5 training days', () => {
    expect(defaultWorkoutPlan.length).toBe(5);
  });

  it('covers Monday, Tuesday, Wednesday, Friday, Saturday', () => {
    const days = defaultWorkoutPlan.map((d) => d.dayName);
    expect(days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday']);
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

  it('has Push day on Monday', () => {
    expect(defaultWorkoutPlan[0].label).toBe('Push');
  });

  it('has Pull day on Tuesday', () => {
    expect(defaultWorkoutPlan[1].label).toBe('Pull');
  });

  it('has leg days on Wednesday and Saturday', () => {
    expect(defaultWorkoutPlan[2].label).toContain('Legs');
    expect(defaultWorkoutPlan[4].label).toContain('Legs');
  });

  it('Monday is strength focus', () => {
    expect(defaultWorkoutPlan[0].focus).toBe('strength');
  });

  it('Friday is hypertrophy focus', () => {
    expect(defaultWorkoutPlan[3].focus).toBe('hypertrophy');
  });

  it('merges Thursday and Friday into a shorter Friday upper workout', () => {
    const friday = defaultWorkoutPlan.find((d) => d.id === 'friday')!;
    const exerciseIds = friday.exercises.map((exercise) => exercise.exerciseId);
    const targetSets = friday.exercises.reduce((total, exercise) => total + exercise.targetSets, 0);

    expect(defaultWorkoutPlan.some((day) => day.id === 'thursday')).toBe(false);
    expect(friday.label).toBe('Upper');
    expect(friday.exercises).toHaveLength(14);
    expect(targetSets).toBe(32);
    expect(exerciseIds).toEqual([
      'machine-chest',
      'lat-pulldown',
      'db-shoulder',
      'wide-cable-row',
      'cable-fly',
      'lateral-machine',
      'rear-delt-machine',
      'cable-skull',
      'bb-curl',
      'lean-pushdown',
      'db-shrugs',
      'bayesian-curl',
      'hammer-rope',
      'neck-curl',
    ]);
  });

  it('keeps Tuesday pull work concise while retaining cable pullovers', () => {
    const tuesday = defaultWorkoutPlan.find((d) => d.id === 'tuesday')!;
    const targetSets = tuesday.exercises.reduce((total, exercise) => total + exercise.targetSets, 0);

    expect(tuesday.exercises).toHaveLength(11);
    expect(targetSets).toBe(27);
    expect(tuesday.exercises.find((exercise) => exercise.exerciseId === 'cable-pullover')?.targetSets).toBe(2);
    expect(tuesday.exercises.find((exercise) => exercise.exerciseId === 'face-pull')?.targetSets).toBe(2);
    expect(tuesday.exercises.find((exercise) => exercise.exerciseId === 'db-shrugs')?.targetSets).toBe(2);
  });

  it('uses two hard sets for isolation work while retaining compound volume', () => {
    const dailySets = defaultWorkoutPlan.map((day) =>
      day.exercises.reduce((total, exercise) => total + exercise.targetSets, 0),
    );
    const isolationExerciseIds = new Set([
      'pec-deck', 'cable-lateral', 'cable-skull', 'cable-pushdown', 'neck-curl',
      'cable-pullover', 'face-pull', 'db-shrugs', 'incline-curl', 'preacher-curl',
      'hammer-db', 'forearm-curls', 'forearm-ext', 'leg-ext', 'seated-ham',
      'cable-crunch', 'hanging-knee', 'pallof-press', 'cable-fly', 'rear-delt-machine',
      'bb-curl', 'lean-pushdown', 'db-shrugs', 'bayesian-curl', 'hammer-rope', 'lying-ham',
    ]);

    expect(dailySets).toEqual([21, 27, 23, 32, 23]);
    expect(defaultWorkoutPlan.flatMap((day) => day.exercises)
      .filter((exercise) => isolationExerciseIds.has(exercise.exerciseId))
      .every((exercise) => exercise.targetSets === 2)).toBe(true);
    expect(defaultWorkoutPlan.flatMap((day) => day.exercises)
      .filter((exercise) => ['standing-calf', 'seated-calf'].includes(exercise.exerciseId))
      .every((exercise) => exercise.targetSets === 4)).toBe(true);
    expect(defaultWorkoutPlan.find((day) => day.id === 'friday')!.exercises
      .find((exercise) => exercise.exerciseId === 'lateral-machine')?.targetSets).toBe(3);
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

  it('logs forearm curls and extensions as separate exercises on Tuesday pull day', () => {
    const tuesday = defaultWorkoutPlan.find((d) => d.id === 'tuesday')!;
    const ids = tuesday.exercises.map((e) => e.exerciseId);
    expect(ids).toContain('forearm-curls');
    expect(ids).toContain('forearm-ext');
  });

  it('does not reference the retired leg-ext-sat id', () => {
    defaultWorkoutPlan.forEach((day) => {
      day.exercises.forEach((ex) => {
        expect(ex.exerciseId).not.toBe('leg-ext-sat');
      });
    });
  });

  it('uses seated calf raise on Saturday and standing on Wednesday', () => {
    const wed = defaultWorkoutPlan.find((d) => d.id === 'wednesday')!;
    const sat = defaultWorkoutPlan.find((d) => d.id === 'saturday')!;
    expect(wed.exercises.some((e) => e.exerciseId === 'standing-calf')).toBe(true);
    expect(wed.exercises.some((e) => e.exerciseId === 'seated-calf')).toBe(false);
    expect(sat.exercises.some((e) => e.exerciseId === 'seated-calf')).toBe(true);
    expect(sat.exercises.some((e) => e.exerciseId === 'standing-calf')).toBe(false);
  });

  it('caps weekly direct quad volume at the recommended MAV ceiling', () => {
    const quadExerciseIds = new Set(['back-squat', 'leg-press', 'leg-ext', 'hack-squat', 'walking-lunge']);
    const weeklyQuadSets = defaultWorkoutPlan.reduce((sum, day) => {
      return (
        sum +
        day.exercises
          .filter((e) => quadExerciseIds.has(e.exerciseId))
          .reduce((s, e) => s + e.targetSets, 0)
      );
    }, 0);
    // Hypertrophy science: quads MAV is ~12-18 sets/wk for natural lifters in recomp.
    expect(weeklyQuadSets).toBeLessThanOrEqual(18);
    expect(weeklyQuadSets).toBeGreaterThanOrEqual(12);
  });
});
