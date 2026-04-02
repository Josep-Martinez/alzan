import { usePreferences } from './settings/usePreferences';
import { useUnitConversion } from './useUnitConversion';

// WRAPPER / COMPATIBILITY LAYER
// This hook previously handled fetching prefs + formatting.
// Now it delegates to `usePreferences` (source of truth) and `useUnitConversion` (logic).

export const useUserPreferences = () => {
  const { preferences, loading: isLoading } = usePreferences();
  const { convertWeightToUi, convertDistanceToUi, parseWeightToKg, parseDistanceToMeters } = useUnitConversion();

  // Compatibility shim for existing components using this hook
  const formatWeight = (kg: number | null | undefined, withUnit = true) => {
    const { value, unit } = convertWeightToUi(kg);
    if (kg === null || kg === undefined) return '-';
    return withUnit ? `${value} ${unit}` : `${value}`;
  };

  const toDisplayWeight = (kg: number) => {
    return convertWeightToUi(kg).value;
  };

  const toDbWeight = (displayValue: number) => {
    return parseWeightToKg(displayValue);
  };

  const formatDistance = (meters: number | null | undefined, withUnit = true) => {
    const { value, unit } = convertDistanceToUi(meters);
    if (meters === null || meters === undefined) return '-';
    return withUnit ? `${value} ${unit}` : `${value}`;
  };

  const toDisplayDistance = (meters: number) => {
    return convertDistanceToUi(meters).value;
  };

  const toDbDistanceFromDisplay = (displayValue: number) => {
    return parseDistanceToMeters(displayValue);
  };

  return {
    preferences: preferences || { weight_unit: 'kg', distance_unit: 'km' }, // Fallback to avoid breaking destructuring
    isLoading,
    formatWeight,
    toDisplayWeight,
    toDbWeight,
    formatDistance,
    toDisplayDistance,
    toDbDistanceFromDisplay,
  };
};
