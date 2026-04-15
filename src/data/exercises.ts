import type { Exercise } from '@/types';

export const exerciseDatabase: Exercise[] = [
  /* ─── Chest ─── */
  { id: 'bb-bench', name: 'Barbell Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell' },
  { id: 'incline-db', name: 'Incline Dumbbell Press', muscleGroups: ['chest', 'shoulders'], equipment: 'dumbbell' },
  { id: 'machine-chest', name: 'Machine Chest Press', muscleGroups: ['chest', 'triceps'], equipment: 'machine' },
  { id: 'pec-deck', name: 'Pec Deck Fly', muscleGroups: ['chest'], equipment: 'machine' },
  { id: 'flat-db', name: 'Flat Dumbbell Press', muscleGroups: ['chest', 'triceps'], equipment: 'dumbbell' },
  { id: 'cable-fly', name: 'Cable Crossover Fly', muscleGroups: ['chest'], equipment: 'cable' },

  /* ─── Shoulders ─── */
  { id: 'ohp-smith', name: 'Overhead Smith Machine Press', muscleGroups: ['shoulders', 'triceps'], equipment: 'smith_machine' },
  { id: 'db-shoulder', name: 'Dumbbell Shoulder Press', muscleGroups: ['shoulders', 'triceps'], equipment: 'dumbbell' },
  { id: 'cable-lateral', name: 'Cable Lateral Raise', muscleGroups: ['side_delts'], equipment: 'cable' },
  { id: 'lateral-machine', name: 'Lateral Raise Machine', muscleGroups: ['side_delts'], equipment: 'machine' },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['rear_delts', 'traps'], equipment: 'cable' },
  { id: 'rear-delt-machine', name: 'Rear Delt Machine', muscleGroups: ['rear_delts', 'traps'], equipment: 'machine' },

  /* ─── Triceps ─── */
  { id: 'cable-skull', name: 'Cable Skull Crushers', muscleGroups: ['triceps'], equipment: 'cable' },
  { id: 'cable-pushdown', name: 'Cable Pushdowns', muscleGroups: ['triceps'], equipment: 'cable' },
  { id: 'lean-pushdown', name: 'Leaning Cable Pushdowns', muscleGroups: ['triceps'], equipment: 'cable' },

  /* ─── Back ─── */
  { id: 'deadlift', name: 'Deadlift', muscleGroups: ['back', 'hamstrings', 'glutes'], equipment: 'barbell' },
  { id: 'weighted-pullup', name: 'Weighted Pull-ups', muscleGroups: ['back', 'biceps'], equipment: 'bodyweight' },
  { id: 'chest-row', name: 'Chest Supported Row', muscleGroups: ['back', 'traps'], equipment: 'machine' },
  { id: 'lat-pulldown', name: 'Lat Pulldown Wide', muscleGroups: ['back', 'biceps'], equipment: 'cable' },
  { id: 'wide-cable-row', name: 'Wide Grip Cable Row (to chest)', muscleGroups: ['back', 'traps', 'rear_delts'], equipment: 'cable' },
  { id: 'cable-pullover', name: 'Cable Pullovers', muscleGroups: ['back'], equipment: 'cable' },
  { id: 'cable-shrugs', name: 'Cable Shrugs', muscleGroups: ['traps'], equipment: 'cable' },

  /* ─── Biceps ─── */
  { id: 'incline-curl', name: 'Incline Curls', muscleGroups: ['biceps'], equipment: 'dumbbell' },
  { id: 'preacher-curl', name: 'Preacher Dumbbell Curls', muscleGroups: ['biceps'], equipment: 'dumbbell' },
  { id: 'hammer-db', name: 'Hammer Curls (Dumbbell)', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell' },
  { id: 'bb-curl', name: 'Barbell Curls', muscleGroups: ['biceps'], equipment: 'barbell' },
  { id: 'bayesian-curl', name: 'Bayesian Curls', muscleGroups: ['biceps'], equipment: 'cable' },
  { id: 'hammer-rope', name: 'Hammer Curl Rope', muscleGroups: ['biceps', 'forearms'], equipment: 'cable' },

  /* ─── Forearms ─── */
  { id: 'forearm-curls', name: 'Forearm Curls + Extensions', muscleGroups: ['forearms'], equipment: 'dumbbell' },

  /* ─── Quads ─── */
  { id: 'back-squat', name: 'Back Squat', muscleGroups: ['quads', 'glutes'], equipment: 'barbell' },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['quads', 'glutes'], equipment: 'machine' },
  { id: 'leg-ext', name: 'Leg Extensions', muscleGroups: ['quads'], equipment: 'machine' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroups: ['quads'], equipment: 'machine' },
  { id: 'walking-lunge', name: 'Walking Lunges', muscleGroups: ['quads', 'glutes'], equipment: 'dumbbell' },
  { id: 'leg-ext-sat', name: 'Leg Extension', muscleGroups: ['quads'], equipment: 'machine' },

  /* ─── Hamstrings ─── */
  { id: 'rdl', name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes'], equipment: 'barbell' },
  { id: 'seated-ham', name: 'Seated Ham Curl', muscleGroups: ['hamstrings'], equipment: 'machine' },
  { id: 'lying-ham', name: 'Lying Ham Curl', muscleGroups: ['hamstrings'], equipment: 'machine' },

  /* ─── Glutes ─── */
  { id: 'hip-thrust', name: 'Hip Thrusts', muscleGroups: ['glutes', 'hamstrings'], equipment: 'barbell' },

  /* ─── Calves ─── */
  { id: 'standing-calf', name: 'Standing Calf Raise', muscleGroups: ['calves'], equipment: 'machine' },

  /* ─── Abs ─── */
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroups: ['abs'], equipment: 'cable' },
  { id: 'hanging-knee', name: 'Hanging Knee Raise', muscleGroups: ['abs'], equipment: 'bodyweight' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroups: ['abs'], equipment: 'cable' },

  /* ─── Neck ─── */
  { id: 'neck-curl', name: 'Neck Curls', muscleGroups: ['neck'], equipment: 'other' },
];

export const getExerciseById = (id: string): Exercise | undefined =>
  exerciseDatabase.find((e) => e.id === id);

export const searchExercises = (query: string): Exercise[] => {
  const q = query.toLowerCase();
  return exerciseDatabase.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroups.some((mg) => mg.toLowerCase().includes(q)) ||
      e.equipment.toLowerCase().includes(q),
  );
};
