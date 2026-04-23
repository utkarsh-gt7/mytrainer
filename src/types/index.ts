/* ─── Muscle & Equipment Enums ─── */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'forearms'
  | 'traps'
  | 'neck'
  | 'rear_delts'
  | 'side_delts';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'smith_machine'
  | 'other';

export type DayFocus = 'strength' | 'hypertrophy' | 'athletic';

/* ─── Exercise ─── */
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  notes?: string;
}

/* ─── Workout Plan ─── */
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: string;
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  label: string;
  focus: DayFocus;
  exercises: WorkoutExercise[];
}

/* ─── Logging ─── */
export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isPersonalRecord?: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  dayId: string;
  exercises: ExerciseLog[];
  duration?: number;
  notes?: string;
  completed: boolean;
  /** Unix ms timestamp when the workout was started. Used to resume elapsed time after a reload. */
  startedAt?: number;
}

/* ─── Body Metrics ─── */
export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  neck?: number;
}

export interface BodyMetrics {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFat?: number;
  bmi?: number;
  measurements?: BodyMeasurements;
  photoUrl?: string;
}

/* ─── Nutrition ─── */
export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  photoUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: FoodItem[];
}

export interface CalorieLog {
  id: string;
  date: string;
  meals: Meal[];
  steps?: number;
  cardioMinutes?: number;
  waterLiters?: number;
}

/* ─── Progress & Verdicts ─── */
export type VerdictRating = 'excellent' | 'good' | 'needs_improvement' | 'poor';

export interface DailyVerdict {
  rating: VerdictRating;
  summary: string;
  tips: string[];
  calorieStatus: 'surplus' | 'deficit' | 'maintenance';
  proteinHit: boolean;
}

export interface WeeklyAnalysis {
  id: string;
  weekStart: string;
  weekEnd: string;
  workoutsCompleted: number;
  workoutsPlanned: number;
  avgCalories: number;
  avgProtein: number;
  weightChange: number;
  bodyFatChange?: number;
  personalRecords: PersonalRecord[];
  verdict: DailyVerdict;
  keyNotes: string[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
  previousBest: number;
}

/* ─── Streaks & Gamification ─── */
export interface Streak {
  current: number;
  longest: number;
  lastWorkoutDate: string;
}

/* ─── User Settings ─── */
export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  bodyFat?: number;
  goal: 'recomp' | 'bulk' | 'cut';
  maintenanceCalories: number;
  proteinTarget: number;
}
