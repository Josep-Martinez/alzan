import i18n, { getValidLocale, Locale } from '../i18n';

export interface LocalizedRecipeFields {
  name_es: string;
  name_en: string | null;
  description_es: string | null;
  description_en: string | null;
}

export interface LocalizedIngredientFields {
  name_es: string;
  name_en: string | null;
  notes_es?: string | null;
  notes_en?: string | null;
  notes?: string | null;
}

export interface LocalizedExerciseFields {
  base_name?: string;
  base_name_es?: string | null;
  base_name_en?: string | null;
  description?: string | null;
  description_es?: string | null;
  description_en?: string | null;
}

export type NormalizedExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseLoadType = 'bodyweight' | 'external' | 'assisted' | 'mixed';
export type ExerciseProgressDisplayMetric = 'weight' | 'reps' | 'time';

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getCurrentAppLocale(): Locale {
  const [languageCode] = i18n.language.split('-');
  return getValidLocale(languageCode);
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, '');
}

export function buildLooseIlikePattern(value: string): string {
  return value
    .trim()
    .replace(/[%_,]+/g, ' ')
    .replace(/\s+/g, '%');
}

export function matchesLoosely(query: string, ...candidates: Array<string | null | undefined>): boolean {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(query);

  if (!normalizedQuery) return true;

  return candidates.some(candidate => {
    const normalizedCandidate = normalizeSearchText(candidate ?? '');
    if (!normalizedCandidate) return false;

    return normalizedCandidate.includes(normalizedQuery) || compactSearchText(candidate ?? '').includes(compactQuery);
  });
}

export function getLocalizedRecipeName(recipe: Pick<LocalizedRecipeFields, 'name_es' | 'name_en'>): string {
  const locale = getCurrentAppLocale();
  const spanishName = normalizeText(recipe.name_es);
  const englishName = normalizeText(recipe.name_en);

  return locale === 'en' ? (englishName ?? spanishName ?? '') : (spanishName ?? englishName ?? '');
}

export function getLocalizedRecipeDescription(
  recipe: Pick<LocalizedRecipeFields, 'description_es' | 'description_en'>,
): string | null {
  const locale = getCurrentAppLocale();
  const spanishDescription = normalizeText(recipe.description_es);
  const englishDescription = normalizeText(recipe.description_en);

  return locale === 'en' ? (englishDescription ?? spanishDescription) : (spanishDescription ?? englishDescription);
}

export function getLocalizedIngredientName(ingredient: Pick<LocalizedIngredientFields, 'name_es' | 'name_en'>): string {
  const locale = getCurrentAppLocale();
  const spanishName = normalizeText(ingredient.name_es);
  const englishName = normalizeText(ingredient.name_en);

  return locale === 'en' ? (englishName ?? spanishName ?? '') : (spanishName ?? englishName ?? '');
}

export function getLocalizedIngredientNotes(
  ingredient: Pick<LocalizedIngredientFields, 'notes_es' | 'notes_en' | 'notes'>,
): string | null {
  const locale = getCurrentAppLocale();
  const spanishNotes = normalizeText(ingredient.notes_es);
  const englishNotes = normalizeText(ingredient.notes_en);
  const legacyNotes = normalizeText(ingredient.notes);

  return locale === 'en'
    ? (englishNotes ?? spanishNotes ?? legacyNotes)
    : (spanishNotes ?? englishNotes ?? legacyNotes);
}

export function getLocalizedExerciseName(
  exercise: Pick<LocalizedExerciseFields, 'base_name' | 'base_name_es' | 'base_name_en'>,
): string {
  const locale = getCurrentAppLocale();
  const legacyName = normalizeText(exercise.base_name);
  const spanishName = normalizeText(exercise.base_name_es);
  const englishName = normalizeText(exercise.base_name_en);

  return locale === 'en'
    ? (englishName ?? spanishName ?? legacyName ?? '')
    : (spanishName ?? englishName ?? legacyName ?? '');
}

export function getLocalizedExerciseDescription(
  exercise: Pick<LocalizedExerciseFields, 'description' | 'description_es' | 'description_en'>,
): string | null {
  const locale = getCurrentAppLocale();
  const legacyDescription = normalizeText(exercise.description);
  const spanishDescription = normalizeText(exercise.description_es);
  const englishDescription = normalizeText(exercise.description_en);

  return locale === 'en'
    ? (englishDescription ?? spanishDescription ?? legacyDescription)
    : (spanishDescription ?? englishDescription ?? legacyDescription);
}

export function normalizeExerciseDifficulty(
  difficulty: string | null | undefined,
): NormalizedExerciseDifficulty | null {
  const normalizedDifficulty = normalizeSearchText(difficulty ?? '');

  switch (normalizedDifficulty) {
    case 'beginner':
    case 'principiante':
      return 'beginner';
    case 'intermediate':
    case 'intermedio':
      return 'intermediate';
    case 'advanced':
    case 'avanzado':
      return 'advanced';
    default:
      return null;
  }
}

export function isTimeBasedExerciseType(exerciseTypeCode: string | null | undefined): boolean {
  const normalizedExerciseType = normalizeSearchText(exerciseTypeCode ?? '');
  return ['tiempo', 'time', 'duration', 'duracion'].includes(normalizedExerciseType);
}

export function normalizeExerciseLoadType(loadType: string | null | undefined): ExerciseLoadType | null {
  const normalizedLoadType = normalizeSearchText(loadType ?? '');

  switch (normalizedLoadType) {
    case 'bodyweight':
      return 'bodyweight';
    case 'external':
      return 'external';
    case 'assisted':
      return 'assisted';
    case 'mixed':
      return 'mixed';
    default:
      return null;
  }
}

export function getStrengthExerciseProgressMetric(loadType: ExerciseLoadType | null): 'weight' | 'reps' {
  return loadType === 'bodyweight' ? 'reps' : 'weight';
}
