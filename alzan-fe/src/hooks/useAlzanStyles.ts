import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export type AlzanStyles = ReturnType<typeof useAlzanStyles>['styles'];

/**
 * Custom hook for Alzan screens theming
 * Works with useTheme to provide dark mode support
 */
export const useAlzanStyles = () => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => {
    return {
      // Background
      containerBackground: isDark ? '#000000' : '#F5F7FA',
      baseBackground: isDark ? '#000000' : '#F5F7FA',

      // Aurora orbs
      topOrbColors: isDark
        ? (['rgba(10, 132, 255, 0.35)', 'transparent'] as const)
        : (['rgba(0, 122, 255, 0.15)', 'transparent'] as const),
      bottomOrbColors: isDark
        ? (['transparent', 'rgba(94, 92, 230, 0.3)'] as const)
        : (['transparent', 'rgba(100, 100, 255, 0.1)'] as const),

      // Header
      headerTitle: { color: colors.textPrimary },
      headerIconBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      headerIconColor: colors.textPrimary,

      // Profile content
      profileName: { color: colors.textPrimary },
      profileBio: { color: colors.textSecondary },
      avatarGlow: {
        backgroundColor: isDark ? '#2C2C2E' : '#fff',
        shadowColor: isDark ? '#0A84FF' : '#4A90D9',
      },

      // Stats cards
      statCard: {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#fff',
      },
      statValue: { color: colors.textPrimary },
      statLabel: { color: colors.textSecondary },
      statCardActive: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#fff',
        borderColor: colors.primary,
        borderWidth: 2,
      },
      statValueActive: { color: colors.primary },
      statLabelActive: { color: colors.primary },

      // Tabs
      tabsContainerBg: isDark ? 'transparent' : '#F7F8FA',
      tabsBackgroundBg: isDark ? 'rgba(118, 118, 128, 0.24)' : '#EAECEF', // iOS segmented control dark style
      tabButtonActiveBg: isDark ? '#636366' : '#fff', // Solid active state for contrast
      tabIconColor: colors.textSecondary,
      tabIconActiveColor: colors.textPrimary,

      // Grid items
      gridMapBg: isDark ? '#1C1C1E' : '#A8D8FF',
      gridGymBg: isDark ? '#2C2C2E' : '#2a2a2a',
      gridOverlayText: { color: '#fff' },
      gridRoute: isDark ? 'rgba(10, 132, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',

      // Inline summary
      inlineSummaryCard: {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#fff',
      },
      inlineSummaryTitle: { color: colors.textPrimary },
      inlineSummaryValue: { color: colors.textPrimary },
      inlineSummaryLabel: { color: colors.textSecondary },
      inlineExtraRow: {
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
      },
      inlineExtraLabel: { color: colors.textSecondary },
      inlineExtraValue: { color: colors.textPrimary },

      // Modal
      modalContent: {
        backgroundColor: isDark ? '#1C1C1E' : '#fff',
      },
      modalOverlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',

      // Logros/Badges
      badgeItem: {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#fff',
      },
      prRow: {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#fff',
      },
      prLabel: { color: colors.textSecondary },
      prValue: { color: colors.textPrimary },
      sectionHeader: { color: colors.textPrimary },

      // Feed cards (Home screen)
      feedCard: {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : 'rgba(255, 255, 255, 0.7)',
      },
      postUserName: { color: colors.textPrimary },
      postTimestamp: { color: colors.textSecondary },
      postDescription: { color: colors.textPrimary },
      postWorkoutTitle: { color: colors.textPrimary },
      dataValue: { color: colors.textPrimary },
      dataUnit: { color: colors.textSecondary },
      actionCount: { color: colors.textSecondary },

      // Empty state
      emptyTabText: { color: colors.textSecondary },
    };
  }, [colors, isDark]);

  return {
    styles,
    colors,
    isDark,
  };
};
