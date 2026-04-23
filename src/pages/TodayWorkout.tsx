import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Timer,
  Trophy,
  ChevronDown,
  ChevronUp,
  Pencil,
  ArrowDown,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import { useRestTimer } from '@/hooks/useRestTimer';
import { formatDuration } from '@/utils/calculations';
import { cn } from '@/utils/cn';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TodayWorkout() {
  const {
    workoutPlan,
    startWorkout,
    logSet,
    completeWorkout,
    reopenWorkout,
    workoutLogs,
    workoutDrafts,
    setWorkoutDraft,
  } = useAppStore();
  const timer = useRestTimer();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayName = DAYS[today.getDay()];
  const todayPlan = workoutPlan.find((d) => d.dayName === dayName);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);

  const activeLog = workoutLogs.find((l) => l.id === activeWorkoutId);
  const completedToday = workoutLogs.find((l) => l.date === todayStr && l.completed);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWorkoutActive) {
      interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const handleStartWorkout = () => {
    if (!todayPlan) return;
    const id = startWorkout(todayPlan.id);
    setActiveWorkoutId(id);
    setIsWorkoutActive(true);
    setExpandedExercise(todayPlan.exercises[0]?.exerciseId ?? null);
  };

  const handleCompleteWorkout = () => {
    if (!activeWorkoutId) return;
    completeWorkout(activeWorkoutId, elapsed);
    setIsWorkoutActive(false);
    setActiveWorkoutId(null);
    setIsEditingCompleted(false);
  };

  const handleEditCompletedWorkout = () => {
    if (!completedToday) return;
    reopenWorkout(completedToday.id);
    setActiveWorkoutId(completedToday.id);
    setIsWorkoutActive(true);
    setIsEditingCompleted(true);
    setElapsed(completedToday.duration ?? 0);
    setExpandedExercise(completedToday.exercises[0]?.exerciseId ?? todayPlan?.exercises[0]?.exerciseId ?? null);
  };

  if (!todayPlan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold dark:text-white mb-2">Rest Day!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Recovery is part of the process. Focus on nutrition, sleep, and light walking today.
        </p>
      </div>
    );
  }

  if (completedToday && !activeWorkoutId) {
    return (
      <div className="animate-fade-in">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
          <Check className="mx-auto text-green-500 mb-3" size={48} />
          <h2 className="text-2xl font-bold dark:text-white mb-2">Workout Complete! 💪</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {todayPlan.dayName} — {todayPlan.label} ({todayPlan.focus})
          </p>
          {completedToday.duration && (
            <p className="text-sm text-gray-400 mt-1">
              Duration: {formatDuration(completedToday.duration)}
            </p>
          )}
          <button
            type="button"
            onClick={handleEditCompletedWorkout}
            aria-label="Edit today's workout"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            <Pencil size={16} /> Edit Workout
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {completedToday.exercises.map((ex) => {
            const exercise = getExerciseById(ex.exerciseId);
            return (
              <div key={ex.exerciseId} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="font-medium dark:text-white">{exercise?.name}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {ex.sets.map((s) => (
                    <span
                      key={s.setNumber}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-mono',
                        s.isPersonalRecord
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {s.weight}kg × {s.reps} {s.isPersonalRecord && '🏆'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold dark:text-white truncate">
            {todayPlan.dayName} — {todayPlan.label}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{todayPlan.focus} Focus</p>
        </div>
        {isWorkoutActive && (
          <div className="text-right flex-shrink-0">
            <p className="text-xl sm:text-2xl font-mono font-bold text-primary-500">{formatDuration(elapsed)}</p>
            <p className="text-xs text-gray-500">elapsed</p>
          </div>
        )}
      </div>

      {/* Rest Timer */}
      {timer.seconds > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="text-primary-500" size={20} />
              <span className="font-semibold dark:text-white">Rest Timer</span>
            </div>
            <span className="text-2xl font-mono font-bold text-primary-500">
              {formatDuration(timer.seconds)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-primary-100 dark:bg-primary-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-1000"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={timer.isRunning ? timer.pause : timer.resume}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600"
            >
              {timer.isRunning ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
              {timer.isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={timer.reset}
              className="py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Start Button */}
      {!isWorkoutActive && !activeWorkoutId && (
        <button
          onClick={handleStartWorkout}
          className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <Play size={22} /> Start Workout
        </button>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {todayPlan.exercises.map((planEx) => {
          const exercise = getExerciseById(planEx.exerciseId);
          const loggedEx = activeLog?.exercises.find((e) => e.exerciseId === planEx.exerciseId);
          const isExpanded = expandedExercise === planEx.exerciseId;
          const completedSets = loggedEx?.sets.length ?? 0;
          const draftsForWorkout = activeWorkoutId ? workoutDrafts[activeWorkoutId] ?? {} : {};

          return (
            <div
              key={planEx.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : planEx.exerciseId)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {planEx.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium dark:text-white truncate">{exercise?.name}</p>
                    <p className="text-xs text-gray-500">{planEx.targetSets} × {planEx.targetReps}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {completedSets > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      {completedSets}/{planEx.targetSets}
                    </span>
                  )}
                  {completedSets >= planEx.targetSets && <Check size={16} className="text-green-500" />}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isExpanded && isWorkoutActive && (
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="mt-3 space-y-2">
                    {Array.from({ length: planEx.targetSets }, (_, i) => i + 1).map((setNum) => {
                      const logged = loggedEx?.sets.find((s) => s.setNumber === setNum);
                      const previous = loggedEx?.sets.find((s) => s.setNumber === setNum - 1);
                      const draftKey = `${planEx.exerciseId}-${setNum}`;
                      const draft = draftsForWorkout[draftKey];
                      return (
                        <SetInput
                          key={setNum}
                          setNumber={setNum}
                          logged={logged}
                          previous={previous}
                          draft={draft}
                          onDraftChange={(weight, reps) => {
                            if (activeWorkoutId) {
                              setWorkoutDraft(activeWorkoutId, planEx.exerciseId, setNum, weight, reps);
                            }
                          }}
                          onLog={(weight, reps) => {
                            if (activeWorkoutId) {
                              logSet(activeWorkoutId, planEx.exerciseId, setNum, weight, reps);
                              timer.start(planEx.targetSets <= 6 ? 150 : 90);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Button */}
      {isWorkoutActive && (
        <button
          onClick={handleCompleteWorkout}
          className="w-full py-4 rounded-2xl bg-green-500 text-white font-semibold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <Check size={22} /> {isEditingCompleted ? 'Save Changes' : 'Complete Workout'}
        </button>
      )}
    </div>
  );
}

interface SetInputProps {
  setNumber: number;
  logged?: { weight: number; reps: number; isPersonalRecord?: boolean };
  previous?: { weight: number; reps: number };
  draft?: { weight: string; reps: string };
  onLog: (weight: number, reps: number) => void;
  onDraftChange?: (weight: string, reps: string) => void;
}

export function SetInput({ setNumber, logged, previous, draft, onLog, onDraftChange }: SetInputProps) {
  const initialWeight =
    draft?.weight ?? (logged?.weight !== undefined ? logged.weight.toString() : '');
  const initialReps = draft?.reps ?? (logged?.reps !== undefined ? logged.reps.toString() : '');

  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [isEditing, setIsEditing] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, []);

  const scheduleDraft = (nextWeight: string, nextReps: string) => {
    if (!onDraftChange) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      onDraftChange(nextWeight, nextReps);
    }, 350);
  };

  const submit = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      onLog(w, r);
      setIsEditing(false);
    }
  };

  const copyPrevious = () => {
    if (!previous) return;
    const nextW = previous.weight.toString();
    const nextR = previous.reps.toString();
    setWeight(nextW);
    setReps(nextR);
    scheduleDraft(nextW, nextR);
  };

  const cancelEdit = () => {
    if (!logged) return;
    setWeight(logged.weight.toString());
    setReps(logged.reps.toString());
    setIsEditing(false);
  };

  const readOnly = !!logged && !isEditing;
  const canCopyPrevious = !readOnly && !!previous && !weight && !reps;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-medium text-gray-400 flex-shrink-0">
        S{setNumber}
      </span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        aria-label={`Set ${setNumber} weight`}
        value={weight}
        readOnly={readOnly}
        onChange={(e) => {
          const v = e.target.value;
          setWeight(v);
          scheduleDraft(v, reps);
        }}
        className="flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60"
      />
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        aria-label={`Set ${setNumber} reps`}
        value={reps}
        readOnly={readOnly}
        onChange={(e) => {
          const v = e.target.value;
          setReps(v);
          scheduleDraft(weight, v);
        }}
        className="flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60"
      />

      {canCopyPrevious && (
        <button
          type="button"
          onClick={copyPrevious}
          aria-label={`Copy values from set ${setNumber - 1}`}
          title={`Copy ${previous?.weight}kg × ${previous?.reps} from S${setNumber - 1}`}
          className="shrink-0 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {readOnly ? (
        <>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit set ${setNumber}`}
            className="shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            disabled
            aria-label={`Set ${setNumber} logged`}
            className="shrink-0 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center"
          >
            <Check size={16} />
            {logged?.isPersonalRecord && <Trophy size={12} className="text-yellow-400 ml-0.5" />}
          </button>
        </>
      ) : (
        <>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              aria-label={`Cancel editing set ${setNumber}`}
              className="shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            aria-label={isEditing ? `Save set ${setNumber}` : `Log set ${setNumber}`}
            className="shrink-0 p-2 rounded-lg transition-colors bg-primary-500 text-white hover:bg-primary-600"
          >
            <Check size={16} />
          </button>
        </>
      )}
    </div>
  );
}
