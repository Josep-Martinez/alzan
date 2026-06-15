import { strict as assert } from 'assert';
import { SupabaseAdminService } from '../../../core/supabase/supabase.service';
import { CanonicalActivityWriterService } from './canonical-activity-writer.service';
import { DedupeService } from './dedupe.service';
import { ImportReconciliationService } from './import-reconciliation.service';
import { RawPayloadService } from './raw-payload.service';

type InsertableTable = 'activity_route_points' | 'activity_stream_samples';

type FakeSupabaseError = {
  code: string;
  details: string;
  hint: string;
  message: string;
};

type FakeInsert = {
  rowCount: number;
  table: string;
};

interface CanonicalActivityWriterServicePrivate {
  insertInChunks(table: InsertableTable, rows: Array<Record<string, unknown>>, errorCode: string): Promise<void>;
}

interface FakeSupabaseTableClient {
  insert(rows: Array<Record<string, unknown>>): Promise<{ error: FakeSupabaseError | null }>;
}

interface FakeSupabaseClient {
  inserts: FakeInsert[];
  from(table: string): FakeSupabaseTableClient;
}

function createFakeSupabaseClient(maxStreamSampleRowsPerInsert: number): FakeSupabaseClient {
  const client: FakeSupabaseClient = {
    inserts: [],
    from(table: string): FakeSupabaseTableClient {
      return {
        async insert(rows: Array<Record<string, unknown>>): Promise<{ error: FakeSupabaseError | null }> {
          client.inserts.push({ rowCount: rows.length, table });
          if (table === 'activity_stream_samples' && rows.length > maxStreamSampleRowsPerInsert) {
            return {
              error: {
                code: '',
                details: 'SocketError: other side closed',
                hint: '',
                message: 'TypeError: fetch failed',
              },
            };
          }
          return { error: null };
        },
      };
    },
  };
  return client;
}

function createService(client: FakeSupabaseClient): CanonicalActivityWriterServicePrivate {
  const supabaseAdminService = { client } as unknown as SupabaseAdminService;
  const service = new CanonicalActivityWriterService(
    supabaseAdminService,
    {} as unknown as RawPayloadService,
    {} as unknown as DedupeService,
    {} as unknown as ImportReconciliationService,
  );
  return service as unknown as CanonicalActivityWriterServicePrivate;
}

async function assertStreamSamplesUseTransportSafeChunks(): Promise<void> {
  const client = createFakeSupabaseClient(250);
  const service = createService(client);
  const rows = Array.from({ length: 1758 }, (_, index) => ({ value: index }));

  await service.insertInChunks('activity_stream_samples', rows, 'WEARABLE_ACTIVITY_STREAM_SAMPLES_INSERT_FAILED');

  assert.deepEqual(
    client.inserts.map(insert => insert.rowCount),
    [250, 250, 250, 250, 250, 250, 250, 8],
  );
}

async function run(): Promise<void> {
  await assertStreamSamplesUseTransportSafeChunks();
}

void run();
