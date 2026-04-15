import { useState } from 'react';
import { User, Sun, Moon, Download, Trash2, Database, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { isFirebaseConfigured, db, doc, deleteDoc } from '@/services/firebase';
import { isGeminiConfigured } from '@/services/gemini';

export default function Settings() {
  const { profile, updateProfile, darkMode, toggleDarkMode, workoutLogs, calorieLogs, bodyMetrics } = useAppStore();
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age.toString());
  const [height, setHeight] = useState(profile.height.toString());
  const [weight, setWeight] = useState(profile.weight.toString());
  const [bodyFat, setBodyFat] = useState(profile.bodyFat?.toString() ?? '');
  const [goal, setGoal] = useState(profile.goal);
  const [maintenanceCal, setMaintenanceCal] = useState(profile.maintenanceCalories.toString());
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
          rows.push([log.date, log.dayId, ex.exerciseId, s.setNumber.toString(), s.weight.toString(), s.reps.toString()]);
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
    if (window.confirm('Are you sure? This will delete ALL your data including workout logs, metrics, and meal logs. This cannot be undone.')) {
      if (isFirebaseConfigured() && db) {
        try {
          await deleteDoc(doc(db, 'appState', 'main'));
        } catch (err) {
          console.error('Failed to clear Firestore data:', err);
        }
      }
      localStorage.removeItem('fitness-tracker-storage');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Settings</h1>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          {darkMode ? <Moon size={18} /> : <Sun size={18} />} Appearance
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm dark:text-gray-300">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <User size={18} /> Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Height (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Body Fat %</label>
            <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Goal</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value as 'recomp' | 'bulk' | 'cut')}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white">
              <option value="recomp">Body Recomp</option>
              <option value="bulk">Lean Bulk</option>
              <option value="cut">Cut</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Maintenance Cal</label>
            <input type="number" value={maintenanceCal} onChange={(e) => setMaintenanceCal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium dark:text-gray-400 block mb-1">Protein Target (g)</label>
            <input type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
          </div>
        </div>
        <button onClick={handleSave}
          className="mt-4 w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">
          {saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Service Status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <Shield size={18} /> Services
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm dark:text-gray-300">Firebase</span>
            <span className={`text-xs px-2 py-1 rounded-full w-fit ${isFirebaseConfigured() ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {isFirebaseConfigured() ? 'Connected' : 'Not configured (using local storage)'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm dark:text-gray-300">Gemini AI</span>
            <span className={`text-xs px-2 py-1 rounded-full w-fit ${isGeminiConfigured() ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {isGeminiConfigured() ? 'Connected' : 'Not configured (mock analysis)'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h3 className="font-semibold dark:text-white mb-4 flex items-center gap-2">
          <Database size={18} /> Data Management
        </h3>
        <div className="space-y-3">
          <button onClick={handleExport}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
            <Download size={16} /> Export Data (JSON)
          </button>
          <button onClick={handleExportCSV}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
            <Download size={16} /> Export Workouts (CSV)
          </button>
          <button onClick={handleClearData}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
            <Trash2 size={16} /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
