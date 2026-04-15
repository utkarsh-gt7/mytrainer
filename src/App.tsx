import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import TodayWorkout from '@/pages/TodayWorkout';
import WeeklyPlan from '@/pages/WeeklyPlan';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import BodyMetrics from '@/pages/BodyMetrics';
import CalorieTracker from '@/pages/CalorieTracker';
import Progress from '@/pages/Progress';
import Settings from '@/pages/Settings';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
