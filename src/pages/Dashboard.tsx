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
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  StatTile,
} from '@/components/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Dashboard — landing page summarising the user's week at a glance.
 *
 * Sections:
 *   1. Header with the date + welcome.
 *   2. Four StatTiles: streak, weekly workouts, average calories, weight.
 *   3. Today's workout preview with deep link to /today.
 *   4. Side-by-side nutrition + recent PRs cards.
 */
export default function Dashboard() {
  const {
    profile,
    workoutPlan,
    workoutLogs,
    calorieLogs,
    bodyMetrics,
    streak,
    personalRecords,
  } = useAppStore();

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

  const avgCalories =
    weekCalories.length > 0
      ? Math.round(
          weekCalories.reduce(
            (s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0),
            0,
          ) / weekCalories.length,
        )
      : 0;

  const todayTotalCals = todayCalories?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;
  const todayTotalProtein = todayCalories?.meals.reduce((s, m) => s + m.protein, 0) ?? 0;

  const latestMetrics =
    bodyMetrics.length > 0
      ? [...bodyMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0]
      : null;

  const recentPRs = [...personalRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={Activity}
        eyebrow={today.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        title={`Welcome back, ${profile.name}`}
        subtitle={
          todayPlan
            ? `${todayPlan.label} day — ${todayPlan.focus} focus.`
            : 'Rest day — fuel up and recover.'
        }
      />

      {/* ─── Quick stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={Flame}
          tone="accent"
          label="Streak"
          value={`${streak.current}d`}
          hint={`Best: ${streak.longest}d`}
        />
        <StatTile
          icon={Dumbbell}
          label="This week"
          value={`${weekLogs.length}/6`}
          hint="workouts done"
        />
        <StatTile
          icon={Utensils}
          label="Avg calories"
          value={avgCalories.toLocaleString()}
          hint="last 7 days"
        />
        <StatTile
          icon={Scale}
          label="Weight"
          value={latestMetrics ? `${latestMetrics.weight} kg` : `${profile.weight} kg`}
          hint={latestMetrics?.bodyFat ? `${latestMetrics.bodyFat}% BF` : undefined}
        />
      </div>

      {/* ─── Today's workout ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-fg-muted" />
              Today&apos;s workout
            </span>
          </CardTitle>
          {todayPlan && (
            <Link
              to="/today"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-700 dark:hover:text-accent-400 focus-ring rounded-md px-1.5 -mx-1.5"
            >
              {todayLog?.completed ? 'View log' : 'Start workout'}
              <ArrowRight size={14} />
            </Link>
          )}
        </CardHeader>

        {todayPlan ? (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge tone="accent" variant="soft">
                {todayPlan.label}
              </Badge>
              <Badge tone="neutral" variant="soft" className="capitalize">
                {todayPlan.focus}
              </Badge>
              {todayLog?.completed && (
                <Badge tone="success" variant="soft">
                  Completed
                </Badge>
              )}
            </div>

            <div className="divide-y divide-line">
              {todayPlan.exercises.slice(0, 4).map((ex) => {
                const exercise = getExerciseById(ex.exerciseId);
                return (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm text-fg">{exercise?.name ?? ex.exerciseId}</span>
                    <span className="text-xs text-fg-muted tabular-nums">
                      {ex.targetSets} × {ex.targetReps}
                    </span>
                  </div>
                );
              })}
            </div>

            {todayPlan.exercises.length > 4 && (
              <p className="text-xs text-fg-subtle">
                +{todayPlan.exercises.length - 4} more exercises
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="Rest day"
            description="Recovery is part of the process. Eat well, sleep well, come back stronger."
          />
        )}
      </Card>

      {/* ─── Bottom row: nutrition + PRs ─────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Utensils size={16} className="text-fg-muted" />
                Today&apos;s nutrition
              </span>
            </CardTitle>
            <Link
              to="/nutrition"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-700 dark:hover:text-accent-400 focus-ring rounded-md px-1.5 -mx-1.5"
            >
              Log meal
              <ArrowRight size={14} />
            </Link>
          </CardHeader>

          <div className="grid grid-cols-2 gap-4">
            <MetricRing
              value={todayTotalCals}
              target={profile.maintenanceCalories}
              suffix="cal"
            />
            <MetricRing
              value={todayTotalProtein}
              target={profile.proteinTarget}
              suffix="g protein"
              tone="info"
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Trophy size={16} className="text-fg-muted" />
                Recent personal records
              </span>
            </CardTitle>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-700 dark:hover:text-accent-400 focus-ring rounded-md px-1.5 -mx-1.5"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </CardHeader>

          {recentPRs.length > 0 ? (
            <ul className="divide-y divide-line">
              {recentPRs.map((pr) => {
                const ex = getExerciseById(pr.exerciseId);
                const delta = pr.previousBest > 0 ? pr.weight - pr.previousBest : 0;
                return (
                  <li
                    key={pr.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{ex?.name}</p>
                      <p className="text-xs text-fg-subtle">{pr.date}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-fg tabular-nums">
                        {pr.weight} kg × {pr.reps}
                      </p>
                      {delta > 0 && (
                        <p className="text-xs text-success flex items-center gap-0.5 justify-end">
                          <TrendingUp size={11} /> +{delta} kg
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No PRs yet"
              description="Log a workout to see your first record here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

/**
 * Compact "value / target" stat with a slim progress bar underneath.
 * Used inside the nutrition card.
 */
function MetricRing({
  value,
  target,
  suffix,
  tone = 'accent',
}: {
  value: number;
  target: number;
  suffix: string;
  tone?: 'accent' | 'info' | 'success' | 'warning';
}) {
  return (
    <div>
      <p className="text-2xl font-semibold text-fg tabular-nums leading-none">{value}</p>
      <p className="text-xs text-fg-muted mt-1 tabular-nums">
        / {target.toLocaleString()} {suffix}
      </p>
      <Progress value={value} max={target} tone={tone} className="mt-2.5" />
    </div>
  );
}
