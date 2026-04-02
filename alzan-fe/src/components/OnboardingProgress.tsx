import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { OnboardingStep, TOTAL_ONBOARDING_STEPS } from '../types/onboarding.types';
import { spacing } from '../theme';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <View
            key={stepNumber}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              isCompleted && { backgroundColor: colors.success },
              isActive && { backgroundColor: colors.primary, width: 24 },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
});
