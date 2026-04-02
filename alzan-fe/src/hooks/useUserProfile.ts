import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { weightApi } from '../modules/health/services/weightApi';
import { Nullable } from '../types/common.types';
import { Sex } from '../types/requests.types';

export interface UserProfileData {
  sex: Nullable<Sex>;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null; // Latest recorded weight
  age: number | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Independent fetches to ensure one failure doesn't block the other
      console.log('[useUserProfile] Fetching profile for user:', user.id);

      const [userResult, weightResult] = await Promise.all([
        supabase.from('users').select('sex, date_of_birth, height_cm').eq('id', user.id).single(),
        weightApi.getLogs(user.id, 1),
      ]);

      // Handle User Details
      const { data: userData, error } = userResult;
      if (!error && userData) {
        console.log('[useUserProfile] User details found');
      } else {
        console.error('[useUserProfile] User details fetch error:', error);
      }

      // Handle Weight
      let latestWeight: number | null = null;
      const logs = weightResult;
      if (logs && logs.length > 0) {
        latestWeight = logs[0].weight_kg;
        console.log('[useUserProfile] Weight found:', latestWeight);
      } else {
        console.log('[useUserProfile] No weight logs found');
      }

      // Calculate Age
      let age: number | null = null;
      if (userData?.date_of_birth) {
        const dob = new Date(userData.date_of_birth);
        const today = new Date();
        let ageYears = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          ageYears--;
        }
        age = ageYears;
      }

      return {
        sex: userData?.sex,
        date_of_birth: userData?.date_of_birth,
        height_cm: userData?.height_cm,
        weight_kg: latestWeight,
        age,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
