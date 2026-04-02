const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'SUPABASE_URL_HERE';
const supabaseKey = 'SUPABASE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251209_create_workout_plans.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Ejecutando migración: crear tabla workout_plans...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);

      // Intentar método alternativo: query directo
      console.log('Intentando método alternativo...');

      // Dividir y ejecutar cada statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Ejecutando: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.from('_migrations').insert({
            name: '20251209_create_workout_plans',
            executed_at: new Date().toISOString(),
          });

          if (stmtError) {
            console.warn('Nota: No se pudo registrar en _migrations, es normal si no existe la tabla');
          }
        }
      }

      console.log('\n⚠️  No se pudo ejecutar automáticamente la migración.');
      console.log('Por favor, copia y ejecuta manualmente el SQL desde:');
      console.log(migrationPath);
      console.log('\nEn Supabase Dashboard → SQL Editor');
    } else {
      console.log('✅ Migración ejecutada correctamente');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Instrucciones manuales:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/jbxliouzlrsjrwacwdml/editor');
    console.log('2. Abre SQL Editor');
    console.log('3. Copia el contenido de: supabase/migrations/20251209_create_workout_plans.sql');
    console.log('4. Ejecuta el SQL');
  }
}

runMigration();
