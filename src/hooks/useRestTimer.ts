import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRestTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  progress: number;
}

export function useRestTimer(): UseRestTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1sbm1uf4OJi4yCd3d8gYKAgH2Af4KHiIiIhYJ+e3t7fX+AgoaJi4mIhYN/fXt7fX+BhIeKi4mHhIJ/fXt7fX+BhIeKi4mIhYN/',
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            audioRef.current?.play().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  const start = useCallback((duration: number) => {
    setTotalDuration(duration);
    setSeconds(duration);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    setTotalDuration(0);
  }, []);

  const progress = totalDuration > 0 ? ((totalDuration - seconds) / totalDuration) * 100 : 0;

  return { seconds, isRunning, start, pause, resume, reset, progress };
}
