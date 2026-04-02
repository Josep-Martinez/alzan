import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { getCurrentAppLocale } from '../services/localization';

export const useMuscleGroups = () => {
  const languageCode = getCurrentAppLocale();

  const {
    data: muscleGroups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['muscleGroups', languageCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muscle_groups')
        .select(
          `
                    id,
                    code,
                    muscle_group_translations (
                        name,
                        language_code
                    )
                `,
        )
        .order('code');

      if (error) {
        console.error('Error fetching muscle groups:', error);
        throw error;
      }
      return data.map(item => {
        const translations = item.muscle_group_translations || [];
        const trans = translations.find(t => t.language_code === languageCode) || translations[0];
        return {
          id: item.id,
          code: item.code,
          name: trans?.name || item.code,
        };
      });
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    muscleGroups,
    isLoading,
    error,
  };
};
