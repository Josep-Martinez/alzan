import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingScreenNavigationProp } from '../../types/navigation.types';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { OnboardingBackButton } from '../../components/OnboardingBackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OnboardingStep } from '../../types/onboarding.types';
import { DistanceUnit, EnergyUnit, PaceUnit, WeightUnit } from '../../types/requests.types';
import { useTranslation } from 'react-i18next';

interface ToggleProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

const Toggle: React.FC<ToggleProps> = ({ options, selected, onSelect }) => {
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

export const OnboardingUnits = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { styles } = useOnboardingStyles();
  const { data, updateData, saveAndNext, skip, saving, canSkipCurrentStep } = useOnboarding();

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(data.weightUnit);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(data.distanceUnit);
  const [paceUnit] = useState<PaceUnit>(data.paceUnit);
  const [energyUnit] = useState<EnergyUnit>(data.energyUnit);

  const handleContinue = useCallback(async () => {
    const newData = { weightUnit, distanceUnit, paceUnit, energyUnit };
    updateData(newData);
    const success = await saveAndNext(newData);
    if (success) {
      navigation.navigate('OnboardingHealth');
    }
  }, [weightUnit, distanceUnit, paceUnit, energyUnit, updateData, saveAndNext, navigation]);

  const handleSkip = useCallback(async () => {
    const success = await skip();
    if (success) {
      navigation.navigate('OnboardingHealth');
    }
  }, [skip, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <OnboardingProgress currentStep={OnboardingStep.UNITS} />
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
              onSelect={v => setWeightUnit(v as WeightUnit)}
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
              onSelect={v => setDistanceUnit(v as DistanceUnit)}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <OnboardingBackButton />
        <PrimaryButton title={t('onboarding.continue')} onPress={handleContinue} loading={saving} />
        {canSkipCurrentStep && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
