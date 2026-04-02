import {
  ActivityLevel,
  AdjustmentType,
  DailyActivity,
  GoalMode,
  Sex,
  TrainingFrequency,
} from '../../../types/requests.types';

export type NutritionSettings = {
  // New Fields (Optional to support migration)
  daily_activity?: DailyActivity | null;
  training_frequency?: TrainingFrequency | null;

  // Legacy Field (Maintained for fallback)
  activity_level: ActivityLevel;

  goal_mode: GoalMode;
  adjustment_type: AdjustmentType;
  adjustment_value: number;
  protein_g_per_kg?: number | null;
  fat_g_per_kg?: number | null;
  min_fat_g?: number | null;
  min_carbs_g?: number | null;
};

export type UserAnthro = {
  sex: Sex;
  date_of_birth: string; // "YYYY-MM-DD"
  height_cm: number;
  weight_kg: number;
};

export type NutritionResult = {
  age: number;
  bmr_kcal: number;
  tdee_kcal: number;
  target_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  multipliers: {
    activity_multiplier: number;
    applied_adjustment_kcal: number;
  };
};

// Legacy Multipliers (Fallback)
const LEGACY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
};

// --- Helpers ---

function roundInt(x: number): number {
  return Math.round(x);
}

function calcAge(dateOfBirthISO: string, today = new Date()): number {
  const dob = new Date(dateOfBirthISO + 'T00:00:00');
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}

function calcBmrMifflin(params: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const { sex, weightKg, heightCm, age } = params;
  let s = 5; // Male
  if (sex === 'female') s = -161;
  if (sex === 'other' || sex === 'prefer_not_to_say') s = -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

// --- HYBRID CALCULATION LOGIC ---

function getCompositeMultiplier(daily: DailyActivity, training: TrainingFrequency): number {
  // A. Base according to Daily Activity (NEAT)
  let base = 1.2;
  switch (daily) {
    case 'sedentary':
      base = 1.15; // Lower than standard 1.2 to separate true sedentary
      break;
    case 'active': // "De Pie / Activo"
      base = 1.35;
      break;
    case 'physical': // "Físico / Exigente"
      base = 1.55;
      break;
  }

  // B. Adder according to Training Frequency (EAT)
  let adder = 0;
  switch (training) {
    case 'none':
      adder = 0;
      break;
    case 'occasional': // 1-3 days
      adder = 0.2;
      break;
    case 'frequent': // 4-6 days
      adder = 0.4;
      break;
    case 'athlete': // 7+ or double sessions
      adder = 0.75;
      break;
  }

  // Round to avoiding long decimals
  return parseFloat((base + adder).toFixed(3));
}

// --- MAIN FUNCTION ---

export function computeKcalAndMacros(
  user: UserAnthro,
  settings: NutritionSettings,
  today = new Date(),
): NutritionResult {
  // 1. Validations
  if (!user.date_of_birth || !user.height_cm || !user.weight_kg) {
    throw new Error('Faltan datos del usuario (fecha nacimiento, altura o peso)');
  }

  const age = calcAge(user.date_of_birth, today);

  // 2. Calculate BMR
  const bmr = calcBmrMifflin({
    sex: user.sex,
    weightKg: user.weight_kg,
    heightCm: user.height_cm,
    age,
  });

  // 3. Calculate TDEE (Hybrid Approach)
  let activityMultiplier = 1.2;

  // Use new hybrid logic if data is available
  if (settings.daily_activity && settings.training_frequency) {
    activityMultiplier = getCompositeMultiplier(settings.daily_activity, settings.training_frequency);
  } else {
    // Fallback to legacy system
    activityMultiplier = LEGACY_MULTIPLIER[settings.activity_level] ?? 1.2;
  }

  const tdee = bmr * activityMultiplier;

  // 4. Determine Target Calories
  let adjustmentKcal = 0;

  if (settings.goal_mode !== 'maintain') {
    if (settings.adjustment_type === 'percent') {
      const p = Math.min(settings.adjustment_value, 0.35); // Cap at 35%
      adjustmentKcal = tdee * p;
    } else {
      adjustmentKcal = settings.adjustment_value;
    }
  }

  let target = tdee;
  if (settings.goal_mode === 'lose' || settings.goal_mode === 'recomp') {
    target = tdee - adjustmentKcal;
  } else if (settings.goal_mode === 'gain') {
    target = tdee + adjustmentKcal;
  }

  // SAFETY FLOOR
  const minSafeKcal = user.sex === 'female' ? 1200 : 1500;
  if (target < minSafeKcal && settings.goal_mode === 'lose') {
    target = minSafeKcal;
    // Re-calculate adjustment for display purposes
    adjustmentKcal = tdee - target;
  }

  // 5. Macro Distribution
  let pPerKg = settings.protein_g_per_kg;
  if (!pPerKg) {
    if (settings.goal_mode === 'gain') pPerKg = 1.8;
    else if (settings.goal_mode === 'lose') pPerKg = 2.0;
    else pPerKg = 1.8;
  }

  let fPerKg = settings.fat_g_per_kg;
  if (!fPerKg) {
    if (settings.goal_mode === 'gain') fPerKg = 1.0;
    else fPerKg = 0.8;
  }

  let protein_g = user.weight_kg * pPerKg;
  let fat_g = user.weight_kg * fPerKg;

  // Absolute minimum fat
  const absMinFat = Math.max(settings.min_fat_g ?? 0, user.weight_kg * 0.5);
  fat_g = Math.max(fat_g, absMinFat);

  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const availableForCarbs = target - proteinKcal - fatKcal;
  let carbs_g = availableForCarbs / 4;

  // 6. Rescue Logic (Waterfall) for Low Calories
  const minCarbsG = settings.min_carbs_g ?? 50;

  if (carbs_g < minCarbsG) {
    // We need more calories for carbs. Try to take from fats first.
    const currentFatKcal = fat_g * 9;
    const minFatKcal = absMinFat * 9;
    const fatBufferKcal = currentFatKcal - minFatKcal;
    const kcalNeeded = minCarbsG * 4 - availableForCarbs;

    if (fatBufferKcal >= kcalNeeded) {
      fat_g -= kcalNeeded / 9;
      // Re-calc available for carbs (implicitly done by setting carbs to min)
    } else {
      // Take all buffer from fat
      fat_g = absMinFat;
      const remainingDeficit = kcalNeeded - fatBufferKcal;

      // Now try to take from protein
      const minProteinG = user.weight_kg * 1.6; // Don't go below 1.6g/kg
      const proteinBufferKcal = protein_g * 4 - minProteinG * 4;

      if (proteinBufferKcal >= remainingDeficit) {
        protein_g -= remainingDeficit / 4;
      } else {
        // We hit all floors. We must increase calories.
        protein_g = minProteinG;
        // Target is redefined to fit minimums
        target = protein_g * 4 + fat_g * 9 + minCarbsG * 4;
      }
    }
    carbs_g = minCarbsG;
  }

  // 7. Final Output Handling
  const finalP = roundInt(protein_g);
  const finalF = roundInt(fat_g);
  const finalC = roundInt(carbs_g);
  const finalTarget = finalP * 4 + finalF * 9 + finalC * 4;

  return {
    age,
    bmr_kcal: roundInt(bmr),
    tdee_kcal: roundInt(tdee),
    target_kcal: finalTarget,
    protein_g: finalP,
    fat_g: finalF,
    carbs_g: finalC,
    multipliers: {
      activity_multiplier: activityMultiplier,
      applied_adjustment_kcal: roundInt(tdee - finalTarget),
    },
  };
}
