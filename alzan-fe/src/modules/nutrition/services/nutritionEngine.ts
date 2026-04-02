import {
  searchFoodsByName,
  getFoodNutritionById,
  getMealNutritionFromIngredients,
  MealIngredientInput,
} from '../../../services/nutritionApi';

import { Macros } from '../types';

export const nutritionEngine = {
  /**
   * Search for foods (wrapper around OFF V2)
   */
  async searchFoods(query: string) {
    return searchFoodsByName(query);
  },

  /**
   * Get details by ID/Barcode
   */
  async fetchById(id: string) {
    return getFoodNutritionById(id);
  },

  /**
   * Estimate macros from ingredients (name + grams)
   */
  async estimateFromIngredients(ingredients: MealIngredientInput[]) {
    return getMealNutritionFromIngredients(ingredients);
  },

  /**
   * Normalize macros to ensure safe numbers
   */
  normalizeMacros(macros?: Partial<Macros>): Macros {
    return {
      kcal: Math.round(Number(macros?.kcal || 0)),
      protein_g: Number((macros?.protein_g || 0).toFixed(1)),
      carbs_g: Number((macros?.carbs_g || 0).toFixed(1)),
      fats_g: Number((macros?.fats_g || 0).toFixed(1)),
    };
  },
};
