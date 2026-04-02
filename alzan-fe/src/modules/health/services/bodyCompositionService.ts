/**
 * Body Composition Service
 * Auto-calculates BMI, body fat, and muscle mass when weight or measurements are inserted
 * Uses adaptive algorithm selection based on available data
 */

import { supabase } from '../../../lib/supabaseClient';
import { Nullable } from '../../../types/common.types';
import { MaleOrFemale, MeasurementType, WeightLogUpdate } from '../../../types/requests.types';
import { calculateBodyComposition, BodyCompositionResult } from '../algorithms/bodyComposition';

interface UserProfile {
  height_cm: number | null;
  date_of_birth: string | null;
  sex: Nullable<MaleOrFemale>;
}

type AllMeasurements = { [key in MeasurementType]?: number };

export interface ManualRecalculateResult {
  success: boolean;
  unchanged?: boolean;
  errorCode?:
    | 'limit_reached'
    | 'weight_missing'
    | 'height_missing'
    | 'insufficient_data'
    | 'unexpected_error'
    | 'user_not_found';
  errorValues?: Record<string, string | number>;
}

export const bodyCompositionService = {
  /**
   * Recalculates body composition for a weight log entry
   * Called after weight is inserted (if bodyfat_percent not provided)
   */
  async recalculateForWeight(userId: string, weightLogId: string, weightKg: number): Promise<void> {
    try {
      // 1. Get user profile
      const profile = await this.getUserProfile(userId);
      if (!profile || !profile.height_cm) {
        console.log('[BodyComp] No height in profile, skipping calculation');
        return;
      }

      // 2. Get ALL latest measurements (not just abdomen/hip)
      const measurements = await this.getAllLatestMeasurements(userId);

      // 3. Calculate age
      const age = this.calculateAge(profile.date_of_birth);
      const sex = profile.sex || 'male';

      // 4. Calculate full body composition using adaptive algorithms
      const result = calculateBodyComposition({
        weightKg,
        heightCm: profile.height_cm,
        age,
        sex,
        measurements: {
          abdomen: measurements.abdomen,
          hips: measurements.hips,
          chest: measurements.chest,
          arm: measurements.arm,
          thigh: measurements.thigh,
        },
      });

      // If we couldn't estimate body fat, skip update
      if (!result.bodyFat) {
        console.log('[BodyComp] Could not estimate body fat, insufficient data');
        return;
      }

      // 5. Update the weight log with calculated values
      const updatePayload: WeightLogUpdate = {
        bodyfat_percent: result.bodyFat.percentage,
      };

      if (result.muscle) {
        updatePayload.muscle_mass_kg = result.muscle.massKg;
      }

      const { error } = await supabase.from('weight_logs').update(updatePayload).eq('id', weightLogId);

      if (error) {
        console.error('[BodyComp] Error updating weight log:', error);
      } else {
        console.log(
          `[BodyComp] Updated weight log ${weightLogId}: ` +
            `BF=${result.bodyFat.percentage}% (${result.bodyFat.method}), ` +
            `Muscle=${result.muscle?.massKg}kg (${result.muscle?.method})`,
        );
      }
    } catch (error) {
      console.error('[BodyComp] Error in recalculateForWeight:', error);
    }
  },

  /**
   * Recalculates body fat for the latest weight log
   * Called after a relevant measurement is inserted (abdomen, hips, etc.)
   */
  async recalculateLatestWeight(userId: string): Promise<void> {
    try {
      // Get the latest weight log
      const { data: weightLog, error } = await supabase
        .from('weight_logs')
        .select('id, weight_kg, bodyfat_percent, source')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !weightLog) {
        console.log('[BodyComp] No recent weight log to recalculate');
        return;
      }

      // Recalculate
      await this.recalculateForWeight(userId, weightLog.id, weightLog.weight_kg);
    } catch (error) {
      console.error('[BodyComp] Error in recalculateLatestWeight:', error);
    }
  },

  /**
   * Get full body composition for display (used by hooks)
   */
  async getBodyComposition(userId: string, weightKg: number): Promise<BodyCompositionResult | null> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile || !profile.height_cm) return null;

      const measurements = await this.getAllLatestMeasurements(userId);
      const age = this.calculateAge(profile.date_of_birth);
      const sex = (profile.sex as 'male' | 'female') || 'male';

      return calculateBodyComposition({
        weightKg,
        heightCm: profile.height_cm,
        age,
        sex,
        measurements: {
          abdomen: measurements.abdomen,
          hips: measurements.hips,
          chest: measurements.chest,
          arm: measurements.arm,
          thigh: measurements.thigh,
        },
      });
    } catch (error) {
      console.error('[BodyComp] Error in getBodyComposition:', error);
      return null;
    }
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('height_cm, date_of_birth, sex')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as UserProfile;
  },

  /**
   * Get ALL latest measurements for body composition algorithms
   */
  async getAllLatestMeasurements(userId: string): Promise<AllMeasurements> {
    const relevantTypes: MeasurementType[] = ['abdomen', 'hips', 'chest', 'arm', 'thigh'];
    const measurements: AllMeasurements = {};

    const MEASUREMENT_VALIDITY_DAYS = 14;
    const now = new Date();

    for (const type of relevantTypes) {
      const { data } = await supabase
        .from('body_measurements')
        .select('value_cm, measured_at')
        .eq('user_id', userId)
        .eq('measurement_type', type)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        // Check if measurement is recent enough
        const measuredAt = new Date(data.measured_at);
        const daysDiff = (now.getTime() - measuredAt.getTime()) / (1000 * 3600 * 24);

        if (daysDiff <= MEASUREMENT_VALIDITY_DAYS) {
          // Only set if not already set (prioritize whichever comes first or is found)
          if (!measurements[type]) {
            measurements[type] = data.value_cm;
          }
          console.log(`[BodyComp] Using recent ${type}: ${data.value_cm}cm (${Math.round(daysDiff)} days old)`);
        } else {
          console.log(`[BodyComp] Ignoring old ${type} (${Math.round(daysDiff)} days old)`);
        }
      }
    }

    return measurements;
  },

  calculateAge(dateOfBirth: string | null): number {
    if (!dateOfBirth) return 30; // Default age
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },

  /**
   * Count how many weight logs have been updated today (for daily limit)
   * We check by looking at the updated_at field for today's date
   */
  async getTodayRecalculationCount(userId: string): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { count, error } = await supabase
      .from('weight_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('measured_at', startOfDay)
      .lt('measured_at', endOfDay);

    if (error) {
      console.error('[BodyComp] Error counting today recalculations:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Manual recalculation with daily limit (max 2 per day)
   * Only saves if values actually change
   * Returns: { success: boolean, error?: string, unchanged?: boolean }
   */
  async manualRecalculate(userId: string): Promise<ManualRecalculateResult> {
    const MAX_DAILY_RECALCULATIONS = 2;

    try {
      // Check daily limit (locally)
      const todayCount = await this.getTodayRecalculationCount(userId);
      if (todayCount >= MAX_DAILY_RECALCULATIONS) {
        return {
          success: false,
          errorCode: 'limit_reached',
          errorValues: { count: MAX_DAILY_RECALCULATIONS },
        };
      }

      // Get the latest weight log with current values
      const { data: weightLog, error: fetchError } = await supabase
        .from('weight_logs')
        .select('id, weight_kg, bodyfat_percent, muscle_mass_kg')
        .eq('user_id', userId)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !weightLog) {
        return {
          success: false,
          errorCode: 'weight_missing',
        };
      }

      // Get profile and measurements to calculate new values
      const profile = await this.getUserProfile(userId);
      if (!profile || !profile.height_cm) {
        return { success: false, errorCode: 'height_missing' };
      }

      const measurements = await this.getAllLatestMeasurements(userId);
      const age = this.calculateAge(profile.date_of_birth);
      const sex = (profile.sex as 'male' | 'female') || 'male';

      const result = calculateBodyComposition({
        weightKg: weightLog.weight_kg,
        heightCm: profile.height_cm,
        age,
        sex,
        measurements: {
          abdomen: measurements.abdomen,
          hips: measurements.hips,
          chest: measurements.chest,
          arm: measurements.arm,
          thigh: measurements.thigh,
        },
      });

      if (!result.bodyFat) {
        return { success: false, errorCode: 'insufficient_data' };
      }

      // Check if values are meaningfully different (>0.1 difference)
      const currentBF = weightLog.bodyfat_percent || 0;
      const newBF = result.bodyFat.percentage;
      const currentMuscle = weightLog.muscle_mass_kg || 0;
      const newMuscle = result.muscle?.massKg || 0;

      const bfDiff = Math.abs(newBF - currentBF);
      const muscleDiff = Math.abs(newMuscle - currentMuscle);

      if (bfDiff < 0.1 && muscleDiff < 0.1) {
        // Values are essentially the same, no need to save
        return {
          success: true,
          unchanged: true,
        };
      }

      // Values are different, create a new record
      // We must copy weight_kg as it is NOT NULL in the database
      // The user suggested weight could be null, but schema forbids it, so we replicate the latest weight
      const { error: insertError } = await supabase.from('weight_logs').insert({
        user_id: userId,
        weight_kg: weightLog.weight_kg,
        bodyfat_percent: result.bodyFat.percentage,
        muscle_mass_kg: result.muscle?.massKg,
        measured_at: new Date().toISOString(),
        source: 'manual', // Treated as a manual entry/recalculation
      });

      if (insertError) {
        throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error('[BodyComp] Error in manualRecalculate:', error);
      return {
        success: false,
        errorCode: 'unexpected_error',
      };
    }
  },
};
