import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { ActivityHeartRateZone } from '../types/requests.types';

export const useSessionHeartRateZones = (sessionId?: string) => {
  return useQuery({
    queryKey: ['sessionHeartRateZones', sessionId],
    queryFn: async (): Promise<ActivityHeartRateZone[]> => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('activity_heart_rate_zones')
        .select('*')
        .eq('session_id', sessionId)
        .order('zone', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
};
