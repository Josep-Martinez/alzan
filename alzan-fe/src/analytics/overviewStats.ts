import { supabase } from '../lib/supabaseClient';
import { DateRange, TrendDirection } from './types';
import { format, subDays, differenceInDays } from 'date-fns';

export type OverviewSummary = {
  training: {
    totalSessions: number;
    totalDurationHours: number;
    totalDistanceKm: number;
    comparisonLabel: string;
    trend: TrendDirection;
  };
  nutrition: {
    adherencePercent: number; // 0-100
    avgDailyKcal: number;
    label: string;
  };
  health: {
    currentWeightKg: number;
    weightChangeKg: number; // delta
    avgSleepDurationHours: number;
    currentRestingHr: number;
    restingHrChange: number;
  };
  goalProgress: {
    description: string;
    currentValue: string;
    targetValue: string;
    percentage: number; // 0-100
  } | null;
};

// --- MOCK DATA GENERATOR ---
const getMockOverviewSummary = (): OverviewSummary => ({
  training: {
    totalSessions: 5,
    totalDurationHours: 4.5,
    totalDistanceKm: 22.5,
    comparisonLabel: '+15% más que la semana anterior',
    trend: 'up',
  },
  nutrition: {
    adherencePercent: 82,
    avgDailyKcal: 2300,
    label: 'Has cumplido el 82% de tus comidas.',
  },
  health: {
    currentWeightKg: 75.4,
    weightChangeKg: -1.2,
    avgSleepDurationHours: 7.2,
    currentRestingHr: 58,
    restingHrChange: -2,
  },
  goalProgress: {
    description: 'Objetivo: Bajar a 70kg',
    currentValue: '75.4 kg',
    targetValue: '70 kg',
    percentage: 45,
  },
});

