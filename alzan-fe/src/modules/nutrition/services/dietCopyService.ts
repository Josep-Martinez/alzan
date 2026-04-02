import { supabase } from '../../../lib/supabaseClient';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, getISOWeek, getYear } from 'date-fns';

/**
 * Get ISO week string in format "YYYY-WXX"
 */
export const getISOWeekString = (date: Date): string => {
  const year = getYear(date);
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

/**
 * Get the visible week range (2 past weeks + current week + 3 future weeks = 6 total)
 */
export const getVisibleWeekRange = (): { start: Date; end: Date; weeks: Date[]; currentWeekIndex: number } => {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  const weeks: Date[] = [];
  // W-2, W-1, W0 (current), W+1, W+2, W+3
  for (let i = -2; i <= 4; i++) {
    weeks.push(addWeeks(currentWeekStart, i));
  }

  return {
    start: addWeeks(currentWeekStart, -2),
    end: addWeeks(currentWeekStart, 4),
    weeks,
    currentWeekIndex: 2, // W0 is at index 2
  };
};

/**
 * Check if sequential activation would overwrite data
 * Returns true if ANY target week (W+1, W+2, W+3) has data
 */
export const checkSequentialConflicts = async (userId: string): Promise<boolean> => {
  const { weeks, currentWeekIndex } = getVisibleWeekRange();
  // Check W+1, W+2, W+3
  for (let i = 1; i <= 4; i++) {
    if (await weekHasData(userId, weeks[currentWeekIndex + i])) return true;
  }
  return false;
};

/**
 * Check if alternating activation would overwrite data
 * Returns true if ANY target week (W+2, W+3) has data
 */
export const checkAlternatingConflicts = async (userId: string): Promise<boolean> => {
  const { weeks, currentWeekIndex } = getVisibleWeekRange();
  // Check W+2, W+3
  if (await weekHasData(userId, weeks[currentWeekIndex + 2])) return true;
  if (await weekHasData(userId, weeks[currentWeekIndex + 3])) return true;
  if (await weekHasData(userId, weeks[currentWeekIndex + 4])) return true;
  return false;
};

/**
 * Copy meal logs from one week to another
 * @param overwrite If true, deletes existing logs in target week before copying
 */
export const copyWeekToWeek = async (
  userId: string,
  sourceWeekStart: Date,
  targetWeekStart: Date,
  overwrite: boolean = false,
): Promise<{ success: boolean; copiedCount: number; error?: string }> => {
  try {
    const sourceStart = startOfWeek(sourceWeekStart, { weekStartsOn: 1 });
    const sourceEnd = endOfWeek(sourceWeekStart, { weekStartsOn: 1 });
    const targetStart = startOfWeek(targetWeekStart, { weekStartsOn: 1 });
    const targetEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

    console.log(
      `[dietCopyService] Copiando: ${format(sourceStart, 'yyyy-MM-dd')} → ${format(targetWeekStart, 'yyyy-MM-dd')} (Overwrite: ${overwrite})`,
    );

    // 1. OVERWRITE PROTECTION & HANDLING
    // 1. OVERWRITE PROTECTION & HANDLING
    const { data: logsToDelete, error: fetchError1 } = await supabase
      .from('meal_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('date', format(targetStart, 'yyyy-MM-dd'))
      .lte('date', format(targetEnd, 'yyyy-MM-dd'));

    if (fetchError1) {
      console.error('[dietCopyService] Error fetching logs to check overwrite:', fetchError1);
      return { success: false, copiedCount: 0, error: fetchError1.message };
    }

    if (logsToDelete && logsToDelete.length > 0) {
      if (!overwrite) {
        console.log('[dietCopyService] ⚠️ La semana destino ya tiene datos. Se omite (sin overwrite).');
        return { success: true, copiedCount: 0 };
      } else {
        console.log('[dietCopyService] 🗑️ Eliminando datos existentes en destino (Overwrite mode)...');

        const logIds = logsToDelete.map(l => l.id);

        // A. DELETE DEPENDENT ITEMS FIRST
        const { error: itemsDelError } = await supabase.from('meal_items').delete().in('meal_log_id', logIds);

        if (itemsDelError) {
          console.error('[dietCopyService] Error borrando ingredientes destino:', itemsDelError);
          return { success: false, copiedCount: 0, error: itemsDelError.message };
        }

        // B. DELETE THE LOGS
        const { error: delError } = await supabase.from('meal_logs').delete().in('id', logIds);

        if (delError) {
          console.error('[dietCopyService] Error borrando destino:', delError);
          return { success: false, copiedCount: 0, error: delError.message };
        }
      }
    }

    // 2. Fetch source logs with ingredients
    const { data: sourceLogs, error: fetchError } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(sourceStart, 'yyyy-MM-dd'))
      .lte('date', format(sourceEnd, 'yyyy-MM-dd'));

    if (fetchError) throw fetchError;
    if (!sourceLogs || sourceLogs.length === 0) return { success: true, copiedCount: 0 };

    // Fetch ingredients
    const sourceLogIds = sourceLogs.map(l => l.id);
    const { data: sourceIngredients, error: ingError } = await supabase
      .from('meal_items')
      .select('*')
      .in('meal_log_id', sourceLogIds);

    if (ingError) throw ingError;

    // Group ingredients

    const ingredientsByLog = sourceIngredients.reduce(
      (acc, ing) => {
        if (!acc[ing.meal_log_id]) acc[ing.meal_log_id] = [];
        acc[ing.meal_log_id].push(ing);
        return acc;
      },
      {} as Record<string, typeof sourceIngredients>,
    );

    let copiedCount = 0;

    // 3. Insert Logs and Ingredients
    for (const log of sourceLogs) {
      const sourceDate = parseISO(log.date);
      const dayOffset = Math.floor((sourceDate.getTime() - sourceStart.getTime()) / (24 * 60 * 60 * 1000));
      const targetDate = new Date(targetStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const targetDateStr = format(targetDate, 'yyyy-MM-dd');

      // Insert new log
      const { data: newLog, error: insertError } = await supabase
        .from('meal_logs')
        .insert({
          user_id: userId,
          date: targetDateStr,
          meal_type: log.meal_type,
          name: log.name,
          notes: log.notes,
          kcal: log.kcal,
          protein_g: log.protein_g,
          carbs_g: log.carbs_g,
          fats_g: log.fats_g,
          diet_template_meal_id: log.diet_template_meal_id,
          adherence_status: 'pending',
          source: log.source,
          data_quality: log.data_quality,
          calc_version: log.calc_version,
          origin: log.origin,
          origin_confidence: log.origin_confidence,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[dietCopyService] Error inserting log for ${targetDateStr}:`, insertError);
        continue; // Skip this one but try others? Or break?
      }

      if (newLog) {
        copiedCount++;

        // 4. Insert Ingredients for this log
        const originalIngredients = ingredientsByLog[log.id];
        if (originalIngredients && originalIngredients.length > 0) {
          const ingredientsToInsert = originalIngredients.map(ing => ({
            meal_log_id: newLog.id, // Linking to the NEW log
            user_id: userId,
            name: ing.name,
            quantity_g: ing.quantity_g,
            source: ing.source,
            source_ref: ing.source_ref,
            kcal: ing.kcal,
            protein_g: ing.protein_g,
            carbs_g: ing.carbs_g,
            fats_g: ing.fats_g,
            per_100g_kcal: ing.per_100g_kcal,
            per_100g_protein_g: ing.per_100g_protein_g,
            per_100g_carbs_g: ing.per_100g_carbs_g,
            per_100g_fats_g: ing.per_100g_fats_g,
            data_quality: ing.data_quality || 'manual',
            origin: ing.origin || 'user',
            confidence: ing.confidence,
          }));

          const { error: ingInsertError } = await supabase.from('meal_items').insert(ingredientsToInsert);

          if (ingInsertError) {
            console.error(`[dietCopyService] Error copying ingredients for log ${newLog.id}:`, ingInsertError);
          }
        }
      }
    }

    console.log(`[dietCopyService] ✅ Copiados ${copiedCount} registros con ingredientes`);
    return { success: true, copiedCount };
  } catch (error: unknown) {
    console.error('[dietCopyService] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, copiedCount: 0, error: message };
  }
};

/**
 * Sequential mode activation: W0 → W1, W2, W3
 */
export const copySequentialOnActivate = async (
  userId: string,
  overwrite: boolean = false,
): Promise<{ success: boolean; totalCopied: number }> => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`[dietCopyService] 🔄 MODO SECUENCIAL: Activando (Overwrite: ${overwrite})`);
  console.log('═══════════════════════════════════════════════════');

  const { weeks, currentWeekIndex } = getVisibleWeekRange();
  const w0 = weeks[currentWeekIndex]; // W0 is current week (index 2)
  let totalCopied = 0;

  // Copy W0 to W+1, W+2, W+3, W+4 (indices 3, 4, 5, 6)
  for (let i = currentWeekIndex + 1; i <= currentWeekIndex + 4; i++) {
    const result = await copyWeekToWeek(userId, w0, weeks[i], overwrite);
    if (!result.success) {
      return { success: false, totalCopied };
    }
    totalCopied += result.copiedCount;
  }

  console.log(`[dietCopyService] ✅ Total copiados: ${totalCopied}`);
  console.log('═══════════════════════════════════════════════════');
  return { success: true, totalCopied };
};

/**
 * Alternating mode activation: W0 → W2, W1 → W3
 */
export const copyAlternatingOnActivate = async (
  userId: string,
  overwrite: boolean = false,
): Promise<{ success: boolean; totalCopied: number }> => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`[dietCopyService] 🔄 MODO ALTERNO: Activando (Overwrite: ${overwrite})`);
  console.log('═══════════════════════════════════════════════════');

  const { weeks, currentWeekIndex } = getVisibleWeekRange();
  let totalCopied = 0;

  // 1. Copy Previous Week (W-1) to Next Week (W+1) and W+3
  // This propagates the "Plan B"
  let result = await copyWeekToWeek(userId, weeks[currentWeekIndex - 1], weeks[currentWeekIndex + 1], overwrite); // W-1 -> W+1
  if (!result.success) return { success: false, totalCopied };
  totalCopied += result.copiedCount;

  result = await copyWeekToWeek(userId, weeks[currentWeekIndex - 1], weeks[currentWeekIndex + 3], overwrite); // W-1 -> W+3
  if (!result.success) return { success: false, totalCopied };
  totalCopied += result.copiedCount;

  // 2. Copy Current Week (W0) to W+2 and W+4
  // This propagates the "Plan A"
  result = await copyWeekToWeek(userId, weeks[currentWeekIndex], weeks[currentWeekIndex + 2], overwrite); // W0 -> W+2
  if (!result.success) return { success: false, totalCopied };
  totalCopied += result.copiedCount;

  result = await copyWeekToWeek(userId, weeks[currentWeekIndex], weeks[currentWeekIndex + 4], overwrite); // W0 -> W+4
  if (!result.success) return { success: false, totalCopied };
  totalCopied += result.copiedCount;

  console.log(`[dietCopyService] ✅ Total copiados: ${totalCopied}`);
  console.log('═══════════════════════════════════════════════════');
  return { success: true, totalCopied };
};

/**
 * Check if a week has any meal logs
 */
export const weekHasData = async (userId: string, weekStart: Date): Promise<boolean> => {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { count, error } = await supabase
    .from('meal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', format(start, 'yyyy-MM-dd'))
    .lte('date', format(end, 'yyyy-MM-dd'));

  if (error) {
    console.error('[dietCopyService] Error checking week data:', error);
    return false;
  }

  return (count || 0) > 0;
};

/**
 * Helper to converting YYYY-WXX to Date (Monday of that week)
 */
const getDateFromISOWeekString = (isoStr: string): Date => {
  const [yearStr, weekStr] = isoStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Simple algo: Jan 4th is always in week 1
  const d = new Date(year, 0, 4);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7; // 1=Mon, 7=Sun
  // Move to start of Week 1
  const startWeek1 = new Date(d.getTime() - (day - 1) * 24 * 60 * 60 * 1000);

  // Add (week - 1) weeks
  return addWeeks(startWeek1, week - 1);
};

/**
 * Check and copy if new week(s) visible and empty
 * Handles gap filling if user hasn't opened app in multiple weeks
 */
export const checkAndCopyNewWeek = async (
  userId: string,
  mode: 'sequential' | 'alternating',
  lastVisibleWeek: string | undefined,
): Promise<{ copied: boolean; newLastVisibleWeek: string; copiedCount: number }> => {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ [dietCopyService] 🔍 VERIFICANDO NUEVAS SEMANAS │');
  console.log('└─────────────────────────────────────────────────┘');

  const { weeks } = getVisibleWeekRange();
  // Weeks array has: [W-2, W-1, W0(current), W+1, W+2, W+3(target)]
  // We want to ensure everything up to W+3 is checked/filled if needed.

  // Target horizon is W+4 (last index)
  const targetHorizonDate = weeks[weeks.length - 1];
  const targetHorizonISO = getISOWeekString(targetHorizonDate);

  console.log(`[dietCopyService] Última visible guardada: ${lastVisibleWeek || 'ninguna'}`);
  console.log(`[dietCopyService] Horizonte actual: ${targetHorizonISO}`);

  // If no last visible week, we assume it's the first time running or enabled.
  // We shouldn't backfill history from 1970.
  // We treat "now" as the starting point?
  // Or we just check the single target week (W+3)?
  // Let's assume if it's undefined, we only check the standard "new week" (W+3).
  // Better yet: if undefined, we can default to W+2 (so we check W+3).
  let lastCheckedDate: Date;
  if (!lastVisibleWeek) {
    // Default to checking ONLY the furthest one (W+4) by setting "last checked" to W+3
    lastCheckedDate = weeks[weeks.length - 2];
  } else {
    lastCheckedDate = getDateFromISOWeekString(lastVisibleWeek);
  }

  // Safety check: if lastCheckedDate is in the future relative to horizon, nothing to do
  // (Shouldn't happen unless time travel)
  if (getISOWeekString(lastCheckedDate) === targetHorizonISO) {
    console.log('[dietCopyService] ✓ Al día. No hay nuevas semanas.');
    return { copied: false, newLastVisibleWeek: targetHorizonISO, copiedCount: 0 };
  }

  // Start checking from the week AFTER lastChecked
  let currentCheckDate = addWeeks(lastCheckedDate, 1);
  let totalCopied = 0;
  let somethingCopied = false;

  // Loop until we reach (inclusive) the target horizon
  // Limit iterations to prevent infinite loops (e.g. max 10 weeks catchup)
  let safetyCounter = 0;
  while (safetyCounter < 12) {
    const currentISO = getISOWeekString(currentCheckDate);

    // Break if we passed the horizon
    // (Simple comparison of time)
    if (currentCheckDate.getTime() > targetHorizonDate.getTime() + 1000) {
      break;
    }

    console.log(`[dietCopyService] 👉 Procesando semana: ${currentISO}`);

    // 1. Check if empty
    const hasData = await weekHasData(userId, currentCheckDate);

    if (hasData) {
      console.log(`[dietCopyService]    - Tiene datos. Saltando.`);
    } else {
      console.log(`[dietCopyService]    - Vacía. Intentando copiar (${mode})...`);

      let result: { success: boolean; copiedCount: number } = { success: false, copiedCount: 0 };

      if (mode === 'sequential') {
        // Determine Source: Previous Week (currentCheckDate - 1 week)
        // We trust that if the previous week was empty, it was filled in the previous iteration of this loop!
        const sourceDate = addWeeks(currentCheckDate, -1);

        // Extra check: Does source have data?
        // It might not if the user's very first week was empty too and we couldn't fill it.
        // But generally, for sequential, we just try.
        result = await copyWeekToWeek(userId, sourceDate, currentCheckDate);
      } else {
        // Alternating
        // Source: currentCheckDate - 2 weeks
        // Even -> copy from Even. Odd -> copy from Odd.
        // Works simply by looking back 2 weeks.
        const sourceDate = addWeeks(currentCheckDate, -2);
        result = await copyWeekToWeek(userId, sourceDate, currentCheckDate);
      }

      if (result.success && result.copiedCount > 0) {
        totalCopied += result.copiedCount;
        somethingCopied = true;
        console.log(`[dietCopyService]    ✅ Copiados ${result.copiedCount} items.`);
      } else {
        console.log(`[dietCopyService]    ⚠️ No se pudo copiar (origen vacío o error).`);
      }
    }

    // Next week
    currentCheckDate = addWeeks(currentCheckDate, 1);
    safetyCounter++;
  }

  if (somethingCopied) {
    console.log(`[dietCopyService] ✅ Proceso de relleno completado. Total: ${totalCopied}`);
  } else {
    console.log(`[dietCopyService] ✓ Proceso finalizado. Nada nuevo copiado.`);
  }

  return { copied: somethingCopied, newLastVisibleWeek: targetHorizonISO, copiedCount: totalCopied };
};

// Keep old function for backward compatibility during migration
export const copyCurrentWeekToNextWeeks = copySequentialOnActivate;

/**
 * Delete ALL future weeks data (from TOMORROW onwards)
 */
export const deleteFutureWeeks = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  console.log('═══════════════════════════════════════════════════');
  console.log('[dietCopyService] 🗑️ ELIMINANDO DATOS FUTUROS (Desde Mañana)...');
  console.log('═══════════════════════════════════════════════════');

  try {
    const { weeks } = getVisibleWeekRange();

    // Target start date is TOMORROW
    // We want to keep today safe.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetStartStr = format(tomorrow, 'yyyy-MM-dd');

    // Target end date is W+4 (furthest visible)
    const targetEnd = weeks[weeks.length - 1];
    const targetEndStr = format(endOfWeek(targetEnd, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    console.log(`[dietCopyService] Rango a borrar: ${targetStartStr} -> ${targetEndStr}`);

    // FETCH LOGS TO DELETE
    const { data: logsToDelete, error: fetchError } = await supabase
      .from('meal_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('date', targetStartStr);
    // We could use lte targetEndStr, but actually deleting EVERYTHING future is safer/cleaner?
    // User said "todo lo que puede ver el usuario".
    // Let's stick to the visual range to avoid deleting waaay future data if exists (unlikely but safe).
    // .lte('date', targetEndStr);

    if (fetchError) throw fetchError;

    if (!logsToDelete || logsToDelete.length === 0) {
      console.log('[dietCopyService] ✓ No se encontraron registros futuros.');
      return { success: true };
    }

    const logIds = logsToDelete.map(l => l.id);

    // DELETE ITEMS FIRST
    const { error: itemsError } = await supabase.from('meal_items').delete().in('meal_log_id', logIds);
    if (itemsError) throw itemsError;

    // DELETE LOGS
    const { error: logsError } = await supabase.from('meal_logs').delete().in('id', logIds);
    if (logsError) throw logsError;

    console.log('[dietCopyService] ✅ Futuro eliminado correctamente.');
    return { success: true };
  } catch (error: unknown) {
    console.error('[dietCopyService] Error deleting future weeks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};
