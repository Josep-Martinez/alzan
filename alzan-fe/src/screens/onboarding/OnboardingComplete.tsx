import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useOnboardingStyles } from '../../hooks/useOnboardingStyles';
import { OnboardingBackButton } from '../../components/OnboardingBackButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TOTAL_ONBOARDING_STEPS } from '../../types/onboarding.types';
import { computeKcalAndMacros } from '../../modules/nutrition/algorithms/nutritionCalculator';
import { GoalMode } from '../../types/requests.types';
import { useTranslation } from 'react-i18next';
import { Alert } from '../../components/common/Alert';

export const OnboardingComplete = () => {
  const { t } = useTranslation();
  const { styles } = useOnboardingStyles();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Celebration animation sequence
    Animated.sequence([
      // Icon pop-in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Text fade-in and slide
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const calculateAndSaveGoals = async (userId: string) => {
    try {
      // 1. Fetch user metrics
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('sex, date_of_birth, height_cm')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // 2. Fetch nutrition settings (goal & activity)
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_nutrition_settings')
        .select('primary_goal, activity_level')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // 3. Fetch latest weight
      const { data: weightData, error: weightError } = await supabase
        .from('weight_logs')
        .select('weight_kg')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weightError) throw weightError;

      // Check if we have enough data to calculate
      if (
        userData?.sex &&
        userData?.date_of_birth &&
        userData?.height_cm &&
        weightData?.weight_kg &&
        settingsData?.primary_goal &&
        settingsData?.activity_level
      ) {
        const goalModeMap: Record<string, GoalMode> = {
          lose_weight: 'lose',
          maintain: 'maintain',
          gain_muscle: 'gain',
          gain_strength: 'gain',
          recomp: 'recomp',
        };
        const goalMode = goalModeMap[settingsData.primary_goal] || 'maintain';

        // Compute
        const result = computeKcalAndMacros(
          {
            sex: userData.sex,
            date_of_birth: userData.date_of_birth,
            height_cm: userData.height_cm,
            weight_kg: weightData.weight_kg,
          },
          {
            activity_level: settingsData.activity_level,
            goal_mode: goalMode,
            adjustment_type: 'percent',
            adjustment_value: 0,
          },
        );

        console.log('[OnboardingComplete] Calculated targets:', result);

        // Save to user_goals
        const { error: insertError } = await supabase.from('user_goals').insert({
          user_id: userId,
          goal_type: 'nutrition',
          target_calories_kcal: result.target_kcal,
          target_protein_g: result.protein_g,
          target_carbs_g: result.carbs_g,
          target_fats_g: result.fat_g,
          description: `Objetivo inicial: ${settingsData.primary_goal}`,
          is_active: true,
        });

        if (insertError) throw insertError;
      } else {
        console.log('[OnboardingComplete] Not enough data for auto-calculation. Skipping.');
      }
    } catch (error) {
      console.error('[OnboardingComplete] Error calculating/saving goals:', error);
      // Non-blocking error, user can set goals manually later
    }
  };

  const handleGoToHome = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // New step: Auto-calculate and save goals
      await calculateAndSaveGoals(user.id);

      // 1. Update user step to complete (> 8)
      const { error } = await supabase
        .from('users')
        .update({ onboarding_step: TOTAL_ONBOARDING_STEPS + 1 })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating onboarding step:', error);
        throw error;
      }

      // 2. Refresh session to trigger RootNavigator update
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      Alert.alert(t('common.error'), t('onboarding.finishRegistrationError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.completeContainer}>
        <Animated.Text
          style={[
            styles.completeIcon,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          🎉
        </Animated.Text>

        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.completeTitle}>{t('onboarding.allSet')}</Text>
          <Text style={styles.completeSubtitle}>{t('onboarding.profileSetupSuccess')}</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomContainer}>
        <OnboardingBackButton />
        <PrimaryButton title={t('onboarding.goHome')} onPress={handleGoToHome} loading={loading} />
      </View>
    </View>
  );
};
