import { TranslationKey } from '../../../i18n/locales/en';

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  ALMUERZO: 'almuerzo',
  LUNCH: 'lunch',
  MERIENDA: 'merienda',
  DINNER: 'dinner',
  SNACK: 'snack',
};

// Translating keys for UI Display would handle this,
// but if we want to change UI Text, better to have a map.
export const MEAL_TYPE_LABELS: Record<string, TranslationKey> = {
  breakfast: 'settings.breakfast',
  almuerzo: 'settings.almuerzo',
  lunch: 'settings.lunch',
  merienda: 'settings.merienda',
  dinner: 'settings.dinner',
  snack: 'settings.snack',
};

export const MEAL_TYPE_ORDER: Record<string, number> = {
  breakfast: 1,
  almuerzo: 2,
  lunch: 3,
  merienda: 4,
  dinner: 5,
  snack: 6,
};

export const DAYS_OF_WEEK = [
  { id: 1, key: 'mon', label: 'Lunes' }, // Spanish
  { id: 2, key: 'tue', label: 'Martes' },
  { id: 3, key: 'wed', label: 'Miércoles' },
  { id: 4, key: 'thu', label: 'Jueves' },
  { id: 5, key: 'fri', label: 'Viernes' },
  { id: 6, key: 'sat', label: 'Sábado' },
  { id: 7, key: 'sun', label: 'Domingo' },
];

export const DEFAULT_MACROS = {
  kcal: 2000,
  protein_g: 150,
  carbs_g: 200,
  fats_g: 65,
};
