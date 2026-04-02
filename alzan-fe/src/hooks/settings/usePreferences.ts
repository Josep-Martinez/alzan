import { usePreferencesContext } from '../../context/PreferencesContext';
import { UserPreference } from '../../types/requests.types';

// Re-export interface for backward compatibility
export type { UserPreference };

/**
 * Hook to access user preferences from global context.
 * All components using this hook share the same state.
 */
export const usePreferences = () => {
  return usePreferencesContext();
};
