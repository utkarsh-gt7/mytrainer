import type { FoodItem } from '@/types';

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Sum the macro/calorie totals across an array of food items. */
export function totalsForItems(items: FoodItem[]): MealTotals {
  return items.reduce<MealTotals>(
    (acc, item) => ({
      calories: acc.calories + (Number.isFinite(item.calories) ? item.calories : 0),
      protein: acc.protein + (Number.isFinite(item.protein) ? item.protein : 0),
      carbs: acc.carbs + (Number.isFinite(item.carbs) ? item.carbs : 0),
      fat: acc.fat + (Number.isFinite(item.fat) ? item.fat : 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
