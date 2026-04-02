import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { getCurrentAppLocale } from '../services/localization';

export interface Equipment {
  id: number;
  code: string;
  name: string;
}

export const useEquipment = () => {
  const languageCode = getCurrentAppLocale();

  const {
    data: equipment = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['equipment', languageCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(
          `
                    id,
                    code,
                    equipment_translations (
                        name,
                        language_code
                    )
                `,
        )
        .order('code');

      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }
      return data.map(item => {
        const translations = item.equipment_translations || [];
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
    equipment,
    isLoading,
    error,
  };
};
