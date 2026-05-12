import { useRef, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Camera,
  Droplets,
  Footprints,
  Heart,
  Loader2,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { analyzeFoodImage, isGeminiConfigured } from '@/services/gemini';
import { getDailyCalorieTarget } from '@/utils/calculations';
import type { FoodItem } from '@/types';
import { notify } from '@/services/notifier';
import { cn } from '@/utils/cn';
import PageHeader from '@/components/PageHeader';
import SavedMealsBar from '@/components/nutrition/SavedMealsBar';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
} from '@/components/ui';

/**
 * Macro slice colours match the design-token accent set so the pie
 * chart sits visually quietly inside the surface.
 */
const MACRO_COLORS = {
  protein: 'rgb(14 165 233)', // info-500
  carbs: 'rgb(16 185 129)', // success-500
  fat: 'rgb(245 158 11)', // warning-500
};

const blankManual = () => ({
  name: '',
  quantity: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
});

/**
 * CalorieTracker — daily nutrition + activity logging.
 *
 * Top-level sections:
 *   1. Header with date picker.
 *   2. Two-card macro summary (totals + pie chart).
 *   3. Verdict line ("on track", "over target", etc.).
 *   4. Three activity inputs (steps / cardio / water).
 *   5. SavedMealsBar (one-tap recurring meals).
 *   6. Add-meal CTA + modal form (AI image OR manual entries).
 *   7. List of meals logged today.
 */
