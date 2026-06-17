import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { weightApi } from '../services/weightApi';
import { bodyCompositionService } from '../services/bodyCompositionService';
import { calculateBodyComposition } from '../algorithms/bodyComposition';

export const useWeightLogs = (limit = 100) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weightLogs', user?.id, limit],
    queryFn: () => weightApi.getLogs(user!.id, limit),
    enabled: !!user?.id,
  });
};

export const useAddWeightLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: {
      weight_kg: number;
      bodyfat_percent?: number;
      muscle_mass_kg?: number;
      measured_at?: string;
    }) => {
      let userId = user?.id;

      if (!userId) {
        // Fallback: Check Supabase session directly
        const { data } = await import('../../../lib/supabaseClient').then(m => m.supabase.auth.getSession());
        userId = data.session?.user?.id;
      }

      if (!userId) throw new Error('No hay usuario autenticado');

      const targetDate = log.measured_at ? new Date(log.measured_at) : new Date();
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString();
      const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate() + 1,
      ).toISOString();

      // Check if a weight log already exists for this day
      const { data: existingLogs } = await import('../../../lib/supabaseClient').then(m =>
        m.supabase
          .from('weight_logs')
          .select('id, weight_kg, bodyfat_percent, muscle_mass_kg')
          .eq('user_id', userId)
          .gte('measured_at', startOfDay)
          .lt('measured_at', endOfDay)
          .order('measured_at', { ascending: false })
          .limit(1),
      );

      const existingLog = existingLogs?.[0];

      if (existingLog) {
        // Overwrite the existing weight log for this day if any values change
        const updatedWeight = log.weight_kg;
        const profile = await bodyCompositionService.getUserProfile(userId);
        let calculatedBF: number | undefined = log.bodyfat_percent;
        let calculatedMuscle: number | undefined = log.muscle_mass_kg;

        if (profile && profile.height_cm) {
          const measurements = await bodyCompositionService.getAllLatestMeasurements(userId);
          const age = bodyCompositionService.calculateAge(profile.date_of_birth);
          const sex = (profile.sex as 'male' | 'female') || 'male';

          const compResult = calculateBodyComposition({
            weightKg: updatedWeight,
            heightCm: profile.height_cm,
            age,
            sex,
            measurements: {
              abdomen: measurements.abdomen,
              hips: measurements.hips,
              chest: measurements.chest,
              arm: measurements.arm,
              thigh: measurements.thigh,
            },
          });

          if (compResult.bodyFat) {
            calculatedBF = compResult.bodyFat.percentage;
            calculatedMuscle = compResult.muscle?.massKg;
          }
        }

        const currentWeight = existingLog.weight_kg;
        const currentBF = existingLog.bodyfat_percent || 0;
        const newBF = calculatedBF || 0;
        const currentMuscle = existingLog.muscle_mass_kg || 0;
        const newMuscle = calculatedMuscle || 0;

        const weightDiff = Math.abs(updatedWeight - currentWeight);
        const bfDiff = Math.abs(newBF - currentBF);
        const muscleDiff = Math.abs(newMuscle - currentMuscle);

        if (weightDiff >= 0.05 || bfDiff >= 0.1 || muscleDiff >= 0.1) {
          console.log('[useAddWeightLog] Overwriting same-day weight record:', existingLog.id);
          const result = await weightApi.updateLog(existingLog.id, {
            weight_kg: updatedWeight,
            bodyfat_percent: calculatedBF ?? null,
            muscle_mass_kg: calculatedMuscle ?? null,
          });
          return result;
        }

        return existingLog;
      }

      // Normal insert if no log exists for the day
      const result = await weightApi.addLog({
        user_id: userId,
        measured_at: targetDate.toISOString(),
        source: 'manual',
        ...log,
      });

      // Auto-calculate body fat if not provided manually
      if (!log.bodyfat_percent && result.id) {
        await bodyCompositionService.recalculateForWeight(userId, result.id, log.weight_kg);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
    },
  });
};

export const useDeleteWeightLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: weightApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
    },
  });
};
