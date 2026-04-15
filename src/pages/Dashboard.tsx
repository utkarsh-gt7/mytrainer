import { Link } from 'react-router-dom';
import {
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
  Utensils,
  Scale,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Dashboard() {
  const { profile, workoutPlan, workoutLogs, calorieLogs, bodyMetrics, streak, personalRecords } =
    useAppStore();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayName = DAYS[today.getDay()];
  const todayPlan = workoutPlan.find((d) => d.dayName === dayName);
  const todayLog = workoutLogs.find((l) => l.date === todayStr);
  const todayCalories = calorieLogs.find((l) => l.date === todayStr);

  const weekAgoDate = new Date(today);
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = weekAgoDate.toISOString().split('T')[0];

  const weekLogs = workoutLogs.filter((l) => l.date >= weekAgoStr && l.completed);
  const weekCalories = calorieLogs.filter((l) => l.date >= weekAgoStr);

  const avgCalories = weekCalories.length > 0
    ? Math.round(weekCalories.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0), 0) / weekCalories.length)
    : 0;

  const todayTotalCals = todayCalories?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;
  const todayTotalProtein = todayCalories?.meals.reduce((s, m) => s + m.protein, 0) ?? 0;

  const latestMetrics = bodyMetrics.length > 0
    ? [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const recentPRs = [...personalRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold dark:text-white">
          Welcome back, {profile.name} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Flame className="text-orange-500" />}
          label="Streak"
          value={`${streak.current} days`}
          sub={`Best: ${streak.longest}`}
          color="orange"
        />
        <StatCard
          icon={<Dumbbell className="text-primary-500" />}
          label="This Week"
          value={`${weekLogs.length}/6`}
          sub="workouts done"
          color="indigo"
        />
        <StatCard
          icon={<Utensils className="text-green-500" />}
          label="Avg Calories"
          value={avgCalories.toString()}
          sub="this week"
          color="green"
        />
        <StatCard
          icon={<Scale className="text-blue-500" />}
          label="Weight"
          value={latestMetrics ? `${latestMetrics.weight} kg` : `${profile.weight} kg`}
          sub={latestMetrics?.bodyFat ? `${latestMetrics.bodyFat}% BF` : ''}
          color="blue"
        />
      </div>

      {/* Today's Workout */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary-500" size={22} />
            <h2 className="text-lg font-semibold dark:text-white">Today&apos;s Workout</h2>
          </div>
          {todayPlan && (
            <Link
              to="/today"
              className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              {todayLog?.completed ? 'View Log' : 'Start Workout'}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
        {todayPlan ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {todayPlan.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {todayPlan.focus === 'strength' ? 'Strength' : todayPlan.focus === 'hypertrophy' ? 'Hypertrophy' : 'Athletic'}
              </span>
              {todayLog?.completed && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  ✓ Completed
                </span>
              )}
            </div>
            <div className="space-y-2">
              {todayPlan.exercises.slice(0, 4).map((ex) => {
                const exercise = getExerciseById(ex.exerciseId);
                return (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <span className="text-sm dark:text-gray-300">{exercise?.name ?? ex.exerciseId}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {ex.targetSets} × {ex.targetReps}
                    </span>
                  </div>
                );
              })}
              {todayPlan.exercises.length > 4 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  +{todayPlan.exercises.length - 4} more exercises
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={40} />
            <p className="text-gray-500 dark:text-gray-400">Rest day! 🎉</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Recovery is part of the process.</p>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {/* Today's Nutrition */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white flex items-center gap-2">
              <Utensils size={18} className="text-green-500" />
              Today&apos;s Nutrition
            </h3>
            <Link to="/nutrition" className="text-sm text-primary-500 hover:text-primary-600">
              Log Meal →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold dark:text-white">{todayTotalCals}</p>
              <p className="text-xs text-gray-500">/ {profile.maintenanceCalories} cal</p>
              <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayTotalCals / profile.maintenanceCalories) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">{todayTotalProtein}g</p>
              <p className="text-xs text-gray-500">/ {profile.proteinTarget}g protein</p>
              <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayTotalProtein / profile.proteinTarget) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent PRs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              Recent PRs
            </h3>
            <Link to="/progress" className="text-sm text-primary-500 hover:text-primary-600">
              View All →
            </Link>
          </div>
          {recentPRs.length > 0 ? (
            <div className="space-y-3">
              {recentPRs.map((pr) => {
                const ex = getExerciseById(pr.exerciseId);
                return (
                  <div key={pr.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-gray-300">{ex?.name}</p>
                      <p className="text-xs text-gray-500">{pr.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                        {pr.weight} kg × {pr.reps}
                      </p>
                      {pr.previousBest > 0 && (
                        <p className="text-xs text-green-500 flex items-center gap-0.5 justify-end">
                          <TrendingUp size={12} /> +{pr.weight - pr.previousBest} kg
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No PRs yet. Start logging workouts!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    orange: 'bg-orange-50 dark:bg-orange-900/10',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/10',
    green: 'bg-green-50 dark:bg-green-900/10',
    blue: 'bg-blue-50 dark:bg-blue-900/10',
  };
  return (
    <div className={`rounded-2xl p-3 sm:p-4 ${bgMap[color] ?? bgMap.indigo} border border-gray-200 dark:border-gray-800`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">{icon}<span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</span></div>
      <p className="text-lg sm:text-xl font-bold dark:text-white truncate">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
