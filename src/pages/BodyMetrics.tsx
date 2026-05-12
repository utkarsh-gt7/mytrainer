import { useState } from 'react';
import { Scale, TrendingUp, TrendingDown, Camera, Plus, Ruler } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { calculateBMI, getBMICategory } from '@/utils/calculations';
import type { BodyMeasurements } from '@/types';
import PageHeader from '@/components/PageHeader';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Modal,
  StatTile,
} from '@/components/ui';

const MEASUREMENT_KEYS = [
  'chest',
  'waist',
  'hips',
  'neck',
  'bicepLeft',
  'bicepRight',
  'thighLeft',
  'thighRight',
  'calfLeft',
  'calfRight',
] as const;

const humanize = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

/**
 * BodyMetrics — weekly weight / BF / measurements logging with a
 * recharts trend line. Form lives inside the shared `Modal`.
 */
export default function BodyMetrics() {
  const { bodyMetrics, addBodyMetrics, profile } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    weight: profile.weight.toString(),
    height: profile.height.toString(),
    bodyFat: profile.bodyFat?.toString() ?? '',
    date: new Date().toISOString().split('T')[0],
    chest: '',
    waist: '',
    hips: '',
    bicepLeft: '',
    bicepRight: '',
    thighLeft: '',
    thighRight: '',
    calfLeft: '',
    calfRight: '',
    neck: '',
  }));

  const sorted = [...bodyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const weightChange =
    latest && previous ? Math.round((latest.weight - previous.weight) * 10) / 10 : 0;

  const chartData = sorted.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight,
    bodyFat: m.bodyFat,
  }));

  const handleSubmit = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (!Number.isFinite(weight) || !Number.isFinite(height)) return;

    const measurements: BodyMeasurements = {};
    for (const k of MEASUREMENT_KEYS) {
      const v = formData[k];
      if (v) (measurements as Record<string, number>)[k] = parseFloat(v);
    }

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
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        icon={Ruler}
        eyebrow="Body composition"
        title="Body metrics"
        subtitle="Measure weekly. Adjust smarter."
      >
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Log metrics
        </Button>
      </PageHeader>

      {/* ── Summary tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={Scale}
          label="Weight"
          value={`${latest?.weight ?? profile.weight} kg`}
          hint={
            weightChange !== 0
              ? `${weightChange > 0 ? '+' : ''}${weightChange} kg`
              : 'No prior log'
          }
          tone={weightChange < 0 ? 'success' : weightChange > 0 ? 'warning' : 'fg'}
        />
        <StatTile
          label="BMI"
          value={currentBMI.toString()}
          hint={getBMICategory(currentBMI)}
        />
        <StatTile
          label="Body fat"
          value={`${latest?.bodyFat ?? profile.bodyFat ?? '—'}%`}
        />
        <StatTile label="Check-ins" value={bodyMetrics.length.toString()} />
      </div>

      {/* ── Weight chart ───────────────────────────────────────── */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Weight trend</CardTitle>
            {weightChange !== 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted tabular-nums">
                {weightChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {weightChange > 0 ? '+' : ''}
                {weightChange} kg
              </span>
            )}
          </CardHeader>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line-strong))" opacity={0.4} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'rgb(var(--fg-subtle))' }}
                stroke="rgb(var(--line))"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'rgb(var(--fg-subtle))' }}
                stroke="rgb(var(--line))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--surface))',
                  border: '1px solid rgb(var(--line))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: 'rgb(var(--fg))',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="rgb(var(--accent))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'rgb(var(--accent))', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── History ─────────────────────────────────────────────── */}
      {sorted.length > 0 ? (
        <Card bare>
          <div className="px-4 sm:px-5 py-3 border-b border-line">
            <h3 className="text-base font-semibold text-fg tracking-tight">History</h3>
          </div>
          <ul className="divide-y divide-line">
            {[...sorted].reverse().map((m) => (
              <li
                key={m.id}
                className="px-4 sm:px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-fg">
                    {new Date(m.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-fg-subtle tabular-nums">
                    BMI {m.bmi}
                    {m.bodyFat ? ` · ${m.bodyFat}% BF` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fg tabular-nums">{m.weight} kg</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Scale}
            title="No measurements yet"
            description="Log your first check-in to start building a trend line."
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Log metrics
              </Button>
            }
          />
        </Card>
      )}

      {/* ── Form modal ──────────────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Log body metrics"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save metrics
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="bm-date">
              <Input
                id="bm-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              />
            </Field>
            <Field label="Weight (kg)" htmlFor="bm-weight" required>
              <Input
                id="bm-weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
              />
            </Field>
            <Field label="Height (cm)" htmlFor="bm-height" required>
              <Input
                id="bm-height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData((p) => ({ ...p, height: e.target.value }))}
              />
            </Field>
            <Field label="Body fat %" htmlFor="bm-bf">
              <Input
                id="bm-bf"
                type="number"
                step="0.1"
                value={formData.bodyFat}
                onChange={(e) => setFormData((p) => ({ ...p, bodyFat: e.target.value }))}
              />
            </Field>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-accent hover:text-accent-700 dark:hover:text-accent-400 list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Body measurements (optional)
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {MEASUREMENT_KEYS.map((key) => (
                <Field key={key} label={`${humanize(key)} (cm)`} htmlFor={`bm-${key}`}>
                  <Input
                    id={`bm-${key}`}
                    type="number"
                    step="0.1"
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </Field>
              ))}
            </div>
          </details>

          <div className="flex items-center gap-3 p-3 rounded-md bg-surface-2 border border-dashed border-line-strong text-fg-subtle">
            <Camera size={18} />
            <span className="text-sm">Add progress photo (coming soon)</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
