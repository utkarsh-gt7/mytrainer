import { useState } from 'react';
import { Trash2, X, Save, Bookmark } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { totalsForItems } from '@/utils/mealMath';
import { notify } from '@/services/notifier';
import type { FoodItem, SavedMeal } from '@/types';

interface SavedMealEditorProps {
  /** When null we're creating a new template. */
  meal: SavedMeal | null;
  onClose: () => void;
}

const clampInt = (raw: string): number => {
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
};

export default function SavedMealEditor({ meal, onClose }: SavedMealEditorProps) {
  const { addSavedMeal, updateSavedMeal } = useAppStore();
  const isEditing = meal !== null;
  const [name, setName] = useState(meal?.name ?? '');
  const [defaultTime, setDefaultTime] = useState(meal?.defaultTime ?? '');
  const [notes, setNotes] = useState(meal?.notes ?? '');
  const [items, setItems] = useState<FoodItem[]>(meal?.items ?? []);
  const [draft, setDraft] = useState({
    name: '',
    quantity: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const totals = totalsForItems(items);

  const addDraftItem = () => {
    if (!draft.name.trim() || !draft.calories) {
      notify.warning('Missing info', 'Ingredient name and calories are required.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        name: draft.name.trim(),
        quantity: draft.quantity || '1 serving',
        calories: clampInt(draft.calories),
        protein: clampInt(draft.protein),
        carbs: clampInt(draft.carbs),
        fat: clampInt(draft.fat),
      },
    ]);
    setDraft({ name: '', quantity: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!name.trim()) {
      notify.warning('Name required', 'Give the saved meal a recognisable name.');
      return;
    }
    if (items.length === 0) {
      notify.warning('Add at least one ingredient', 'Saved meals need an item or two inside them.');
      return;
    }
    const payload = {
      name: name.trim(),
      defaultTime: defaultTime || undefined,
      items,
      notes: notes.trim() || undefined,
    };
    if (isEditing && meal) {
      updateSavedMeal(meal.id, payload);
      notify.success('Saved meal updated', `${payload.name} is good to go.`);
    } else {
      addSavedMeal(payload);
      notify.success('Saved meal stashed', `${payload.name} now lives in your saved meals.`);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit saved meal' : 'New saved meal'}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-iron-900 border border-iron-200/60 dark:border-iron-800 shadow-2xl animate-slide-up"
      >
        <div className="flex items-center justify-between p-5 border-b border-iron-200/60 dark:border-iron-800">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-nutrition-500" />
            <h3 className="font-display uppercase tracking-wide text-lg font-bold dark:text-white">
              {isEditing ? 'Edit Saved Meal' : 'New Saved Meal'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg hover:bg-iron-100 dark:hover:bg-iron-800 text-iron-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold dark:text-iron-300">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Greek yogurt bowl"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold dark:text-iron-300">Default Time (optional)</span>
              <input
                type="time"
                value={defaultTime}
                onChange={(e) => setDefaultTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold dark:text-iron-300">Notes (optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. post-workout, dairy-free swap"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-iron-50 dark:bg-iron-800 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
            />
          </label>

          {/* Ingredient input */}
          <div className="rounded-lg border border-iron-200/60 dark:border-iron-800 bg-iron-50/40 dark:bg-iron-950/40 p-3">
            <p className="text-xs font-semibold dark:text-iron-300 mb-2">Ingredients & Measurements</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Ingredient name"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                className="col-span-2 sm:col-span-3 px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
              <input
                type="text"
                placeholder="Qty (e.g. 200g)"
                value={draft.quantity}
                onChange={(e) => setDraft((p) => ({ ...p, quantity: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
              <input
                type="number"
                placeholder="Calories"
                value={draft.calories}
                onChange={(e) => setDraft((p) => ({ ...p, calories: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
              <input
                type="number"
                placeholder="Protein (g)"
                value={draft.protein}
                onChange={(e) => setDraft((p) => ({ ...p, protein: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={draft.carbs}
                onChange={(e) => setDraft((p) => ({ ...p, carbs: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
              <input
                type="number"
                placeholder="Fat (g)"
                value={draft.fat}
                onChange={(e) => setDraft((p) => ({ ...p, fat: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-iron-900 border border-iron-200 dark:border-iron-700 text-sm dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={addDraftItem}
              className="mt-3 px-4 py-2 rounded-lg bg-iron-200 dark:bg-iron-700 hover:bg-iron-300 dark:hover:bg-iron-600 text-sm font-semibold dark:text-white"
            >
              + Add ingredient
            </button>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="rounded-lg bg-iron-50 dark:bg-iron-800/40 border border-iron-200/60 dark:border-iron-800 overflow-hidden">
              <ul className="divide-y divide-iron-200/60 dark:divide-iron-800">
                {items.map((item, i) => (
                  <li key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="dark:text-white font-semibold truncate">
                        {item.name}{' '}
                        <span className="text-iron-500 font-normal">({item.quantity})</span>
                      </p>
                      <p className="font-mono tabular-nums text-iron-500 dark:text-iron-400">
                        {item.calories} cal · {item.protein}P · {item.carbs}C · {item.fat}F
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1.5 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="px-3 py-2 bg-white dark:bg-iron-900/60 border-t border-iron-200/60 dark:border-iron-800 flex justify-between text-xs font-bold dark:text-white">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {totals.calories} cal · {totals.protein}P · {totals.carbs}C · {totals.fat}F
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || items.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-nutrition-500 hover:bg-nutrition-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {isEditing ? 'Save changes' : 'Save meal'}
          </button>
        </div>
      </div>
    </div>
  );
}
