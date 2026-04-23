import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SetInput } from '@/pages/TodayWorkout';

describe('SetInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('keeps the tick button in the row even when inputs are wide (mobile safety)', () => {
    render(<SetInput setNumber={1} onLog={vi.fn()} />);
    const tick = screen.getByRole('button', { name: /log set 1/i });
    expect(tick).toHaveClass('shrink-0');
  });

  it('logs weight and reps when the tick button is pressed', () => {
    const onLog = vi.fn();
    render(<SetInput setNumber={1} onLog={onLog} />);
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/set 1 reps/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /log set 1/i }));
    expect(onLog).toHaveBeenCalledWith(80, 8);
  });

  it('ignores submission when values are missing or invalid', () => {
    const onLog = vi.fn();
    render(<SetInput setNumber={1} onLog={onLog} />);
    fireEvent.click(screen.getByRole('button', { name: /log set 1/i }));
    expect(onLog).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/set 1 reps/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /log set 1/i }));
    expect(onLog).not.toHaveBeenCalled();
  });

  it('copies weight and reps from the previous set when the copy button is pressed', () => {
    const onDraftChange = vi.fn();
    render(
      <SetInput
        setNumber={2}
        previous={{ weight: 82.5, reps: 6 }}
        onLog={vi.fn()}
        onDraftChange={onDraftChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /copy values from set 1/i }));
    expect(screen.getByLabelText(/set 2 weight/i)).toHaveValue(82.5);
    expect(screen.getByLabelText(/set 2 reps/i)).toHaveValue(6);
    vi.runAllTimers();
    expect(onDraftChange).toHaveBeenCalledWith('82.5', '6');
  });

  it('hides the copy-previous button after the user starts typing', () => {
    render(<SetInput setNumber={2} previous={{ weight: 82.5, reps: 6 }} onLog={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /copy values from set 1/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/set 2 weight/i), { target: { value: '80' } });
    expect(screen.queryByRole('button', { name: /copy values from set 1/i })).not.toBeInTheDocument();
  });

  it('hydrates inputs from a persisted draft', () => {
    render(
      <SetInput
        setNumber={1}
        draft={{ weight: '75', reps: '10' }}
        onLog={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(75);
    expect(screen.getByLabelText(/set 1 reps/i)).toHaveValue(10);
  });

  it('emits a debounced draft update after each keystroke', () => {
    const onDraftChange = vi.fn();
    render(<SetInput setNumber={1} onLog={vi.fn()} onDraftChange={onDraftChange} />);
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '80' } });
    expect(onDraftChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(onDraftChange).toHaveBeenCalledTimes(1);
    expect(onDraftChange).toHaveBeenLastCalledWith('80', '');
  });

  it('renders logged values as read-only and exposes an edit button', () => {
    render(
      <SetInput
        setNumber={1}
        logged={{ weight: 80, reps: 8 }}
        onLog={vi.fn()}
      />,
    );
    const weight = screen.getByLabelText(/set 1 weight/i);
    expect(weight).toHaveValue(80);
    expect(weight).toHaveAttribute('readOnly');
    expect(screen.getByRole('button', { name: /edit set 1/i })).toBeInTheDocument();
  });

  it('allows editing a logged set and calls onLog with the new values', () => {
    const onLog = vi.fn();
    render(<SetInput setNumber={1} logged={{ weight: 80, reps: 8 }} onLog={onLog} />);
    fireEvent.click(screen.getByRole('button', { name: /edit set 1/i }));
    const weight = screen.getByLabelText(/set 1 weight/i);
    fireEvent.change(weight, { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText(/set 1 reps/i), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /save set 1/i }));
    expect(onLog).toHaveBeenCalledWith(85, 6);
  });

  it('cancels an in-progress edit without logging', () => {
    const onLog = vi.fn();
    render(<SetInput setNumber={1} logged={{ weight: 80, reps: 8 }} onLog={onLog} />);
    fireEvent.click(screen.getByRole('button', { name: /edit set 1/i }));
    fireEvent.change(screen.getByLabelText(/set 1 weight/i), { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel editing set 1/i }));
    expect(onLog).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/set 1 weight/i)).toHaveValue(80);
    expect(screen.getByRole('button', { name: /edit set 1/i })).toBeInTheDocument();
  });

  it('shows a PR trophy on logged personal record sets', () => {
    render(
      <SetInput
        setNumber={1}
        logged={{ weight: 120, reps: 3, isPersonalRecord: true }}
        onLog={vi.fn()}
      />,
    );
    const badge = screen.getByRole('button', { name: /set 1 logged/i });
    expect(badge.querySelector('svg')).toBeTruthy();
  });
});
