/**
 * Onboarding flow types and constants
 */

import { Nullable } from './common.types';
import {
  DailyActivity,
  DistanceUnit,
  EnergyUnit,
  PaceUnit,
  PrimaryGoalMode,
  Sex,
  TrainingFrequency,
  WeightUnit,
} from './requests.types';
import { TranslationKey } from '../i18n/locales/en';

export enum OnboardingStep {
  IDENTITY = 1,
  GOAL = 2,
  PHYSICAL = 3,
  ACTIVITY = 4, // NEW: Activity level step
  PROFILE = 5,
  UNITS = 6,
  HEALTH = 7,
  CONSENT = 8,
  COMPLETE = 9,
}

// Steps 1-4 and 8 are mandatory, 6-7 can be skipped
export const MANDATORY_STEPS = [
  OnboardingStep.IDENTITY,
  OnboardingStep.GOAL,
  OnboardingStep.PHYSICAL,
  OnboardingStep.ACTIVITY,
  OnboardingStep.PROFILE,
  OnboardingStep.CONSENT,
];

export const SKIPPABLE_STEPS = [OnboardingStep.UNITS, OnboardingStep.HEALTH];

export const TOTAL_ONBOARDING_STEPS = 9;

export interface OnboardingData {
  // Step 1: Identity
  displayName: string;
  username: string;
  avatarUrl: string | null;

  // Step 2: Goal
  primaryGoal: PrimaryGoalMode | null;

  // Step 3: Physical
  heightCm: number | null;
  weightKg: number | null;

  // Step 4: Activity Level (Two-Step)
  dailyActivity: DailyActivity | null;
  trainingFrequency: TrainingFrequency | null;

  // Step 5: Profile
  dateOfBirth: Date | null;
  sex: Nullable<Sex>;

  // Step 6: Units
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  paceUnit: PaceUnit;
  energyUnit: EnergyUnit;

  // Step 7: Health (Coming Soon)
  healthConnected: boolean;

  // Step 8: Consent
  termsAccepted: boolean;
  healthDataConsent: boolean;
}

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  displayName: '',
  username: '',
  avatarUrl: null,
  primaryGoal: null,
  heightCm: null,
  weightKg: null,
  dailyActivity: null,
  trainingFrequency: null,
  dateOfBirth: null,
  sex: null,
  weightUnit: 'kg',
  distanceUnit: 'km',
  paceUnit: 'min_km',
  energyUnit: 'kcal',
  healthConnected: false,
  termsAccepted: false,
  healthDataConsent: false,
};

// Goal options with display info
export const GOAL_OPTIONS: { value: PrimaryGoalMode; labelKey: TranslationKey; icon: string }[] = [
  { value: 'gain_strength', labelKey: 'onboarding.goals.gainStrength.label', icon: '🏋️' },
  { value: 'gain_muscle', labelKey: 'onboarding.goals.gainMuscle.label', icon: '💪' },
  { value: 'recomp', labelKey: 'onboarding.goals.recomp.label', icon: '🔄' },
  { value: 'lose_weight', labelKey: 'onboarding.goals.loseWeight.label', icon: '🏃' },
  { value: 'maintain', labelKey: 'onboarding.goals.maintain.label', icon: '⚖️' },
];

// Goal descriptions for UI info
export interface GoalInfo {
  titleKey: TranslationKey;
  icon: string;
  shortDescriptionKey: TranslationKey;
  longDescriptionKey: TranslationKey;
}

export const GOAL_DESCRIPTIONS: Record<PrimaryGoalMode, GoalInfo> = {
  gain_strength: {
    titleKey: 'onboarding.goals.gainStrength.title',
    icon: '🏋️',
    shortDescriptionKey: 'onboarding.goals.gainStrength.shortDescription',
    longDescriptionKey: 'onboarding.goals.gainStrength.longDescription',
  },
  gain_muscle: {
    titleKey: 'onboarding.goals.gainMuscle.title',
    icon: '💪',
    shortDescriptionKey: 'onboarding.goals.gainMuscle.shortDescription',
    longDescriptionKey: 'onboarding.goals.gainMuscle.longDescription',
  },
  recomp: {
    titleKey: 'onboarding.goals.recomp.title',
    icon: '⚖️',
    shortDescriptionKey: 'onboarding.goals.recomp.shortDescription',
    longDescriptionKey: 'onboarding.goals.recomp.longDescription',
  },
  lose_weight: {
    titleKey: 'onboarding.goals.loseWeight.title',
    icon: '🔥',
    shortDescriptionKey: 'onboarding.goals.loseWeight.shortDescription',
    longDescriptionKey: 'onboarding.goals.loseWeight.longDescription',
  },
  maintain: {
    titleKey: 'onboarding.goals.maintain.title',
    icon: '🧘',
    shortDescriptionKey: 'onboarding.goals.maintain.shortDescription',
    longDescriptionKey: 'onboarding.goals.maintain.longDescription',
  },
};

// Daily Activity (NEAT) options - Step 4a
export const DAILY_ACTIVITY_OPTIONS: {
  value: DailyActivity;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
}[] = [
  {
    value: 'sedentary',
    labelKey: 'settings.sedentary',
    descriptionKey: 'settings.sedentaryJobDesc',
    icon: '🛋️',
  },
  {
    value: 'active',
    labelKey: 'settings.activeStanding',
    descriptionKey: 'settings.activeJobDesc',
    icon: '🚶',
  },
  {
    value: 'physical',
    labelKey: 'settings.physicalExigent',
    descriptionKey: 'settings.physicalJobDesc',
    icon: '🏗️',
  },
];

// Training Frequency (EAT) options - Step 4b
export const TRAINING_FREQUENCY_OPTIONS: {
  value: TrainingFrequency;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
}[] = [
  {
    value: 'none',
    labelKey: 'settings.noneOrLittle',
    descriptionKey: 'settings.sedentaryDesc',
    icon: '🛌',
  },
  {
    value: 'occasional',
    labelKey: 'settings.occasional',
    descriptionKey: 'settings.occasionalDesc',
    icon: '🏃',
  },
  {
    value: 'frequent',
    labelKey: 'settings.frequent',
    descriptionKey: 'settings.frequentDesc',
    icon: '🔥',
  },
  {
    value: 'athlete',
    labelKey: 'settings.proAthlete',
    descriptionKey: 'settings.athleteDesc',
    icon: '🏅',
  },
];

// Sex options for Step 5
export const SEX_OPTIONS: { value: Sex; labelKey: TranslationKey }[] = [
  { value: 'male', labelKey: 'settings.genderMale' },
  { value: 'female', labelKey: 'settings.genderFemaleAlt' },
  { value: 'other', labelKey: 'settings.genderPrivate' },
  { value: 'prefer_not_to_say', labelKey: 'settings.genderPrivate' },
];
