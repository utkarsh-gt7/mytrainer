import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/firebase', () => ({
  isFirebaseConfigured: () => true,
  db: {},
  doc: (...parts: string[]) => parts.join('/'),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => ({}),
  }),
}));

import { useAppStore } from '@/store/useAppStore';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { exerciseDatabase } from '@/data/exercises';

const clonePlan = () => JSON.parse(JSON.stringify(defaultWorkoutPlan));
const cloneExercises = () => JSON.parse(JSON.stringify(exerciseDatabase));

describe('useAppStore', () => {
  beforeEach(() => {
    const { setState } = useAppStore;
    setState({
      workoutLogs: [],
      calorieLogs: [],
      bodyMetrics: [],
      personalRecords: [],
      workoutDrafts: {},
      streak: { current: 0, longest: 0, lastWorkoutDate: '' },
      workoutPlan: clonePlan(),
      exercises: cloneExercises(),
    });
  });

  describe('theme', () => {
    it('starts with dark mode on', () => {
      expect(useAppStore.getState().darkMode).toBe(true);
    });

    it('toggles dark mode', () => {
      useAppStore.getState().toggleDarkMode();
      expect(useAppStore.getState().darkMode).toBe(false);
      useAppStore.getState().toggleDarkMode();
      expect(useAppStore.getState().darkMode).toBe(true);
    });
  });

  describe('profile', () => {
    it('has default profile', () => {
      const profile = useAppStore.getState().profile;
      expect(profile.name).toBe('User');
      expect(profile.age).toBe(22);
      expect(profile.height).toBe(175);
      expect(profile.weight).toBe(72.2);
      expect(profile.goal).toBe('recomp');
    });

    it('updates profile partially', () => {
      useAppStore.getState().updateProfile({ name: 'John', weight: 75 });
      const profile = useAppStore.getState().profile;
      expect(profile.name).toBe('John');
      expect(profile.weight).toBe(75);
      expect(profile.height).toBe(175);
    });
  });

  describe('exercise library', () => {
    it('has default exercises', () => {
      expect(useAppStore.getState().exercises.length).toBeGreaterThan(0);
    });

    it('adds an exercise', () => {
      const initial = useAppStore.getState().exercises.length;
      useAppStore.getState().addExercise({
        id: 'test-ex',
        name: 'Test Exercise',
        muscleGroups: ['chest'],
        equipment: 'barbell',
      });
      expect(useAppStore.getState().exercises.length).toBe(initial + 1);
    });

    it('updates an exercise', () => {
      useAppStore.getState().updateExercise('bb-bench', { name: 'Updated Bench' });
      const ex = useAppStore.getState().exercises.find((e) => e.id === 'bb-bench');
      expect(ex?.name).toBe('Updated Bench');
    });

    it('removes an exercise', () => {
      const initial = useAppStore.getState().exercises.length;
      useAppStore.getState().removeExercise('bb-bench');
      expect(useAppStore.getState().exercises.length).toBe(initial - 1);
    });
  });

  describe('workout plan', () => {
    it('has 6 days', () => {
      expect(useAppStore.getState().workoutPlan.length).toBe(6);
    });

    it('adds exercise to day', () => {
      const mondayBefore = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      const initialCount = mondayBefore!.exercises.length;
      useAppStore.getState().addExerciseToDay('monday', 'deadlift', 3, '5');
      const monday = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      expect(monday!.exercises.length).toBe(initialCount + 1);
    });

    it('removes exercise from day', () => {
      const monday = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      const firstExId = monday!.exercises[0].id;
      const initialCount = monday!.exercises.length;
      useAppStore.getState().removeExerciseFromDay('monday', firstExId);
      const updated = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      expect(updated!.exercises.length).toBe(initialCount - 1);
    });

    it('replaces the entire plan with updateWorkoutPlan', () => {
      const plan = useAppStore.getState().workoutPlan.slice(0, 1);
      useAppStore.getState().updateWorkoutPlan(plan);
      expect(useAppStore.getState().workoutPlan).toHaveLength(1);
    });

    it('reorders exercises', () => {
      const monday = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      const secondEx = monday!.exercises[1];
      useAppStore.getState().reorderExercise('monday', secondEx.id, 1);
      const updated = useAppStore.getState().workoutPlan.find((d) => d.id === 'monday');
      expect(updated!.exercises[0].id).toBe(secondEx.id);
    });
  });

  describe('workout logging', () => {
    it('starts a workout and returns ID', () => {
      const id = useAppStore.getState().startWorkout('monday');
      expect(id).toBeTruthy();
      expect(useAppStore.getState().workoutLogs.length).toBe(1);
    });

    it('stamps startedAt on a new workout so reload can recover elapsed time', () => {
      const before = Date.now();
      const id = useAppStore.getState().startWorkout('monday');
      const after = Date.now();
      const log = useAppStore.getState().workoutLogs.find((l) => l.id === id)!;
      expect(log.startedAt).toBeDefined();
      expect(log.startedAt!).toBeGreaterThanOrEqual(before);
      expect(log.startedAt!).toBeLessThanOrEqual(after);
      expect(log.completed).toBe(false);
    });

    it('logs a set', () => {
      const id = useAppStore.getState().startWorkout('monday');
      const log = useAppStore.getState().workoutLogs.find((l) => l.id === id)!;
      const firstExId = log.exercises[0].exerciseId;
      useAppStore.getState().logSet(id, firstExId, 1, 80, 8);
      const updated = useAppStore.getState().workoutLogs.find((l) => l.id === id)!;
      const exLog = updated.exercises.find((e) => e.exerciseId === firstExId);
      expect(exLog!.sets.length).toBe(1);
      expect(exLog!.sets[0].weight).toBe(80);
      expect(exLog!.sets[0].reps).toBe(8);
    });

    it('detects personal records', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 100, 5);
      expect(useAppStore.getState().personalRecords.length).toBe(1);
      expect(useAppStore.getState().personalRecords[0].weight).toBe(100);
    });

    it('updates PR when new best', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 80, 5);
      useAppStore.getState().logSet(id, 'bb-bench', 2, 90, 5);
      const prs = useAppStore.getState().personalRecords;
      const benchPR = prs.find((p) => p.exerciseId === 'bb-bench');
      expect(benchPR!.weight).toBe(90);
      expect(benchPR!.previousBest).toBe(80);
    });

    it('completes workout and updates streak', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().completeWorkout(id, 3600);
      const log = useAppStore.getState().workoutLogs[0];
      expect(log.completed).toBe(true);
      expect(log.duration).toBe(3600);
      expect(useAppStore.getState().streak.current).toBe(1);
    });

    it('getWorkoutLog finds log by ID', () => {
      const id = useAppStore.getState().startWorkout('monday');
      const log = useAppStore.getState().getWorkoutLog(id);
      expect(log).toBeDefined();
      expect(log!.dayId).toBe('monday');
    });

    it('getWorkoutLog returns undefined for invalid ID', () => {
      expect(useAppStore.getState().getWorkoutLog('nonexistent')).toBeUndefined();
    });

    it('getTodayWorkout finds today log', () => {
      const id = useAppStore.getState().startWorkout('monday');
      const today = useAppStore.getState().getTodayWorkout();
      expect(today?.id).toBe(id);
    });

    it('logSet updates an existing set instead of appending', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 80, 8);
      useAppStore.getState().logSet(id, 'bb-bench', 1, 82.5, 7);
      const log = useAppStore.getState().workoutLogs.find((l) => l.id === id)!;
      const exLog = log.exercises.find((e) => e.exerciseId === 'bb-bench')!;
      expect(exLog.sets.length).toBe(1);
      expect(exLog.sets[0].weight).toBe(82.5);
      expect(exLog.sets[0].reps).toBe(7);
    });

    it('removeSet deletes a single set', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 80, 8);
      useAppStore.getState().logSet(id, 'bb-bench', 2, 82.5, 6);
      useAppStore.getState().removeSet(id, 'bb-bench', 1);
      const exLog = useAppStore
        .getState()
        .workoutLogs.find((l) => l.id === id)!
        .exercises.find((e) => e.exerciseId === 'bb-bench')!;
      expect(exLog.sets.length).toBe(1);
      expect(exLog.sets[0].setNumber).toBe(2);
    });

    it('removeSet is a no-op for unknown workout or exercise', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 80, 8);
      useAppStore.getState().removeSet('missing-workout', 'bb-bench', 1);
      useAppStore.getState().removeSet(id, 'missing-exercise', 1);
      const exLog = useAppStore
        .getState()
        .workoutLogs.find((l) => l.id === id)!
        .exercises.find((e) => e.exerciseId === 'bb-bench')!;
      expect(exLog.sets.length).toBe(1);
    });

    it('reopenWorkout flips completed back to false', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().completeWorkout(id, 1800);
      expect(useAppStore.getState().workoutLogs[0].completed).toBe(true);
      useAppStore.getState().reopenWorkout(id);
      expect(useAppStore.getState().workoutLogs[0].completed).toBe(false);
    });

    it('reopenWorkout leaves other workouts untouched', () => {
      const a = useAppStore.getState().startWorkout('monday');
      const b = useAppStore.getState().startWorkout('tuesday');
      useAppStore.getState().completeWorkout(a, 1800);
      useAppStore.getState().completeWorkout(b, 1800);
      useAppStore.getState().reopenWorkout(a);
      const state = useAppStore.getState().workoutLogs;
      expect(state.find((l) => l.id === a)!.completed).toBe(false);
      expect(state.find((l) => l.id === b)!.completed).toBe(true);
    });

    it('continues a streak on same-day re-complete', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().completeWorkout(id, 1000);
      const first = useAppStore.getState().streak.current;
      useAppStore.getState().reopenWorkout(id);
      useAppStore.getState().completeWorkout(id, 1200);
      expect(useAppStore.getState().streak.current).toBe(first);
    });
  });

  describe('workout drafts', () => {
    it('stores a draft for a set', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      const draft = useAppStore.getState().workoutDrafts[id]?.['bb-bench-1'];
      expect(draft).toEqual({ weight: '80', reps: '8' });
    });

    it('removes a draft when both values are empty', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '', '');
      expect(useAppStore.getState().workoutDrafts[id]).toBeUndefined();
    });

    it('keeps other drafts when one is cleared via empty values', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 2, '82', '6');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '', '');
      const drafts = useAppStore.getState().workoutDrafts[id]!;
      expect(drafts['bb-bench-1']).toBeUndefined();
      expect(drafts['bb-bench-2']).toEqual({ weight: '82', reps: '6' });
    });

    it('clearWorkoutDraft removes a single entry', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 2, '82', '6');
      useAppStore.getState().clearWorkoutDraft(id, 'bb-bench', 1);
      const drafts = useAppStore.getState().workoutDrafts[id]!;
      expect(drafts['bb-bench-1']).toBeUndefined();
      expect(drafts['bb-bench-2']).toBeDefined();
    });

    it('clearWorkoutDraft is a no-op for unknown workout', () => {
      useAppStore.getState().clearWorkoutDraft('nope', 'bb-bench', 1);
      expect(useAppStore.getState().workoutDrafts).toEqual({});
    });

    it('clearWorkoutDrafts removes everything for a workout', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 2, '82', '6');
      useAppStore.getState().clearWorkoutDrafts(id);
      expect(useAppStore.getState().workoutDrafts[id]).toBeUndefined();
    });

    it('clearWorkoutDrafts is a no-op when nothing to clear', () => {
      useAppStore.getState().clearWorkoutDrafts('missing');
      expect(useAppStore.getState().workoutDrafts).toEqual({});
    });

    it('logSet clears the matching draft entry', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().logSet(id, 'bb-bench', 1, 80, 8);
      expect(useAppStore.getState().workoutDrafts[id]).toBeUndefined();
    });

    it('completeWorkout wipes drafts for that workout', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().completeWorkout(id, 1800);
      expect(useAppStore.getState().workoutDrafts[id]).toBeUndefined();
    });

    it('clearWorkoutDraft removes the workout entry when it becomes empty', () => {
      const id = useAppStore.getState().startWorkout('monday');
      useAppStore.getState().setWorkoutDraft(id, 'bb-bench', 1, '80', '8');
      useAppStore.getState().clearWorkoutDraft(id, 'bb-bench', 1);
      expect(useAppStore.getState().workoutDrafts[id]).toBeUndefined();
    });
  });

  describe('getTodayCalories', () => {
    it('returns undefined when no log for today exists', () => {
      expect(useAppStore.getState().getTodayCalories()).toBeUndefined();
    });

    it('returns the log for today when present', () => {
      const today = new Date().toISOString().split('T')[0];
      useAppStore.getState().addMeal(today, {
        name: 'Breakfast', time: '08:00', calories: 500, protein: 30, carbs: 40, fat: 15, items: [],
      });
      const log = useAppStore.getState().getTodayCalories();
      expect(log?.date).toBe(today);
      expect(log?.meals.length).toBe(1);
    });
  });

  describe('body metrics', () => {
    it('adds body metrics with calculated BMI', () => {
      useAppStore.getState().addBodyMetrics({
        date: '2024-01-01',
        weight: 72.2,
        height: 175,
        bodyFat: 14.1,
      });
      const metrics = useAppStore.getState().bodyMetrics;
      expect(metrics.length).toBe(1);
      expect(metrics[0].bmi).toBe(23.6);
    });

    it('getLatestMetrics returns most recent', () => {
      useAppStore.getState().addBodyMetrics({ date: '2024-01-01', weight: 72, height: 175 });
      useAppStore.getState().addBodyMetrics({ date: '2024-01-08', weight: 71.5, height: 175 });
      const latest = useAppStore.getState().getLatestMetrics();
      expect(latest?.weight).toBe(71.5);
    });

    it('getLatestMetrics returns undefined when empty', () => {
      expect(useAppStore.getState().getLatestMetrics()).toBeUndefined();
    });
  });

  describe('calorie logs', () => {
    it('adds a meal to a new date', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      expect(useAppStore.getState().calorieLogs.length).toBe(1);
      expect(useAppStore.getState().calorieLogs[0].meals.length).toBe(1);
    });

    it('adds a meal to existing date', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Dinner', time: '19:00', calories: 1000, protein: 50, carbs: 70, fat: 30, items: [],
      });
      expect(useAppStore.getState().calorieLogs.length).toBe(1);
      expect(useAppStore.getState().calorieLogs[0].meals.length).toBe(2);
    });

    it('removes a meal', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      const mealId = useAppStore.getState().calorieLogs[0].meals[0].id;
      useAppStore.getState().removeMeal('2024-01-01', mealId);
      expect(useAppStore.getState().calorieLogs[0].meals.length).toBe(0);
    });

    it('updates steps for new date', () => {
      useAppStore.getState().updateSteps('2024-01-01', 8000);
      expect(useAppStore.getState().calorieLogs[0].steps).toBe(8000);
    });

    it('updates steps for existing date', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      useAppStore.getState().updateSteps('2024-01-01', 10000);
      expect(useAppStore.getState().calorieLogs[0].steps).toBe(10000);
    });

    it('updates cardio minutes for new date', () => {
      useAppStore.getState().updateCardio('2024-01-01', 30);
      const log = useAppStore.getState().calorieLogs.find((l) => l.date === '2024-01-01');
      expect(log?.cardioMinutes).toBe(30);
    });

    it('updates cardio minutes for existing date', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      useAppStore.getState().updateCardio('2024-01-01', 45);
      expect(useAppStore.getState().calorieLogs[0].cardioMinutes).toBe(45);
    });

    it('updates water for new date', () => {
      useAppStore.getState().updateWater('2024-01-01', 2.5);
      const log = useAppStore.getState().calorieLogs.find((l) => l.date === '2024-01-01');
      expect(log?.waterLiters).toBe(2.5);
    });

    it('updates water for existing date', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      useAppStore.getState().updateWater('2024-01-01', 3);
      expect(useAppStore.getState().calorieLogs[0].waterLiters).toBe(3);
    });

    it('only mutates the matching log when multiple dates are present', () => {
      useAppStore.getState().addMeal('2024-01-01', {
        name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [],
      });
      useAppStore.getState().addMeal('2024-01-02', {
        name: 'Dinner', time: '19:00', calories: 900, protein: 45, carbs: 80, fat: 25, items: [],
      });
      useAppStore.getState().updateSteps('2024-01-02', 12000);
      useAppStore.getState().updateCardio('2024-01-02', 20);
      useAppStore.getState().updateWater('2024-01-02', 2.5);
      useAppStore.getState().removeMeal('2024-01-02', useAppStore.getState().calorieLogs.find((l) => l.date === '2024-01-02')!.meals[0].id);
      const day1 = useAppStore.getState().calorieLogs.find((l) => l.date === '2024-01-01');
      const day2 = useAppStore.getState().calorieLogs.find((l) => l.date === '2024-01-02');
      expect(day1!.meals.length).toBe(1);
      expect(day1!.steps).toBeUndefined();
      expect(day2!.steps).toBe(12000);
      expect(day2!.cardioMinutes).toBe(20);
      expect(day2!.waterLiters).toBe(2.5);
      expect(day2!.meals.length).toBe(0);
    });
  });
});
