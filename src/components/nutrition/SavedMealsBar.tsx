import { useState } from 'react';
import { Bookmark, Plus, Pencil, Trash2, Settings as SettingsIcon, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { totalsForItems } from '@/utils/mealMath';
import { cn } from '@/utils/cn';
import { notify } from '@/services/notifier';
import type { SavedMeal } from '@/types';
import SavedMealEditor from './SavedMealEditor';

interface SavedMealsBarProps {
  /** ISO date the user is currently logging on. */
  selectedDate: string;
}

/**
 * A horizontally-scrolling strip of one-tap meal templates with a
 * dedicated manager sheet for full CRUD. The user's regular meals live
 * here so they don't have to type them out every day.
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
    if (window.confirm(`Delete saved meal “${template.name}”? This cannot be undone.`)) {
      removeSavedMeal(template.id);
    }
  };

  return (
    <div className="rounded-2xl border border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-nutrition-500" />
          <h3 className="font-display text-sm uppercase tracking-wider font-bold text-iron-600 dark:text-iron-200">
            Saved Meals
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          aria-label="Manage saved meals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-iron-500 dark:text-iron-300 hover:text-primary-600 dark:hover:text-primary-300"
        >
          <SettingsIcon size={14} /> Manage
        </button>
      </div>

      {sorted.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full py-3 rounded-lg border border-dashed border-iron-300 dark:border-iron-700 text-sm text-iron-500 dark:text-iron-400 hover:border-nutrition-400 hover:text-nutrition-600 dark:hover:text-nutrition-300 transition-colors flex items-center justify-center gap-2"
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
                className="flex-shrink-0 w-44 text-left p-3 rounded-xl border border-nutrition-200 dark:border-nutrition-900/60 bg-nutrition-50/70 dark:bg-nutrition-900/20 hover:border-nutrition-400 hover:bg-nutrition-100/80 dark:hover:bg-nutrition-900/40 transition-colors"
              >
                <p className="text-sm font-semibold dark:text-white truncate">{meal.name}</p>
                <p className="text-[11px] text-iron-500 dark:text-iron-400 font-mono tabular-nums mt-0.5">
                  {totals.calories} cal · {totals.protein}P · {totals.carbs}C · {totals.fat}F
                </p>
                <p className="text-[10px] text-iron-400 dark:text-iron-500 mt-1 truncate">
                  {meal.items.length} {meal.items.length === 1 ? 'item' : 'items'}
                </p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setEditing('new')}
            aria-label="Save a new meal template"
            className="flex-shrink-0 w-12 rounded-xl border border-dashed border-iron-300 dark:border-iron-700 text-iron-400 dark:text-iron-500 hover:border-nutrition-400 hover:text-nutrition-500 transition-colors flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Manager sheet — full CRUD list. */}
      {managerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Manage saved meals"
          onClick={() => setManagerOpen(false)}
          className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-iron-900 border border-iron-200/60 dark:border-iron-800 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between p-5 border-b border-iron-200/60 dark:border-iron-800">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-iron-500">
                  Templates
                </p>
                <h3 className="font-display uppercase tracking-wide text-lg font-bold dark:text-white">
                  Saved Meals
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagerOpen(false)}
                aria-label="Close manager"
                className="p-2 rounded-lg hover:bg-iron-100 dark:hover:bg-iron-800 text-iron-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <button
                type="button"
                onClick={() => setEditing('new')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-nutrition-500 hover:bg-nutrition-600 text-white text-sm font-semibold transition-colors"
              >
                <Plus size={16} /> New saved meal
              </button>

              {sorted.length === 0 ? (
                <p className="text-sm text-iron-500 dark:text-iron-400 text-center py-6">
                  No saved meals yet. Add one to enable one-tap logging.
                </p>
              ) : (
                <ul className="divide-y divide-iron-100 dark:divide-iron-800">
                  {sorted.map((meal) => {
                    const totals = totalsForItems(meal.items);
                    return (
                      <li
                        key={meal.id}
                        className="py-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold dark:text-white truncate">
                            {meal.name}
                          </p>
                          <p className="text-xs font-mono tabular-nums text-iron-500 dark:text-iron-400 mt-0.5">
                            {totals.calories} cal · {totals.protein}P · {totals.carbs}C · {totals.fat}F
                          </p>
                          {meal.items.length > 0 && (
                            <p className="text-[11px] text-iron-400 dark:text-iron-500 mt-1 line-clamp-1">
                              {meal.items.map((it) => `${it.name} (${it.quantity})`).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditing(meal)}
                            aria-label={`Edit ${meal.name}`}
                            className="p-2 rounded-lg hover:bg-iron-100 dark:hover:bg-iron-800 text-iron-500"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(meal)}
                            aria-label={`Delete ${meal.name}`}
                            className={cn(
                              'p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500',
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <SavedMealEditor
          meal={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
