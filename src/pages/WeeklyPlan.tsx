import { useState } from 'react';
import { Plus, Trash2, GripVertical, Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById, searchExercises } from '@/data/exercises';
import { cn } from '@/utils/cn';
import type { Exercise } from '@/types';

export default function WeeklyPlan() {
  const { workoutPlan, addExerciseToDay, removeExerciseFromDay, exercises } = useAppStore();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');

  const filteredExercises = searchQuery.length > 1 ? searchExercises(searchQuery) : exercises.slice(0, 20);

  const handleAdd = () => {
    if (!addingTo || !selectedExercise) return;
    addExerciseToDay(addingTo, selectedExercise.id, parseInt(sets) || 3, reps || '12');
    setAddingTo(null);
    setSelectedExercise(null);
    setSearchQuery('');
  };

  const focusColors: Record<string, string> = {
    strength: 'border-l-red-500',
    hypertrophy: 'border-l-blue-500',
    athletic: 'border-l-green-500',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Weekly Plan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Tap any day to add, remove or reorder exercises
        </p>
      </div>

      <div className="grid gap-4">
        {workoutPlan.map((day) => {
          const totalSets = day.exercises.reduce((s, e) => s + e.targetSets, 0);
          return (
            <div
              key={day.id}
              className={cn(
                'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 overflow-hidden',
                focusColors[day.focus] ?? 'border-l-gray-400',
              )}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold dark:text-white">
                      {day.dayName} — {day.label}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">{day.focus} • {totalSets} sets</p>
                  </div>
                  <button
                    onClick={() => setAddingTo(addingTo === day.id ? null : day.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-primary-500"
                  >
                    {addingTo === day.id ? <X size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                <div className="space-y-1">
                  {day.exercises.map((ex) => {
                    const exercise = getExerciseById(ex.exerciseId);
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center gap-2 py-1.5 group"
                      >
                        <GripVertical size={14} className="text-gray-300 dark:text-gray-600" />
                        <span className="w-5 text-xs text-gray-400 font-mono">{ex.order}</span>
                        <span className="flex-1 text-sm dark:text-gray-300">{exercise?.name}</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {ex.targetSets}×{ex.targetReps}
                        </span>
                        <button
                          onClick={() => removeExerciseFromDay(day.id, ex.id)}
                          className="p-1.5 rounded sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Exercise Panel */}
                {addingTo === day.id && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
                    <div className="relative mb-3">
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedExercise(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    {!selectedExercise && (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredExercises.map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setSelectedExercise(ex);
                              setSearchQuery(ex.name);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:text-gray-300"
                          >
                            {ex.name}
                            <span className="text-xs text-gray-400 ml-2">
                              {ex.muscleGroups.join(', ')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedExercise && (
                      <div className="flex gap-2 items-end">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Sets</label>
                          <input
                            type="number"
                            value={sets}
                            onChange={(e) => setSets(e.target.value)}
                            className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                          <input
                            type="text"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleAdd}
                          className="px-4 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
