import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingScreenNavigationProp } from '../../types/navigation.types';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { OnboardingBackButton } from '../../components/OnboardingBackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OnboardingStep } from '../../types/onboarding.types';
import { useTranslation } from 'react-i18next';

// Placeholder URLs - to be replaced with actual legal documents
const TERMS_URL = 'https://alzan.health/terms';
const PRIVACY_URL = 'https://alzan.health/privacy';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
  required?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onToggle, label, required }) => {
  const { styles, colors } = useOnboardingStyles();

  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={{ color: '#FFFFFF', fontSize: 14 }}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
    </TouchableOpacity>
  );
};

export const OnboardingConsent = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles, colors } = useOnboardingStyles();
  const { data, updateData, saveAndNext, saving } = useOnboarding();

  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted);
  const [healthDataConsent, setHealthDataConsent] = useState(data.healthDataConsent);

  const isValid = termsAccepted;

  const handleContinue = useCallback(async () => {
    if (!termsAccepted) return;
    const newData = { termsAccepted, healthDataConsent };
    updateData(newData);
    const success = await saveAndNext(newData);
    if (success) {
      navigation.navigate('OnboardingComplete');
    }
  }, [termsAccepted, healthDataConsent, updateData, saveAndNext, navigation]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening link:', err));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <OnboardingProgress currentStep={OnboardingStep.CONSENT} />
          <Text style={styles.title}>{t('onboarding.termsAndPrivacy')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.acceptTermsPrompt')}</Text>
        </View>

        <Checkbox
          checked={termsAccepted}
          onToggle={() => setTermsAccepted(!termsAccepted)}
          required
          label={
            <Text>
              {t('onboarding.iAccept')}{' '}
              <Text style={styles.link} onPress={() => openLink(TERMS_URL)}>
                {t('onboarding.termsOfUse')}
              </Text>{' '}
              {t('onboarding.andThe')}{' '}
              <Text style={styles.link} onPress={() => openLink(PRIVACY_URL)}>
                {t('settings.privacyPolicy')}
              </Text>
            </Text>
          }
        />

        <Checkbox
          checked={healthDataConsent}
          onToggle={() => setHealthDataConsent(!healthDataConsent)}
          label={t('onboarding.healthConsent')}
        />

        <View
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <Text style={[styles.helperText, { marginTop: 0, marginLeft: 0 }]}>{t('onboarding.dataPrivacyNotice')}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <OnboardingBackButton />
        <PrimaryButton
          title={t('onboarding.createAccount')}
          onPress={handleContinue}
          loading={saving}
          disabled={!isValid}
        />
      </View>
    </View>
  );
};