export default function CalorieTracker() {
  const {
    calorieLogs,
    addMeal,
    removeMeal,
    updateSteps,
    updateCardio,
    updateWater,
    profile,
    addSavedMeal,
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [showMealForm, setShowMealForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState('12:00');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [manualItem, setManualItem] = useState(blankManual);
  const [aiDescription, setAiDescription] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayLog = calorieLogs.find((l) => l.date === selectedDate);
  const totalCals = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;
  const totalProtein = todayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0;
  const totalCarbs = todayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0;
  const totalFat = todayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0;

  const isTrainingDay = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ].includes(new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }));
  const calorieTarget = getDailyCalorieTarget(profile, isTrainingDay);

  const macroData = [
    { name: 'Protein', value: totalProtein * 4, grams: totalProtein },
    { name: 'Carbs', value: totalCarbs * 4, grams: totalCarbs },
    { name: 'Fat', value: totalFat * 9, grams: totalFat },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify.warning('Not an image', 'Please pick a photo or use the camera.');
      return;
    }
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      notify.warning('Image too large', 'Please use a photo under 8MB.');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeFoodImage(file, aiDescription);
      if (result && result.items.length > 0) {
        setItems(result.items);
        setMealName((prev) => prev || 'AI analyzed meal');
        notify.success(
          'Food analyzed',
          `${result.items.length} item(s) detected${aiDescription.trim() ? ' (with your context)' : ''}.`,
        );
      } else {
        notify.warning('Could not analyze', 'Add the items manually below.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      notify.error('Analysis failed', 'We could not reach the AI service right now.');
    } finally {
      setAnalyzing(false);
      if (e.target) e.target.value = '';
    }
  };

  const clampNumber = (raw: string): number => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
  };

  const addManualItem = () => {
    if (!manualItem.name.trim() || !manualItem.calories) {
      notify.warning('Missing info', 'Food name and calories are required.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        name: manualItem.name.trim(),
        quantity: manualItem.quantity || '1 serving',
        calories: clampNumber(manualItem.calories),
        protein: clampNumber(manualItem.protein),
        carbs: clampNumber(manualItem.carbs),
        fat: clampNumber(manualItem.fat),
      },
    ]);
    setManualItem(blankManual());
  };

  const saveMeal = () => {
    if (items.length === 0) {
      notify.warning('Add at least one item', 'A meal needs food inside it.');
      return;
    }
    if (!mealName.trim()) {
      notify.warning('Name your meal', 'e.g. Lunch, Post-workout shake.');
      return;
    }
    const totalC = items.reduce((s, i) => s + i.calories, 0);
    const totalP = items.reduce((s, i) => s + i.protein, 0);
    const totalCa = items.reduce((s, i) => s + i.carbs, 0);
    const totalF = items.reduce((s, i) => s + i.fat, 0);
    addMeal(selectedDate, {
      name: mealName.trim(),
      time: mealTime,
      calories: totalC,
      protein: totalP,
      carbs: totalCa,
      fat: totalF,
      items,
    });
    if (saveAsTemplate) {
      addSavedMeal({
        name: mealName.trim(),
        defaultTime: mealTime,
        items: items.map((it) => ({ ...it })),
      });
    }
    notify.success(
      saveAsTemplate ? 'Meal saved & stashed' : 'Meal saved',
      `${totalC} cal · ${totalP}g protein`,
    );
    setShowMealForm(false);
    setItems([]);
    setMealName('');
    setSaveAsTemplate(false);
    setAiDescription('');
  };

  const verdict = (() => {
    if (totalCals === 0) {
      return { tone: 'neutral' as const, text: 'No meals logged yet' };
    }
    const calDiff = totalCals - calorieTarget;
    const proteinHit = totalProtein >= profile.proteinTarget * 0.9;
    if (Math.abs(calDiff) <= 200 && proteinHit) {
      return { tone: 'success' as const, text: 'On track — great day' };
    }
    if (calDiff > 400) {
      return { tone: 'warning' as const, text: `${calDiff} cal over target` };
    }
    if (calDiff < -500) {
      return {
        tone: 'danger' as const,
        text: `${Math.abs(calDiff)} cal under — eat more`,
      };
    }
    if (!proteinHit) {
      return {
        tone: 'info' as const,
        text: `Need ${profile.proteinTarget - totalProtein}g more protein`,
      };
    }
    return { tone: 'warning' as const, text: 'Decent day, keep going' };
  })();

  const caloriesOverBudget = totalCals > calorieTarget * 1.1;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        icon={Utensils}
        eyebrow={isTrainingDay ? 'Training day · fuel up' : 'Rest day · recovery'}
        title="Nutrition"
        subtitle={`Target ${calorieTarget.toLocaleString()} cal — lean protein, smart carbs, clean fats.`}
      >
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Selected date"
          inputSize="sm"
          className="w-auto"
        />
      </PageHeader>

      {/* ── Macro summary + pie ──────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Calories</CardTitle>
            <Badge tone={verdict.tone === 'neutral' ? 'neutral' : verdict.tone} variant="soft">
              {verdict.text}
            </Badge>
          </CardHeader>
          <div className="flex items-end gap-2">
            <span className="text-3xl sm:text-4xl font-semibold text-fg tabular-nums leading-none">
              {totalCals.toLocaleString()}
            </span>
            <span className="text-sm text-fg-muted mb-1 tabular-nums">
              / {calorieTarget.toLocaleString()} cal
            </span>
          </div>
          <Progress
            value={totalCals}
            max={calorieTarget}
            tone={caloriesOverBudget ? 'warning' : 'success'}
            className="mt-3 h-2"
          />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MacroChip label="Protein" value={`${totalProtein}g`} tone="info" />
            <MacroChip label="Carbs" value={`${totalCarbs}g`} tone="success" />
            <MacroChip label="Fat" value={`${totalFat}g`} tone="warning" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro split</CardTitle>
          </CardHeader>
          {totalCals > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={60}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={MACRO_COLORS.protein} />
                  <Cell fill={MACRO_COLORS.carbs} />
                  <Cell fill={MACRO_COLORS.fat} />
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: string, entry: Record<string, any>) =>
                    `${value}: ${entry?.payload?.grams ?? 0}g`
                  }
                  wrapperStyle={{ fontSize: '12px', color: 'rgb(var(--fg-muted))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-fg-subtle text-center py-12">
              Add meals to see macro split
            </p>
          )}
        </Card>
      </div>

      {/* ── Activity inputs ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <ActivityTile
          icon={Footprints}
          label="Steps"
          value={todayLog?.steps ?? ''}
          onChange={(n) => updateSteps(selectedDate, n)}
        />
        <ActivityTile
          icon={Heart}
          label="Cardio (min)"
          value={todayLog?.cardioMinutes ?? ''}
          onChange={(n) => updateCardio(selectedDate, n)}
        />
        <ActivityTile
          icon={Droplets}
          label="Water (L)"
          value={todayLog?.waterLiters ?? ''}
          step={0.5}
          onChange={(n) => updateWater(selectedDate, n)}
        />
      </div>

      {/* ── Saved-meals strip ────────────────────────────────── */}
      <SavedMealsBar selectedDate={selectedDate} />

      {/* ── Add meal CTA ─────────────────────────────────────── */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => setShowMealForm(true)}
      >
        <Plus size={16} /> Add meal
      </Button>

      {/* ── Meals list ───────────────────────────────────────── */}
      {todayLog?.meals && todayLog.meals.length > 0 ? (
        <div className="space-y-2.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Meals
          </h3>
          {todayLog.meals.map((meal) => (
            <Card key={meal.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{meal.name}</p>
                  <p className="text-xs text-fg-subtle tabular-nums">{meal.time}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-fg tabular-nums">
                    {meal.calories} cal
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMeal(selectedDate, meal.id)}
                    aria-label={`Remove ${meal.name}`}
                    className="touch-target-sm p-1.5 rounded text-fg-subtle hover:text-danger hover:bg-danger-100 dark:hover:bg-danger-700/20 transition-colors focus-ring"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Badge tone="info" variant="soft" className="font-mono">
                  P {meal.protein}g
                </Badge>
                <Badge tone="success" variant="soft" className="font-mono">
                  C {meal.carbs}g
                </Badge>
                <Badge tone="warning" variant="soft" className="font-mono">
                  F {meal.fat}g
                </Badge>
              </div>
              {meal.items.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {meal.items.map((item, i) => (
                    <li key={i} className="text-xs text-fg-subtle tabular-nums">
                      · {item.name} ({item.quantity}) — {item.calories} cal
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Utensils}
            title="No meals logged today"
            description="Snap a photo, pick a saved meal, or enter items manually."
          />
        </Card>
      )}

      {/* ── Add-meal modal ───────────────────────────────────── */}
      <Modal
        open={showMealForm}
        onClose={() => setShowMealForm(false)}
        title="Add meal"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowMealForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveMeal} disabled={items.length === 0}>
              Save meal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meal name" htmlFor="meal-name" required>
              <Input
                id="meal-name"
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Lunch"
              />
            </Field>
            <Field label="Time" htmlFor="meal-time">
              <Input
                id="meal-time"
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
              />
            </Field>
          </div>

          {/* AI image picker */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-lg border-2 border-dashed border-line-strong hover:border-accent bg-surface-2/40 hover:bg-surface-2 text-center transition-colors focus-ring"
              aria-label="Upload food photo for AI analysis"
            >
              {analyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-accent" />
                  <p className="text-sm text-fg-muted">Analyzing food image…</p>
                </div>
              ) : (
                <>
                  <Camera size={20} className="mx-auto text-fg-muted mb-2" />
                  <p className="text-sm text-fg">Take a photo or upload an image</p>
                  <p className="text-xs text-fg-subtle mt-0.5">
                    AI will estimate calories &amp; macros
                  </p>
                  {!isGeminiConfigured() && (
                    <p className="text-xs text-warning mt-2 flex items-center justify-center gap-1">
                      <AlertCircle size={12} /> Set <code>VITE_GEMINI_API_KEY</code> for AI
                    </p>
                  )}
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </button>

            <Field
              label="Description (optional)"
              htmlFor="ai-desc"
              hint="Refines the AI estimate."
            >
              <textarea
                id="ai-desc"
                rows={2}
                maxLength={600}
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g. pan-fried in 1 tbsp olive oil, 200g chicken breast, side of rice…"
                className="block w-full rounded-md bg-surface border border-line text-fg placeholder:text-fg-subtle transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0 py-2 px-3 text-sm resize-y"
              />
            </Field>
          </div>

          {/* Manual entry */}
          <div className="border-t border-line pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle mb-2">
              Or add items manually
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Input
                inputSize="sm"
                type="text"
                placeholder="Food name"
                value={manualItem.name}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, name: e.target.value }))
                }
                className="col-span-2 sm:col-span-3"
              />
              <Input
                inputSize="sm"
                type="text"
                placeholder="Qty"
                value={manualItem.quantity}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, quantity: e.target.value }))
                }
              />
              <Input
                inputSize="sm"
                type="number"
                placeholder="Calories"
                value={manualItem.calories}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, calories: e.target.value }))
                }
              />
              <Input
                inputSize="sm"
                type="number"
                placeholder="Protein (g)"
                value={manualItem.protein}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, protein: e.target.value }))
                }
              />
              <Input
                inputSize="sm"
                type="number"
                placeholder="Carbs (g)"
                value={manualItem.carbs}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, carbs: e.target.value }))
                }
              />
              <Input
                inputSize="sm"
                type="number"
                placeholder="Fat (g)"
                value={manualItem.fat}
                onChange={(e) =>
                  setManualItem((p) => ({ ...p, fat: e.target.value }))
                }
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addManualItem}
              className="mt-3"
            >
              <Plus size={14} /> Add item
            </Button>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="rounded-md border border-line bg-surface-2 p-3 space-y-1.5">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1"
                >
                  <span className="text-fg font-medium">
                    {item.name} ({item.quantity})
                  </span>
                  <div className="flex items-center gap-2 text-fg-subtle tabular-nums">
                    <span>{item.calories} cal</span>
                    <span>P{item.protein}</span>
                    <span>C{item.carbs}</span>
                    <span>F{item.fat}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((p) => p.filter((_, idx) => idx !== i))
                      }
                      aria-label={`Remove ${item.name}`}
                      className="touch-target-sm text-fg-subtle hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-line mt-2 pt-2 flex justify-between text-xs font-semibold text-fg tabular-nums">
                <span>Total</span>
                <span>{items.reduce((s, i) => s + i.calories, 0)} cal</span>
              </div>
            </div>
          )}

          {/* Template checkbox */}
          <label
            className={cn(
              'flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-md border transition-colors',
              saveAsTemplate
                ? 'border-accent bg-accent-50/50 dark:bg-accent-950/20'
                : 'border-line bg-surface-2 hover:border-line-strong',
            )}
          >
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-accent flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg inline-flex items-center gap-1">
                <Bookmark size={12} className="text-accent" /> Save as template
              </p>
              <p className="text-xs text-fg-muted mt-0.5">
                Stash this meal for one-tap logging from the saved-meals bar.
              </p>
            </div>
          </label>
        </div>
      </Modal>
    </div>
  );
}

