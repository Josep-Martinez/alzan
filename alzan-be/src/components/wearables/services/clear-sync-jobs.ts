import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env explicitly to ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env');
    process.exit(1);
  }

  const client = createClient(url, key);

  console.log(`Connecting to Supabase at ${url}...`);

  try {
    const { error: error1 } = await client
      .from('integration_sync_state')
      .update({ status: 'error' })
      .eq('status', 'running');

    if (error1) throw error1;
    console.log('✅ Cleared stuck integration_sync_state jobs.');

    const { error: error2 } = await client
      .from('wearable_sync_jobs')
      .update({ status: 'error' })
      .eq('status', 'running');

    if (error2) throw error2;
    console.log('✅ Cleared stuck wearable_sync_jobs (set to failed).');

    const { error: error3 } = await client.from('wearable_activity_imports').delete().eq('status', 'processing');

    if (error3) throw error3;
    console.log('✅ Deleted stuck wearable_activity_imports.');

    console.log('🎉 All stuck sync jobs successfully cleared.');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to clear jobs:', message);
  }
}

void run();
