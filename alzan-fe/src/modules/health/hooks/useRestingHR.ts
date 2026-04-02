import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { hrApi } from '../services/hrApi';

export const useRestingHRLogs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['restingHRLogs', user?.id],
    queryFn: () => hrApi.getLogs(user!.id),
    enabled: !!user?.id,
  });
};

export const useAddRestingHRLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { resting_hr_bpm: number; measured_at?: string }) =>
      hrApi.addLog({
        user_id: user!.id,
        measured_at: new Date().toISOString(),
        source: 'manual',
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restingHRLogs'] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
    },
  });
};

export const useDeleteRestingHRLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restingHRLogs'] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
    },
  });
};
