import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { usePreferencesContext } from '../../context/PreferencesContext';
import { OnboardingScreenNavigationProp } from '../../types/navigation.types';
import { changeLanguage, DEFAULT_LOCALE, getLocaleOptions, Locale } from '../../i18n';

export const OnboardingLanguage = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles } = useOnboardingStyles();
  const { updatePreferences } = usePreferencesContext();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    void changeLanguage(DEFAULT_LOCALE);
  }, []);

  const handleSelectLocale = useCallback((locale: Locale) => {
    setSelectedLocale(locale);
    void changeLanguage(locale);
  }, []);

  const handleContinue = useCallback(async () => {
    await updatePreferences({ language_code: selectedLocale });
    navigation.navigate('OnboardingIdentity');
  }, [navigation, selectedLocale, updatePreferences]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('onboarding.languageSelectionTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.languageSelectionSubtitle')}</Text>
        </View>

        <View style={styles.optionsGrid}>
          {getLocaleOptions().map(option => {
            const isSelected = selectedLocale === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelectLocale(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                </View>
                <View style={[styles.optionCheck, isSelected && styles.optionCheckSelected]}>
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <PrimaryButton title={t('onboarding.continue')} onPress={handleContinue} />
      </View>
    </View>
  );
};
