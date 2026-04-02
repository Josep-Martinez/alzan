import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OnboardingBackButton } from '../../components/OnboardingBackButton';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { usePreferencesContext } from '../../context/PreferencesContext';
import { OnboardingScreenNavigationProp } from '../../types/navigation.types';
import { DistanceUnit, WeightUnit } from '../../types/requests.types';

interface ToggleProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}

const Toggle = <T extends string>({ options, selected, onSelect }: ToggleProps<T>) => {
  const { styles } = useOnboardingStyles();

  return (
    <View style={styles.toggleContainer}>
      {options.map(option => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.toggleOption, isSelected && styles.toggleOptionSelected]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.toggleText, isSelected && styles.toggleTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const OnboardingMetrics = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles } = useOnboardingStyles();
  const { preferences, updatePreferences } = usePreferencesContext();

  const initialWeightUnit = useMemo<WeightUnit>(() => preferences?.weight_unit ?? 'kg', [preferences?.weight_unit]);
  const initialDistanceUnit = useMemo<DistanceUnit>(
    () => preferences?.distance_unit ?? 'km',
    [preferences?.distance_unit],
  );

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialWeightUnit);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(initialDistanceUnit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWeightUnit(initialWeightUnit);
  }, [initialWeightUnit]);

  useEffect(() => {
    setDistanceUnit(initialDistanceUnit);
  }, [initialDistanceUnit]);

  const handleContinue = useCallback(async () => {
    setSaving(true);
    try {
      await updatePreferences({
        weight_unit: weightUnit,
        distance_unit: distanceUnit,
      });
      navigation.navigate('OnboardingGoal');
    } finally {
      setSaving(false);
    }
  }, [distanceUnit, navigation, updatePreferences, weightUnit]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('onboarding.units')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.unitPreferencePrompt')}</Text>
        </View>

        <View style={styles.unitRow}>
          <Text style={styles.unitLabel}>{t('settings.weight')}</Text>
          <View style={styles.unitToggleWrapper}>
            <Toggle
              options={[
                { value: 'kg', label: t('health.unitKg') },
                { value: 'lb', label: t('onboarding.unitLb') },
              ]}
              selected={weightUnit}
              onSelect={setWeightUnit}
            />
          </View>
        </View>

        <View style={[styles.unitRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.unitLabel}>{t('settings.distance')}</Text>
          <View style={styles.unitToggleWrapper}>
            <Toggle
              options={[
                { value: 'km', label: t('onboarding.unitKm') },
                { value: 'miles', label: t('onboarding.unitMi') },
              ]}
              selected={distanceUnit}
              onSelect={setDistanceUnit}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <OnboardingBackButton />
        <PrimaryButton title={t('onboarding.continue')} onPress={handleContinue} loading={saving} />
      </View>
    </View>
  );
};
