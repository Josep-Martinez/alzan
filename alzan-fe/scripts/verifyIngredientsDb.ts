// Script to verify ingredients database connection and data
// Run with: npx ts-node scripts/verifyIngredientsDb.ts

import { supabase } from '../src/lib/supabaseClient';

async function verifyDatabase() {
  console.log('🔍 Verifying ingredients database...\n');

  try {
    // Test connection
    const { data, error, count } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.error('❌ Error connecting to ingredients database:');
      console.error(error);
      return;
    }

    console.log(`✅ Connection successful!`);
    console.log(`📊 Total ingredients in database: ${count || 0}\n`);

    if (data && data.length > 0) {
      console.log('Sample ingredients:');
      data.forEach((ing: any, idx: number) => {
        console.log(`${idx + 1}. ${ing.name_es} (${ing.name_en})`);
        console.log(`   Category: ${ing.category}`);
        console.log(`   Macros: ${ing.kcal_100}kcal, ${ing.protein_g_100}g protein`);
        console.log(`   Quality: ${ing.quality_score}\n`);
      });
    } else {
      console.log('⚠️  No ingredients found in database!');
      console.log('You need to import ingredient data.');
    }

    // Test search
    console.log('\n🔍 Testing search for "pollo"...');
    const { data: searchResults } = await supabase
      .from('ingredients')
      .select('*')
      .or('name_norm_es.ilike.%pollo%,name_es.ilike.%pollo%')
      .limit(3);

    if (searchResults && searchResults.length > 0) {
      console.log(`Found ${searchResults.length} results:`);
      searchResults.forEach((ing: any) => {
        console.log(`- ${ing.name_es} (normalized: ${ing.name_norm_es})`);
      });
    } else {
      console.log('No results found for "pollo"');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

verifyDatabase();
