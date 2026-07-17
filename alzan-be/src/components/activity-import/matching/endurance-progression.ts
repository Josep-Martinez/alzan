import { EnduranceStepLike } from './endurance-template-match';

export type StepProgressionOverride = {
  progression_key: string;
  week_index: number;
  duration_s?: number | null;
  distance_m?: number | null;
  target_type?: string | null;
  target_min?: number | null;
  target_max?: number | null;
  repetitions?: number | null;
};

const parseDateOnly = (dateStr: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function calculateProgressionWeekIndex(startDateStr: string | null, plannedDateStr: string | null): number {
  if (!startDateStr || !plannedDateStr) return 0;
  const startDate = parseDateOnly(startDateStr);
  const plannedDate = parseDateOnly(plannedDateStr);
  if (!startDate || !plannedDate || plannedDate < startDate) return 0;

  const diffTime = Math.abs(plannedDate.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

const hasFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function normalizeStepProgressions(progressions: StepProgressionOverride[]): StepProgressionOverride[] {
  const normalizedByKey = new Map<string, StepProgressionOverride>();

  progressions.forEach(progression => {
    if (!progression.progression_key || !Number.isInteger(progression.week_index) || progression.week_index < 1) {
      return;
    }

    const normalized: StepProgressionOverride = {
      progression_key: progression.progression_key,
      week_index: progression.week_index,
    };

    if (progression.target_type) normalized.target_type = progression.target_type;
    if (hasFiniteNumber(progression.target_min)) normalized.target_min = progression.target_min;
    if (hasFiniteNumber(progression.target_max)) normalized.target_max = progression.target_max;
    if (hasFiniteNumber(progression.duration_s))
      normalized.duration_s = Math.max(0, Math.round(progression.duration_s));
    if (hasFiniteNumber(progression.distance_m))
      normalized.distance_m = Math.max(0, Math.round(progression.distance_m));
    if (hasFiniteNumber(progression.repetitions)) {
      normalized.repetitions = Math.max(1, Math.round(progression.repetitions));
    }

    const hasOverrideValue =
      hasFiniteNumber(normalized.target_min) ||
      hasFiniteNumber(normalized.target_max) ||
      hasFiniteNumber(normalized.duration_s) ||
      hasFiniteNumber(normalized.distance_m) ||
      hasFiniteNumber(normalized.repetitions);

    if (!hasOverrideValue) return;

    normalizedByKey.set(`${normalized.progression_key}:${normalized.week_index}`, normalized);
  });

  return Array.from(normalizedByKey.values()).sort((a, b) => {
    if (a.progression_key === b.progression_key) return a.week_index - b.week_index;
    return a.progression_key.localeCompare(b.progression_key);
  });
}

function applyProgressionToStep(
  step: EnduranceStepLike,
  progression: StepProgressionOverride | undefined,
): EnduranceStepLike {
  if (!progression) return step;

  return {
    ...step,
    durationS: progression.duration_s ?? step.durationS,
    distanceM: progression.distance_m ?? step.distanceM,
    targetType: (progression.target_type as EnduranceStepLike['targetType']) ?? step.targetType,
    targetMin: progression.target_min ?? step.targetMin,
    targetMax: progression.target_max ?? step.targetMax,
    repetitions: progression.repetitions ?? step.repetitions,
  };
}

export function applyProgressionsToSteps(
  steps: EnduranceStepLike[],
  weekIndex: number,
  progressions: StepProgressionOverride[],
): EnduranceStepLike[] {
  const normalized = normalizeStepProgressions(progressions);
  const progressionByStep = new Map(
    normalized
      .filter(progression => progression.week_index === weekIndex)
      .map(progression => [progression.progression_key, progression] as const),
  );

  return steps.map(step => applyProgressionToStep(step, progressionByStep.get(step.progressionKey ?? '')));
}
