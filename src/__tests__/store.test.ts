import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    const { setState } = useAppStore;
    setState({
      workoutLogs: [],
      calorieLogs: [],
      bodyMetrics: [],
      personalRecords: [],
      streak: { current: 0, longest: 0, lastWorkoutDate: '' },
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
  });
});
