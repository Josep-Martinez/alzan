import { supabase } from '../lib/supabaseClient';
import { DateRange } from './types';
import { format, parseISO, getDay } from 'date-fns';

export type WeeklyAdherenceSummary = {
  percent: number;
  label: string;
};

export type DailyNutritionPoint = {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  targetKcal?: number;
};

export type WeekdayAdherencePoint = {
  dayName: string; // 'Monday', 'Tuesday'... (or translated later)
  dayIndex: number; // 0=Sunday, 1=Monday...
  adherencePercent: number;
};

// --- MOCK ---
export async function getWeeklyDietAdherence(
  userId: string,
  range: DateRange,
  useMock = false,
): Promise<WeeklyAdherenceSummary> {
  if (useMock) return { percent: 85, label: 'Has cumplido el 85% de tu dieta' };

  const { data: logs } = await supabase
    .from('meal_logs')
    .select('adherence_status')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'));

  if (!logs || logs.length === 0) return { percent: 0, label: 'No hay registros' };

  // Filter out extra meals from denominator?
  // Usually adherence = compliance / planned.
  const planned = logs.filter(l => l.adherence_status !== 'extra_meal');
  if (planned.length === 0) return { percent: 0, label: 'No hay comidas planificadas' };

  const compliant = planned.filter(
    l => l.adherence_status === 'done_as_planned' || l.adherence_status === 'done_with_changes',
  ).length;

  const percent = Math.round((compliant / planned.length) * 100);
  return {
    percent,
    label: `Has cumplido el ${percent}% de tu dieta`,
  };
}

export async function getDailyKcalAndMacros(
  userId: string,
  range: DateRange,
  useMock = false,
): Promise<DailyNutritionPoint[]> {
  if (useMock) {
    return [
      { date: '2025-12-01', kcal: 2200, protein: 150, carbs: 250, fats: 70, targetKcal: 2300 },
      { date: '2025-12-02', kcal: 2150, protein: 145, carbs: 240, fats: 65, targetKcal: 2300 },
      { date: '2025-12-03', kcal: 2400, protein: 160, carbs: 280, fats: 80, targetKcal: 2300 },
    ];
  }

  // Get meal logs
  const { data: logs } = await supabase
    .from('meal_logs')
    .select('date, kcal, protein_g, carbs_g, fats_g')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  // Get active diet template target (simplified: get latest)
  const { data: templates } = await supabase
    .from('diet_templates')
    .select('daily_calorie_target_kcal')
    .eq('user_id', userId)
    .limit(1); // Ideally we check validity dates if we had them, but diet_templates doesn't have valid_from/to in schema provided?
  // Schema has created_at/updated_at. We assume the current one is active.
  // Actually for historical accuracy we'd need logs to store target snapshot, or template history.
  // For now, use current target as ref.

  const targetKcal = templates?.[0]?.daily_calorie_target_kcal || undefined;

  const grouped = new Map<string, DailyNutritionPoint>();

  logs?.forEach(log => {
    const d = log.date;
    if (!grouped.has(d)) {
      grouped.set(d, { date: d, kcal: 0, protein: 0, carbs: 0, fats: 0, targetKcal });
    }
    const p = grouped.get(d)!;
    p.kcal += Number(log.kcal) || 0;
    p.protein += Number(log.protein_g) || 0;
    p.carbs += Number(log.carbs_g) || 0;
    p.fats += Number(log.fats_g) || 0;
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAdherenceByWeekday(
  userId: string,
  range: DateRange,
  useMock = false,
): Promise<WeekdayAdherencePoint[]> {
  if (useMock) {
    return [
      { dayName: 'Lunes', dayIndex: 1, adherencePercent: 90 },
      { dayName: 'Martes', dayIndex: 2, adherencePercent: 88 },
      { dayName: 'Miércoles', dayIndex: 3, adherencePercent: 85 },
      { dayName: 'Jueves', dayIndex: 4, adherencePercent: 80 },
      { dayName: 'Viernes', dayIndex: 5, adherencePercent: 70 },
      { dayName: 'Sábado', dayIndex: 6, adherencePercent: 60 },
      { dayName: 'Domingo', dayIndex: 0, adherencePercent: 95 },
    ];
  }

  const { data: logs } = await supabase
    .from('meal_logs')
    .select('date, adherence_status')
    .eq('user_id', userId)
    .gte('date', format(range.startDate, 'yyyy-MM-dd'))
    .lte('date', format(range.endDate, 'yyyy-MM-dd'));

  // Group by day index (0-6)
  const days = new Map<number, { planned: number; compliant: number }>();

  logs?.forEach(log => {
    const date = parseISO(log.date);
    const dayIdx = getDay(date); // 0 = Sunday

    if (log.adherence_status === 'extra_meal') return; // Skip extra

    if (!days.has(dayIdx)) days.set(dayIdx, { planned: 0, compliant: 0 });
    const stat = days.get(dayIdx)!;
    stat.planned += 1;
    if (log.adherence_status === 'done_as_planned' || log.adherence_status === 'done_with_changes') {
      stat.compliant += 1;
    }
  });

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return Array.from(days.entries())
    .map(([dayIndex, stats]) => ({
      dayIndex,
      dayName: dayNames[dayIndex],
      adherencePercent: stats.planned > 0 ? Math.round((stats.compliant / stats.planned) * 100) : 0,
    }))
    .sort((a, b) => {
      // Sort Monday (1) to Sunday (0 -> 7)
      const idxA = a.dayIndex === 0 ? 7 : a.dayIndex;
      const idxB = b.dayIndex === 0 ? 7 : b.dayIndex;
      return idxA - idxB;
    });
}
