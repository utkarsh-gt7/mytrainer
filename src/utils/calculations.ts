import type { BodyMetrics, CalorieLog, WorkoutLog, UserProfile } from '@/types';

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateBodyFatEstimate(
  waist: number,
  neck: number,
  heightCm: number,
  isMale = true,
): number {
  if (isMale) {
    return Math.round(
      (495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450) * 10,
    ) / 10;
  }
  return 0;
}

export function calculateMaintenanceCalories(profile: UserProfile): number {
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  return Math.round(bmr * 1.55);
}

export function getDailyCalorieTarget(profile: UserProfile, isTrainingDay: boolean): number {
  const maintenance = profile.maintenanceCalories || calculateMaintenanceCalories(profile);
  switch (profile.goal) {
    case 'recomp':
      return isTrainingDay ? maintenance + 150 : maintenance - 250;
    case 'bulk':
      return maintenance + 350;
    case 'cut':
      return maintenance - 500;
    default:
      return maintenance;
  }
}

export function getProteinTarget(weight: number): number {
  return Math.round(weight * 2.2);
}

export function getWeeklyWeightChange(metrics: BodyMetrics[]): number {
  if (metrics.length < 2) return 0;
  const sorted = [...metrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return Math.round((sorted[0].weight - sorted[1].weight) * 10) / 10;
}

export function getWorkoutCompletionRate(logs: WorkoutLog[], daysPlanned: number): number {
  if (daysPlanned === 0) return 0;
  const completed = logs.filter((l) => l.completed).length;
  return Math.round((completed / daysPlanned) * 100);
}

export function getAverageDailyCalories(logs: CalorieLog[]): number {
  if (logs.length === 0) return 0;
  const total = logs.reduce(
    (sum, log) => sum + log.meals.reduce((s, m) => s + m.calories, 0),
    0,
  );
  return Math.round(total / logs.length);
}

export function getAverageDailyProtein(logs: CalorieLog[]): number {
  if (logs.length === 0) return 0;
  const total = logs.reduce(
    (sum, log) => sum + log.meals.reduce((s, m) => s + m.protein, 0),
    0,
  );
  return Math.round(total / logs.length);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
