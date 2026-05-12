import { useMemo } from 'react';
import {
  Trophy,
  TrendingUp,
  Calendar,
  Flame,
  Dumbbell,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import PageHeader from '@/components/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  StatTile,
} from '@/components/ui';

// Shared recharts styling — single accent stroke, neutral grid.
const chartTokens = {
  grid: 'rgb(var(--line-strong))',
  axis: 'rgb(var(--line))',
  tick: 'rgb(var(--fg-subtle))',
  surface: 'rgb(var(--surface))',
  fg: 'rgb(var(--fg))',
  accent: 'rgb(var(--accent))',
  success: 'rgb(16 185 129)',
  info: 'rgb(14 165 233)',
};

/**
 * Progress — analytics dashboard. Three sections of charts, a key-notes
 * panel for personalised insights, and a PR history list.
 */
export default function Progress() {
  const {
    workoutLogs,
    calorieLogs,
    bodyMetrics,
    personalRecords,
    streak,
    profile,
  } = useAppStore();

  const weeklyWorkouts = useMemo(() => {
    const weeks: Record<string, number> = {};
    workoutLogs
      .filter((l) => l.completed)
      .forEach((log) => {
        const d = new Date(log.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weeks[key] = (weeks[key] || 0) + 1;
      });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        workouts: count,
      }));
  }, [workoutLogs]);

  const weeklyCalories = useMemo(() => {
    const weeks: Record<string, { total: number; days: number }> = {};
    calorieLogs.forEach((log) => {
      const d = new Date(log.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const dayCals = log.meals.reduce((s, m) => s + m.calories, 0);
      if (!weeks[key]) weeks[key] = { total: 0, days: 0 };
      weeks[key].total += dayCals;
      weeks[key].days += 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        avgCalories: Math.round(data.total / data.days),
      }));
  }, [calorieLogs]);

  const recentPRs = [...personalRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const totalWorkouts = workoutLogs.filter((l) => l.completed).length;
  const totalVolume = workoutLogs
    .filter((l) => l.completed)
    .reduce(
      (total, log) =>
        total +
        log.exercises.reduce(
          (exTotal, ex) =>
            exTotal + ex.sets.reduce((setTotal, s) => setTotal + s.weight * s.reps, 0),
          0,
        ),
      0,
    );

  const weightData = [...bodyMetrics]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: m.weight,
    }));

  /* ─── Dynamic weekly insights ───────────────────────────────── */
  const todayStr = new Date().toISOString().split('T')[0];
  const keyNotes = useMemo(() => {
    const notes: string[] = [];
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 7);
    const weekAgo = d.toISOString().split('T')[0];
    const lastWeekLogs = workoutLogs.filter((l) => l.date >= weekAgo && l.completed);
    const lastWeekCals = calorieLogs.filter((l) => l.date >= weekAgo);
    const avgCals =
      lastWeekCals.length > 0
        ? Math.round(
            lastWeekCals.reduce(
              (s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0),
              0,
            ) / lastWeekCals.length,
          )
        : 0;
    const avgProtein =
      lastWeekCals.length > 0
        ? Math.round(
            lastWeekCals.reduce(
              (s, l) => s + l.meals.reduce((ms, m) => ms + m.protein, 0),
              0,
            ) / lastWeekCals.length,
          )
        : 0;
    const latestWeight =
      bodyMetrics.length > 0
        ? [...bodyMetrics].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0]
        : null;

    if (lastWeekLogs.length >= 5) {
      notes.push(`Great workout adherence — ${lastWeekLogs.length}/6 sessions completed.`);
    } else if (lastWeekLogs.length >= 3) {
      notes.push(
        `Decent week with ${lastWeekLogs.length} workouts. Aim for 5–6 next week.`,
      );
    } else if (lastWeekLogs.length > 0) {
      notes.push(
        `Only ${lastWeekLogs.length} workout(s) this week. Consistency is key for recomp.`,
      );
    } else {
      notes.push('No workouts logged this week. Start tracking to see progress.');
    }

    if (avgCals > 0) {
      const target = profile.maintenanceCalories;
      if (avgCals > target + 300) {
        notes.push(
          `Avg ${avgCals} cal/day — ${avgCals - target} over maintenance. Stay near ${target} for recomp.`,
        );
      } else if (avgCals < target - 400) {
        notes.push(
          `Avg ${avgCals} cal/day — too low for muscle growth. Aim for ~${target}.`,
        );
      } else {
        notes.push(`Nutrition on point — avg ${avgCals} cal/day (target ${target}).`);
      }
    }

    if (avgProtein > 0) {
      if (avgProtein >= profile.proteinTarget * 0.9) {
        notes.push(`Protein target met — avg ${avgProtein}g/day.`);
      } else {
        notes.push(
          `Protein avg ${avgProtein}g/day — aim for ${profile.proteinTarget}g for optimal recomp.`,
        );
      }
    }

    if (latestWeight?.bodyFat) {
      const bf = latestWeight.bodyFat;
      if (bf > 14) {
        notes.push(`Body fat ${bf}%. For visible abs, target 10–12%.`);
      } else if (bf <= 12) {
        notes.push(`Body fat ${bf}% — abs should be showing. Maintain current approach.`);
      }
    }

    if (totalWorkouts > 0 && totalWorkouts % 30 === 0) {
      notes.push('Consider a deload week — reduce volume by 40–50% for recovery.');
    }

    if (notes.length === 0) {
      notes.push('Start logging workouts and meals to get personalised insights.');
    }

    return notes;
  }, [workoutLogs, calorieLogs, bodyMetrics, profile, totalWorkouts, todayStr]);

  const sharedAxisProps = {
    tick: { fontSize: 11, fill: chartTokens.tick },
    stroke: chartTokens.axis,
  };

  const sharedTooltipStyle = {
    backgroundColor: chartTokens.surface,
    border: '1px solid rgb(var(--line))',
    borderRadius: '0.5rem',
    fontSize: '12px',
    color: chartTokens.fg,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        theme="progress"
        icon={Trophy}
        eyebrow="Earned, not given"
        title="Progress"
        subtitle="Volume, PRs and streaks — receipts for the work you've put in."
      />

      {/* ── Headline stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Dumbbell} label="Workouts" value={totalWorkouts} hint="completed" />
        <StatTile
          icon={TrendingUp}
          tone="success"
          label="Volume"
          value={`${Math.round(totalVolume / 1000)}k`}
          hint="kg lifted"
        />
        <StatTile
          icon={Trophy}
          tone="warning"
          label="Personal records"
          value={personalRecords.length}
        />
        <StatTile
          icon={Flame}
          tone="accent"
          label="Best streak"
          value={`${streak.longest}d`}
        />
      </div>

      {/* ── Weekly insights ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-fg-muted" />
              Weekly insights
            </span>
          </CardTitle>
        </CardHeader>
        <ul className="space-y-1.5">
          {keyNotes.map((note, i) => (
            <li
              key={i}
              className="text-sm text-fg flex gap-2 before:content-['·'] before:text-fg-subtle"
            >
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── Two-column charts ───────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {weeklyWorkouts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly workouts</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyWorkouts} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid} opacity={0.4} />
                <XAxis dataKey="week" {...sharedAxisProps} />
                <YAxis {...sharedAxisProps} />
                <Tooltip contentStyle={sharedTooltipStyle} cursor={{ fill: 'rgb(var(--surface-2))' }} />
                <Bar dataKey="workouts" fill={chartTokens.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {weeklyCalories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Avg weekly calories</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyCalories} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid} opacity={0.4} />
                <XAxis dataKey="week" {...sharedAxisProps} />
                <YAxis {...sharedAxisProps} />
                <Tooltip contentStyle={sharedTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="avgCalories"
                  stroke={chartTokens.success}
                  strokeWidth={2}
                  dot={{ r: 3, fill: chartTokens.success, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ── Weight trend ────────────────────────────────────── */}
      {weightData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightData} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid} opacity={0.4} />
              <XAxis dataKey="date" {...sharedAxisProps} />
              <YAxis domain={['auto', 'auto']} {...sharedAxisProps} />
              <Tooltip contentStyle={sharedTooltipStyle} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={chartTokens.info}
                strokeWidth={2}
                dot={{ r: 3, fill: chartTokens.info, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── PR history ──────────────────────────────────────── */}
      {recentPRs.length > 0 ? (
        <Card bare>
          <div className="px-4 sm:px-5 py-3 border-b border-line flex items-center gap-2">
            <Trophy size={16} className="text-warning" />
            <h3 className="text-base font-semibold text-fg tracking-tight">
              Personal records
            </h3>
          </div>
          <ul className="divide-y divide-line">
            {recentPRs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId);
              return (
                <li
                  key={pr.id}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{ex?.name}</p>
                    <p className="text-xs text-fg-subtle">
                      {new Date(pr.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-fg tabular-nums">
                      {pr.weight} kg × {pr.reps}
                    </p>
                    {pr.previousBest > 0 && (
                      <p className="text-xs text-success tabular-nums">
                        +{pr.weight - pr.previousBest} kg from previous
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Trophy}
            title="No PRs logged yet"
            description="Complete workouts and your records will track themselves here."
          />
        </Card>
      )}
    </div>
  );
}
