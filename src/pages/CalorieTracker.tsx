import { useState, useRef } from 'react';
import { Camera, Plus, Trash2, Footprints, Heart, Droplets, Loader2, AlertCircle, Utensils } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { analyzeFoodImage, isGeminiConfigured } from '@/services/gemini';
import { getDailyCalorieTarget } from '@/utils/calculations';
import type { FoodItem } from '@/types';
import PageHeader from '@/components/PageHeader';
import { notify } from '@/services/notifier';

const MACRO_COLORS = { protein: '#2f8dff', carbs: '#22ac5c', fat: '#f0b429' };

export default function CalorieTracker() {
  const { calorieLogs, addMeal, removeMeal, updateSteps, updateCardio, updateWater, profile } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState('12:00');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [manualItem, setManualItem] = useState({ name: '', quantity: '', calories: '', protein: '', carbs: '', fat: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayLog = calorieLogs.find((l) => l.date === selectedDate);
  const totalCals = todayLog?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;
  const totalProtein = todayLog?.meals.reduce((s, m) => s + m.protein, 0) ?? 0;
  const totalCarbs = todayLog?.meals.reduce((s, m) => s + m.carbs, 0) ?? 0;
  const totalFat = todayLog?.meals.reduce((s, m) => s + m.fat, 0) ?? 0;

  const isTrainingDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    .includes(new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }));
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
    // Protect the Gemini call from huge uploads.
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      notify.warning('Image too large', 'Please use a photo under 8MB.');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeFoodImage(file);
      if (result && result.items.length > 0) {
        setItems(result.items);
        setMealName((prev) => prev || 'AI Analyzed Meal');
        notify.success('Food analyzed', `${result.items.length} item(s) detected.`);
      } else {
        notify.warning('Could not analyze', 'Add the items manually below.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      notify.error('Analysis failed', 'We could not reach the AI service right now.');
    } finally {
      setAnalyzing(false);
      // Allow re-uploading the same file if the user wants to retry.
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
    setItems((prev) => [...prev, {
      name: manualItem.name.trim(),
      quantity: manualItem.quantity || '1 serving',
      calories: clampNumber(manualItem.calories),
      protein: clampNumber(manualItem.protein),
      carbs: clampNumber(manualItem.carbs),
      fat: clampNumber(manualItem.fat),
    }]);
    setManualItem({ name: '', quantity: '', calories: '', protein: '', carbs: '', fat: '' });
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
    notify.success('Meal saved', `${totalC} cal · ${totalP}g protein`);
    setShowMealForm(false);
    setItems([]);
    setMealName('');
  };

  const getVerdict = () => {
    if (totalCals === 0) return { emoji: '🍽️', text: 'No meals logged yet', color: 'text-gray-400' };
    const calDiff = totalCals - calorieTarget;
    const proteinHit = totalProtein >= profile.proteinTarget * 0.9;
    if (Math.abs(calDiff) <= 200 && proteinHit) return { emoji: '✅', text: 'On track! Great day', color: 'text-green-500' };
    if (calDiff > 400) return { emoji: '⚠️', text: `${calDiff} cal over target`, color: 'text-orange-500' };
    if (calDiff < -500) return { emoji: '⚠️', text: `${Math.abs(calDiff)} cal under — eat more!`, color: 'text-red-500' };
    if (!proteinHit) return { emoji: '💪', text: `Need ${profile.proteinTarget - totalProtein}g more protein`, color: 'text-blue-500' };
    return { emoji: '👍', text: 'Decent day, keep going', color: 'text-yellow-500' };
  };

  const verdict = getVerdict();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        theme="nutrition"
        icon={Utensils}
        eyebrow={isTrainingDay ? 'Training Day · Fuel Up' : 'Rest Day · Recovery'}
        title="Nutrition"
        subtitle={`Target ${calorieTarget} cal — lean protein, smart carbs, clean fats.`}
      >
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-sm text-sm text-white placeholder-white/60 focus:outline-none"
        />
      </PageHeader>

      {/* Macro Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-nutrition-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-6">
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 mb-2">Calories</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-display font-bold dark:text-white tabular-nums">{totalCals}</span>
            <span className="text-sm text-iron-500 mb-1">/ {calorieTarget} cal</span>
          </div>
          <div className="mt-3 h-3 bg-iron-100 dark:bg-iron-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalCals > calorieTarget * 1.1
                  ? 'bg-gradient-to-r from-primary-500 to-flame-500'
                  : 'bg-gradient-to-r from-nutrition-400 to-nutrition-600'
              }`}
              style={{ width: `${Math.min(100, (totalCals / calorieTarget) * 100)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-metrics-50 dark:bg-metrics-900/20 border border-metrics-200/60 dark:border-metrics-900/40 p-2">
              <p className="text-lg font-bold text-metrics-600 dark:text-metrics-300 font-mono tabular-nums">{totalProtein}g</p>
              <p className="text-[10px] uppercase tracking-wider text-iron-500">Protein</p>
            </div>
            <div className="rounded-lg bg-nutrition-50 dark:bg-nutrition-900/20 border border-nutrition-200/60 dark:border-nutrition-900/40 p-2">
              <p className="text-lg font-bold text-nutrition-600 dark:text-nutrition-300 font-mono tabular-nums">{totalCarbs}g</p>
              <p className="text-[10px] uppercase tracking-wider text-iron-500">Carbs</p>
            </div>
            <div className="rounded-lg bg-gold-50 dark:bg-gold-900/20 border border-gold-200/60 dark:border-gold-900/40 p-2">
              <p className="text-lg font-bold text-gold-600 dark:text-gold-300 font-mono tabular-nums">{totalFat}g</p>
              <p className="text-[10px] uppercase tracking-wider text-iron-500">Fat</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 p-4 sm:p-6">
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300 mb-2">Macro Split</h3>
          {totalCals > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                  <Cell fill={MACRO_COLORS.protein} />
                  <Cell fill={MACRO_COLORS.carbs} />
                  <Cell fill={MACRO_COLORS.fat} />
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Legend formatter={(value: string, entry: Record<string, any>) => `${value}: ${entry?.payload?.grams ?? 0}g`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Add meals to see macro split</p>
          )}
        </div>
      </div>

      {/* Daily Verdict */}
      <div className="bg-white dark:bg-iron-900/60 rounded-2xl border border-iron-200/60 dark:border-iron-800 p-4 flex items-center gap-3">
        <span className="text-2xl">{verdict.emoji}</span>
        <div>
          <p className={`font-semibold ${verdict.color}`}>{verdict.text}</p>
          <p className="text-xs text-iron-500">
            Steps: {todayLog?.steps ?? 0} • Cardio: {todayLog?.cardioMinutes ?? 0} min • Water: {todayLog?.waterLiters ?? 0}L
          </p>
        </div>
      </div>

      {/* Activity Inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-metrics-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Footprints size={16} className="text-metrics-500" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-iron-500 dark:text-iron-300">Steps</span>
          </div>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={todayLog?.steps ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              updateSteps(selectedDate, Number.isFinite(n) && n >= 0 ? n : 0);
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm font-mono tabular-nums dark:text-white"
          />
        </div>
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-primary-500 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-primary-500" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-iron-500 dark:text-iron-300">Cardio (min)</span>
          </div>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={todayLog?.cardioMinutes ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              updateCardio(selectedDate, Number.isFinite(n) && n >= 0 ? n : 0);
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm font-mono tabular-nums dark:text-white"
          />
        </div>
        <div className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-metrics-400 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={16} className="text-metrics-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-iron-500 dark:text-iron-300">Water (L)</span>
          </div>
          <input
            type="number"
            min={0}
            step="0.5"
            placeholder="0"
            value={todayLog?.waterLiters ?? ''}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              updateWater(selectedDate, Number.isFinite(n) && n >= 0 ? n : 0);
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm font-mono tabular-nums dark:text-white"
          />
        </div>
      </div>

      {/* Add Meal Button */}
      <button
        onClick={() => setShowMealForm(true)}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-nutrition-600 to-nutrition-500 text-white font-display uppercase tracking-[0.15em] hover:shadow-glow-nutrition transition-all flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Add Meal
      </button>

      {/* Meals List */}
      {todayLog?.meals && todayLog.meals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-500 dark:text-iron-300">Meals</h3>
          {todayLog.meals.map((meal) => (
            <div key={meal.id} className="bg-white dark:bg-iron-900/60 rounded-2xl border-l-4 border-l-nutrition-400 border-t border-r border-b border-iron-200/60 dark:border-iron-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold dark:text-white">{meal.name}</p>
                  <p className="text-xs text-iron-500">{meal.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold dark:text-white font-mono tabular-nums">{meal.calories} cal</span>
                  <button onClick={() => removeMeal(selectedDate, meal.id)} className="p-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-primary-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-xs font-mono">
                <span className="text-metrics-600 dark:text-metrics-300">P: {meal.protein}g</span>
                <span className="text-nutrition-600 dark:text-nutrition-300">C: {meal.carbs}g</span>
                <span className="text-gold-600 dark:text-gold-300">F: {meal.fat}g</span>
              </div>
              {meal.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {meal.items.map((item, i) => (
                    <p key={i} className="text-xs text-iron-400">• {item.name} ({item.quantity}) — {item.calories} cal</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Meal Modal */}
      {showMealForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMealForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold dark:text-white mb-4">Add Meal</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Meal Name</label>
                  <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Lunch"
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium dark:text-gray-400 block mb-1">Time</label>
                  <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
              </div>

              {/* AI Image Analysis */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 text-center transition-colors"
              >
                {analyzing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-primary-500" />
                    <p className="text-sm text-gray-500">Analyzing food image...</p>
                  </div>
                ) : (
                  <>
                    <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Take a photo or upload an image</p>
                    <p className="text-xs text-gray-400 mt-1">AI will estimate calories & macros</p>
                    {!isGeminiConfigured() && (
                      <p className="text-xs text-orange-400 mt-2 flex items-center justify-center gap-1">
                        <AlertCircle size={12} /> Set VITE_GEMINI_API_KEY for AI analysis
                      </p>
                    )}
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Manual Entry */}
              <div>
                <p className="text-sm font-medium dark:text-gray-300 mb-2">Or add items manually:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input type="text" placeholder="Food name" value={manualItem.name} onChange={(e) => setManualItem(p => ({...p, name: e.target.value}))}
                    className="col-span-2 sm:col-span-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                  <input type="number" placeholder="Qty" value={manualItem.quantity} onChange={(e) => setManualItem(p => ({...p, quantity: e.target.value}))}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                  <input type="number" placeholder="Calories" value={manualItem.calories} onChange={(e) => setManualItem(p => ({...p, calories: e.target.value}))}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                  <input type="number" placeholder="Protein (g)" value={manualItem.protein} onChange={(e) => setManualItem(p => ({...p, protein: e.target.value}))}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                  <input type="number" placeholder="Carbs (g)" value={manualItem.carbs} onChange={(e) => setManualItem(p => ({...p, carbs: e.target.value}))}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                  <input type="number" placeholder="Fat (g)" value={manualItem.fat} onChange={(e) => setManualItem(p => ({...p, fat: e.target.value}))}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white" />
                </div>
                <button onClick={addManualItem} className="mt-3 w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white">
                  + Add Item
                </button>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {items.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                      <span className="dark:text-gray-300 font-medium">{item.name} ({item.quantity})</span>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{item.calories} cal</span>
                        <span>P:{item.protein}</span>
                        <span>C:{item.carbs}</span>
                        <span>F:{item.fat}</span>
                        <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 touch-target-sm">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-between text-xs font-bold dark:text-white">
                    <span>Total</span>
                    <span>{items.reduce((s, i) => s + i.calories, 0)} cal</span>
                  </div>
                </div>
              )}

              <button onClick={saveMeal} disabled={items.length === 0}
                className="w-full py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Save Meal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
