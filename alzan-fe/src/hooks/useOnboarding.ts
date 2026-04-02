import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  OnboardingStep,
  OnboardingData,
  DEFAULT_ONBOARDING_DATA,
  TOTAL_ONBOARDING_STEPS,
  SKIPPABLE_STEPS,
} from '../types/onboarding.types';
import { computeKcalAndMacros } from '../modules/nutrition/algorithms/nutritionCalculator';
import {
  ActivityLevel,
  DailyActivity,
  GoalMode,
  PrimaryGoalMode,
  TrainingFrequency,
  UserNutritionSettingInsert,
} from '../types/requests.types';

interface UseOnboardingReturn {
  currentStep: OnboardingStep;
  data: OnboardingData;
  loading: boolean;
  saving: boolean;
  isComplete: boolean;
  updateData: (updates: Partial<OnboardingData>) => void;
  saveAndNext: (dataOverride?: Partial<OnboardingData>) => Promise<boolean>;
  skip: () => Promise<boolean>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  canSkipCurrentStep: boolean;
}

export const upsertUserNutritionSettings = async (settings: UserNutritionSettingInsert) => {
  const { error: goalError } = await supabase
    .from('user_nutrition_settings')
    .upsert(settings, { onConflict: 'user_id' });

  if (goalError) {
    console.error('[Onboarding] Error saving nutrition settings:', goalError);
    // Fallback or retry? user_nutrition_settings is the new source of truth.
    // Throwing might be better to alert UI
    throw goalError;
  }
};

export const getGoalMode = (goal: PrimaryGoalMode) => {
  switch (goal) {
    case 'lose_weight':
      return 'lose';
    case 'gain_muscle':
    case 'gain_strength':
      return 'gain';
    case 'recomp':
      return 'recomp';
    case 'maintain':
    default:
      return 'maintain';
  }
};

// Map the two-step activity system to a single activity_level for calculations
export const computeActivityLevel = (
  dailyActivity: DailyActivity,
  trainingFrequency: TrainingFrequency,
): ActivityLevel => {
  // Sedentary daily + no training = sedentary
  if (dailyActivity === 'sedentary' && trainingFrequency === 'none') return 'sedentary';

  // Sedentary daily + occasional training = light
  if (dailyActivity === 'sedentary' && trainingFrequency === 'occasional') return 'light';

  // Active daily + no/occasional training = light/moderate
  if (dailyActivity === 'active' && trainingFrequency === 'none') return 'light';
  if (dailyActivity === 'active' && trainingFrequency === 'occasional') return 'moderate';

  // Physical daily or frequent training = high
  if (dailyActivity === 'physical' || trainingFrequency === 'frequent') return 'high';

  // Athlete training = very_high
  if (trainingFrequency === 'athlete') return 'very_high';

  // Default moderate
  return 'moderate';
};

