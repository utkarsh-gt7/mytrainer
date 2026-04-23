import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type {
  WorkoutDay,
  WorkoutLog,
  ExerciseLog,
  BodyMetrics,
  CalorieLog,
  Meal,
  UserProfile,
  Exercise,
  Streak,
  PersonalRecord,
} from '@/types';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { exerciseDatabase } from '@/data/exercises';
import { generateId, calculateBMI } from '@/utils/calculations';
import { isFirebaseConfigured, db, doc, setDoc, getDoc } from '@/services/firebase';

/* ─── Firestore-backed Storage Adapter ─── */
const FIRESTORE_DOC_PATH = 'appState';
const FIRESTORE_DOC_ID = 'main';

export const firestoreStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Cloud-only persistence requires Firebase.');
    }
    try {
      const snap = await getDoc(doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID));
      if (snap.exists()) {
        const data = snap.data();
        return data[name] ? JSON.stringify(data[name]) : null;
      }
      return null;
    } catch (err) {
      console.error('Firestore getItem failed:', err);
      throw err;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Cloud-only persistence requires Firebase.');
    }
    try {
      await setDoc(
        doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID),
        { [name]: JSON.parse(value) },
        { merge: true },
      );
    } catch (err) {
      console.error('Firestore setItem failed:', err);
      throw err;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not configured. Cloud-only persistence requires Firebase.');
    }
    try {
      const { deleteField } = await import('firebase/firestore');
      await setDoc(
        doc(db, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID),
        { [name]: deleteField() },
        { merge: true },
      );
    } catch (err) {
      console.error('Firestore removeItem failed:', err);
      throw err;
    }
  },
};

/* ─── State Shape ─── */
interface AppState {
  /* Theme */
  darkMode: boolean;
  toggleDarkMode: () => void;

  /* User Profile */
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;

  /* Exercise Library */
  exercises: Exercise[];
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;

  /* Workout Plan */
  workoutPlan: WorkoutDay[];
  updateWorkoutPlan: (plan: WorkoutDay[]) => void;
  addExerciseToDay: (dayId: string, exerciseId: string, targetSets: number, targetReps: string) => void;
  removeExerciseFromDay: (dayId: string, workoutExerciseId: string) => void;
  reorderExercise: (dayId: string, exerciseId: string, newOrder: number) => void;

  /* Workout Logs */
  workoutLogs: WorkoutLog[];
  startWorkout: (dayId: string) => string;
  logSet: (workoutId: string, exerciseId: string, setNumber: number, weight: number, reps: number) => void;
  removeSet: (workoutId: string, exerciseId: string, setNumber: number) => void;
  completeWorkout: (workoutId: string, duration: number) => void;
  reopenWorkout: (workoutId: string) => void;
  getWorkoutLog: (id: string) => WorkoutLog | undefined;
  getTodayWorkout: () => WorkoutLog | undefined;

  /* In-progress Set Drafts (survive page reload) */
  workoutDrafts: Record<string, Record<string, { weight: string; reps: string }>>;
  setWorkoutDraft: (
    workoutId: string,
    exerciseId: string,
    setNumber: number,
    weight: string,
    reps: string,
  ) => void;
  clearWorkoutDraft: (workoutId: string, exerciseId: string, setNumber: number) => void;
  clearWorkoutDrafts: (workoutId: string) => void;

  /* Body Metrics */
  bodyMetrics: BodyMetrics[];
  addBodyMetrics: (metrics: Omit<BodyMetrics, 'id' | 'bmi'>) => void;
  getLatestMetrics: () => BodyMetrics | undefined;

  /* Calorie Logs */
  calorieLogs: CalorieLog[];
  addMeal: (date: string, meal: Omit<Meal, 'id'>) => void;
  removeMeal: (date: string, mealId: string) => void;
  updateSteps: (date: string, steps: number) => void;
  updateCardio: (date: string, minutes: number) => void;
  updateWater: (date: string, liters: number) => void;
  getTodayCalories: () => CalorieLog | undefined;

  /* Personal Records */
  personalRecords: PersonalRecord[];

