import { useState } from 'react';
import { Plus, Trash2, GripVertical, Search, X, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById, searchExercises } from '@/data/exercises';
import type { Exercise } from '@/types';
import PageHeader from '@/components/PageHeader';
import { Badge, Button, Card, Field, Input } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';

const focusTone: Record<string, BadgeTone> = {
  strength: 'accent',
  hypertrophy: 'info',
  athletic: 'success',
};

/**
 * WeeklyPlan — edit the user's seven-day training split. Each day
 * shows its programmed exercises and exposes a per-day add panel.
 */
export default function WeeklyPlan() {
  const { workoutPlan, addExerciseToDay, removeExerciseFromDay, exercises } = useAppStore();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');

  const filteredExercises =
    searchQuery.length > 1 ? searchExercises(searchQuery) : exercises.slice(0, 20);

  const handleAdd = () => {
    if (!addingTo || !selectedExercise) return;
    addExerciseToDay(addingTo, selectedExercise.id, parseInt(sets) || 3, reps || '12');
    setAddingTo(null);
    setSelectedExercise(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        theme="plan"
        icon={CalendarDays}
        eyebrow="Training split"
        title="Weekly plan"
        subtitle="Six days of programmed work. Tap any card to tweak exercises, sets and reps."
      />

      <div className="space-y-3">
        {workoutPlan.map((day) => {
          const totalSets = day.exercises.reduce((s, e) => s + e.targetSets, 0);
          const isOpen = addingTo === day.id;

          return (
            <Card key={day.id} bare>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-fg tracking-tight">
                      {day.dayName}{' '}
                      <span className="text-fg-subtle font-normal">— {day.label}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge tone={focusTone[day.focus] ?? 'neutral'} variant="soft" className="capitalize">
                        {day.focus}
                      </Badge>
                      <span className="text-xs text-fg-muted tabular-nums">
                        {totalSets} working sets
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={isOpen ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setAddingTo(isOpen ? null : day.id)}
                    aria-label={isOpen ? 'Close add panel' : `Add exercise to ${day.dayName}`}
                  >
                    {isOpen ? <X size={16} /> : <Plus size={16} />}
                  </Button>
                </div>

                <ul className="divide-y divide-line">
                  {day.exercises.map((ex) => {
                    const exercise = getExerciseById(ex.exerciseId);
                    return (
                      <li
                        key={ex.id}
                        className="flex items-center gap-2 py-2 group first:pt-0 last:pb-0"
                      >
                        <GripVertical size={14} className="text-fg-subtle/60" />
                        <span className="w-5 text-xs text-fg-subtle tabular-nums">{ex.order}</span>
                        <span className="flex-1 text-sm text-fg truncate">{exercise?.name}</span>
                        <span className="text-xs text-fg-muted font-mono tabular-nums">
                          {ex.targetSets}×{ex.targetReps}
                        </span>
                        <button
                          onClick={() => removeExerciseFromDay(day.id, ex.id)}
                          aria-label={`Remove ${exercise?.name ?? 'exercise'} from ${day.dayName}`}
                          className="touch-target-sm p-1.5 rounded text-fg-subtle hover:text-danger hover:bg-danger-100 dark:hover:bg-danger-700/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus-ring"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* ── Add exercise inline panel ─────────────────── */}
                {isOpen && (
                  <div className="mt-4 p-4 rounded-lg bg-surface-2 border border-line animate-slide-up">
                    <div className="relative mb-3">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
                      />
                      <Input
                        type="text"
                        placeholder="Search exercises…"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedExercise(null);
                        }}
                        className="pl-9"
                      />
                    </div>

                    {!selectedExercise && (
                      <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-0.5">
                        {filteredExercises.map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setSelectedExercise(ex);
                              setSearchQuery(ex.name);
                            }}
                            className="touch-target-sm w-full text-left px-3 py-2 rounded-md text-sm text-fg hover:bg-surface transition-colors focus-ring"
                          >
                            <span className="font-medium">{ex.name}</span>
                            <span className="text-xs text-fg-subtle ml-2">
                              {ex.muscleGroups.join(', ')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedExercise && (
                      <div className="flex gap-2 items-end">
                        <Field label="Sets" htmlFor={`sets-${day.id}`} className="flex-1">
                          <Input
                            id={`sets-${day.id}`}
                            type="number"
                            value={sets}
                            onChange={(e) => setSets(e.target.value)}
                            inputSize="sm"
                          />
                        </Field>
                        <Field label="Reps" htmlFor={`reps-${day.id}`} className="flex-1">
                          <Input
                            id={`reps-${day.id}`}
                            type="text"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            inputSize="sm"
                          />
                        </Field>
                        <Button variant="primary" size="sm" onClick={handleAdd}>
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
