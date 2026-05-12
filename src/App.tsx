import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ErrorFallback from '@/components/ErrorFallback';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import Dashboard from '@/pages/Dashboard';
import TodayWorkout from '@/pages/TodayWorkout';
import WeeklyPlan from '@/pages/WeeklyPlan';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import BodyMetrics from '@/pages/BodyMetrics';
import CalorieTracker from '@/pages/CalorieTracker';
import Progress from '@/pages/Progress';
import Settings from '@/pages/Settings';
import WorkoutArchive from '@/pages/WorkoutArchive';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAppStore } from '@/store/useAppStore';

/** Wraps a page with a scoped error boundary + a human-friendly label. */
function Guarded({ label, children }: { label: string; children: ReactNode }) {
  return <RouteErrorBoundary label={label}>{children}</RouteErrorBoundary>;
}

export default function App() {
  const darkMode = useAppStore((s) => s.darkMode);
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [hydrationAttempt, setHydrationAttempt] = useState(0);

  const retryHydration = useCallback(() => {
    setHydrationError(null);
    setHydrated(useAppStore.persist.hasHydrated());
    setHydrationAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));

    Promise.resolve(useAppStore.persist.rehydrate()).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load your cloud data.';
      setHydrationError(message);
    });

    return () => unsub();
  }, [hydrationAttempt]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!isFirebaseConfigured()) {
    return (
      <ErrorFallback
        title="Firebase configuration required"
        message="This app now runs in cloud-only mode. Add your Firebase environment variables and enable Firestore before using it."
        showReload={false}
      />
    );
  }

  if (hydrationError) {
    return (
      <ErrorFallback
        title="Unable to load cloud data"
        message={hydrationError}
        onReset={retryHydration}
      />
    );
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas text-fg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-fg-muted">Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Guarded label="Dashboard"><Dashboard /></Guarded>} />
          <Route path="/today" element={<Guarded label="Today's Workout"><TodayWorkout /></Guarded>} />
          <Route path="/plan" element={<Guarded label="Weekly Plan"><WeeklyPlan /></Guarded>} />
          <Route path="/exercises" element={<Guarded label="Exercise Library"><ExerciseLibrary /></Guarded>} />
          <Route path="/metrics" element={<Guarded label="Body Metrics"><BodyMetrics /></Guarded>} />
          <Route path="/nutrition" element={<Guarded label="Nutrition"><CalorieTracker /></Guarded>} />
          <Route path="/progress" element={<Guarded label="Progress"><Progress /></Guarded>} />
          <Route path="/archive" element={<Guarded label="Workout Archive"><WorkoutArchive /></Guarded>} />
          <Route path="/settings" element={<Guarded label="Settings"><Settings /></Guarded>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
