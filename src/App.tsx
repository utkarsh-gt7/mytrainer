import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ErrorFallback from '@/components/ErrorFallback';
import Dashboard from '@/pages/Dashboard';
import TodayWorkout from '@/pages/TodayWorkout';
import WeeklyPlan from '@/pages/WeeklyPlan';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import BodyMetrics from '@/pages/BodyMetrics';
import CalorieTracker from '@/pages/CalorieTracker';
import Progress from '@/pages/Progress';
import Settings from '@/pages/Settings';
import { isFirebaseConfigured } from '@/services/firebase';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const darkMode = useAppStore((s) => s.darkMode);
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));

    Promise.resolve(useAppStore.persist.rehydrate()).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load your cloud data.';
      setHydrationError(message);
    });

    return () => unsub();
  }, []);

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
      />
    );
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today" element={<TodayWorkout />} />
          <Route path="/plan" element={<WeeklyPlan />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/metrics" element={<BodyMetrics />} />
          <Route path="/nutrition" element={<CalorieTracker />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