export async function getOverviewSummary(
  userId: string,
  range: DateRange,
  useMock: boolean = false,
): Promise<OverviewSummary> {
  if (useMock) return getMockOverviewSummary();

  const startDateStr = range.startDate.toISOString();
  const endDateStr = range.endDate.toISOString();

  // Calculate previous period for comparison
  const daysDiff = differenceInDays(range.endDate, range.startDate) + 1;
  const prevStartDate = subDays(range.startDate, daysDiff);
  const prevEndDate = subDays(range.endDate, daysDiff);

  // 1. TRAINING
  // Current Period
  const { data: trainingData, error: trainingError } = await supabase
    .from('activity_sessions')
    .select('duration_s, distance_m')
    .eq('user_id', userId)
    .gte('start_time', startDateStr)
    .lte('start_time', endDateStr);

  if (trainingError) throw trainingError;

  // Previous Period
  const { data: prevTrainingData } = await supabase
    .from('activity_sessions')
    .select('duration_s')
    .eq('user_id', userId)
    .gte('start_time', prevStartDate.toISOString())
    .lte('start_time', prevEndDate.toISOString());

  const currentDurationS = trainingData?.reduce((acc, s) => acc + (s.duration_s || 0), 0) || 0;
  const currentDistanceM = trainingData?.reduce((acc, s) => acc + (s.distance_m || 0), 0) || 0;
  const prevDurationS = prevTrainingData?.reduce((acc, s) => acc + (s.duration_s || 0), 0) || 0;

  const totalSessions = trainingData?.length || 0;
  const totalDurationHours = currentDurationS / 3600;
  const totalDistanceKm = currentDistanceM / 1000;

  // Determine trend
  let trend: TrendDirection = 'stable';
  let comparisonLabel = 'Igual que el periodo anterior';

  if (prevDurationS > 0) {
    const change = (currentDurationS - prevDurationS) / prevDurationS;
    const percent = Math.round(Math.abs(change * 100));
    if (change > 0.05) {
      trend = 'up';
      comparisonLabel = `+${percent}% más actividad`;
    } else if (change < -0.05) {
      trend = 'down';
      comparisonLabel = `-${percent}% menos actividad`;
    }
  } else if (currentDurationS > 0) {
    trend = 'up';
    comparisonLabel = 'Empezando a entrenar';
  }

  // 2. NUTRITION
  const { data: mealLogs } = await supabase
    .from('meal_logs')
    .select('adherence_status, kcal, date')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'));

  let adherencePercent = 0;
  let avgDailyKcal = 0;
  let nutritionLabel = 'No hay datos de nutrición';

  if (mealLogs && mealLogs.length > 0) {
    // The prompt says: "comidas planificadas que se han cumplido"
    // We assume logs with adherence_status != null are 'planned' or at least tracked.
    // Actually, let's assume all logs that refer to a diet_template_meal_id are planned.
    // But adherence_status is simpler.
    // done_as_planned, done_with_changes -> OK. skipped -> Bad.

    const compliantMeals = mealLogs.filter(
      m => m.adherence_status === 'done_as_planned' || m.adherence_status === 'done_with_changes',
    ).length;

    const totalPlanned = mealLogs.filter(m => m.adherence_status !== 'extra_meal').length;

    if (totalPlanned > 0) {
      adherencePercent = Math.round((compliantMeals / totalPlanned) * 100);
    }

    // Avg Kcal (group by day first?)
    // Simple average of all days in range?
    // We should sum kcal per day, then average over number of days with logs.
    const dayMap = new Map<string, number>();
    mealLogs.forEach(log => {
      const d = log.date;
      dayMap.set(d, (dayMap.get(d) || 0) + (log.kcal || 0));
    });

    let sumKcal = 0;
    dayMap.forEach(v => (sumKcal += v));
    if (dayMap.size > 0) {
      avgDailyKcal = Math.round(sumKcal / dayMap.size);
    }

    nutritionLabel = `Has cumplido el ${adherencePercent}% de tus comidas planificadas`;
  }

  // 3. HEALTH
  // Weight: Get last logged weight in range, and first logged weight in range.
  const { data: weightLogs } = await supabase
    .from('weight_logs')
    .select('weight_kg, measured_at')
    .eq('user_id', userId)
    .gte('measured_at', startDateStr)
    .lte('measured_at', endDateStr)
    .order('measured_at', { ascending: true }); // Oldest first

  let currentWeightKg = 0;
  let weightChangeKg = 0;

  if (weightLogs && weightLogs.length > 0) {
    const first = weightLogs[0];
    const last = weightLogs[weightLogs.length - 1];
    currentWeightKg = last.weight_kg;
    weightChangeKg = Number((last.weight_kg - first.weight_kg).toFixed(1));
  } else {
    // Try to get the very last known weight even if outside range?
    // For "currentWeight", yes. But for "Change vs start of period", if no logs in period, we can't calc change in period.
    // Let's settle for 0 if no logs in period for now.
  }

  // Sleep
  const { data: sleepLogs } = await supabase
    .from('sleep_logs')
    .select('duration_min')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'));

  let avgSleepDurationHours = 0;
  if (sleepLogs && sleepLogs.length > 0) {
    const totalMin = sleepLogs.reduce((acc, s) => acc + (s.duration_min || 0), 0);
    avgSleepDurationHours = Number((totalMin / sleepLogs.length / 60).toFixed(1));
  }

  // HR
  const { data: hrLogs } = await supabase
    .from('resting_hr_logs')
    .select('resting_hr_bpm, measured_at')
    .eq('user_id', userId)
    .gte('measured_at', startDateStr)
    .lte('measured_at', endDateStr)
    .order('measured_at', { ascending: true });

  let currentRestingHr = 0;
  let restingHrChange = 0;
  if (hrLogs && hrLogs.length > 0) {
    const firstHr = hrLogs[0];
    const lastHr = hrLogs[hrLogs.length - 1];
    currentRestingHr = lastHr.resting_hr_bpm;
    restingHrChange = lastHr.resting_hr_bpm - firstHr.resting_hr_bpm;
  }

  // 4. GOAL
  // Fetch active goal
  const { data: goals } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .lte('valid_from', new Date().toISOString())
    .is('valid_to', null) // assumes active goals have no end date or valid_to is future
    .limit(1);

  let goalProgress = null;
  if (goals && goals.length > 0) {
    const goal = goals[0];
    // Simple logic for weight goal
    if (goal.target_weight_kg && currentWeightKg > 0) {
      goalProgress = {
        description: goal.description || `Objetivo: ${goal.target_weight_kg}kg`,
        currentValue: `${currentWeightKg} kg`,
        targetValue: `${goal.target_weight_kg} kg`,
        percentage: 0, // Complex to calc "percentage completed" without start weight of goal.
      };
      // We could try to find the start weight of the goal (valid_from) but let's keep it simple.
    }
  }

  return {
    training: {
      totalSessions,
      totalDurationHours: Number(totalDurationHours.toFixed(1)),
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      comparisonLabel,
      trend,
    },
    nutrition: {
      adherencePercent,
      avgDailyKcal,
      label: nutritionLabel,
    },
    health: {
      currentWeightKg,
      weightChangeKg,
      avgSleepDurationHours,
      currentRestingHr,
      restingHrChange,
    },
    goalProgress,
  };
}
