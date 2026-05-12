import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Sun,
  Moon,
  Download,
  Trash2,
  Database,
  Shield,
  Settings as SettingsIcon,
  Archive,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { isFirebaseConfigured, db, doc, deleteDoc } from '@/services/firebase';
import { isGeminiConfigured } from '@/services/gemini';
import { cn } from '@/utils/cn';
import PageHeader from '@/components/PageHeader';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
} from '@/components/ui';

/**
 * Settings — profile, appearance, archive shortcut, service status,
 * and data management. The page is intentionally calmer than before —
 * each section is a flat surface Card with consistent spacing.
 */
export default function Settings() {
  const {
    profile,
    updateProfile,
    darkMode,
    toggleDarkMode,
    workoutLogs,
    calorieLogs,
    bodyMetrics,
  } = useAppStore();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age.toString());
  const [height, setHeight] = useState(profile.height.toString());
  const [weight, setWeight] = useState(profile.weight.toString());
  const [bodyFat, setBodyFat] = useState(profile.bodyFat?.toString() ?? '');
  const [goal, setGoal] = useState(profile.goal);
  const [maintenanceCal, setMaintenanceCal] = useState(
    profile.maintenanceCalories.toString(),
  );
  const [proteinTarget, setProteinTarget] = useState(profile.proteinTarget.toString());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({
      name,
      age: parseInt(age) || 22,
      height: parseFloat(height) || 175,
      weight: parseFloat(weight) || 72,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      goal: goal as 'recomp' | 'bulk' | 'cut',
      maintenanceCalories: parseInt(maintenanceCal) || 2300,
      proteinTarget: parseInt(proteinTarget) || 160,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = {
      profile,
      workoutLogs,
      calorieLogs,
      bodyMetrics,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = [['Date', 'Day', 'Exercise', 'Set', 'Weight (kg)', 'Reps']];
    workoutLogs.forEach((log) => {
      log.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          rows.push([
            log.date,
            log.dayId,
            ex.exerciseId,
            s.setNumber.toString(),
            s.weight.toString(),
            s.reps.toString(),
          ]);
        });
      });
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittracker-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        'Are you sure? This will delete ALL your data including workout logs, metrics, and meal logs. This cannot be undone.',
      )
    ) {
      if (isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, 'appState', 'main'));
        } catch (err) {
          console.error('Failed to clear Firestore data:', err);
        }
      }
      window.location.reload();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Personal setup"
        title="Settings"
        subtitle="Tune your profile, theme and cloud data — all in one place."
      />

      {/* ── Appearance ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              {darkMode ? (
                <Moon size={16} className="text-fg-muted" />
              ) : (
                <Sun size={16} className="text-fg-muted" />
              )}
              Appearance
            </span>
          </CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-fg">Dark mode</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Inverts surfaces — accent stays warm.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode}
            className={cn(
              'touch-target-sm relative w-11 h-6 rounded-full transition-colors focus-ring',
              darkMode ? 'bg-accent' : 'bg-surface-2 border border-line-strong',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                darkMode ? 'translate-x-5' : '',
              )}
            />
          </button>
        </div>
      </Card>

      {/* ── Profile ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <User size={16} className="text-fg-muted" />
              Profile
            </span>
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" htmlFor="p-name">
            <Input id="p-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Age" htmlFor="p-age">
            <Input id="p-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </Field>
          <Field label="Height (cm)" htmlFor="p-h">
            <Input
              id="p-h"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </Field>
          <Field label="Weight (kg)" htmlFor="p-w">
            <Input
              id="p-w"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
          <Field label="Body fat %" htmlFor="p-bf">
            <Input
              id="p-bf"
              type="number"
              step="0.1"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </Field>
          <Field label="Goal" htmlFor="p-goal">
            <Select
              id="p-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as 'recomp' | 'bulk' | 'cut')}
            >
              <option value="recomp">Body recomp</option>
              <option value="bulk">Lean bulk</option>
              <option value="cut">Cut</option>
            </Select>
          </Field>
          <Field label="Maintenance cal" htmlFor="p-mc">
            <Input
              id="p-mc"
              type="number"
              value={maintenanceCal}
              onChange={(e) => setMaintenanceCal(e.target.value)}
            />
          </Field>
          <Field label="Protein target (g)" htmlFor="p-pt">
            <Input
              id="p-pt"
              type="number"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" onClick={handleSave}>
            {saved && <CheckCircle2 size={14} />}
            {saved ? 'Saved' : 'Save profile'}
          </Button>
        </div>
      </Card>

      {/* ── Training history shortcut ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Archive size={16} className="text-fg-muted" />
              Training history
            </span>
          </CardTitle>
        </CardHeader>
        <Link
          to="/archive"
          className="group flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-line bg-surface-2/50 hover:bg-surface-2 hover:border-line-strong transition-colors focus-ring"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">Workout archive</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Search, filter and revisit every session.
            </p>
          </div>
          <ChevronRight
            size={16}
            className="text-fg-subtle group-hover:text-fg flex-shrink-0"
          />
        </Link>
      </Card>

      {/* ── Service status ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-fg-muted" />
              Services
            </span>
          </CardTitle>
        </CardHeader>
        <ul className="space-y-2">
          <li className="flex items-center justify-between">
            <span className="text-sm text-fg">Firebase</span>
            <Badge
              tone={isFirebaseConfigured() ? 'success' : 'warning'}
              variant="soft"
            >
              {isFirebaseConfigured() ? 'Connected' : 'Not configured'}
            </Badge>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-sm text-fg">Gemini AI</span>
            <Badge
              tone={isGeminiConfigured() ? 'success' : 'warning'}
              variant="soft"
            >
              {isGeminiConfigured() ? 'Connected' : 'Mock analysis'}
            </Badge>
          </li>
        </ul>
      </Card>

      {/* ── Data management ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Database size={16} className="text-fg-muted" />
              Data management
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download size={14} /> Export data (JSON)
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={handleExportCSV}
          >
            <Download size={14} /> Export workouts (CSV)
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={handleClearData}
          >
            <Trash2 size={14} /> Clear all data
          </Button>
        </div>
      </Card>
    </div>
  );
}
