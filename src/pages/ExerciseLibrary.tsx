import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Dumbbell, Library } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import type { Exercise, MuscleGroup, Equipment } from '@/types';
import { generateId } from '@/utils/calculations';
import PageHeader from '@/components/PageHeader';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'side_delts', 'rear_delts', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms', 'traps', 'neck',
];

const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'smith_machine', 'other'];

export default function ExerciseLibrary() {
  const { exercises, addExercise, updateExercise, removeExercise } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    muscleGroups: MuscleGroup[];
    equipment: Equipment;
    notes: string;
  }>({ name: '', muscleGroups: [], equipment: 'barbell', notes: '' });

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      searchQuery === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroups.some((mg) => mg.includes(searchQuery.toLowerCase()));
    const matchesMuscle = filterMuscle === '' || ex.muscleGroups.includes(filterMuscle);
    return matchesSearch && matchesMuscle;
  });

  const handleEdit = (ex: Exercise) => {
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
    setFormData({ name: '', muscleGroups: [], equipment: 'barbell', notes: '' });
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        theme="library"
        icon={Library}
        eyebrow="Reference Catalog"
        title="Exercise Library"
        subtitle={`${exercises.length} movements — every tool in the rack.`}
      >
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', muscleGroups: [], equipment: 'barbell', notes: '' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-sm text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add Exercise</span><span className="sm:hidden">Add</span>
        </button>
      </PageHeader>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | '')}
          className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
        >
          <option value="">All Muscles</option>
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg}>{mg.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Exercise Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {editingId ? 'Edit Exercise' : 'New Exercise'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-1 block">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
                  placeholder="Exercise name"
                />
              </div>

              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-2 block">Muscle Groups</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((mg) => (
                    <button
                      key={mg}
                      onClick={() => toggleMuscle(mg)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                        formData.muscleGroups.includes(mg)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {mg.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-1 block">Equipment</label>
                <select
                  value={formData.equipment}
                  onChange={(e) => setFormData((p) => ({ ...p, equipment: e.target.value as Equipment }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
                >
                  {EQUIPMENT.map((eq) => (
                    <option key={eq} value={eq}>{eq.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-1 block">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
                  rows={2}
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
              >
                {editingId ? 'Save Changes' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-primary-400" />
                <h4 className="font-medium text-sm dark:text-white">{ex.name}</h4>
              </div>
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(ex)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Edit2 size={16} className="text-gray-400" />
                </button>
                <button onClick={() => removeExercise(ex.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {ex.muscleGroups.map((mg) => (
                <span key={mg} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {mg.replace('_', ' ')}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 capitalize">{ex.equipment.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={40} />
          <p className="text-gray-500 dark:text-gray-400">No exercises found</p>
        </div>
      )}
    </div>
  );
}
