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
  Dumbbell,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import { useRestTimer } from '@/hooks/useRestTimer';
import { formatDuration } from '@/utils/calculations';
import { cn } from '@/utils/cn';
import PageHeader from '@/components/PageHeader';

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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          theme="workout"
          icon={Dumbbell}
          eyebrow={dayName}
          title="Rest Day"
          subtitle="Recovery is part of the program. Prioritize protein, sleep, and a light walk — you earned it."
        />
        <div className="rounded-2xl border border-iron-200/60 dark:border-iron-800 bg-white dark:bg-iron-900/60 p-6 text-center">
          <Flame className="mx-auto text-flame-500 mb-3" size={36} />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Come back tomorrow — gains are built between sessions.
          </p>
        </div>
      </div>
    );
  }

  if (completedToday && !activeWorkoutId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          theme="workout"
          icon={Dumbbell}
          eyebrow={`${todayPlan.dayName} · ${todayPlan.focus.toUpperCase()}`}
          title={todayPlan.label}
          subtitle="Logged and locked in. Great work."
        >
          <button
            type="button"
            onClick={handleEditCompletedWorkout}
            aria-label="Edit today's workout"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-sm text-white transition-colors"
          >
            <Pencil size={16} /> Edit Workout
          </button>
        </PageHeader>

        <div className="rounded-2xl border border-nutrition-200 dark:border-nutrition-900/50 bg-gradient-to-br from-nutrition-50 to-white dark:from-nutrition-900/20 dark:to-iron-900/40 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nutrition-500 text-white flex items-center justify-center flex-shrink-0">
            <Check size={24} strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <p className="font-display uppercase tracking-wide text-lg font-bold text-nutrition-700 dark:text-nutrition-300">
              Workout Complete
            </p>
            {completedToday.duration && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Time under iron: <span className="font-mono font-semibold">{formatDuration(completedToday.duration)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {completedToday.exercises.map((ex) => {
            const exercise = getExerciseById(ex.exerciseId);
            return (
              <div
                key={ex.exerciseId}
                className="bg-white dark:bg-iron-900/60 rounded-xl border border-iron-200/60 dark:border-iron-800 p-4"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell size={14} className="text-primary-500" />
                  <p className="font-semibold dark:text-white">{exercise?.name}</p>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {ex.sets.map((s) => (
                    <span
                      key={s.setNumber}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-mono font-semibold border',
                        s.isPersonalRecord
                          ? 'bg-gold-100 dark:bg-gold-900/20 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-800'
                          : 'bg-iron-50 dark:bg-iron-800/70 text-iron-700 dark:text-iron-200 border-iron-200 dark:border-iron-700',
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
      <PageHeader
        theme="workout"
        icon={Dumbbell}
        eyebrow={`${todayPlan.dayName} · ${todayPlan.focus.toUpperCase()}`}
        title={todayPlan.label}
        subtitle={isWorkoutActive ? 'Session in progress — lock every rep in.' : 'Time to move some iron.'}
      >
        {isWorkoutActive && (
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">{formatDuration(elapsed)}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">elapsed</p>
          </div>
        )}
      </PageHeader>

      {/* Rest Timer */}
      {timer.seconds > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-primary-200 dark:border-primary-900/60 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-iron-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center">
                <Timer size={16} />
              </div>
              <span className="font-display uppercase tracking-wide text-sm font-semibold dark:text-white">
                Rest Timer
              </span>
            </div>
            <span className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-300 tabular-nums">
              {formatDuration(timer.seconds)}
            </span>
          </div>
          <div className="mt-3 h-2 bg-primary-100 dark:bg-iron-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-flame-500 rounded-full transition-all duration-1000"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={timer.isRunning ? timer.pause : timer.resume}
              className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 shadow-glow-primary"
            >
              {timer.isRunning ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
              {timer.isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={timer.reset}
              className="py-1.5 px-3 rounded-lg text-sm font-medium bg-iron-200 dark:bg-iron-700 hover:bg-iron-300 dark:hover:bg-iron-600 dark:text-white"
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
          className="group w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-flame-500 text-white font-display text-xl uppercase tracking-[0.15em] hover:shadow-glow-primary transition-all flex items-center justify-center gap-3"
        >
          <Play size={24} strokeWidth={2.5} /> Start Workout
        </button>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {todayPlan.exercises.map((planEx) => {
          const exercise = getExerciseById(planEx.exerciseId);
          const loggedEx = activeLog?.exercises.find((e) => e.exerciseId === planEx.exerciseId);
          const isExpanded = expandedExercise === planEx.exerciseId;
          const completedSets = loggedEx?.sets.length ?? 0;
          const isDone = completedSets >= planEx.targetSets;
          const draftsForWorkout = activeWorkoutId ? workoutDrafts[activeWorkoutId] ?? {} : {};

          return (
            <div
              key={planEx.id}
              className={cn(
                'bg-white dark:bg-iron-900/60 rounded-xl border overflow-hidden transition-colors',
                isDone
                  ? 'border-nutrition-300 dark:border-nutrition-900/60'
                  : 'border-iron-200/60 dark:border-iron-800',
              )}
            >
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : planEx.exerciseId)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-display font-bold flex-shrink-0 border',
                      isDone
                        ? 'bg-nutrition-500 text-white border-nutrition-600'
                        : 'bg-primary-500 text-white border-primary-600',
                    )}
                  >
                    {planEx.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold dark:text-white truncate">{exercise?.name}</p>
                    <p className="text-xs font-mono text-iron-500 dark:text-iron-300">
                      {planEx.targetSets} × {planEx.targetReps}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {completedSets > 0 && (
                    <span
                      className={cn(
                        'text-xs font-mono font-semibold px-2 py-0.5 rounded-md border',
                        isDone
                          ? 'bg-nutrition-100 dark:bg-nutrition-900/30 text-nutrition-700 dark:text-nutrition-300 border-nutrition-300 dark:border-nutrition-800'
                          : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-900/60',
                      )}
                    >
                      {completedSets}/{planEx.targetSets}
                    </span>
                  )}
                  {isDone && <Check size={16} className="text-nutrition-500" />}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isExpanded && isWorkoutActive && (
                <div className="px-3 sm:px-4 pb-4 border-t border-iron-200/60 dark:border-iron-800 bg-iron-50/60 dark:bg-iron-950/40">
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
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-nutrition-600 to-nutrition-500 text-white font-display text-xl uppercase tracking-[0.15em] hover:shadow-glow-nutrition transition-all flex items-center justify-center gap-3"
        >
          <Check size={24} strokeWidth={2.5} /> {isEditingCompleted ? 'Save Changes' : 'Complete Workout'}
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
    <div
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 rounded-lg p-1.5 sm:p-2 transition-colors',
        readOnly
          ? logged?.isPersonalRecord
            ? 'bg-gold-50 dark:bg-gold-900/10 border border-gold-200/70 dark:border-gold-900/50'
            : 'bg-iron-100/70 dark:bg-iron-900/40 border border-iron-200/50 dark:border-iron-800/70'
          : 'bg-white dark:bg-iron-900/50 border border-iron-200 dark:border-iron-800',
      )}
    >
      <span
        className={cn(
          'w-8 sm:w-9 text-center font-display uppercase text-xs sm:text-sm font-bold flex-shrink-0 tracking-wider',
          readOnly
            ? 'text-iron-500 dark:text-iron-300'
            : 'text-primary-600 dark:text-primary-300',
        )}
      >
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
        className={cn(
          'flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg text-sm font-mono font-semibold tabular-nums border focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60',
          readOnly
            ? 'bg-transparent border-transparent text-iron-700 dark:text-iron-100'
            : 'bg-iron-50 dark:bg-iron-800 border-iron-200 dark:border-iron-700 dark:text-white',
        )}
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
        className={cn(
          'flex-1 min-w-0 px-2 sm:px-3 py-2 rounded-lg text-sm font-mono font-semibold tabular-nums border focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60',
          readOnly
            ? 'bg-transparent border-transparent text-iron-700 dark:text-iron-100'
            : 'bg-iron-50 dark:bg-iron-800 border-iron-200 dark:border-iron-700 dark:text-white',
        )}
      />

      {canCopyPrevious && (
        <button
          type="button"
          onClick={copyPrevious}
          aria-label={`Copy values from set ${setNumber - 1}`}
          title={`Copy ${previous?.weight}kg × ${previous?.reps} from S${setNumber - 1}`}
          className="shrink-0 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors border border-primary-200/70 dark:border-primary-900/50"
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
            className="shrink-0 p-2 rounded-lg bg-iron-200 dark:bg-iron-800 text-iron-700 dark:text-iron-200 hover:bg-iron-300 dark:hover:bg-iron-700 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            disabled
            aria-label={`Set ${setNumber} logged`}
            className={cn(
              'shrink-0 p-2 rounded-lg flex items-center',
              logged?.isPersonalRecord
                ? 'bg-gold-500 text-white shadow-glow-gold'
                : 'bg-nutrition-500 text-white',
            )}
          >
            <Check size={16} strokeWidth={2.5} />
            {logged?.isPersonalRecord && <Trophy size={12} className="text-white ml-0.5" />}
          </button>
        </>
      ) : (
        <>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              aria-label={`Cancel editing set ${setNumber}`}
              className="shrink-0 p-2 rounded-lg bg-iron-200 dark:bg-iron-800 text-iron-600 dark:text-iron-300 hover:bg-iron-300 dark:hover:bg-iron-700 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            aria-label={isEditing ? `Save set ${setNumber}` : `Log set ${setNumber}`}
            className="shrink-0 p-2 rounded-lg transition-colors bg-primary-500 text-white hover:bg-primary-600 shadow-glow-primary"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
