import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

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

import TodayWorkout from '@/pages/TodayWorkout';
import { useAppStore } from '@/store/useAppStore';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { exerciseDatabase } from '@/data/exercises';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayStr = new Date().toISOString().split('T')[0];
const todayDayName = DAYS[new Date().getDay()];

const clonePlan = () => JSON.parse(JSON.stringify(defaultWorkoutPlan));
const cloneExercises = () => JSON.parse(JSON.stringify(exerciseDatabase));

const resetStore = () => {
  useAppStore.setState({
    workoutLogs: [],
    calorieLogs: [],
    bodyMetrics: [],
    personalRecords: [],
    workoutDrafts: {},
    streak: { current: 0, longest: 0, lastWorkoutDate: '' },
    workoutPlan: clonePlan(),
    exercises: cloneExercises(),
  });
};

describe('TodayWorkout page', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows rest day UI when the plan has no matching day', () => {
    useAppStore.setState({ workoutPlan: [] });
    render(<TodayWorkout />);
    expect(screen.getByText(/rest day/i)).toBeInTheDocument();
  });

  it('shows the start button when a plan is scheduled and no workout is active', () => {
    render(<TodayWorkout />);
    const btn = screen.queryByRole('button', { name: /start workout/i });
    if (!useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName)) {
      expect(btn).toBeNull();
    } else {
      expect(btn).toBeInTheDocument();
    }
  });

  it('renders the saved workout summary with an edit button when completed today', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return; // rest day — skip
    useAppStore.setState({
      workoutLogs: [
        {
          id: 'saved',
          date: todayStr,
          dayId: day.id,
          completed: true,
          duration: 1234,
          exercises: [
            {
              exerciseId: day.exercises[0].exerciseId,
              sets: [{ setNumber: 1, weight: 80, reps: 8, isPersonalRecord: true }],
            },
          ],
        },
      ],
    });
    render(<TodayWorkout />);
    expect(screen.getByText(/workout complete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit today's workout/i })).toBeInTheDocument();
  });

  it('re-opens a completed workout when the edit button is pressed', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return;
    useAppStore.setState({
      workoutLogs: [
        {
          id: 'saved',
          date: todayStr,
          dayId: day.id,
          completed: true,
          duration: 1000,
          exercises: [
            {
              exerciseId: day.exercises[0].exerciseId,
              sets: [{ setNumber: 1, weight: 80, reps: 8 }],
            },
          ],
        },
      ],
    });
    render(<TodayWorkout />);
    fireEvent.click(screen.getByRole('button', { name: /edit today's workout/i }));
    expect(useAppStore.getState().workoutLogs[0].completed).toBe(false);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('can start a workout, log a set via the SetInput, and complete it', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return;
    vi.useFakeTimers();
    render(<TodayWorkout />);
    fireEvent.click(screen.getByRole('button', { name: /^start workout$/i }));

    const weight = screen.getByLabelText(/set 1 weight/i);
    const reps = screen.getByLabelText(/set 1 reps/i);
    fireEvent.change(weight, { target: { value: '80' } });
    fireEvent.change(reps, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /log set 1/i }));

    const state = useAppStore.getState();
    const activeLog = state.workoutLogs[state.workoutLogs.length - 1];
    const exLog = activeLog.exercises.find((e) => e.exerciseId === day.exercises[0].exerciseId);
    expect(exLog?.sets.length).toBe(1);
    expect(exLog?.sets[0].weight).toBe(80);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole('button', { name: /complete workout/i }));
    expect(useAppStore.getState().workoutLogs[0].completed).toBe(true);
  });

  it('auto-resumes an in-progress workout on reload and recovers elapsed time', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return;
    const startedAt = Date.now() - 90_000; // 90 seconds ago
    useAppStore.setState({
      workoutLogs: [
        {
          id: 'resumable',
          date: todayStr,
          dayId: day.id,
          completed: false,
          startedAt,
          exercises: day.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: [] })),
        },
      ],
    });
    render(<TodayWorkout />);
    // The active workout flow is visible even though the user never clicked Start.
    expect(screen.getByRole('button', { name: /complete workout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^start workout$/i })).not.toBeInTheDocument();
  });

  it('collapses an expanded exercise when its header is tapped again', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return;
    render(<TodayWorkout />);
    fireEvent.click(screen.getByRole('button', { name: /^start workout$/i }));
    const firstExerciseHeader = screen.getAllByRole('button').find((btn) =>
      btn.textContent?.includes('1') && btn.textContent?.toLowerCase().includes(day.exercises[0].targetReps.toLowerCase()),
    );
    expect(firstExerciseHeader).toBeDefined();
    expect(screen.queryByLabelText(/set 1 weight/i)).toBeInTheDocument();
    fireEvent.click(firstExerciseHeader!);
    expect(screen.queryByLabelText(/set 1 weight/i)).not.toBeInTheDocument();
    fireEvent.click(firstExerciseHeader!);
    expect(screen.queryByLabelText(/set 1 weight/i)).toBeInTheDocument();
  });

  it('persists a draft value while typing so a reload would recover it', () => {
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return;
    vi.useFakeTimers();
    render(<TodayWorkout />);
    fireEvent.click(screen.getByRole('button', { name: /^start workout$/i }));
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText(/set 1 reps/i), { target: { value: '10' } });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const workoutId = useAppStore.getState().workoutLogs[0].id;
    const key = `${day.exercises[0].exerciseId}-1`;
    expect(useAppStore.getState().workoutDrafts[workoutId]?.[key]).toEqual({
      weight: '75',
      reps: '10',
    });
  });
});
