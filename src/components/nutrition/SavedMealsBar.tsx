import { useState } from 'react';
import { Bookmark, Plus, Pencil, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { totalsForItems } from '@/utils/mealMath';
import { notify } from '@/services/notifier';
import type { SavedMeal } from '@/types';
import SavedMealEditor from './SavedMealEditor';
import { Button, Card, EmptyState, Modal } from '@/components/ui';

interface SavedMealsBarProps {
  /** ISO date the user is currently logging on. */
  selectedDate: string;
}

/**
 * A horizontally-scrolling strip of one-tap meal templates with a
 * dedicated manager Modal for full CRUD. The user's regular meals
 * live here so they don't have to type them out every day.
 */
export default function SavedMealsBar({ selectedDate }: SavedMealsBarProps) {
  const { savedMeals, applySavedMeal, removeSavedMeal } = useAppStore();
  const [managerOpen, setManagerOpen] = useState(false);
  const [editing, setEditing] = useState<SavedMeal | 'new' | null>(null);

  const sorted = [...savedMeals].sort((a, b) => b.createdAt - a.createdAt);

  const handleApply = (template: SavedMeal) => {
    applySavedMeal(selectedDate, template.id);
    notify.success('Meal added', `${template.name} logged for the day.`);
  };

  const handleDelete = (template: SavedMeal) => {
    if (
      window.confirm(
        `Delete saved meal “${template.name}”? This cannot be undone.`,
      )
    ) {
      removeSavedMeal(template.id);
    }
  };

  return (
    <Card bare className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={14} className="text-fg-muted" />
          <h3 className="text-sm font-semibold text-fg tracking-tight">
            Saved meals
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          aria-label="Manage saved meals"
          className="touch-target-sm inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg focus-ring rounded px-1.5 py-1"
        >
          <SettingsIcon size={13} /> Manage
        </button>
      </div>

      {sorted.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full py-4 rounded-md border border-dashed border-line-strong text-sm text-fg-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 focus-ring"
        >
          <Plus size={14} /> Stash your first regular meal for one-tap logging
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {sorted.map((meal) => {
            const totals = totalsForItems(meal.items);
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => handleApply(meal)}
                aria-label={`Add ${meal.name} to ${selectedDate}`}
                className="flex-shrink-0 w-44 text-left p-3 rounded-md border border-line bg-surface hover:bg-surface-2 hover:border-line-strong transition-colors focus-ring"
              >
                <p className="text-sm font-medium text-fg truncate">{meal.name}</p>
                <p className="text-xs text-fg-muted font-mono tabular-nums mt-0.5">
                  {totals.calories} cal · {totals.protein}P · {totals.carbs}C ·{' '}
                  {totals.fat}F
                </p>
                <p className="text-2xs text-fg-subtle mt-1 truncate">
                  {meal.items.length} {meal.items.length === 1 ? 'item' : 'items'}
                </p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setEditing('new')}
            aria-label="Save a new meal template"
            className="touch-target-sm flex-shrink-0 w-11 rounded-md border border-dashed border-line-strong text-fg-subtle hover:border-accent hover:text-accent transition-colors flex items-center justify-center focus-ring"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* ── Manager modal ────────────────────────────────────── */}
      <Modal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        title="Manage saved meals"
        description="Edit, delete, or stash new one-tap meal templates."
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setEditing('new')}>
            <Plus size={14} /> New saved meal
          </Button>
        }
      >
        {sorted.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved meals yet"
            description="Stash a meal to enable one-tap logging."
          />
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((meal) => {
              const totals = totalsForItems(meal.items);
              return (
                <li
                  key={meal.id}
                  className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">
                      {meal.name}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-fg-muted mt-0.5">
                      {totals.calories} cal · {totals.protein}P · {totals.carbs}C ·{' '}
                      {totals.fat}F
                    </p>
                    {meal.items.length > 0 && (
                      <p className="text-xs text-fg-subtle mt-1 line-clamp-1">
                        {meal.items
                          .map((it) => `${it.name} (${it.quantity})`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(meal)}
                      aria-label={`Edit ${meal.name}`}
                      className="touch-target-sm p-2 rounded text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors focus-ring"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(meal)}
                      aria-label={`Delete ${meal.name}`}
                      className="touch-target-sm p-2 rounded text-fg-subtle hover:text-danger hover:bg-danger-100 dark:hover:bg-danger-700/20 transition-colors focus-ring"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      {editing && (
        <SavedMealEditor
          meal={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}