export const useOnboarding = (): UseOnboardingReturn => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.IDENTITY);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current step and existing data on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get user data including onboarding_step
        const { data: userData, error } = await supabase
          .from('users')
          .select('onboarding_step, display_name, username, avatar_url, height_cm, date_of_birth, sex')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Set current step (default to 1 if not set)
        const step = (userData?.onboarding_step || 1) as OnboardingStep;
        setCurrentStep(step);

        // Pre-fill existing data
        if (userData) {
          setData(prev => ({
            ...prev,
            displayName: userData.display_name || '',
            username: userData.username || '',
            avatarUrl: userData.avatar_url || null,
            heightCm: userData.height_cm || null,
            dateOfBirth: userData.date_of_birth ? new Date(userData.date_of_birth) : null,
            sex: userData.sex || null,
          }));
        }

        // Also load preferences if they exist
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('weight_unit, distance_unit, pace_unit, energy_unit, health_data_consent')
          .eq('user_id', user.id)
          .maybeSingle();

        if (prefs) {
          setData(prev => ({
            ...prev,
            weightUnit: prefs.weight_unit || 'kg',
            distanceUnit: prefs.distance_unit || 'km',
            paceUnit: prefs.pace_unit || 'min_km',
            energyUnit: prefs.energy_unit || 'kcal',
            healthDataConsent: prefs.health_data_consent || false,
          }));
        }
      } catch (error) {
        console.error('[Onboarding] Error loading state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [user?.id]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const checkUsernameAvailable = useCallback(
    async (username: string): Promise<boolean> => {
      if (!username || username.length < 3) return false;

      try {
        // First try with RPC if it exists (for RLS environments)
        const { data, error } = await supabase.rpc('check_username', {
          username_input: username.toLowerCase(),
        });

        if (!error && data !== null) {
          return data as boolean;
        }

        // Fallback to table select (might fail if RLS prevents reading others)
        // But we keep it as fallback just in case
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.toLowerCase())
          .neq('id', user?.id || '')
          .maybeSingle();

        if (selectError) throw selectError;
        return !existingUser;
      } catch (error) {
        console.warn('[Onboarding] Error checking username:', error);
        // Default to true to let the unique constraint on save be the final judge
        return true;
      }
    },
    [user?.id],
  );

  const saveStepData = async (dataOverride?: Partial<OnboardingData>): Promise<boolean> => {
    if (!user?.id) return false;

    // Merge current state with override to ensure we save the freshest data
    const dataToSave = { ...data, ...dataOverride };

    try {
      switch (currentStep) {
        case OnboardingStep.IDENTITY:
          await supabase
            .from('users')
            .update({
              display_name: dataToSave.displayName,
              username: dataToSave.username.toLowerCase(),
              avatar_url: dataToSave.avatarUrl,
            })
            .eq('id', user.id);
          break;

        case OnboardingStep.GOAL:
          if (!dataToSave.primaryGoal) return false;

          // Store goal in user_nutrition_settings table
          await upsertUserNutritionSettings({
            user_id: user.id,
            primary_goal: dataToSave.primaryGoal,
            goal_mode: getGoalMode(dataToSave.primaryGoal),
            adjustment_type: 'percent', // Default
            adjustment_value: 0, // Default
            activity_level: 'moderate', // Default
          });

          break;

        case OnboardingStep.PHYSICAL:
          // Update height in users table
          await supabase.from('users').update({ height_cm: dataToSave.heightCm }).eq('id', user.id);

          // Insert weight log
          if (dataToSave.weightKg) {
            await supabase.from('weight_logs').insert({
              user_id: user.id,
              weight_kg: dataToSave.weightKg,
              source: 'onboarding',
            });
          }
          break;

        case OnboardingStep.ACTIVITY:
          // Update daily_activity and training_frequency in user_nutrition_settings
          if (dataToSave.dailyActivity && dataToSave.trainingFrequency) {
            const { error: activityError } = await supabase
              .from('user_nutrition_settings')
              .update({
                daily_activity: dataToSave.dailyActivity,
                training_frequency: dataToSave.trainingFrequency,
              })
              .eq('user_id', user.id);

            if (activityError) {
              console.error('[Onboarding] Error saving activity levels:', activityError);
              throw activityError;
            }
          }
          break;

        case OnboardingStep.PROFILE:
          await supabase
            .from('users')
            .update({
              date_of_birth: dataToSave.dateOfBirth?.toISOString().split('T')[0],
              sex: dataToSave.sex,
            })
            .eq('id', user.id);
          break;

        case OnboardingStep.UNITS:
          await supabase.from('user_preferences').upsert(
            {
              user_id: user.id,
              weight_unit: dataToSave.weightUnit,
              distance_unit: dataToSave.distanceUnit,
              pace_unit: dataToSave.paceUnit,
              energy_unit: dataToSave.energyUnit,
            },
            { onConflict: 'user_id' },
          );
          break;

        case OnboardingStep.HEALTH:
          // Coming Soon - no action needed
          break;

        case OnboardingStep.CONSENT:
          await supabase.from('user_preferences').upsert(
            {
              user_id: user.id,
              health_data_consent: dataToSave.healthDataConsent,
            },
            { onConflict: 'user_id' },
          );
          break;
      }

      return true;
    } catch (error) {
      console.error('[Onboarding] Error saving step data:', error);
      return false;
    }
  };

  const updateOnboardingStep = async (nextStep: number): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase.from('users').update({ onboarding_step: nextStep }).eq('id', user.id);

      if (error) throw error;
      setCurrentStep(nextStep as OnboardingStep);
      return true;
    } catch (error) {
      console.error('[Onboarding] Error updating step:', error);
      return false;
    }
  };

  const saveAndNext = useCallback(
    async (dataOverride?: Partial<OnboardingData>): Promise<boolean> => {
      setSaving(true);
      try {
        // Pass the override down to saveStepData
        const saved = await saveStepData(dataOverride);
        if (!saved) return false;

        const nextStep = currentStep === OnboardingStep.PROFILE ? OnboardingStep.HEALTH : currentStep + 1;
        if (nextStep > TOTAL_ONBOARDING_STEPS) {
          // Complete!
          // AUTO-CALCULATION: Calculate initial nutrition targets and save to user_goals
          try {
            const finalData = { ...data, ...dataOverride }; // Ensure we use latest data
            if (
              finalData.sex &&
              finalData.dateOfBirth &&
              finalData.heightCm &&
              finalData.weightKg &&
              finalData.dailyActivity &&
              finalData.trainingFrequency &&
              finalData.primaryGoal
            ) {
              const goalModeMap: Record<string, GoalMode> = {
                lose_weight: 'lose',
                maintain: 'maintain',
                gain_muscle: 'gain',
                gain_strength: 'gain',
                recomp: 'recomp',
              };
              const goalMode = goalModeMap[finalData.primaryGoal] || 'maintain';

              const result = computeKcalAndMacros(
                {
                  sex: finalData.sex,
                  date_of_birth: finalData.dateOfBirth.toISOString().split('T')[0],
                  height_cm: finalData.heightCm,
                  weight_kg: finalData.weightKg,
                },
                {
                  activity_level: computeActivityLevel(finalData.dailyActivity, finalData.trainingFrequency),
                  daily_activity: finalData.dailyActivity,
                  training_frequency: finalData.trainingFrequency,
                  goal_mode: goalMode,
                  adjustment_type: 'percent',
                  adjustment_value: 0,
                },
              );

              // Save to user_goals (Manual Targets Source)
              if (user) {
                await supabase.from('user_goals').insert({
                  user_id: user.id,
                  goal_type: 'nutrition',
                  target_calories_kcal: result.target_kcal,
                  target_protein_g: result.protein_g,
                  target_carbs_g: result.carbs_g,
                  target_fats_g: result.fat_g,
                  description: goalMode, // Optional description
                  is_active: true,
                });
                console.log('[Onboarding] Initial nutrition goals calculated and saved.');
              }
            }
          } catch (calcError) {
            console.error('[Onboarding] Error calculating initial goals:', calcError);
            // Don't block completion if calc fails, user can set it later
          }

          // Set step to indicate finished
          return await updateOnboardingStep(TOTAL_ONBOARDING_STEPS + 1);
        }

        return await updateOnboardingStep(nextStep);
      } finally {
        setSaving(false);
      }
    },
    [currentStep, data, user?.id],
  );

  const skip = useCallback(async (): Promise<boolean> => {
    if (!SKIPPABLE_STEPS.includes(currentStep)) return false;

    setSaving(true);
    try {
      const nextStep = currentStep + 1;
      return await updateOnboardingStep(nextStep);
    } finally {
      setSaving(false);
    }
  }, [currentStep, user?.id]);

  return {
    currentStep,
    data,
    loading,
    saving,
    isComplete: currentStep > TOTAL_ONBOARDING_STEPS,
    updateData,
    saveAndNext,
    skip,
    checkUsernameAvailable,
    canSkipCurrentStep: SKIPPABLE_STEPS.includes(currentStep),
  };
};
