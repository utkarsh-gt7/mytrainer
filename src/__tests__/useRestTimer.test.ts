import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRestTimer } from '@/hooks/useRestTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(
    () => Promise.resolve(),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useRestTimer', () => {
  it('starts idle with zero seconds and zero progress', () => {
    const { result } = renderHook(() => useRestTimer());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('counts down when started and auto-stops at zero', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start(3));
    expect(result.current.seconds).toBe(3);
    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(2);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('pauses and resumes', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start(5));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(4);
    act(() => result.current.resume());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(3);
  });

  it('reset returns to zero and not running', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start(10));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => result.current.reset());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('calculates progress relative to total duration', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start(4));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.progress).toBe(25);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.progress).toBe(50);
  });
});
