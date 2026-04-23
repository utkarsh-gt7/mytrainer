import { useMemo } from 'react';
import { Trophy, TrendingUp, Calendar, Flame, Dumbbell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import PageHeader from '@/components/PageHeader';

export default function Progress() {
  const { workoutLogs, calorieLogs, bodyMetrics, personalRecords, streak, profile } = useAppStore();

  const weeklyWorkouts = useMemo(() => {
    const weeks: Record<string, number> = {};
    workoutLogs.filter((l) => l.completed).forEach((log) => {
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
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgCalories: Math.round(data.total / data.days),
      }));
  }, [calorieLogs]);

  const recentPRs = [...personalRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const totalWorkouts = workoutLogs.filter((l) => l.completed).length;
  const totalVolume = workoutLogs
    .filter((l) => l.completed)
    .reduce((total, log) => total + log.exercises.reduce(
      (exTotal, ex) => exTotal + ex.sets.reduce((setTotal, s) => setTotal + s.weight * s.reps, 0), 0
    ), 0);

  const weightData = [...bodyMetrics]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weight,
    }));

  /* ─── Dynamic Key Notes Based on Last Week's Data ─── */
  const todayStr = new Date().toISOString().split('T')[0];
  const keyNotes = useMemo(() => {
    const notes: string[] = [];
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 7);
    const weekAgo = d.toISOString().split('T')[0];
    const lastWeekLogs = workoutLogs.filter((l) => l.date >= weekAgo && l.completed);
    const lastWeekCals = calorieLogs.filter((l) => l.date >= weekAgo);
    const avgCals = lastWeekCals.length > 0
      ? Math.round(lastWeekCals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + m.calories, 0), 0) / lastWeekCals.length)
      : 0;
    const avgProtein = lastWeekCals.length > 0
      ? Math.round(lastWeekCals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + m.protein, 0), 0) / lastWeekCals.length)
      : 0;
    const latestWeight = bodyMetrics.length > 0
      ? [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;

    // Workout adherence
    if (lastWeekLogs.length >= 5) notes.push('🔥 Great workout adherence! ' + lastWeekLogs.length + '/6 sessions completed.');
    else if (lastWeekLogs.length >= 3) notes.push('👍 Decent week with ' + lastWeekLogs.length + ' workouts. Try to hit 5-6 next week.');
    else if (lastWeekLogs.length > 0) notes.push('⚠️ Only ' + lastWeekLogs.length + ' workout(s) this week. Consistency is key for recomp.');
    else notes.push('🏋️ No workouts logged this week. Start tracking to see progress!');

    // Nutrition
    if (avgCals > 0) {
      const target = profile.maintenanceCalories;
      if (avgCals > target + 300) notes.push('⚠️ Avg ' + avgCals + ' cal/day — ' + (avgCals - target) + ' over maintenance. For recomp, stay near ' + target + '.');
      else if (avgCals < target - 400) notes.push('⚠️ Avg ' + avgCals + ' cal/day — too low for muscle growth. Aim for ~' + target + '.');
      else notes.push('✅ Nutrition on point: avg ' + avgCals + ' cal/day (target: ' + target + ').');
    }

    if (avgProtein > 0) {
      if (avgProtein >= profile.proteinTarget * 0.9) notes.push('✅ Protein target met: avg ' + avgProtein + 'g/day.');
      else notes.push('💪 Protein avg ' + avgProtein + 'g/day — aim for ' + profile.proteinTarget + 'g for optimal recomp.');
    }

    // Weight trend
    if (latestWeight) {
      const bf = latestWeight.bodyFat;
      if (bf && bf > 14) notes.push('📊 Body fat at ' + bf + '%. For visible abs, target 10-12%. Keep nutrition consistent.');
      else if (bf && bf <= 12) notes.push('🎯 Body fat at ' + bf + '% — abs should be showing! Maintain current approach.');
    }

    // Deload reminder
    if (totalWorkouts > 0 && totalWorkouts % 30 === 0) {
      notes.push('🔄 Consider a deload week — reduce volume by 40-50% for recovery.');
    }

    if (notes.length === 0) notes.push('📝 Start logging workouts and meals to get personalized insights!');

    return notes;
  }, [workoutLogs, calorieLogs, bodyMetrics, profile, totalWorkouts, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        theme="progress"
        icon={Trophy}
        eyebrow="Earned, Not Given"
        title="Progress"
        subtitle="Volume, PRs and streaks — receipts for the work you've put in."
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-primary-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <Dumbbell size={18} className="text-primary-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">{totalWorkouts}</p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Total Workouts</p>
        </div>
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-nutrition-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <TrendingUp size={18} className="text-nutrition-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">{Math.round(totalVolume / 1000)}k</p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Total Volume (kg)</p>
        </div>
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-gold-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <Trophy size={18} className="text-gold-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">{personalRecords.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Personal Records</p>
        </div>
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-flame-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <Flame size={18} className="text-flame-500 mb-1" />
          <p className="text-2xl font-display font-bold dark:text-white tabular-nums">{streak.longest}</p>
          <p className="text-[10px] uppercase tracking-wider text-iron-500">Best Streak</p>
        </div>
      </div>

      {/* Dynamic Key Notes */}
      <div className="bg-gradient-to-r from-gold-50 via-white to-primary-50 dark:from-gold-900/20 dark:via-iron-900/60 dark:to-primary-900/20 rounded-2xl border border-gold-200 dark:border-gold-900/50 p-4 sm:p-6">
        <h3 className="font-display text-sm uppercase tracking-wider font-bold text-gold-700 dark:text-gold-300 mb-3 flex items-center gap-2">
          <Calendar size={18} /> Weekly Insights
        </h3>
        <div className="space-y-2">
          {keyNotes.map((note, i) => (
            <p key={i} className="text-sm dark:text-gray-300">{note}</p>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {weeklyWorkouts.length > 0 && (
          <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 p-4 sm:p-6">
            <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 mb-4">Weekly Workouts</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyWorkouts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="workouts" fill="#ef2b2b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {weeklyCalories.length > 0 && (
          <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 p-4 sm:p-6">
            <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 mb-4">Avg Weekly Calories</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyCalories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="avgCalories" stroke="#22ac5c" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weight Trend */}
      {weightData.length > 1 && (
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 p-4 sm:p-6">
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 mb-4">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="weight" stroke="#2f8dff" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* PR History */}
      {recentPRs.length > 0 && (
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 overflow-hidden">
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 p-4 border-b border-iron-200/60 dark:border-iron-800 flex items-center gap-2">
            <Trophy size={18} className="text-gold-500" /> Personal Records
          </h3>
          <div className="divide-y divide-iron-100 dark:divide-iron-800">
            {recentPRs.map((pr) => {
              const ex = getExerciseById(pr.exerciseId);
              return (
                <div key={pr.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{ex?.name}</p>
                    <p className="text-xs text-iron-500">{new Date(pr.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold-700 dark:text-gold-300 font-mono tabular-nums">{pr.weight} kg × {pr.reps}</p>
                    {pr.previousBest > 0 && (
                      <p className="text-xs text-nutrition-600">+{pr.weight - pr.previousBest} kg from previous</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
