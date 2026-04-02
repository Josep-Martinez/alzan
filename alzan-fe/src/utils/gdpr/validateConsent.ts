import { supabase } from '../../lib/supabaseClient';
import { UserPreference as UserPreferences } from '../../types/requests.types';

export const validateConsent = async (userId: string): Promise<boolean> => {
  console.log('[gdpr.validateConsent] Verificando consentimiento');
  try {
    if (!userId) {
      console.log('[gdpr.validateConsent] No hay usuario');
      return false;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('health_data_consent')
      .eq('user_id', userId)
      .single<Pick<UserPreferences, 'health_data_consent'>>();

    if (error) {
      console.error('[gdpr.validateConsent] Error:', error);
      return false;
    }

    const hasConsent = !!data?.health_data_consent;
    console.log('[gdpr.validateConsent] Resultado:', hasConsent);
    return hasConsent;
  } catch (error) {
    console.error('[gdpr.validateConsent] Exception:', error);
    return false;
  }
};
