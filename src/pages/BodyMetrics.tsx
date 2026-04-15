import { useState } from 'react';
import { Scale, TrendingUp, TrendingDown, Camera, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { calculateBMI, getBMICategory } from '@/utils/calculations';
import type { BodyMeasurements } from '@/types';

export default function BodyMetrics() {
  const { bodyMetrics, addBodyMetrics, profile } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weight: profile.weight.toString(),
    height: profile.height.toString(),
    bodyFat: profile.bodyFat?.toString() ?? '',
    date: new Date().toISOString().split('T')[0],
    chest: '', waist: '', hips: '', bicepLeft: '', bicepRight: '',
    thighLeft: '', thighRight: '', calfLeft: '', calfRight: '', neck: '',
  });

  const sorted = [...bodyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const weightChange = latest && previous ? Math.round((latest.weight - previous.weight) * 10) / 10 : 0;

  const chartData = sorted.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight,
    bodyFat: m.bodyFat,
    bmi: m.bmi,
  }));

  const handleSubmit = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (isNaN(weight) || isNaN(height)) return;

    const measurements: BodyMeasurements = {};
    if (formData.chest) measurements.chest = parseFloat(formData.chest);
    if (formData.waist) measurements.waist = parseFloat(formData.waist);
    if (formData.hips) measurements.hips = parseFloat(formData.hips);
    if (formData.bicepLeft) measurements.bicepLeft = parseFloat(formData.bicepLeft);
    if (formData.bicepRight) measurements.bicepRight = parseFloat(formData.bicepRight);
    if (formData.thighLeft) measurements.thighLeft = parseFloat(formData.thighLeft);
    if (formData.thighRight) measurements.thighRight = parseFloat(formData.thighRight);
    if (formData.calfLeft) measurements.calfLeft = parseFloat(formData.calfLeft);
    if (formData.calfRight) measurements.calfRight = parseFloat(formData.calfRight);
    if (formData.neck) measurements.neck = parseFloat(formData.neck);

    addBodyMetrics({
      date: formData.date,
      weight,
      height,
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
    });
    setShowForm(false);
  };

  const currentBMI = latest
    ? latest.bmi ?? calculateBMI(latest.weight, latest.height)
    : calculateBMI(profile.weight, profile.height);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Body Metrics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track your body composition weekly</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
        >
          <Plus size={16} /> Log Metrics
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <Scale size={18} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold dark:text-white">{latest?.weight ?? profile.weight} kg</p>
          {weightChange !== 0 && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {weightChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {weightChange > 0 ? '+' : ''}{weightChange} kg
            </p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">Weight</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold dark:text-white">{currentBMI}</p>
          <p className="text-xs text-gray-500">{getBMICategory(currentBMI)}</p>
          <p className="text-xs text-gray-400 mt-0.5">BMI</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold dark:text-white">
            {latest?.bodyFat ?? profile.bodyFat ?? '—'}%
          </p>
          <p className="text-xs text-gray-500">Body Fat</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-2xl font-bold dark:text-white">{bodyMetrics.length}</p>
          <p className="text-xs text-gray-500">Check-ins</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <h3 className="font-semibold dark:text-white mb-4">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">Log Body Metrics</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({...p, date: e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData(p => ({...p, weight: e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={(e) => setFormData(p => ({...p, height: e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Body Fat %</label>
                  <input type="number" step="0.1" value={formData.bodyFat} onChange={(e) => setFormData(p => ({...p, bodyFat: e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-primary-500 hover:text-primary-600">
                  Body Measurements (optional)
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(['chest','waist','hips','neck','bicepLeft','bicepRight','thighLeft','thighRight','calfLeft','calfRight'] as const).map(key => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 block mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} (cm)</label>
                      <input type="number" step="0.1" value={formData[key]}
                        onChange={(e) => setFormData(p => ({...p, [key]: e.target.value}))}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                    </div>
                  ))}
                </div>
              </details>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer">
                <Camera size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">Add progress photo (coming soon)</span>
              </div>

              <button onClick={handleSubmit}
                className="w-full py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600">
                Save Metrics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <h3 className="font-semibold dark:text-white p-4 border-b border-gray-200 dark:border-gray-800">History</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...sorted].reverse().map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium dark:text-white">{new Date(m.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">BMI: {m.bmi} • {m.bodyFat ? `${m.bodyFat}% BF` : ''}</p>
                </div>
                <p className="font-semibold dark:text-white">{m.weight} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