/** Macro chip — small surface-2 tile under the calories card. */
function MacroChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'info' | 'success' | 'warning';
}) {
  const fg: Record<typeof tone, string> = {
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
  };
  return (
    <div className="rounded-md bg-surface-2 border border-line p-2">
      <p className={cn('text-base font-semibold tabular-nums font-mono', fg[tone])}>
        {value}
      </p>
      <p className="text-2xs uppercase tracking-wide text-fg-subtle mt-0.5">{label}</p>
    </div>
  );
}

/** Activity tile — icon + label + numeric input. */
function ActivityTile({
  icon: Icon,
  label,
  value,
  step,
  onChange,
}: {
  icon: typeof Footprints;
  label: string;
  value: number | string;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="bg-surface border border-line rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2 text-fg-muted">
        <Icon size={14} />
        <span className="text-2xs uppercase tracking-wide font-semibold text-fg-muted">
          {label}
        </span>
      </div>
      <input
        type="number"
        min={0}
        step={step}
        placeholder="0"
        value={value}
        onChange={(e) => {
          const raw = step !== undefined ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
          onChange(Number.isFinite(raw) && raw >= 0 ? raw : 0);
        }}
        className="w-full h-9 px-2.5 rounded-md bg-surface-2 border border-line text-sm font-mono tabular-nums text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        aria-label={label}
      />
    </div>
  );
}
