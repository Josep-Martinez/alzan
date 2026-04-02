import { supabase } from '../lib/supabaseClient';
import { MeasurementType } from '../types/requests.types';
import { DateRange } from './types';
import { format } from 'date-fns';

export type WeightTrendPoint = {
  date: string;
  weightKg: number;
};

export type BodyMeasurementPoint = {
  date: string;
  value: number;
};

export type SleepStatsSummary = {
  avgDurationHours: number;
  goodSleepPercent: number; // >= 7h
  history: { date: string; durationHours: number; quality?: number }[];
};

export type RestingHrTrendSummary = {
  history: { date: string; bpm: number }[];
  startBpm: number;
  endBpm: number;
  trendLabel: string; // "Bajando", "Subiendo"
};

// --- MOCK ---
export async function getWeightTrend(
  userId: string,
  range: DateRange,
  useMock = false,
): Promise<WeightTrendPoint[] & { deltaKg: number }> {
  console.log('[healthStats.getWeightTrend] Iniciando - userId:', userId);
  if (useMock) {
    console.log('[healthStats.getWeightTrend] Usando mock data');
    const mock: WeightTrendPoint[] = [
      { date: '2025-11-20', weightKg: 78.0 },
      { date: '2025-11-25', weightKg: 77.5 },
      { date: '2025-11-30', weightKg: 77.0 },
    ];
    return Object.assign(mock, { deltaKg: -1.0 });
  }

  try {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('measured_at, weight_kg')
      .eq('user_id', userId)
      .gte('measured_at', range.startDate.toISOString())
      .lte('measured_at', range.endDate.toISOString())
      .order('measured_at', { ascending: true });

    if (error) {
      console.error('[healthStats.getWeightTrend] Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[healthStats.getWeightTrend] Sin datos');
      return Object.assign([], { deltaKg: 0 });
    }

    const points = data.map(d => ({
      date: d.measured_at,
      weightKg: d.weight_kg,
    }));

    const first = points[0].weightKg;
    const last = points[points.length - 1].weightKg;
    // @ts-expect-error points.deltaKg is not typed
    points.deltaKg = Number((last - first).toFixed(1));
    console.log('[healthStats.getWeightTrend] Éxito - puntos:', points.length);
    // @ts-expect-error points.deltaKg is not typed
    return points;
  } catch (err) {
    console.error('[healthStats.getWeightTrend] Exception:', err);
    throw err;
  }
}

export async function getBodyMeasurementsTrend(
  userId: string,
  range: DateRange,
  measurementType: MeasurementType,
  useMock = false,
): Promise<BodyMeasurementPoint[]> {
  console.log('[healthStats.getBodyMeasurementsTrend] Iniciando - type:', measurementType);
  if (useMock) {
    console.log('[healthStats.getBodyMeasurementsTrend] Usando mock data');
    return [
      { date: '2025-11-20', value: 95 },
      { date: '2025-12-05', value: 94 },
    ];
  }

  try {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('measured_at, value_cm')
      .eq('user_id', userId)
      .eq('measurement_type', measurementType)
      .gte('measured_at', range.startDate.toISOString())
      .lte('measured_at', range.endDate.toISOString())
      .order('measured_at', { ascending: true });

    if (error) {
      console.error('[healthStats.getBodyMeasurementsTrend] Error:', error);
      throw error;
    }
    console.log('[healthStats.getBodyMeasurementsTrend] Éxito - puntos:', data?.length);
    return (
      data?.map(d => ({
        date: d.measured_at,
        value: Number(d.value_cm),
      })) || []
    );
  } catch (err) {
    console.error('[healthStats.getBodyMeasurementsTrend] Exception:', err);
    throw err;
  }
}

export async function getSleepStats(userId: string, range: DateRange, useMock = false): Promise<SleepStatsSummary> {
  if (useMock) {
    return {
      avgDurationHours: 7.1,
      goodSleepPercent: 60,
      history: [
        { date: '2025-12-01', durationHours: 6.5 },
        { date: '2025-12-02', durationHours: 7.5 },
      ],
    };
  }

  const { data } = await supabase
    .from('sleep_logs')
    .select('date, duration_min, quality_score')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  if (!data || data.length === 0) {
    return { avgDurationHours: 0, goodSleepPercent: 0, history: [] };
  }

  const totalMin = data.reduce((acc, l) => acc + (l.duration_min || 0), 0);
  const avgDurationHours = Number((totalMin / data.length / 60).toFixed(1));

  const goodSleepCount = data.filter(l => (l.duration_min || 0) >= 7 * 60).length;
  const goodSleepPercent = Math.round((goodSleepCount / data.length) * 100);

  const history = data.map(d => ({
    date: d.date,
    durationHours: Number(((d.duration_min || 0) / 60).toFixed(1)),
    quality: d.quality_score || undefined,
  }));

  return { avgDurationHours, goodSleepPercent, history };
}

export async function getRestingHrTrend(
  userId: string,
  range: DateRange,
  useMock = false,
): Promise<RestingHrTrendSummary> {
  if (useMock) {
    return {
      history: [
        { date: '2025-12-01', bpm: 60 },
        { date: '2025-12-05', bpm: 58 },
      ],
      startBpm: 60,
      endBpm: 58,
      trendLabel: 'Bajando',
    };
  }

  const { data } = await supabase
    .from('resting_hr_logs')
    .select('measured_at, resting_hr_bpm')
    .eq('user_id', userId)
    .gte('measured_at', range.startDate.toISOString())
    .lte('measured_at', range.endDate.toISOString())
    .order('measured_at', { ascending: true });

  if (!data || data.length === 0) {
    return { history: [], startBpm: 0, endBpm: 0, trendLabel: 'Sin datos' };
  }

  const history = data.map(d => ({ date: d.measured_at, bpm: d.resting_hr_bpm }));
  const startBpm = history[0].bpm;
  const endBpm = history[history.length - 1].bpm;

  let trendLabel = 'Estable';
  if (endBpm < startBpm - 2) trendLabel = 'Bajando';
  else if (endBpm > startBpm + 2) trendLabel = 'Subiendo';

  return { history, startBpm, endBpm, trendLabel };
}
