// src/modules/nutrition/types/db.ts
// Database types matching Supabase schema

import { MealItemsSource } from '../../../types/requests.types';

// Helper types for UI
// Helper types for UI
export interface IngredientInput {
  name: string;
  quantity_g: number;
  source: MealItemsSource;
  source_ref?: string;

  // Flattened macros matching DbIngredient / MealComponent
  kcal_100?: number | null;
  protein_g_100?: number | null;
  carbs_g_100?: number | null;
  fat_g_100?: number | null;
}
