import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Dumbbell, Library } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import type { Exercise, MuscleGroup, Equipment } from '@/types';
import { generateId } from '@/utils/calculations';
import PageHeader from '@/components/PageHeader';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'side_delts', 'rear_delts', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms', 'traps', 'neck',
];

const EQUIPMENT: Equipment[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'smith_machine',
  'other',
];

const blankForm = (): {
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  notes: string;
} => ({ name: '', muscleGroups: [], equipment: 'barbell', notes: '' });

/**
 * ExerciseLibrary — browse, add, edit and remove exercises.
 *
 * The form lives inside a shared Modal so the same affordance is
 * used here, in the meal editor, and in PreviousLogsModal.
 */
export default function ExerciseLibrary() {
  const { exercises, addExercise, updateExercise, removeExercise } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(blankForm);

  const filtered = exercises.filter((ex) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroups.some((mg) => mg.includes(q));
    const matchesMuscle = filterMuscle === '' || ex.muscleGroups.includes(filterMuscle);
    return matchesSearch && matchesMuscle;
  });

  const openAdd = () => {
    setEditingId(null);
    setFormData(blankForm());
    setShowForm(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setFormData({
      name: ex.name,
      muscleGroups: ex.muscleGroups,
      equipment: ex.equipment,
      notes: ex.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.muscleGroups.length === 0) return;
    if (editingId) {
      updateExercise(editingId, formData);
    } else {
      addExercise({ ...formData, id: generateId() });
    }
    setShowForm(false);
    setEditingId(null);
    setFormData(blankForm());
  };

  const toggleMuscle = (mg: MuscleGroup) => {
    setFormData((prev) => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(mg)
        ? prev.muscleGroups.filter((m) => m !== mg)
        : [...prev.muscleGroups, mg],
    }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        icon={Library}
        eyebrow="Reference catalog"
        title="Exercise library"
        subtitle={`${exercises.length} movements available.`}
      >
        <Button variant="primary" onClick={openAdd}>
          <Plus size={14} />
          <span className="hidden sm:inline">Add exercise</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </PageHeader>

      {/* ── Search + filter ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search exercises…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | '')}
          className="sm:w-48 capitalize"
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg} className="capitalize">
              {mg.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>

      {/* ── Exercise grid ───────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ex) => (
            <Card key={ex.id} className="!p-4 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Dumbbell size={14} className="text-fg-muted flex-shrink-0" />
                  <h4 className="text-sm font-medium text-fg truncate">{ex.name}</h4>
                </div>
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(ex)}
                    aria-label={`Edit ${ex.name}`}
                    className="touch-target-sm p-1.5 rounded text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors focus-ring"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    aria-label={`Remove ${ex.name}`}
                    className="touch-target-sm p-1.5 rounded text-fg-subtle hover:text-danger hover:bg-danger-100 dark:hover:bg-danger-700/20 transition-colors focus-ring"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {ex.muscleGroups.map((mg) => (
                  <Badge key={mg} tone="neutral" variant="soft" className="capitalize">
                    {mg.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-fg-subtle mt-2 capitalize">
                {ex.equipment.replace('_', ' ')}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Search}
            title="No exercises found"
            description="Try a different search term or muscle filter."
          />
        </Card>
      )}

      {/* ── Form modal ──────────────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit exercise' : 'New exercise'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!formData.name || formData.muscleGroups.length === 0}
            >
              {editingId ? 'Save changes' : 'Add exercise'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="ex-name" required>
            <Input
              id="ex-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Incline dumbbell press"
            />
          </Field>

          <Field label="Muscle groups" required>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((mg) => {
                const active = formData.muscleGroups.includes(mg);
                return (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => toggleMuscle(mg)}
                    className={cn(
                      'touch-target-sm capitalize px-2.5 h-7 rounded-md text-xs font-medium transition-colors focus-ring',
                      active
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface',
                    )}
                  >
                    {mg.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Equipment" htmlFor="ex-eq">
            <Select
              id="ex-eq"
              value={formData.equipment}
              onChange={(e) =>
                setFormData((p) => ({ ...p, equipment: e.target.value as Equipment }))
              }
              className="capitalize"
            >
              {EQUIPMENT.map((eq) => (
                <option key={eq} value={eq} className="capitalize">
                  {eq.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Notes" htmlFor="ex-notes" hint="Optional cues or form notes.">
            <Textarea
              id="ex-notes"
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
