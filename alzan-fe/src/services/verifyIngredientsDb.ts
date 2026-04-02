import { supabase } from '../lib/supabaseClient';

/**
 * Verify ingredients database has data
 * Call this from your app to check database status
 */
export async function verifyIngredientsDatabase() {
  console.log('🔍 [DB Check] Verifying ingredients database...');

  try {
    // Count total ingredients
    const { count, error: countError } = await supabase.from('ingredients').select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ [DB Check] Error:', countError);
      return { success: false, error: countError };
    }

    console.log(`✅ [DB Check] Total ingredients: ${count || 0}`);

    // Get sample data
    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name_es, name_norm_es, category, kcal_100')
      .limit(5);

    if (error) {
      console.error('❌ [DB Check] Error fetching samples:', error);
      return { success: false, error };
    }

    if (data && data.length > 0) {
      console.log('📋 [DB Check] Sample ingredients:');
      data.forEach(ing => {
        console.log(`  - ${ing.name_es} (${ing.category})`);
      });
    } else {
      console.warn('⚠️  [DB Check] No ingredients found! Database is empty.');
    }

    return {
      success: true,
      count: count || 0,
      hasData: (count || 0) > 0,
      samples: data || [],
    };
  } catch (err) {
    console.error('❌ [DB Check] Unexpected error:', err);
    return { success: false, error: err };
  }
}