  /* Streak */
  streak: Streak;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ─── Theme ─── */
      darkMode: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      /* ─── User Profile ─── */
      profile: {
        name: 'User',
        age: 22,
        height: 175,
        weight: 72.2,
        bodyFat: 14.1,
        goal: 'recomp',
        maintenanceCalories: 2300,
        proteinTarget: 160,
      },
      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      /* ─── Exercise Library ─── */
      exercises: exerciseDatabase,
      addExercise: (exercise) =>
        set((s) => ({ exercises: [...s.exercises, exercise] })),
      updateExercise: (id, updates) =>
        set((s) => ({
          exercises: s.exercises.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),
      removeExercise: (id) =>
        set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),

      /* ─── Workout Plan ─── */
      workoutPlan: defaultWorkoutPlan,
      updateWorkoutPlan: (plan) => set({ workoutPlan: plan }),
      addExerciseToDay: (dayId, exerciseId, targetSets, targetReps) =>
        set((s) => ({
          workoutPlan: s.workoutPlan.map((day) => {
            if (day.id !== dayId) return day;
            const maxOrder = Math.max(0, ...day.exercises.map((e) => e.order));
            return {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  id: generateId(),
                  exerciseId,
                  order: maxOrder + 1,
                  targetSets,
                  targetReps,
                },
              ],
            };
          }),
        })),
      removeExerciseFromDay: (dayId, workoutExerciseId) =>
        set((s) => ({
          workoutPlan: s.workoutPlan.map((day) => {
            if (day.id !== dayId) return day;
            return {
              ...day,
              exercises: day.exercises
                .filter((e) => e.id !== workoutExerciseId)
                .map((e, i) => ({ ...e, order: i + 1 })),
            };
          }),
        })),
      reorderExercise: (dayId, exerciseId, newOrder) =>
        set((s) => ({
          workoutPlan: s.workoutPlan.map((day) => {
            if (day.id !== dayId) return day;
            const exs = [...day.exercises];
            const idx = exs.findIndex((e) => e.id === exerciseId);
            if (idx === -1) return day;
            const [moved] = exs.splice(idx, 1);
            exs.splice(newOrder - 1, 0, moved);
            return { ...day, exercises: exs.map((e, i) => ({ ...e, order: i + 1 })) };
          }),
        })),

      /* ─── Workout Logs ─── */
      workoutLogs: [],
      startWorkout: (dayId) => {
        const id = generateId();
        const today = new Date().toISOString().split('T')[0];
        const day = get().workoutPlan.find((d) => d.id === dayId);
        const exercises: ExerciseLog[] =
          day?.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sets: [],
          })) ?? [];
        set((s) => ({
          workoutLogs: [
            ...s.workoutLogs,
            { id, date: today, dayId, exercises, completed: false },
          ],
        }));
        return id;
      },
      logSet: (workoutId, exerciseId, setNumber, weight, reps) => {
        const state = get();
        const allPRs = [...state.personalRecords];
        const existingPR = allPRs.find((pr) => pr.exerciseId === exerciseId);
        let isNewPR = false;
        if (!existingPR || weight > existingPR.weight) {
          isNewPR = true;
          const prEntry: PersonalRecord = {
            id: generateId(),
            exerciseId,
            date: new Date().toISOString().split('T')[0],
            weight,
            reps,
            previousBest: existingPR?.weight ?? 0,
          };
          if (existingPR) {
            const idx = allPRs.indexOf(existingPR);
            allPRs[idx] = prEntry;
          } else {
            allPRs.push(prEntry);
          }
        }

        set((s) => {
          const draftKey = `${exerciseId}-${setNumber}`;
          const workoutDrafts = { ...s.workoutDrafts };
          if (workoutDrafts[workoutId]) {
            const { [draftKey]: _removed, ...rest } = workoutDrafts[workoutId];
            void _removed;
            workoutDrafts[workoutId] = rest;
            if (Object.keys(rest).length === 0) delete workoutDrafts[workoutId];
          }
          return {
            personalRecords: allPRs,
            workoutDrafts,
            workoutLogs: s.workoutLogs.map((log) => {
              if (log.id !== workoutId) return log;
              return {
                ...log,
                exercises: log.exercises.map((ex) => {
                  if (ex.exerciseId !== exerciseId) return ex;
                  const existingIdx = ex.sets.findIndex((s) => s.setNumber === setNumber);
                  const newSet = { setNumber, weight, reps, isPersonalRecord: isNewPR };
                  const sets =
                    existingIdx >= 0
                      ? ex.sets.map((s, i) => (i === existingIdx ? newSet : s))
                      : [...ex.sets, newSet];
                  return { ...ex, sets };
                }),
              };
            }),
          };
        });
      },
      removeSet: (workoutId, exerciseId, setNumber) =>
        set((s) => ({
          workoutLogs: s.workoutLogs.map((log) => {
            if (log.id !== workoutId) return log;
            return {
              ...log,
              exercises: log.exercises.map((ex) =>
                ex.exerciseId === exerciseId
                  ? { ...ex, sets: ex.sets.filter((st) => st.setNumber !== setNumber) }
                  : ex,
              ),
            };
          }),
        })),
      completeWorkout: (workoutId, duration) => {
        set((s) => {
          const today = new Date().toISOString().split('T')[0];
          const newStreak = { ...s.streak };
          const lastDate = newStreak.lastWorkoutDate;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (lastDate === yesterday || lastDate === today) {
            newStreak.current = lastDate === today ? newStreak.current : newStreak.current + 1;
          } else {
            newStreak.current = 1;
          }
          newStreak.longest = Math.max(newStreak.longest, newStreak.current);
          newStreak.lastWorkoutDate = today;

          const workoutDrafts = { ...s.workoutDrafts };
          delete workoutDrafts[workoutId];

          return {
            streak: newStreak,
            workoutDrafts,
            workoutLogs: s.workoutLogs.map((log) =>
              log.id === workoutId ? { ...log, completed: true, duration } : log,
            ),
          };
        });
      },
      reopenWorkout: (workoutId) =>
        set((s) => ({
          workoutLogs: s.workoutLogs.map((log) =>
            log.id === workoutId ? { ...log, completed: false } : log,
          ),
        })),
      getWorkoutLog: (id) => get().workoutLogs.find((l) => l.id === id),
      getTodayWorkout: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().workoutLogs.find((l) => l.date === today);
      },

      /* ─── In-progress Set Drafts ─── */
      workoutDrafts: {},
      setWorkoutDraft: (workoutId, exerciseId, setNumber, weight, reps) =>
        set((s) => {
          const key = `${exerciseId}-${setNumber}`;
          if (!weight && !reps) {
            const forWorkout = { ...(s.workoutDrafts[workoutId] ?? {}) };
            delete forWorkout[key];
            const drafts = { ...s.workoutDrafts };
            if (Object.keys(forWorkout).length === 0) {
              delete drafts[workoutId];
            } else {
              drafts[workoutId] = forWorkout;
            }
            return { workoutDrafts: drafts };
          }
          return {
            workoutDrafts: {
              ...s.workoutDrafts,
              [workoutId]: {
                ...(s.workoutDrafts[workoutId] ?? {}),
                [key]: { weight, reps },
              },
            },
          };
        }),
      clearWorkoutDraft: (workoutId, exerciseId, setNumber) =>
        set((s) => {
          if (!s.workoutDrafts[workoutId]) return s;
          const key = `${exerciseId}-${setNumber}`;
          const forWorkout = { ...s.workoutDrafts[workoutId] };
          delete forWorkout[key];
          const drafts = { ...s.workoutDrafts };
          if (Object.keys(forWorkout).length === 0) {
            delete drafts[workoutId];
          } else {
            drafts[workoutId] = forWorkout;
          }
          return { workoutDrafts: drafts };
        }),
      clearWorkoutDrafts: (workoutId) =>
        set((s) => {
          if (!s.workoutDrafts[workoutId]) return s;
          const drafts = { ...s.workoutDrafts };
          delete drafts[workoutId];
          return { workoutDrafts: drafts };
        }),

      /* ─── Body Metrics ─── */
      bodyMetrics: [],
      addBodyMetrics: (metrics) =>
        set((s) => ({
          bodyMetrics: [
            ...s.bodyMetrics,
            {
              ...metrics,
              id: generateId(),
              bmi: calculateBMI(metrics.weight, metrics.height),
            },
          ],
        })),
      getLatestMetrics: () => {
        const metrics = get().bodyMetrics;
        if (metrics.length === 0) return undefined;
        return [...metrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0];
      },

      /* ─── Calorie Logs ─── */
      calorieLogs: [],
      addMeal: (date, meal) =>
        set((s) => {
          const existing = s.calorieLogs.find((l) => l.date === date);
          if (existing) {
            return {
              calorieLogs: s.calorieLogs.map((l) =>
                l.date === date
                  ? { ...l, meals: [...l.meals, { ...meal, id: generateId() }] }
                  : l,
              ),
            };
          }
          return {
            calorieLogs: [
              ...s.calorieLogs,
              { id: generateId(), date, meals: [{ ...meal, id: generateId() }] },
            ],
          };
        }),
      removeMeal: (date, mealId) =>
        set((s) => ({
          calorieLogs: s.calorieLogs.map((l) =>
            l.date === date
              ? { ...l, meals: l.meals.filter((m) => m.id !== mealId) }
              : l,
          ),
        })),
      updateSteps: (date, steps) =>
        set((s) => {
          const existing = s.calorieLogs.find((l) => l.date === date);
          if (existing) {
            return {
              calorieLogs: s.calorieLogs.map((l) =>
                l.date === date ? { ...l, steps } : l,
              ),
            };
          }
          return {
            calorieLogs: [...s.calorieLogs, { id: generateId(), date, meals: [], steps }],
          };
        }),
      updateCardio: (date, minutes) =>
        set((s) => {
          const existing = s.calorieLogs.find((l) => l.date === date);
          if (existing) {
            return {
              calorieLogs: s.calorieLogs.map((l) =>
                l.date === date ? { ...l, cardioMinutes: minutes } : l,
              ),
            };
          }
          return {
            calorieLogs: [
              ...s.calorieLogs,
              { id: generateId(), date, meals: [], cardioMinutes: minutes },
            ],
          };
        }),
      updateWater: (date, liters) =>
        set((s) => {
          const existing = s.calorieLogs.find((l) => l.date === date);
          if (existing) {
            return {
              calorieLogs: s.calorieLogs.map((l) =>
                l.date === date ? { ...l, waterLiters: liters } : l,
              ),
            };
          }
          return {
            calorieLogs: [
              ...s.calorieLogs,
              { id: generateId(), date, meals: [], waterLiters: liters },
            ],
          };
        }),
      getTodayCalories: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().calorieLogs.find((l) => l.date === today);
      },

      /* ─── Personal Records ─── */
      personalRecords: [],

      /* ─── Streak ─── */
      streak: { current: 0, longest: 0, lastWorkoutDate: '' },
    }),
    {
      name: 'fitness-tracker-storage',
      version: 1,
      storage: createJSONStorage(() => firestoreStorage),
    },
  ),
);
