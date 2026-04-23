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
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import PageHeader from '@/components/PageHeader';

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
      <PageHeader
        theme="dashboard"
        icon={Activity}
        eyebrow={today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`Welcome back, ${profile.name}`}
        subtitle={todayPlan ? `${todayPlan.label} day — ${todayPlan.focus.toUpperCase()} focus. Let's move.` : 'Rest day — fuel up and recover.'}
      >
        {streak.current > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 border border-white/25 backdrop-blur-sm">
            <Flame size={16} className="text-white" />
            <span className="font-display uppercase text-sm font-bold tracking-wider">
              {streak.current} day streak
            </span>
          </div>
        )}
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Flame className="text-flame-500" />}
          label="Streak"
          value={`${streak.current} days`}
          sub={`Best: ${streak.longest}`}
          color="flame"
        />
        <StatCard
          icon={<Dumbbell className="text-primary-500" />}
          label="This Week"
          value={`${weekLogs.length}/6`}
          sub="workouts done"
          color="primary"
        />
        <StatCard
          icon={<Utensils className="text-nutrition-500" />}
          label="Avg Calories"
          value={avgCalories.toString()}
          sub="this week"
          color="nutrition"
        />
        <StatCard
          icon={<Scale className="text-metrics-500" />}
          label="Weight"
          value={latestMetrics ? `${latestMetrics.weight} kg` : `${profile.weight} kg`}
          sub={latestMetrics?.bodyFat ? `${latestMetrics.bodyFat}% BF` : ''}
          color="metrics"
        />
      </div>

      {/* Today's Workout */}
      <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-primary-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary-500" size={22} />
            <h2 className="font-display text-lg uppercase tracking-wide font-bold dark:text-white">Today&apos;s Workout</h2>
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
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-nutrition-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base uppercase tracking-wide font-bold dark:text-white flex items-center gap-2">
              <Utensils size={18} className="text-nutrition-500" />
              Today&apos;s Nutrition
            </h3>
            <Link to="/nutrition" className="text-sm text-nutrition-600 hover:text-nutrition-700 font-semibold">
              Log Meal →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold dark:text-white font-display tabular-nums">{todayTotalCals}</p>
              <p className="text-xs text-iron-500 dark:text-iron-400">/ {profile.maintenanceCalories} cal</p>
              <div className="mt-2 h-2 bg-iron-100 dark:bg-iron-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-nutrition-400 to-nutrition-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayTotalCals / profile.maintenanceCalories) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white font-display tabular-nums">{todayTotalProtein}g</p>
              <p className="text-xs text-iron-500 dark:text-iron-400">/ {profile.proteinTarget}g protein</p>
              <div className="mt-2 h-2 bg-iron-100 dark:bg-iron-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-metrics-400 to-metrics-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayTotalProtein / profile.proteinTarget) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent PRs */}
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-gold-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base uppercase tracking-wide font-bold dark:text-white flex items-center gap-2">
              <Trophy size={18} className="text-gold-500" />
              Recent PRs
            </h3>
            <Link to="/progress" className="text-sm text-gold-600 hover:text-gold-700 font-semibold">
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
                      <p className="text-xs text-iron-500">{pr.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold-700 dark:text-gold-300 font-mono tabular-nums">
                        {pr.weight} kg × {pr.reps}
                      </p>
                      {pr.previousBest > 0 && (
                        <p className="text-xs text-nutrition-600 flex items-center gap-0.5 justify-end">
                          <TrendingUp size={12} /> +{pr.weight - pr.previousBest} kg
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-iron-400 dark:text-iron-500 text-center py-4">
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
    flame: 'bg-gradient-to-br from-flame-50 to-white dark:from-flame-900/20 dark:to-iron-900/60 border-flame-200 dark:border-flame-900/50',
    primary: 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-iron-900/60 border-primary-200 dark:border-primary-900/50',
    nutrition: 'bg-gradient-to-br from-nutrition-50 to-white dark:from-nutrition-900/20 dark:to-iron-900/60 border-nutrition-200 dark:border-nutrition-900/50',
    metrics: 'bg-gradient-to-br from-metrics-50 to-white dark:from-metrics-900/20 dark:to-iron-900/60 border-metrics-200 dark:border-metrics-900/50',
    gold: 'bg-gradient-to-br from-gold-50 to-white dark:from-gold-900/20 dark:to-iron-900/60 border-gold-200 dark:border-gold-900/50',
  };
  return (
    <div className={`rounded-2xl p-3 sm:p-4 border ${bgMap[color] ?? bgMap.primary}`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        {icon}
        <span className="text-[10px] sm:text-xs font-display uppercase tracking-wider text-iron-500 dark:text-iron-300">{label}</span>
      </div>
      <p className="text-lg sm:text-2xl font-bold dark:text-white truncate font-display tracking-tight">{value}</p>
      {sub && <p className="text-xs text-iron-500 dark:text-iron-400 mt-0.5">{sub}</p>}
    </div>
  );
}
