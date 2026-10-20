import type { MealLog } from '../../../types/requests.types';
import type { Macros } from '../types';

export type MenuImportStatusLog = Pick<MealLog, 'adherence_status' | 'date' | 'origin' | 'source'>;

export type MenuImportMealState = 'planned' | 'assumed_eaten' | 'skipped' | 'not_imported';

export type MealSaveProvenance = Pick<MealLog, 'adherence_status' | 'origin' | 'source'>;

export type DailyMealMacroLog = Pick<MealLog, 'kcal' | 'protein_g' | 'carbs_g' | 'fats_g'>;

const isImportedMenuLog = (log: MenuImportStatusLog): boolean =>
  log.source === 'menu_import_v1' && log.origin === 'imported' && log.adherence_status !== 'extra_meal';

export const getDailyMealMacros = (log: DailyMealMacroLog): Macros => ({
  kcal: log.kcal || 0,
  protein_g: log.protein_g || 0,
  carbs_g: log.carbs_g || 0,
  fats_g: log.fats_g || 0,
});

export const addDailyMealMacrosToTotals = (totals: Macros, log: DailyMealMacroLog): void => {
  const macros = getDailyMealMacros(log);
  totals.kcal += macros.kcal;
  totals.protein_g += macros.protein_g;
  totals.carbs_g += macros.carbs_g;
  totals.fats_g += macros.fats_g;
};

export const shouldCountMealMacros = (log: MenuImportStatusLog, currentNutritionDate: string): boolean => {
  if (log.adherence_status === 'skipped') return false;
  return getMenuImportMealState(log, currentNutritionDate) !== 'planned';
};

export const getMenuImportMealState = (log: MenuImportStatusLog, currentNutritionDate: string): MenuImportMealState => {
  if (!isImportedMenuLog(log)) return 'not_imported';
  if (log.adherence_status === 'skipped') return 'skipped';
  if (log.adherence_status === 'done_as_planned' || log.adherence_status === 'done_with_changes') {
    return 'assumed_eaten';
  }
  return log.date >= currentNutritionDate ? 'planned' : 'assumed_eaten';
};

export const getMealSaveProvenance = (log: MenuImportStatusLog): MealSaveProvenance => ({
  source: log.source,
  origin: log.origin,
  adherence_status: log.adherence_status,
});
