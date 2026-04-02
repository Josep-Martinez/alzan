import { DietTemplateMeal, MealLog, MealType } from '../../../types/requests.types';

// Helper types
export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

export type FoodItem = {
  name: string;
  brand?: string;
  servingSize?: string;
  macros: Macros; // per serving or 100g depending on context, normalized
  source: 'api' | 'manual' | 'custom';
  barcode?: string;
};

export type AdherenceStatus = 'done_as_planned' | 'done_with_changes' | 'skipped' | 'extra_meal';

export type DailyMealItem = {
  // Linking info - Useful to have direct objects
  templateMeal?: DietTemplateMeal;
  log?: MealLog;

  // Helpers (can be derived but useful for UI)
  templateMealId?: string;
  logId?: string;

  // Display info
  displayName: string; // Changed from 'name'
  mealType: MealType; // Changed from 'type'
  orderIndex: number;

  // Status
  status: 'pending' | AdherenceStatus;

  // Macros (Actual if logged, Target if pending)
  macros: Macros;
  targetMacros?: Macros; // To show comparison
};

export type WeeklyDietPlan = Record<number, DietTemplateMeal[]>; // 1=Mon, 7=Sun
