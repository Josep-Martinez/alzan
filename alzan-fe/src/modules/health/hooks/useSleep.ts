import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { sleepApi } from '../services/sleepApi';

export const useSleepLogs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sleepLogs', user?.id],
    queryFn: () => sleepApi.getLogs(user!.id),
    enabled: !!user?.id,
  });
};

export const useAddSleepLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: {
      date: string;
      duration_min: number;
      quality_score?: number;
      sleep_start?: string;
      sleep_end?: string;
    }) =>
      sleepApi.addLog({
        user_id: user!.id,
        source: 'manual',
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
      queryClient.invalidateQueries({ queryKey: ['healthInsights'] });
    },
  });
};

export const useDeleteSleepLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sleepApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
    },
  });
};
