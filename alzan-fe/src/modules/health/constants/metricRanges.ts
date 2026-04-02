import { MaleOrFemale } from '../../../types/requests.types';

export interface MetricSegment {
  label: string;
  min: number | null;
  max: number | null;
  color: string;
}

export interface MetricRangeConfig {
  key: string;
  title: string;
  subtitle?: string;
  unit: string;
  appliesTo: 'all' | 'sex_and_age';
  paletteNote?: string;
  segments?: MetricSegment[];
  segmentsBySexAndAge?: {
    female: {
      ageMin: number;
      ageMax: number;
      segments: MetricSegment[];
    }[];
    male: {
      ageMin: number;
      ageMax: number;
      segments: MetricSegment[];
    }[];
  };
}

export const METRIC_RANGES: MetricRangeConfig[] = [
  {
    key: 'bmi',
    title: 'IMC',
    unit: '',
    appliesTo: 'all',
    segments: [
      { label: 'Bajo peso', min: null, max: 18.49, color: '#4DA3FF' },
      { label: 'Normal', min: 18.5, max: 24.99, color: '#34C759' },
      { label: 'Sobrepeso', min: 25.0, max: 29.99, color: '#FF9500' },
      { label: 'Obesidad', min: 30.0, max: null, color: '#FF3B30' },
    ],
  },
  {
    key: 'body_fat_pct',
    title: 'Grasa Corporal',
    unit: '%',
    appliesTo: 'sex_and_age',
    paletteNote: 'En grasa corporal: Normal es el objetivo. Muy bajo también puede ser indeseable (tono morado).',
    segmentsBySexAndAge: {
      female: [
        {
          ageMin: 20,
          ageMax: 39,
          segments: [
            { label: 'Muy bajo', min: null, max: 16.9, color: '#5856D6' },
            { label: 'Bajo', min: 17.0, max: 20.9, color: '#4DA3FF' },
            { label: 'Normal', min: 21.0, max: 32.9, color: '#34C759' },
            { label: 'Alto', min: 33.0, max: 38.9, color: '#FF9500' },
            { label: 'Muy alto', min: 39.0, max: null, color: '#FF3B30' },
          ],
        },
        {
          ageMin: 40,
          ageMax: 59,
          segments: [
            { label: 'Muy bajo', min: null, max: 18.9, color: '#5856D6' },
            { label: 'Bajo', min: 19.0, max: 22.9, color: '#4DA3FF' },
            { label: 'Normal', min: 23.0, max: 33.9, color: '#34C759' },
            { label: 'Alto', min: 34.0, max: 39.9, color: '#FF9500' },
            { label: 'Muy alto', min: 40.0, max: null, color: '#FF3B30' },
          ],
        },
        {
          ageMin: 60,
          ageMax: 79,
          segments: [
            { label: 'Muy bajo', min: null, max: 19.9, color: '#5856D6' },
            { label: 'Bajo', min: 20.0, max: 23.9, color: '#4DA3FF' },
            { label: 'Normal', min: 24.0, max: 35.9, color: '#34C759' },
            { label: 'Alto', min: 36.0, max: 41.9, color: '#FF9500' },
            { label: 'Muy alto', min: 42.0, max: null, color: '#FF3B30' },
          ],
        },
      ],
      male: [
        {
          ageMin: 20,
          ageMax: 39,
          segments: [
            { label: 'Muy bajo', min: null, max: 4.9, color: '#5856D6' },
            { label: 'Bajo', min: 5.0, max: 7.9, color: '#4DA3FF' },
            { label: 'Normal', min: 8.0, max: 19.9, color: '#34C759' },
            { label: 'Alto', min: 20.0, max: 24.9, color: '#FF9500' },
            { label: 'Muy alto', min: 25.0, max: null, color: '#FF3B30' },
          ],
        },
        {
          ageMin: 40,
          ageMax: 59,
          segments: [
            { label: 'Muy bajo', min: null, max: 7.9, color: '#5856D6' },
            { label: 'Bajo', min: 8.0, max: 10.9, color: '#4DA3FF' },
            { label: 'Normal', min: 11.0, max: 21.9, color: '#34C759' },
            { label: 'Alto', min: 22.0, max: 27.9, color: '#FF9500' },
            { label: 'Muy alto', min: 28.0, max: null, color: '#FF3B30' },
          ],
        },
        {
          ageMin: 60,
          ageMax: 79,
          segments: [
            { label: 'Muy bajo', min: null, max: 9.9, color: '#5856D6' },
            { label: 'Bajo', min: 10.0, max: 12.9, color: '#4DA3FF' },
            { label: 'Normal', min: 13.0, max: 24.9, color: '#34C759' },
            { label: 'Alto', min: 25.0, max: 29.9, color: '#FF9500' },
            { label: 'Muy alto', min: 30.0, max: null, color: '#FF3B30' },
          ],
        },
      ],
    },
  },
  {
    key: 'skeletal_muscle_pct',
    title: 'Masa Muscular',
    subtitle: 'Músculo esquelético',
    unit: '%',
    appliesTo: 'sex_and_age',
    paletteNote: 'En músculo esquelético: Alto/Muy alto es mejor (azul/morado). Muy bajo es peor (rojo oscuro).',
    segmentsBySexAndAge: {
      female: [
        {
          ageMin: 18,
          ageMax: 39,
          segments: [
            { label: 'Muy bajo', min: null, max: 22.0, color: '#B00020' },
            { label: 'Bajo', min: 22.1, max: 24.2, color: '#FF3B30' },
            { label: 'Normal', min: 24.3, max: 30.3, color: '#34C759' },
            { label: 'Alto', min: 30.4, max: 35.3, color: '#0A84FF' },
            { label: 'Muy alto', min: 35.4, max: null, color: '#5856D6' },
          ],
        },
        {
          ageMin: 40,
          ageMax: 59,
          segments: [
            { label: 'Muy bajo', min: null, max: 21.8, color: '#B00020' },
            { label: 'Bajo', min: 21.9, max: 24.0, color: '#FF3B30' },
            { label: 'Normal', min: 24.1, max: 30.1, color: '#34C759' },
            { label: 'Alto', min: 30.2, max: 35.1, color: '#0A84FF' },
            { label: 'Muy alto', min: 35.2, max: null, color: '#5856D6' },
          ],
        },
        {
          ageMin: 60,
          ageMax: 80,
          segments: [
            { label: 'Muy bajo', min: null, max: 21.6, color: '#B00020' },
            { label: 'Bajo', min: 21.7, max: 23.8, color: '#FF3B30' },
            { label: 'Normal', min: 23.9, max: 29.9, color: '#34C759' },
            { label: 'Alto', min: 30.0, max: 34.9, color: '#0A84FF' },
            { label: 'Muy alto', min: 35.0, max: null, color: '#5856D6' },
          ],
        },
      ],
      male: [
        {
          ageMin: 18,
          ageMax: 39,
          segments: [
            { label: 'Muy bajo', min: null, max: 31.0, color: '#B00020' },
            { label: 'Bajo', min: 31.1, max: 33.2, color: '#FF3B30' },
            { label: 'Normal', min: 33.3, max: 39.3, color: '#34C759' },
            { label: 'Alto', min: 39.4, max: 44.0, color: '#0A84FF' },
            { label: 'Muy alto', min: 44.1, max: null, color: '#5856D6' },
          ],
        },
        {
          ageMin: 40,
          ageMax: 59,
          segments: [
            { label: 'Muy bajo', min: null, max: 30.8, color: '#B00020' },
            { label: 'Bajo', min: 30.9, max: 33.0, color: '#FF3B30' },
            { label: 'Normal', min: 33.1, max: 39.1, color: '#34C759' },
            { label: 'Alto', min: 39.2, max: 43.8, color: '#0A84FF' },
            { label: 'Muy alto', min: 43.9, max: null, color: '#5856D6' },
          ],
        },
        {
          ageMin: 60,
          ageMax: 80,
          segments: [
            { label: 'Muy bajo', min: null, max: 30.6, color: '#B00020' },
            { label: 'Bajo', min: 30.7, max: 32.8, color: '#FF3B30' },
            { label: 'Normal', min: 32.9, max: 38.9, color: '#34C759' },
            { label: 'Alto', min: 39.0, max: 43.6, color: '#0A84FF' },
            { label: 'Muy alto', min: 43.7, max: null, color: '#5856D6' },
          ],
        },
      ],
    },
  },
];

export const getSegmentsForMetric = (metricKey: string, sex: MaleOrFemale, age: number): MetricSegment[] | null => {
  const config = METRIC_RANGES.find(m => m.key === metricKey);
  if (!config) return null;

  if (config.appliesTo === 'all') {
    return config.segments || null;
  }

  if (config.appliesTo === 'sex_and_age' && config.segmentsBySexAndAge) {
    const ranges = config.segmentsBySexAndAge[sex];
    if (!ranges) return null;

    // Find matching age range
    const matchingRange = ranges.find(r => age >= r.ageMin && age <= r.ageMax);

    // If age is outside ranges (e.g. < 20 or > 80), use closest bound or default
    if (!matchingRange) {
      // Fallback: use first range if too young, last range if too old
      if (age < ranges[0].ageMin) return ranges[0].segments;
      if (age > ranges[ranges.length - 1].ageMax) return ranges[ranges.length - 1].segments;
      return null;
    }

    return matchingRange.segments;
  }

  return null;
};
