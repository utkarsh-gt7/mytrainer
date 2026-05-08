import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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

import PreviousLogsModal from '@/components/workout/PreviousLogsModal';
import { useAppStore } from '@/store/useAppStore';
import { defaultWorkoutPlan } from '@/data/defaultPlan';
import { exerciseDatabase } from '@/data/exercises';
import type { WorkoutLog } from '@/types';

const clonePlan = () => JSON.parse(JSON.stringify(defaultWorkoutPlan));
const cloneExercises = () => JSON.parse(JSON.stringify(exerciseDatabase));

const buildLog = (
  id: string,
  date: string,
  dayId: string,
  exerciseId: string,
  sets: Array<{ setNumber: number; weight: number; reps: number; isPersonalRecord?: boolean }>,
  completed = true,
): WorkoutLog => ({
  id,
  date,
  dayId,
  exercises: [{ exerciseId, sets }],
  completed,
});

describe('PreviousLogsModal', () => {
  beforeEach(() => {
    useAppStore.setState({
      workoutLogs: [],
      personalRecords: [],
      workoutPlan: clonePlan(),
      exercises: cloneExercises(),
    });
  });

  afterEach(() => cleanup());

  it('shows the smart-overload headline derived from the prior session', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('a', '2026-04-22', 'monday', 'bb-bench', [
          { setNumber: 1, weight: 80, reps: 8 },
          { setNumber: 2, weight: 80, reps: 8 },
          { setNumber: 3, weight: 80, reps: 8 },
        ]),
      ],
    });
    render(
      <PreviousLogsModal
        exerciseId="bb-bench"
        beforeDate="2026-05-08"
        targetReps="5-8"
        onClose={() => {}}
      />,
    );
    // 8 reps is the top of 5-8 → suggestion adds weight.
    expect(screen.getByText(/Add 2\.5 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Smart Overload/i)).toBeInTheDocument();
  });

  it('renders sets from the most recent session as pills', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('a', '2026-04-29', 'monday', 'bb-bench', [
          { setNumber: 1, weight: 82.5, reps: 6 },
          { setNumber: 2, weight: 82.5, reps: 5 },
        ]),
      ],
    });
    render(
      <PreviousLogsModal
        exerciseId="bb-bench"
        beforeDate="2026-05-08"
        targetReps="5-8"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/S1: 82\.5 × 6/)).toBeInTheDocument();
    expect(screen.getByText(/S2: 82\.5 × 5/)).toBeInTheDocument();
  });

  it('shows the all-time PR card when one exists for the exercise', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('a', '2026-04-22', 'monday', 'bb-bench', [
          { setNumber: 1, weight: 90, reps: 5 },
        ]),
      ],
      personalRecords: [
        { id: 'pr1', exerciseId: 'bb-bench', date: '2026-04-22', weight: 90, reps: 5, previousBest: 85 },
      ],
    });
    render(
      <PreviousLogsModal
        exerciseId="bb-bench"
        beforeDate="2026-05-08"
        targetReps="5-8"
        onClose={() => {}}
      />,
    );
    // Use case-sensitive match so the small-caps heading is hit but the
    // rationale paragraph ("Your all-time PR is …") is not.
    expect(screen.getByText('All-Time PR')).toBeInTheDocument();
    // The PR text shows up both in the PR card and in the suggestion rationale,
    // so assert at least one match exists.
    expect(screen.getAllByText(/90 kg × 5/).length).toBeGreaterThan(0);
  });

  it('falls back to a friendly first-time message when no logs exist', () => {
    render(
      <PreviousLogsModal
        exerciseId="bb-bench"
        beforeDate="2026-05-08"
        targetReps="5-8"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/First time logging this exercise/i)).toBeInTheDocument();
    expect(screen.getByText(/No prior logs found/i)).toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <PreviousLogsModal exerciseId="bb-bench" beforeDate="2026-05-08" onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('finds the absolute most recent session even when the exercise is trained twice a week', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('tue', '2026-04-28', 'tuesday', 'incline-curl', [
          { setNumber: 1, weight: 10, reps: 10 },
          { setNumber: 2, weight: 10, reps: 9 },
        ]),
        buildLog('fri', '2026-05-01', 'friday', 'incline-curl', [
          { setNumber: 1, weight: 12, reps: 8 },
          { setNumber: 2, weight: 12, reps: 7 },
        ]),
      ],
    });
    render(
      <PreviousLogsModal
        exerciseId="incline-curl"
        beforeDate="2026-05-08"
        targetReps="8-10"
        onClose={() => {}}
      />,
    );
    // Modal must surface Friday (the freshest), not Tuesday.
    expect(screen.getByText(/S1: 12 × 8/)).toBeInTheDocument();
    expect(screen.queryByText(/S1: 10 × 10/)).not.toBeInTheDocument();
  });
});

describe('TodayWorkout integration with PreviousLogsModal', () => {
  beforeEach(() => {
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
  });

  afterEach(() => cleanup());

  it('only mounts the Last Logs button on the currently expanded exercise card', async () => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = DAYS[new Date().getDay()];
    const day = useAppStore.getState().workoutPlan.find((d) => d.dayName === todayDayName);
    if (!day) return; // rest day — nothing to assert

    const TodayWorkoutModule = await import('@/pages/TodayWorkout');
    const TodayWorkout = TodayWorkoutModule.default;

    render(<TodayWorkout />);
    fireEvent.click(screen.getByRole('button', { name: /^start workout$/i }));

    // Expanded card is rendered for the first exercise → exactly one Last Logs button.
    const buttons = screen.getAllByRole('button', { name: /view previous logs/i });
    expect(buttons).toHaveLength(1);
  });
});
