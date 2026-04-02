export type ExerciseLoadType = 'bodyweight' | 'external' | 'assisted' | 'mixed';
export type ExerciseProgressMetric = 'weight' | 'reps' | 'time';
export type WeightQuality = 'valid' | 'missing' | 'invalid';
export type WeightFlag =
  | 'zero_valid_mixed'
  | 'zero_suspect_external'
  | 'zero_suspect_assisted'
  | 'zero_irrelevant_bodyweight'
  | 'negative_invalid'
  | 'empty';

export type ProgressOutlierPoint = {
  sessionId: string;
  maxWeightKg: number;
  maxReps: number;
};

export function normalizeExerciseLoadType(loadType: string | null | undefined): ExerciseLoadType | null {
  const normalizedLoadType = (loadType ?? '').trim().toLowerCase();

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

export function normalizeWeightByLoadTypeForProgress(
  loadType: ExerciseLoadType | null,
  weightKg: number,
): {
  value: number | null;
  quality: WeightQuality;
  flags: WeightFlag[];
} {
  if (!Number.isFinite(weightKg)) {
    return {
      value: null,
      quality: 'missing',
      flags: ['empty'],
    };
  }

  if (weightKg < 0) {
    return {
      value: null,
      quality: 'invalid',
      flags: ['negative_invalid'],
    };
  }

  if (weightKg === 0) {
    if (loadType === 'mixed') {
      return {
        value: 0,
        quality: 'valid',
        flags: ['zero_valid_mixed'],
      };
    }

    if (loadType === 'external') {
      return {
        value: null,
        quality: 'missing',
        flags: ['zero_suspect_external'],
      };
    }

    if (loadType === 'assisted') {
      return {
        value: null,
        quality: 'missing',
        flags: ['zero_suspect_assisted'],
      };
    }

    if (loadType === 'bodyweight') {
      return {
        value: null,
        quality: 'missing',
        flags: ['zero_irrelevant_bodyweight'],
      };
    }
  }

  return {
    value: weightKg,
    quality: 'valid',
    flags: [],
  };
}

export function collectOutlierSessionIdsForProgress(
  points: ProgressOutlierPoint[],
  metric: ExerciseProgressMetric,
): Set<ProgressOutlierPoint['sessionId']> {
  if (points.length < 3 || metric === 'time') {
    return new Set();
  }

  const metricValue = (point: ProgressOutlierPoint) => (metric === 'reps' ? point.maxReps : point.maxWeightKg);
  const positivePoints = points.filter(point => metricValue(point) > 0);

  if (positivePoints.length < 3) {
    return new Set();
  }

  const values = positivePoints.map(point => metricValue(point));
  const sortedValues = [...values].sort((left, right) => left - right);

  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const deviations = sortedValues.map(value => Math.abs(value - median)).sort((left, right) => left - right);
  const mad = deviations[Math.floor(deviations.length / 2)];
  const robustDivisor = mad > 0 ? mad : 0;

  const suspiciousSessionIds = new Set<string>();

  if (robustDivisor > 0) {
    positivePoints.forEach(point => {
      const value = metricValue(point);
      const robustZ = (0.6745 * (value - median)) / robustDivisor;

      if (Math.abs(robustZ) > 3.5) {
        suspiciousSessionIds.add(point.sessionId);
      }
    });
  }

  let previousPositiveValue: number | null = null;
  positivePoints.forEach(point => {
    const value = metricValue(point);

    if (previousPositiveValue !== null) {
      const ratio = Math.max(value, previousPositiveValue) / Math.max(Math.min(value, previousPositiveValue), 0.0001);
      if (ratio >= 2.5) {
        suspiciousSessionIds.add(point.sessionId);
      }
    }

    previousPositiveValue = value;
  });

  return suspiciousSessionIds;
}
