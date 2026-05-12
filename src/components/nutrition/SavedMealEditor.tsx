import { useState } from 'react';
import { Trash2, Save, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { totalsForItems } from '@/utils/mealMath';
import { notify } from '@/services/notifier';
import type { FoodItem, SavedMeal } from '@/types';
import { Button, Field, Input, Modal } from '@/components/ui';

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

const blankDraft = () => ({
  name: '',
  quantity: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
});

/**
 * SavedMealEditor — create or edit a one-tap meal template.
 *
 * Mounted from `SavedMealsBar` for both "new" and "edit" flows.
 * Hooks into the shared `Modal` primitive so the chrome matches the
 * rest of the app (Esc + backdrop close, body-scroll lock, footer
 * action bar with disabled-until-valid save button).
 */
export default function SavedMealEditor({ meal, onClose }: SavedMealEditorProps) {
  const { addSavedMeal, updateSavedMeal } = useAppStore();
  const isEditing = meal !== null;
  const [name, setName] = useState(meal?.name ?? '');
  const [defaultTime, setDefaultTime] = useState(meal?.defaultTime ?? '');
  const [notes, setNotes] = useState(meal?.notes ?? '');
  const [items, setItems] = useState<FoodItem[]>(meal?.items ?? []);
  const [draft, setDraft] = useState(blankDraft);

  const totals = totalsForItems(items);
  const canSave = name.trim().length > 0 && items.length > 0;

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
    setDraft(blankDraft());
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    if (!name.trim()) {
      notify.warning('Name required', 'Give the saved meal a recognisable name.');
      return;
    }
    if (items.length === 0) {
      notify.warning(
        'Add at least one ingredient',
        'Saved meals need an item or two inside them.',
      );
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
      notify.success(
        'Saved meal stashed',
        `${payload.name} now lives in your saved meals.`,
      );
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Edit saved meal' : 'New saved meal'}
      description="Stash a regular meal for one-tap logging."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            <Save size={14} /> {isEditing ? 'Save changes' : 'Save meal'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" htmlFor="sm-name" required>
            <Input
              id="sm-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Greek yogurt bowl"
            />
          </Field>
          <Field label="Default time" htmlFor="sm-time" hint="Optional.">
            <Input
              id="sm-time"
              type="time"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="sm-notes" hint="e.g. post-workout, dairy-free swap.">
          <Input
            id="sm-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {/* ── Ingredient input ─────────────────────────────── */}
        <div className="rounded-md border border-line bg-surface-2/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle mb-2">
            Ingredients
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input
              inputSize="sm"
              type="text"
              placeholder="Ingredient name"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="col-span-2 sm:col-span-3"
            />
            <Input
              inputSize="sm"
              type="text"
              placeholder="Qty (e.g. 200g)"
              value={draft.quantity}
              onChange={(e) => setDraft((p) => ({ ...p, quantity: e.target.value }))}
            />
            <Input
              inputSize="sm"
              type="number"
              placeholder="Calories"
              value={draft.calories}
              onChange={(e) => setDraft((p) => ({ ...p, calories: e.target.value }))}
            />
            <Input
              inputSize="sm"
              type="number"
              placeholder="Protein (g)"
              value={draft.protein}
              onChange={(e) => setDraft((p) => ({ ...p, protein: e.target.value }))}
            />
            <Input
              inputSize="sm"
              type="number"
              placeholder="Carbs (g)"
              value={draft.carbs}
              onChange={(e) => setDraft((p) => ({ ...p, carbs: e.target.value }))}
            />
            <Input
              inputSize="sm"
              type="number"
              placeholder="Fat (g)"
              value={draft.fat}
              onChange={(e) => setDraft((p) => ({ ...p, fat: e.target.value }))}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addDraftItem}
            className="mt-3"
          >
            <Plus size={14} /> Add ingredient
          </Button>
        </div>

        {/* ── Items list ───────────────────────────────────── */}
        {items.length > 0 && (
          <div className="rounded-md bg-surface-2 border border-line overflow-hidden">
            <ul className="divide-y divide-line">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-fg font-medium truncate">
                      {item.name}{' '}
                      <span className="text-fg-subtle font-normal">
                        ({item.quantity})
                      </span>
                    </p>
                    <p className="font-mono tabular-nums text-fg-muted">
                      {item.calories} cal · {item.protein}P · {item.carbs}C ·{' '}
                      {item.fat}F
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label={`Remove ${item.name}`}
                    className="touch-target-sm p-1.5 rounded text-fg-subtle hover:text-danger hover:bg-danger-100 dark:hover:bg-danger-700/20 transition-colors focus-ring"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-3 py-2 bg-surface border-t border-line flex justify-between text-xs font-semibold text-fg">
              <span>Total</span>
              <span className="font-mono tabular-nums">
                {totals.calories} cal · {totals.protein}P · {totals.carbs}C ·{' '}
                {totals.fat}F
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
