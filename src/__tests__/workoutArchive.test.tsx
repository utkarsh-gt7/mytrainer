import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

import WorkoutArchive from '@/pages/WorkoutArchive';
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
  exercises: WorkoutLog['exercises'],
): WorkoutLog => ({ id, date, dayId, exercises, completed: true });

describe('WorkoutArchive page', () => {
  beforeEach(() => {
    useAppStore.setState({
      workoutLogs: [],
      personalRecords: [],
      workoutPlan: clonePlan(),
      exercises: cloneExercises(),
    });
  });

  afterEach(() => cleanup());

  const renderPage = () =>
    render(
      <MemoryRouter>
        <WorkoutArchive />
      </MemoryRouter>,
    );

  it('renders an empty-state when no logs match', () => {
    renderPage();
    expect(screen.getByText(/No sessions match these filters/i)).toBeInTheDocument();
  });

  it('shows session cards in newest-first order with focus badges', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('a', '2026-04-13', 'monday', [
          { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
        ]),
        buildLog('b', '2026-04-15', 'wednesday', [
          { exerciseId: 'back-squat', sets: [{ setNumber: 1, weight: 100, reps: 5 }] },
        ]),
      ],
    });
    renderPage();
    const cards = screen.getAllByRole('button', { name: /Expand session from/i });
    expect(cards[0]).toHaveAttribute('aria-label', expect.stringMatching(/Apr 15/));
    expect(cards[1]).toHaveAttribute('aria-label', expect.stringMatching(/Apr 13/));
  });

  it('opens the filter panel and narrows results by exercise name', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('a', '2026-04-13', 'monday', [
          { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
        ]),
        buildLog('b', '2026-04-15', 'wednesday', [
          { exerciseId: 'back-squat', sets: [{ setNumber: 1, weight: 100, reps: 5 }] },
        ]),
      ],
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^filters/i }));
    fireEvent.change(screen.getByPlaceholderText(/Bench, RDL/i), {
      target: { value: 'squat' },
    });
    const cards = screen.getAllByRole('button', { name: /Expand session from/i });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('aria-label', expect.stringMatching(/Apr 15/));
  });

  it('filters by day of the week', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('mon', '2026-04-13', 'monday', [
          { exerciseId: 'bb-bench', sets: [{ setNumber: 1, weight: 80, reps: 5 }] },
        ]),
        buildLog('sat', '2026-04-18', 'saturday', [
          { exerciseId: 'hack-squat', sets: [{ setNumber: 1, weight: 120, reps: 10 }] },
        ]),
      ],
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^filters/i }));
    fireEvent.change(screen.getByDisplayValue(/Any day/i), {
      target: { value: 'Saturday' },
    });
    const cards = screen.getAllByRole('button', { name: /Expand session from/i });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('aria-label', expect.stringMatching(/Apr 18/));
  });

  it('expands a session card to reveal each exercise and its sets', () => {
    useAppStore.setState({
      workoutLogs: [
        buildLog('mon', '2026-04-13', 'monday', [
          {
            exerciseId: 'bb-bench',
            sets: [
              { setNumber: 1, weight: 80, reps: 5 },
              { setNumber: 2, weight: 82.5, reps: 5 },
            ],
          },
        ]),
      ],
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Expand session from/i }));
    expect(screen.getByText(/Barbell Bench Press/i)).toBeInTheDocument();
    expect(screen.getByText(/S1: 80 × 5/)).toBeInTheDocument();
    expect(screen.getByText(/S2: 82\.5 × 5/)).toBeInTheDocument();
  });
});
