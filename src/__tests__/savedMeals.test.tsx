import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('@/services/firebase', () => ({
  isFirebaseConfigured: () => true,
  db: {},
  doc: (...parts: string[]) => parts.join('/'),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => ({}),
  }),
}));

import SavedMealsBar from '@/components/nutrition/SavedMealsBar';
import { useAppStore } from '@/store/useAppStore';
import { totalsForItems } from '@/utils/mealMath';
import type { FoodItem } from '@/types';

const yogurtBowl: FoodItem[] = [
  { name: 'Greek yogurt', quantity: '200g', calories: 130, protein: 20, carbs: 8, fat: 0 },
  { name: 'Honey', quantity: '15g', calories: 45, protein: 0, carbs: 12, fat: 0 },
];

describe('totalsForItems', () => {
  it('sums all four macros', () => {
    expect(totalsForItems(yogurtBowl)).toEqual({
      calories: 175,
      protein: 20,
      carbs: 20,
      fat: 0,
    });
  });

  it('coerces non-finite values to 0 instead of crashing the totals', () => {
    const broken = [
      { name: 'x', quantity: '1', calories: NaN, protein: 10, carbs: 0, fat: 0 },
    ] as FoodItem[];
    expect(totalsForItems(broken)).toEqual({ calories: 0, protein: 10, carbs: 0, fat: 0 });
  });
});

describe('saved meals store actions', () => {
  beforeEach(() => {
    useAppStore.setState({
      savedMeals: [],
      calorieLogs: [],
    });
  });

  it('addSavedMeal stamps an id and createdAt', () => {
    const id = useAppStore.getState().addSavedMeal({
      name: 'Yogurt Bowl',
      defaultTime: '08:00',
      items: yogurtBowl,
    });
    const meals = useAppStore.getState().savedMeals;
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe(id);
    expect(meals[0].createdAt).toBeGreaterThan(0);
    expect(meals[0].name).toBe('Yogurt Bowl');
  });

  it('addSavedMeal trims the meal name', () => {
    const id = useAppStore.getState().addSavedMeal({
      name: '   Yogurt Bowl   ',
      items: yogurtBowl,
    });
    const meal = useAppStore.getState().savedMeals.find((m) => m.id === id)!;
    expect(meal.name).toBe('Yogurt Bowl');
  });

  it('updateSavedMeal patches fields and trims a new name', () => {
    const id = useAppStore.getState().addSavedMeal({ name: 'A', items: yogurtBowl });
    useAppStore.getState().updateSavedMeal(id, { name: '  B ', defaultTime: '09:30' });
    const meal = useAppStore.getState().savedMeals.find((m) => m.id === id)!;
    expect(meal.name).toBe('B');
    expect(meal.defaultTime).toBe('09:30');
  });

  it('removeSavedMeal removes the entry', () => {
    const id = useAppStore.getState().addSavedMeal({ name: 'A', items: yogurtBowl });
    useAppStore.getState().removeSavedMeal(id);
    expect(useAppStore.getState().savedMeals).toHaveLength(0);
  });

  it('applySavedMeal pushes the template into the calorie log with derived macros', () => {
    const id = useAppStore.getState().addSavedMeal({
      name: 'Yogurt Bowl',
      defaultTime: '08:00',
      items: yogurtBowl,
    });
    useAppStore.getState().applySavedMeal('2026-05-08', id);
    const log = useAppStore.getState().calorieLogs.find((l) => l.date === '2026-05-08');
    expect(log).toBeDefined();
    expect(log!.meals).toHaveLength(1);
    const meal = log!.meals[0];
    expect(meal.name).toBe('Yogurt Bowl');
    expect(meal.time).toBe('08:00');
    expect(meal.calories).toBe(175);
    expect(meal.protein).toBe(20);
    expect(meal.items).toEqual(yogurtBowl);
  });

  it('applySavedMeal honours an explicit time override', () => {
    const id = useAppStore.getState().addSavedMeal({
      name: 'Lunch',
      defaultTime: '12:00',
      items: yogurtBowl,
    });
    useAppStore.getState().applySavedMeal('2026-05-08', id, { time: '13:30' });
    const log = useAppStore.getState().calorieLogs.find((l) => l.date === '2026-05-08')!;
    expect(log.meals[0].time).toBe('13:30');
  });

  it('applySavedMeal silently no-ops when the template id is unknown', () => {
    useAppStore.getState().applySavedMeal('2026-05-08', 'nope');
    expect(useAppStore.getState().calorieLogs).toEqual([]);
  });
});

describe('<SavedMealsBar />', () => {
  beforeEach(() => {
    useAppStore.setState({
      savedMeals: [],
      calorieLogs: [],
    });
  });

  afterEach(() => cleanup());

  it('renders a friendly empty state when no templates exist', () => {
    render(<SavedMealsBar selectedDate="2026-05-08" />);
    expect(screen.getByText(/Stash your first regular meal/i)).toBeInTheDocument();
  });

  it('renders one chip per saved meal with derived totals and adds it on tap', () => {
    useAppStore.getState().addSavedMeal({
      name: 'Yogurt Bowl',
      defaultTime: '08:00',
      items: yogurtBowl,
    });
    render(<SavedMealsBar selectedDate="2026-05-08" />);
    const chip = screen.getByRole('button', {
      name: /Add Yogurt Bowl to 2026-05-08/i,
    });
    expect(within(chip).getByText('Yogurt Bowl')).toBeInTheDocument();
    expect(within(chip).getByText(/175 cal · 20P · 20C · 0F/)).toBeInTheDocument();
    fireEvent.click(chip);
    const log = useAppStore.getState().calorieLogs.find((l) => l.date === '2026-05-08')!;
    expect(log.meals).toHaveLength(1);
    expect(log.meals[0].name).toBe('Yogurt Bowl');
  });

  it('opens the manager sheet when "Manage" is clicked', () => {
    useAppStore.getState().addSavedMeal({ name: 'A', items: yogurtBowl });
    render(<SavedMealsBar selectedDate="2026-05-08" />);
    fireEvent.click(screen.getByRole('button', { name: /Manage saved meals/i }));
    expect(screen.getByRole('dialog', { name: /manage saved meals/i })).toBeInTheDocument();
  });

  it('orders chips newest-first by createdAt', () => {
    useAppStore.getState().addSavedMeal({ name: 'Older', items: yogurtBowl });
    // Force a later timestamp on the second entry.
    const olderId = useAppStore.getState().savedMeals[0].id;
    useAppStore.setState((s) => ({
      savedMeals: s.savedMeals.map((m) =>
        m.id === olderId ? { ...m, createdAt: 1 } : m,
      ),
    }));
    useAppStore.getState().addSavedMeal({ name: 'Newer', items: yogurtBowl });
    render(<SavedMealsBar selectedDate="2026-05-08" />);
    const chips = screen.getAllByRole('button', { name: /Add .* to 2026-05-08/i });
    expect(chips[0]).toHaveAttribute('aria-label', expect.stringContaining('Newer'));
    expect(chips[1]).toHaveAttribute('aria-label', expect.stringContaining('Older'));
  });
});
