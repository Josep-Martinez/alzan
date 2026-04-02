import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook that provides consistent dynamic styles for all training screens
 * Works with useTheme to provide dark mode support
 */
export const useTrainingStyles = () => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () => ({
      // Container styles
      container: { backgroundColor: colors.background },
      gradientColors: isDark ? ([colors.background, colors.surfaceSolid] as const) : (['#F2F5F9', '#EFF2F7'] as const),

      // Card styles
      card: { backgroundColor: isDark ? colors.surfaceSolid : colors.white },
      glassCard: {
        backgroundColor: isDark ? colors.surfaceSolid : 'rgba(255,255,255,0.9)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
      },

      // Text styles
      headerTitle: { color: colors.textPrimary },
      sectionTitle: { color: colors.textPrimary },
      title: { color: colors.textPrimary },
      subtitle: { color: colors.textSecondary },
      label: { color: colors.textPrimary },
      sublabel: { color: colors.textSecondary },

      // Input styles
      input: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.white,
        borderColor: colors.border,
        color: colors.textPrimary,
      },
      inputPlaceholder: colors.textSecondary,

      // Day items (calendar strip)
      dayItem: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      },
      dayNumber: { color: colors.textPrimary },
      dayName: { color: colors.textSecondary },
      selectedDayItem: { backgroundColor: colors.primary },
      selectedDayText: { color: '#FFFFFF' },

      // Interactive elements
      iconContainer: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.background },
      divider: { backgroundColor: colors.border },

      // Modal styles
      modalOverlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      modalContent: { backgroundColor: isDark ? colors.surfaceSolid : colors.white },

      // Button styles
      primaryButton: { backgroundColor: colors.primary },
      secondaryButton: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.background,
        borderColor: colors.border,
      },
      dangerButton: { backgroundColor: isDark ? 'rgba(255,69,58,0.15)' : '#FFF5F5' },

      // Empty state
      emptyState: {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      },
      emptyStateText: { color: colors.textSecondary },

      // Misc
      chevron: { color: colors.textSecondary },
      border: { borderColor: colors.border },
    }),
    [colors, isDark],
  );

  return { styles, colors, isDark };
};
