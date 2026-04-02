import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface ActivityLap {
  id: string;
  session_id: string;
  lap_index: number;
  split_group: 'legacy' | 'custom' | 'distance';
  split_group_order: number;
  split_distance_m: number | null;
  distance_m: number | null;
  duration_s: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_pace_s_per_km: number | null;
}

const normalizeSplitGroup = (value: string): ActivityLap['split_group'] => {
  if (value === 'custom' || value === 'distance' || value === 'legacy') {
    return value;
  }
  return 'legacy';
};

export const useSessionLaps = (sessionId?: string) => {
  return useQuery({
    queryKey: ['sessionLaps', sessionId],
    queryFn: async (): Promise<ActivityLap[]> => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('activity_laps')
        .select('*')
        .eq('session_id', sessionId)
        .order('split_group_order', { ascending: true })
        .order('lap_index');

      if (error) throw error;
      return (data ?? []).map(lap => ({
        id: lap.id,
        session_id: lap.session_id,
        lap_index: lap.lap_index,
        split_group: normalizeSplitGroup(lap.split_group),
        split_group_order: lap.split_group_order,
        split_distance_m: lap.split_distance_m,
        distance_m: lap.distance_m,
        duration_s: lap.duration_s,
        avg_heart_rate: lap.avg_heart_rate,
        max_heart_rate: lap.max_heart_rate,
        avg_pace_s_per_km: lap.avg_pace_s_per_km,
      }));
    },
    enabled: !!sessionId,
  });
};
