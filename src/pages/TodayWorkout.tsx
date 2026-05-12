import { useEffect, useRef, useState } from 'react';
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
  History,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getExerciseById } from '@/data/exercises';
import { useRestTimer } from '@/hooks/useRestTimer';
import { formatDuration } from '@/utils/calculations';
import { cn } from '@/utils/cn';
import PageHeader from '@/components/PageHeader';
import PreviousLogsModal from '@/components/workout/PreviousLogsModal';
import { Badge, Button, Card, EmptyState } from '@/components/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * TodayWorkout — the heart of the app. Three modes:
 *   1. Rest day fallback (no plan for today).
 *   2. Completed-today summary with edit affordance.
 *   3. Active session: rest timer, exercise accordion, per-set inputs.
 *
 * Test-facing strings are kept stable: "rest day", "start workout",
 * "edit today's workout", "workout complete", "save changes",
 * "set N weight/reps", "log set N", "set N logged", "complete workout".
 */
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
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);

  const activeLog = workoutLogs.find((l) => l.id === activeWorkoutId);
  const completedToday = workoutLogs.find((l) => l.date === todayStr && l.completed);
  const inProgressToday = workoutLogs.find((l) => l.date === todayStr && !l.completed);

  const resumedRef = useRef<string | null>(null);

  /**
   * Auto-resume an in-progress workout after reload. A ref guard
   * keeps this idempotent per in-progress id even though React may
   * run effects more than once during dev/StrictMode.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!inProgressToday || activeWorkoutId) return;
    if (resumedRef.current === inProgressToday.id) return;
    resumedRef.current = inProgressToday.id;

    setActiveWorkoutId(inProgressToday.id);
    setIsWorkoutActive(true);
    setIsEditingCompleted(false);
    if (inProgressToday.startedAt) {
      const recovered = Math.max(
        0,
        Math.round((Date.now() - inProgressToday.startedAt) / 1000),
      );
      setElapsed(recovered);
    }
    setExpandedExercise(
      inProgressToday.exercises[0]?.exerciseId ??
        todayPlan?.exercises[0]?.exerciseId ??
        null,
    );
  }, [activeWorkoutId, inProgressToday, todayPlan]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    setExpandedExercise(
      completedToday.exercises[0]?.exerciseId ??
        todayPlan?.exercises[0]?.exerciseId ??
        null,
    );
  };

  // ── Mode 1: Rest day ──────────────────────────────────────────
  if (!todayPlan) {
    return (
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          theme="workout"
          icon={Dumbbell}
          eyebrow={dayName}
          title="Rest day"
          subtitle="Recovery is part of the program. Prioritise protein, sleep, and a light walk."
        />
        <Card>
          <EmptyState
            icon={Dumbbell}
            title="No session scheduled"
            description="Come back tomorrow — gains are built between workouts."
          />
        </Card>
      </div>
    );
  }

  // ── Mode 2: Completed today ──────────────────────────────────
  if (completedToday && !activeWorkoutId) {
    return (
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          theme="workout"
          icon={Dumbbell}
          eyebrow={`${todayPlan.dayName} · ${todayPlan.focus}`}
          title={todayPlan.label}
          subtitle="Logged and locked in."
        >
          <Button
            variant="secondary"
            onClick={handleEditCompletedWorkout}
            aria-label="Edit today's workout"
          >
            <Pencil size={14} /> Edit workout
          </Button>
        </PageHeader>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-success-100 dark:bg-success-700/20 text-success flex items-center justify-center flex-shrink-0">
            <Check size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">Workout complete</p>
            {completedToday.duration && (
              <p className="text-xs text-fg-muted tabular-nums">
                Time under iron · {formatDuration(completedToday.duration)}
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-2.5">
          {completedToday.exercises.map((ex) => {
            const exercise = getExerciseById(ex.exerciseId);
            return (
              <Card key={ex.exerciseId} className="!p-4">
                <div className="flex items-center gap-2">
                  <Dumbbell size={14} className="text-fg-muted" />
                  <p className="text-sm font-semibold text-fg">{exercise?.name}</p>
                </div>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {ex.sets.map((s) => (
                    <Badge
                      key={s.setNumber}
                      tone={s.isPersonalRecord ? 'warning' : 'neutral'}
                      variant="soft"
                      className="font-mono"
                    >
                      {s.weight}kg × {s.reps}
                      {s.isPersonalRecord && (
                        <Trophy size={11} className="ml-0.5" />
                      )}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Mode 3: Active session ───────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        theme="workout"
        icon={Dumbbell}
        eyebrow={`${todayPlan.dayName} · ${todayPlan.focus}`}
        title={todayPlan.label}
        subtitle={
          isWorkoutActive
            ? 'Session in progress — lock every rep in.'
            : 'Ready when you are.'
        }
      >
        {isWorkoutActive && (
          <div className="text-right">
            <p className="text-2xl font-semibold text-fg tabular-nums leading-none">
              {formatDuration(elapsed)}
            </p>
            <p className="text-2xs uppercase tracking-wider text-fg-subtle mt-1">
              elapsed
            </p>
          </div>
        )}
      </PageHeader>

      {/* ── Rest Timer ───────────────────────────────────────── */}
      {timer.seconds > 0 && (
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-surface-2 text-accent flex items-center justify-center">
                <Timer size={14} />
              </div>
              <span className="text-sm font-semibold text-fg">Rest timer</span>
            </div>
            <span className="text-xl font-semibold text-fg tabular-nums">
              {formatDuration(timer.seconds)}
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-1000 ease-out-quart"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={timer.isRunning ? timer.pause : timer.resume}
            >
              {timer.isRunning ? <Pause size={14} /> : <Play size={14} />}
              {timer.isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="secondary" size="icon" onClick={timer.reset}>
              <RotateCcw size={14} />
            </Button>
          </div>
        </Card>
      )}

      {/* ── Start CTA ────────────────────────────────────────── */}
      {!isWorkoutActive && !activeWorkoutId && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStartWorkout}
        >
          <Play size={18} strokeWidth={2.5} /> Start workout
        </Button>
      )}

      {/* ── Exercise list ────────────────────────────────────── */}
      <div className="space-y-2.5">
        {todayPlan.exercises.map((planEx) => {
          const exercise = getExerciseById(planEx.exerciseId);
          const loggedEx = activeLog?.exercises.find(
            (e) => e.exerciseId === planEx.exerciseId,
          );
          const isExpanded = expandedExercise === planEx.exerciseId;
          const completedSets = loggedEx?.sets.length ?? 0;
          const isDone = completedSets >= planEx.targetSets;
          const draftsForWorkout = activeWorkoutId
            ? workoutDrafts[activeWorkoutId] ?? {}
            : {};

          return (
            <div
              key={planEx.id}
              className={cn(
                'bg-surface rounded-lg border overflow-hidden transition-colors',
                isDone ? 'border-success/40' : 'border-line',
              )}
            >
              <button
                onClick={() =>
                  setExpandedExercise(isExpanded ? null : planEx.exerciseId)
                }
                className="w-full p-4 flex items-center justify-between text-left focus-ring rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0',
                      isDone
                        ? 'bg-success text-white'
                        : 'bg-surface-2 text-fg border border-line',
                    )}
                  >
                    {planEx.order}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-fg truncate">{exercise?.name}</p>
                    <p className="text-xs text-fg-muted tabular-nums">
                      {planEx.targetSets} × {planEx.targetReps}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {completedSets > 0 && (
                    <Badge
                      tone={isDone ? 'success' : 'accent'}
                      variant="soft"
                      className="font-mono"
                    >
                      {completedSets}/{planEx.targetSets}
                    </Badge>
                  )}
                  {isDone && <Check size={16} className="text-success" />}
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-fg-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-fg-muted" />
                  )}
                </div>
              </button>

              {isExpanded && isWorkoutActive && (
                <div className="px-3 sm:px-4 pb-4 border-t border-line bg-surface-2/40">
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xs uppercase tracking-wider font-semibold text-fg-subtle">
                      Working sets
                    </span>
                    <button
                      type="button"
                      onClick={() => setHistoryExerciseId(planEx.exerciseId)}
                      aria-label={`View previous logs for ${exercise?.name ?? 'this exercise'}`}
                      title="Previous logs · Smart overload"
                      className="touch-target-sm inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium border border-line bg-surface hover:bg-surface-2 text-fg-muted hover:text-fg transition-colors focus-ring"
                    >
                      <History size={12} />
                      Last logs
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {Array.from({ length: planEx.targetSets }, (_, i) => i + 1).map(
                      (setNum) => {
                        const logged = loggedEx?.sets.find(
                          (s) => s.setNumber === setNum,
                        );
                        const previous = loggedEx?.sets.find(
                          (s) => s.setNumber === setNum - 1,
                        );
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
                                setWorkoutDraft(
                                  activeWorkoutId,
                                  planEx.exerciseId,
                                  setNum,
                                  weight,
                                  reps,
                                );
                              }
                            }}
                            onLog={(weight, reps) => {
                              if (activeWorkoutId) {
                                logSet(
                                  activeWorkoutId,
                                  planEx.exerciseId,
                                  setNum,
                                  weight,
                                  reps,
                                );
                                timer.start(planEx.targetSets <= 6 ? 150 : 90);
                              }
                            }}
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Previous logs popup — mounted only when an exercise card opens it. */}
      {historyExerciseId && (
        <PreviousLogsModal
          exerciseId={historyExerciseId}
          beforeDate={todayStr}
          excludeWorkoutId={activeWorkoutId ?? undefined}
          targetReps={
            todayPlan.exercises.find((e) => e.exerciseId === historyExerciseId)
              ?.targetReps
          }
          onClose={() => setHistoryExerciseId(null)}
        />
      )}

      {/* ── Complete CTA ─────────────────────────────────────── */}
      {isWorkoutActive && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCompleteWorkout}
        >
          <Check size={18} strokeWidth={2.5} />
          {isEditingCompleted ? 'Save changes' : 'Complete workout'}
        </Button>
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

/**
 * SetInput — a single inline row for logging one working set.
 *
 * Behaviour:
 *   - Drafts are debounced ~350ms before persisting to the store
 *     (cheap optimistic UI without spamming Firestore).
 *   - When values exist in `logged`, the row is read-only; tapping
 *     the pencil icon opens an inline edit.
 *   - When the previous set's values are available and this row is
 *     untouched, a down-arrow button copies them across.
 */
export function SetInput({
  setNumber,
  logged,
  previous,
  draft,
  onLog,
  onDraftChange,
}: SetInputProps) {
  const initialWeight =
    draft?.weight ?? (logged?.weight !== undefined ? logged.weight.toString() : '');
  const initialReps =
    draft?.reps ?? (logged?.reps !== undefined ? logged.reps.toString() : '');

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
    const r = parseInt(reps, 10);
    if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) {
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
  const isPR = !!logged?.isPersonalRecord;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 rounded-md p-1.5 sm:p-2 transition-colors',
        readOnly
          ? isPR
            ? 'bg-warning-100/60 dark:bg-warning-700/10 border border-warning/30'
            : 'bg-surface-2 border border-line'
          : 'bg-surface border border-line-strong',
      )}
    >
      <span
        className={cn(
          'w-7 sm:w-9 text-center text-xs sm:text-sm font-semibold flex-shrink-0 tabular-nums',
          readOnly ? 'text-fg-muted' : 'text-accent',
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
          'flex-1 min-w-0 px-2 sm:px-3 h-9 rounded-md text-sm font-mono font-semibold tabular-nums border outline-none transition-colors',
          'focus:border-accent focus:ring-2 focus:ring-accent',
          readOnly
            ? 'bg-transparent border-transparent text-fg'
            : 'bg-surface border-line text-fg',
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
          'flex-1 min-w-0 px-2 sm:px-3 h-9 rounded-md text-sm font-mono font-semibold tabular-nums border outline-none transition-colors',
          'focus:border-accent focus:ring-2 focus:ring-accent',
          readOnly
            ? 'bg-transparent border-transparent text-fg'
            : 'bg-surface border-line text-fg',
        )}
      />

      {canCopyPrevious && (
        <button
          type="button"
          onClick={copyPrevious}
          aria-label={`Copy values from set ${setNumber - 1}`}
          title={`Copy ${previous?.weight}kg × ${previous?.reps} from S${setNumber - 1}`}
          className="touch-target-sm shrink-0 h-9 w-9 rounded-md bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface border border-line transition-colors flex items-center justify-center focus-ring"
        >
          <ArrowDown size={14} />
        </button>
      )}

      {readOnly ? (
        <>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit set ${setNumber}`}
            className="touch-target-sm shrink-0 h-9 w-9 rounded-md bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface border border-line transition-colors flex items-center justify-center focus-ring"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            disabled
            aria-label={`Set ${setNumber} logged`}
            className={cn(
              'touch-target-sm shrink-0 h-9 w-9 rounded-md flex items-center justify-center',
              isPR
                ? 'bg-warning text-white'
                : 'bg-success text-white',
            )}
          >
            {isPR ? <Trophy size={14} /> : <Check size={14} strokeWidth={2.5} />}
          </button>
        </>
      ) : (
        <>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              aria-label={`Cancel editing set ${setNumber}`}
              className="touch-target-sm shrink-0 h-9 w-9 rounded-md bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface border border-line transition-colors flex items-center justify-center focus-ring"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            aria-label={isEditing ? `Save set ${setNumber}` : `Log set ${setNumber}`}
            className="touch-target-sm shrink-0 h-9 w-9 rounded-md bg-accent text-white hover:bg-accent-700 dark:hover:bg-accent-600 transition-colors flex items-center justify-center focus-ring"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
