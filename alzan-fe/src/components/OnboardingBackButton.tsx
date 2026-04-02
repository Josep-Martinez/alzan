import React, { useCallback } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useOnboardingStyles } from '../hooks/useOnboardingStyles';
import { OnboardingScreenNavigationProp } from '../types/navigation.types';

interface OnboardingBackButtonProps {
  onPress?: () => void;
}

export const OnboardingBackButton = ({ onPress }: OnboardingBackButtonProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles } = useOnboardingStyles();

  const canNavigateBack = navigation.canGoBack();
  const isDisabled = !onPress && !canNavigateBack;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }

    if (canNavigateBack) {
      navigation.goBack();
    }
  }, [canNavigateBack, navigation, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      style={[styles.backButton, isDisabled && styles.backButtonDisabled]}
    >
      <Text style={styles.backButtonText}>{t('onboarding.back')}</Text>
    </TouchableOpacity>
  );
};
