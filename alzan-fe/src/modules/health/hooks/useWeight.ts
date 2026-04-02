import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { weightApi } from '../services/weightApi';
import { bodyCompositionService } from '../services/bodyCompositionService';

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

      // Check if weight already exists for this day
      const targetDate = log.measured_at ? new Date(log.measured_at) : new Date();
      const exists = await weightApi.checkExistsForDay(userId, targetDate);
      if (exists) {
        const error = new Error('DUPLICATE_DAY') as Error & { type: string };
        error.type = 'DUPLICATE_DAY';
        throw error;
      }

      const result = await weightApi.addLog({
        user_id: userId,
        measured_at: new Date().toISOString(),
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
