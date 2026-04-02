import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export const useHomeStyles = () => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => {
    return {
      gradientColors: isDark ? (['#000000', '#1C1C1E'] as const) : (['#F8FAFC', '#F1F5F9'] as const),

      // Header
      headerTitle: { color: colors.textPrimary },
      headerDate: { color: colors.textSecondary },

      // Sections
      sectionTitle: { color: colors.textPrimary },

      // Stats Cards
      statsLabel: { color: colors.textPrimary },
      statsValue: { color: colors.textPrimary },
      statsUnit: { color: colors.textSecondary },

      // Agenda
      agendaTitle: { color: colors.textPrimary },
      agendaSubtitle: { color: colors.textSecondary },
      agendaIconBg: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },

      // Actions
      startButton: { backgroundColor: colors.primary },
    };
  }, [colors, isDark]);

  return {
    styles,
    colors,
    isDark,
  };
};
