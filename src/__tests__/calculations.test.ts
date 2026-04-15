import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateBodyFatEstimate,
  calculateMaintenanceCalories,
  getDailyCalorieTarget,
  getProteinTarget,
  getWeeklyWeightChange,
  getWorkoutCompletionRate,
  getAverageDailyCalories,
  getAverageDailyProtein,
  formatDuration,
  generateId,
} from '@/utils/calculations';
import type { UserProfile, BodyMetrics, WorkoutLog, CalorieLog } from '@/types';

describe('calculateBMI', () => {
  it('calculates BMI correctly for normal weight', () => {
    expect(calculateBMI(72.2, 175)).toBe(23.6);
  });

  it('calculates BMI for edge case short height', () => {
    expect(calculateBMI(50, 150)).toBe(22.2);
  });

  it('calculates BMI for heavy weight', () => {
    expect(calculateBMI(120, 180)).toBe(37);
  });
});

describe('getBMICategory', () => {
  it('returns Underweight for BMI < 18.5', () => {
    expect(getBMICategory(17)).toBe('Underweight');
  });

  it('returns Normal for BMI 18.5-24.9', () => {
    expect(getBMICategory(22)).toBe('Normal');
  });

  it('returns Overweight for BMI 25-29.9', () => {
    expect(getBMICategory(27)).toBe('Overweight');
  });

  it('returns Obese for BMI >= 30', () => {
    expect(getBMICategory(35)).toBe('Obese');
  });

  it('returns Normal at boundary 18.5', () => {
    expect(getBMICategory(18.5)).toBe('Normal');
  });

  it('returns Overweight at boundary 25', () => {
    expect(getBMICategory(25)).toBe('Overweight');
  });

  it('returns Obese at boundary 30', () => {
    expect(getBMICategory(30)).toBe('Obese');
  });
});

describe('calculateBodyFatEstimate', () => {
  it('estimates body fat for male', () => {
    const result = calculateBodyFatEstimate(85, 38, 175, true);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(40);
  });

  it('returns 0 for female (not implemented)', () => {
    expect(calculateBodyFatEstimate(80, 35, 165, false)).toBe(0);
  });
});

describe('calculateMaintenanceCalories', () => {
  it('calculates maintenance calories using Mifflin-St Jeor', () => {
    const profile: UserProfile = {
      name: 'Test', age: 22, height: 175, weight: 72.2, goal: 'recomp',
      maintenanceCalories: 2300, proteinTarget: 160,
    };
    const result = calculateMaintenanceCalories(profile);
    expect(result).toBeGreaterThan(2000);
    expect(result).toBeLessThan(3000);
  });
});

describe('getDailyCalorieTarget', () => {
  const base: UserProfile = {
    name: 'Test', age: 22, height: 175, weight: 72.2, goal: 'recomp',
    maintenanceCalories: 2300, proteinTarget: 160,
  };

  it('returns surplus on training day for recomp', () => {
    expect(getDailyCalorieTarget(base, true)).toBe(2450);
  });

  it('returns deficit on rest day for recomp', () => {
    expect(getDailyCalorieTarget(base, false)).toBe(2050);
  });

  it('returns surplus for bulk goal', () => {
    const bulk = { ...base, goal: 'bulk' as const };
    expect(getDailyCalorieTarget(bulk, true)).toBe(2650);
    expect(getDailyCalorieTarget(bulk, false)).toBe(2650);
  });

  it('returns deficit for cut goal', () => {
    const cut = { ...base, goal: 'cut' as const };
    expect(getDailyCalorieTarget(cut, true)).toBe(1800);
  });
});

describe('getProteinTarget', () => {
  it('calculates protein at 2.2g per kg', () => {
    expect(getProteinTarget(72)).toBe(158);
  });

  it('rounds correctly', () => {
    expect(getProteinTarget(80)).toBe(176);
  });
});

describe('getWeeklyWeightChange', () => {
  it('returns 0 for less than 2 entries', () => {
    expect(getWeeklyWeightChange([])).toBe(0);
    expect(getWeeklyWeightChange([{ id: '1', date: '2024-01-01', weight: 72, height: 175 }])).toBe(0);
  });

  it('calculates positive weight change', () => {
    const metrics: BodyMetrics[] = [
      { id: '1', date: '2024-01-01', weight: 72, height: 175 },
      { id: '2', date: '2024-01-08', weight: 72.5, height: 175 },
    ];
    expect(getWeeklyWeightChange(metrics)).toBe(0.5);
  });

  it('calculates negative weight change', () => {
    const metrics: BodyMetrics[] = [
      { id: '1', date: '2024-01-01', weight: 72, height: 175 },
      { id: '2', date: '2024-01-08', weight: 71.3, height: 175 },
    ];
    expect(getWeeklyWeightChange(metrics)).toBe(-0.7);
  });
});

describe('getWorkoutCompletionRate', () => {
  it('returns 0 when no workouts planned', () => {
    expect(getWorkoutCompletionRate([], 0)).toBe(0);
  });

  it('calculates completion rate', () => {
    const logs: WorkoutLog[] = [
      { id: '1', date: '2024-01-01', dayId: 'mon', exercises: [], completed: true },
      { id: '2', date: '2024-01-02', dayId: 'tue', exercises: [], completed: true },
      { id: '3', date: '2024-01-03', dayId: 'wed', exercises: [], completed: false },
    ];
    expect(getWorkoutCompletionRate(logs, 6)).toBe(33);
  });

  it('returns 100 for all completed', () => {
    const logs: WorkoutLog[] = [
      { id: '1', date: '2024-01-01', dayId: 'mon', exercises: [], completed: true },
      { id: '2', date: '2024-01-02', dayId: 'tue', exercises: [], completed: true },
    ];
    expect(getWorkoutCompletionRate(logs, 2)).toBe(100);
  });
});

describe('getAverageDailyCalories', () => {
  it('returns 0 for empty logs', () => {
    expect(getAverageDailyCalories([])).toBe(0);
  });

  it('calculates average correctly', () => {
    const logs: CalorieLog[] = [
      { id: '1', date: '2024-01-01', meals: [{ id: 'm1', name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [] }] },
      { id: '2', date: '2024-01-02', meals: [{ id: 'm2', name: 'Dinner', time: '19:00', calories: 1200, protein: 60, carbs: 80, fat: 30, items: [] }] },
    ];
    expect(getAverageDailyCalories(logs)).toBe(1000);
  });
});

describe('getAverageDailyProtein', () => {
  it('returns 0 for empty logs', () => {
    expect(getAverageDailyProtein([])).toBe(0);
  });

  it('calculates average protein', () => {
    const logs: CalorieLog[] = [
      { id: '1', date: '2024-01-01', meals: [{ id: 'm1', name: 'Lunch', time: '12:00', calories: 800, protein: 40, carbs: 60, fat: 20, items: [] }] },
      { id: '2', date: '2024-01-02', meals: [{ id: 'm2', name: 'Dinner', time: '19:00', calories: 1200, protein: 60, carbs: 80, fat: 30, items: [] }] },
    ];
    expect(getAverageDailyProtein(logs)).toBe(50);
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(300)).toBe('5:00');
  });

  it('pads single digit seconds', () => {
    expect(formatDuration(61)).toBe('1:01');
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('generates string IDs', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('generates IDs with timestamp prefix', () => {
    const id = generateId();
    expect(id).toContain('-');
  });
});
