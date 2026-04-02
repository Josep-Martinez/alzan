import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingScreenNavigationProp } from '../../types/navigation.types';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { OnboardingBackButton } from '../../components/OnboardingBackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OnboardingStep } from '../../types/onboarding.types';
import { useTranslation } from 'react-i18next';

export const OnboardingIdentity = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles, colors } = useOnboardingStyles();
  const { data, updateData, saveAndNext, saving, checkUsernameAvailable } = useOnboarding();

  const [displayName, setDisplayName] = useState(data.displayName);
  const [username, setUsername] = useState(data.username);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      setUsernameError(username.length > 0 ? t('onboarding.min3Chars') : '');
      return;
    }

    // Validate format (alphanumeric and underscores only)
    const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
    if (!validFormat) {
      setUsernameStatus('idle');
      setUsernameError(t('onboarding.usernameFormatError'));
      return;
    }

    setUsernameStatus('checking');
    setUsernameError('');

    const timeoutId = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameStatus(available ? 'available' : 'taken');
      if (!available) {
        setUsernameError(t('onboarding.usernameTakenError'));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailable, t]);

  const isValid = displayName.trim().length >= 2 && usernameStatus === 'available';

  const handleContinue = useCallback(async () => {
    const newData = { displayName: displayName.trim(), username: username.toLowerCase().trim() };
    updateData(newData);
    // Pass data directly to save to avoid stale state
    const success = await saveAndNext(newData);
    if (success) {
      navigation.navigate('OnboardingMetrics');
    }
  }, [displayName, username, updateData, saveAndNext, navigation]);

  const getValidationIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'available':
        return <Text style={[styles.validationIcon, { color: colors.success }]}>✓</Text>;
      case 'taken':
        return <Text style={[styles.validationIcon, { color: colors.danger }]}>✕</Text>;
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <OnboardingProgress currentStep={OnboardingStep.IDENTITY} />
          <Text style={styles.title}>{t('onboarding.yourIdentity')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.displayNamePrompt')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('onboarding.displayName')}</Text>
          <TextInput
            style={[styles.input, displayName.length > 0 && displayName.trim().length < 2 && styles.inputError]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('onboarding.userPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoComplete="name"
          />
          {displayName.length > 0 && displayName.trim().length < 2 && (
            <Text style={styles.errorText}>{t('onboarding.min2Chars')}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('onboarding.username')}</Text>
          <View>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                usernameStatus === 'available' && styles.inputValid,
                usernameStatus === 'taken' && styles.inputError,
              ]}
              value={username}
              onChangeText={text => setUsername(text.toLowerCase().replace(/\s/g, ''))}
              placeholder={t('onboarding.usernamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.inputIcon}>{getValidationIcon()}</View>
          </View>
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : (
            <Text style={styles.helperText}>{t('onboarding.publicIdWarning')}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <OnboardingBackButton />
        <PrimaryButton title={t('onboarding.continue')} onPress={handleContinue} loading={saving} disabled={!isValid} />
      </View>
    </KeyboardAvoidingView>
  );
};
