import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alert } from 'react-native';
import { AdjustmentType, GoalMode, PrimaryGoalMode, SportType, UserGoalUpdate } from '../../types/requests.types';
import { computeKcalAndMacros } from '../../modules/nutrition/algorithms/nutritionCalculator';
import { useAuth } from '../../context/AuthContext';
import { Nullable } from '../../types/common.types';

export interface SportGoal {
  id: string;
  sport_type: SportType;
  target_distance_m: number;
  target_time_s: number | null;
  target_power_w: number | null; // Solo ciclismo
  is_active: boolean;
  description: string | null;
}

export interface NutritionGoals {
  target_calories_kcal: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fats_g: number | null;
  focus: Nullable<GoalMode>;
}

export interface SettingsGoals {
  mainGoal: Nullable<PrimaryGoalMode>;
  sportGoals: SportGoal[];
  nutritionGoals: NutritionGoals;
}

export const useSettingsGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SettingsGoals>({
    mainGoal: null,
    sportGoals: [],
    nutritionGoals: {
      target_calories_kcal: null,
      target_protein_g: null,
      target_carbs_g: null,
      target_fats_g: null,
      focus: null,
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Fetch user_goals (Sport + Manual Nutrition)
      const { data: userGoalsData, error: userGoalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id);

      if (userGoalsError) throw userGoalsError;

      // Fetch user_nutrition_settings (Main Goal)
      const { data: nutritionSettings, error: nutritionSettingsError } = await supabase
        .from('user_nutrition_settings')
        .select('primary_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      if (nutritionSettingsError) console.error('Error fetching nutrition settings:', nutritionSettingsError);

      // Parse goals
      const nutritionRecord = userGoalsData?.find(g => g.goal_type === 'nutrition');
      const sportRecords =
        userGoalsData?.filter(g => ['running', 'cycling', 'swimming'].includes(g.sport_type || '')) || [];

      // Determine main goal from new table
      let mainGoal: Nullable<PrimaryGoalMode> = null;
      if (nutritionSettings?.primary_goal) {
        mainGoal = nutritionSettings.primary_goal;
      }

      // Parse sport goals
      const sportGoals: SportGoal[] = sportRecords.map(g => ({
        id: g.id,
        sport_type: g.sport_type as SportType,
        target_distance_m: g.target_distance_m || 0,
        target_time_s: g.target_time_s,
        target_power_w: g.target_power_w,
        is_active: g.is_active ?? true,
        description: g.description,
      }));

      // Parse nutrition goals
      const nutritionGoals: NutritionGoals = {
        target_calories_kcal: nutritionRecord?.target_calories_kcal || null,
        target_protein_g: nutritionRecord?.target_protein_g || null,
        target_carbs_g: nutritionRecord?.target_carbs_g || null,
        target_fats_g: nutritionRecord?.target_fats_g || null,
        focus: (nutritionRecord?.description as GoalMode) || null,
      };

      setGoals({
        mainGoal,
        sportGoals,
        nutritionGoals,
      });
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateMainGoal = async (goal: Nullable<PrimaryGoalMode>) => {
    try {
      if (!user) return false;

      if (!goal) return false;

      const getSettingsFromGoal = (
        g: PrimaryGoalMode,
      ): {
        goal_mode: GoalMode;
        adjustment_type: AdjustmentType;
        adjustment_value: number;
        protein_g_per_kg: number;
      } => {
        switch (g) {
          case 'gain_strength':
            return {
              goal_mode: 'gain',
              adjustment_type: 'kcal',
              adjustment_value: 150,
              protein_g_per_kg: 2.0,
            };
          case 'gain_muscle':
            return {
              goal_mode: 'gain',
              adjustment_type: 'percent',
              adjustment_value: 0.15,
              protein_g_per_kg: 1.8,
            };
          case 'recomp':
            return {
              goal_mode: 'recomp',
              adjustment_type: 'percent',
              adjustment_value: 0,
              protein_g_per_kg: 2.2,
            };
          case 'lose_weight':
            return {
              goal_mode: 'lose',
              adjustment_type: 'percent',
              adjustment_value: 0.2,
              protein_g_per_kg: 2.0,
            };
          case 'maintain':
          default:
            return {
              goal_mode: 'maintain',
              adjustment_type: 'kcal',
              adjustment_value: 0,
              protein_g_per_kg: 1.6,
            };
        }
      };

      const newSettings = getSettingsFromGoal(goal);

      // Fetch existing settings (to preserve activity) + New Fields
      const { data: existingSettings } = await supabase
        .from('user_nutrition_settings')
        .select('activity_level, daily_activity, training_frequency')
        .eq('user_id', user.id)
        .maybeSingle();

      const activityLevel = existingSettings?.activity_level || 'moderate';
      const dailyActivity = existingSettings?.daily_activity;
      const trainingFrequency = existingSettings?.training_frequency;

      // Update user_nutrition_settings
      const { error } = await supabase.from('user_nutrition_settings').upsert(
        {
          user_id: user.id,
          primary_goal: goal,
          goal_mode: newSettings.goal_mode,
          adjustment_type: newSettings.adjustment_type,
          adjustment_value: newSettings.adjustment_value,
          protein_g_per_kg: newSettings.protein_g_per_kg,
          activity_level: activityLevel,
          daily_activity: dailyActivity,
          training_frequency: trainingFrequency,
        },
        { onConflict: 'user_id' },
      );

      if (error) throw error;

      // --- AUTO-CALCULATION START ---
      // Fetch User Profile for Calculation
      const { data: userData } = await supabase
        .from('users')
        .select('sex, date_of_birth, height_cm')
        .eq('id', user.id)
        .single();

      // Fetch Latest Weight
      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('weight_kg')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userData && weightData) {
        // Run Calculation
        const result = computeKcalAndMacros(
          {
            sex: userData.sex!,
            date_of_birth: userData.date_of_birth!,
            height_cm: userData.height_cm!,
            weight_kg: weightData.weight_kg,
          },
          {
            activity_level: activityLevel,
            daily_activity: dailyActivity,
            training_frequency: trainingFrequency,
            goal_mode: newSettings.goal_mode,
            adjustment_type: newSettings.adjustment_type,
            adjustment_value: newSettings.adjustment_value,
            protein_g_per_kg: newSettings.protein_g_per_kg,
            fat_g_per_kg: null,
          },
        );

        // Save Calculated Macros to user_goals
        const existingNutritionGoal = goals.nutritionGoals.target_calories_kcal
          ? { id: await getNutritionGoalId(user.id) }
          : null;

        const updateData: UserGoalUpdate = {
          target_calories_kcal: result.target_kcal,
          target_protein_g: result.protein_g,
          target_carbs_g: result.carbs_g,
          target_fats_g: result.fat_g,
          description: newSettings.goal_mode,
        };

        if (existingNutritionGoal?.id) {
          await supabase.from('user_goals').update(updateData).eq('id', existingNutritionGoal.id);
        } else {
          // Helper to check if exists didn't find it effectively or just in case
          const { data: existing } = await supabase
            .from('user_goals')
            .select('id')
            .eq('user_id', user.id)
            .eq('goal_type', 'nutrition')
            .maybeSingle();

          if (existing) {
            await supabase.from('user_goals').update(updateData).eq('id', existing.id);
          } else {
            await supabase.from('user_goals').insert({
              user_id: user.id,
              goal_type: 'nutrition',
              ...updateData,
            });
          }
        }
      }
      // --- AUTO-CALCULATION END ---

      await fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  // Helper to get ID internally if needed
  const getNutritionGoalId = async (userId: string) => {
    const { data } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('goal_type', 'nutrition')
      .maybeSingle();
    return data?.id;
  };

  const addSportGoal = async (goal: Omit<SportGoal, 'id'>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      await supabase.from('user_goals').insert({
        user_id: user.id,
        goal_type: 'sport',
        sport_type: goal.sport_type,
        target_distance_m: goal.target_distance_m,
        target_time_s: goal.target_time_s,
        target_power_w: goal.target_power_w,
        is_active: goal.is_active,
        description: goal.description,
      });

      await fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  const updateSportGoal = async (id: string, updates: Partial<SportGoal>) => {
    try {
      await supabase.from('user_goals').update(updates).eq('id', id);

      await fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  const deleteSportGoal = async (id: string) => {
    try {
      await supabase.from('user_goals').delete().eq('id', id);
      await fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  const updateNutritionGoals = async (updates: Partial<NutritionGoals>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if nutrition goal exists (Legacy/Manual Override)
      const { data: existing } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_type', 'nutrition')
        .maybeSingle();

      const updateData: UserGoalUpdate = {};
      if (updates.target_calories_kcal !== undefined) updateData.target_calories_kcal = updates.target_calories_kcal;
      if (updates.target_protein_g !== undefined) updateData.target_protein_g = updates.target_protein_g;
      if (updates.target_carbs_g !== undefined) updateData.target_carbs_g = updates.target_carbs_g;
      if (updates.target_fats_g !== undefined) updateData.target_fats_g = updates.target_fats_g;
      if (updates.focus !== undefined) updateData.description = updates.focus;

      if (existing) {
        await supabase.from('user_goals').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('user_goals').insert({
          user_id: user.id,
          goal_type: 'nutrition',
          ...updateData,
        });
      }

      await fetchGoals();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', message);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [fetchGoals, user]);

  return {
    goals,
    loading,
    updateMainGoal,
    addSportGoal,
    updateSportGoal,
    deleteSportGoal,
    updateNutritionGoals,
    refetch: fetchGoals,
  };
};
