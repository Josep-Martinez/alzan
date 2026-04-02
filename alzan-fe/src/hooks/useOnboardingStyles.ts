import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, borderRadius } from '../theme';

// const { width } = Dimensions.get('window');

export const useOnboardingStyles = () => {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // Main container
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          flexGrow: 1,
          padding: spacing.l,
          paddingBottom: 120, // Space for bottom button
        },
        keyboardView: {
          flex: 1,
        },

        // Header section
        headerContainer: {
          marginTop: spacing.xl,
          marginBottom: spacing.xl,
        },
        stepIndicator: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.m,
        },
        stepDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
          marginRight: spacing.xs,
        },
        stepDotActive: {
          backgroundColor: colors.primary,
          width: 24,
        },
        stepDotCompleted: {
          backgroundColor: colors.success,
        },
        title: {
          ...typography.h1,
          color: colors.textPrimary,
          marginBottom: spacing.s,
        },
        subtitle: {
          ...typography.body,
          color: colors.textSecondary,
          lineHeight: 22,
        },

        // Input fields
        inputContainer: {
          marginBottom: spacing.m,
        },
        label: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          marginLeft: spacing.xs,
        },
        input: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: borderRadius.m,
          padding: spacing.m,
          fontSize: 16,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        inputFocused: {
          borderColor: colors.primary,
        },
        inputError: {
          borderColor: colors.danger,
        },
        inputValid: {
          borderColor: colors.success,
        },
        inputWithIcon: {
          paddingRight: 50,
        },
        inputIcon: {
          position: 'absolute',
          right: spacing.m,
          top: '50%',
          transform: [{ translateY: -12 }],
        },
        helperText: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xs,
          marginLeft: spacing.xs,
        },
        errorText: {
          ...typography.caption,
          color: colors.danger,
          marginTop: spacing.xs,
          marginLeft: spacing.xs,
        },

        // Selection cards (for goals, sex, etc.)
        optionsGrid: {
          gap: spacing.m,
        },
        optionCard: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surface,
          borderRadius: borderRadius.m,
          padding: spacing.l,
          borderWidth: 2,
          borderColor: 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
        },
        optionCardSelected: {
          borderColor: colors.primary,
          backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)',
        },
        optionIcon: {
          fontSize: 28,
          marginRight: spacing.m,
        },
        optionTextContainer: {
          flex: 1,
        },
        optionTitle: {
          ...typography.body,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        optionSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 2,
        },
        optionCheck: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        optionCheckSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },

        // Toggle/Segmented control for units
        toggleContainer: {
          flexDirection: 'row',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: borderRadius.m,
          padding: 4,
        },
        toggleOption: {
          flex: 1,
          paddingVertical: spacing.s,
          alignItems: 'center',
          borderRadius: borderRadius.s,
        },
        toggleOptionSelected: {
          backgroundColor: colors.primary,
        },
        toggleText: {
          ...typography.body,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        toggleTextSelected: {
          color: '#FFFFFF',
        },

        // Unit row
        unitRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.m,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        unitLabel: {
          ...typography.body,
          color: colors.textPrimary,
        },
        unitToggleWrapper: {
          width: 120,
        },

        // Date picker button
        datePickerButton: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          borderRadius: borderRadius.m,
          padding: spacing.m,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        datePickerText: {
          ...typography.body,
          color: colors.textPrimary,
        },
        datePickerPlaceholder: {
          color: colors.textSecondary,
        },

        // Bottom section with CTA
        bottomContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.l,
          paddingBottom: spacing.xl + 20, // Safe area
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        backButton: {
          alignItems: 'center',
          paddingVertical: spacing.s,
          marginBottom: spacing.s,
        },
        backButtonDisabled: {
          opacity: 0.4,
        },
        backButtonText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        skipButton: {
          alignItems: 'center',
          paddingVertical: spacing.s,
          marginTop: spacing.s,
        },
        skipText: {
          ...typography.body,
          color: colors.textSecondary,
        },

        // Checkbox for consent
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.m,
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: colors.border,
          marginRight: spacing.m,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        checkboxLabel: {
          flex: 1,
          ...typography.body,
          color: colors.textPrimary,
        },
        link: {
          color: colors.primary,
          textDecorationLine: 'underline',
        },

        // Health connect card
        healthCard: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surface,
          borderRadius: borderRadius.l,
          padding: spacing.xl,
          alignItems: 'center',
        },
        healthIcon: {
          width: 80,
          height: 80,
          marginBottom: spacing.l,
        },
        healthTitle: {
          ...typography.h3,
          color: colors.textPrimary,
          marginBottom: spacing.s,
          textAlign: 'center',
        },
        healthDescription: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.l,
        },
        comingSoonBadge: {
          backgroundColor: colors.warning,
          paddingHorizontal: spacing.m,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.full,
        },
        comingSoonText: {
          ...typography.caption,
          color: '#FFFFFF',
          fontWeight: '600',
        },

        // Complete screen
        completeContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        },
        completeIcon: {
          fontSize: 80,
          marginBottom: spacing.xl,
        },
        completeTitle: {
          ...typography.h1,
          color: colors.textPrimary,
          marginBottom: spacing.m,
          textAlign: 'center',
        },
        completeSubtitle: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        },

        // Validation icon
        validationIcon: {
          fontSize: 20,
        },
      }),
    [colors, isDark],
  );

  return { styles, colors, isDark };
};
