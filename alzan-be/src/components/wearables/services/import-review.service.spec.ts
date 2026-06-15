import { strict as assert } from 'assert';
import { SupabaseAdminService } from '../../../core/supabase/supabase.service';
import { ImportReconciliationService } from './import-reconciliation.service';
import { ImportReviewService } from './import-review.service';
import { RawPayloadService } from './raw-payload.service';

type FakeSupabaseError = {
  message: string;
};

interface FakeSupabaseQueryClient {
  eq(column: string, value: unknown): FakeSupabaseQueryClient;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: FakeSupabaseError | null }>;
  select(columns: string): FakeSupabaseQueryClient;
}

interface FakeSupabaseClient {
  rows: Record<string, Array<Record<string, unknown>>>;
  from(table: string): FakeSupabaseQueryClient;
}

function createFakeSupabaseClient(rows: Record<string, Array<Record<string, unknown>>>): FakeSupabaseClient {
  const client: FakeSupabaseClient = {
    rows,
    from(table: string): FakeSupabaseQueryClient {
      const filters: Array<{ column: string; value: unknown }> = [];
      return {
        eq(column: string, value: unknown): FakeSupabaseQueryClient {
          filters.push({ column, value });
          return this;
        },
        async maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: FakeSupabaseError | null }> {
          const tableRows = client.rows[table] ?? [];
          const data = tableRows.find(row => filters.every(filter => row[filter.column] === filter.value)) ?? null;
          return { data, error: null };
        },
        select(): FakeSupabaseQueryClient {
          return this;
        },
      };
    },
  };
  return client;
}

function createService(client: FakeSupabaseClient): ImportReviewService {
  const supabaseAdminService = { client } as unknown as SupabaseAdminService;
  return new ImportReviewService(
    supabaseAdminService,
    {} as unknown as RawPayloadService,
    {} as unknown as ImportReconciliationService,
  );
}

async function assertMergeIsIdempotentWhenSourceWasAlreadyDeleted(): Promise<void> {
  const service = createService(
    createFakeSupabaseClient({
      activity_sessions: [
        {
          id: 'survivor-session',
          user_id: 'user-1',
          sport_type: 'running',
          start_time: '2026-06-15T10:00:00Z',
          status: 'completed',
        },
      ],
    }),
  );

  const survivorId = await service.mergeDuplicate('user-1', 'already-deleted-import', 'survivor-session');

  assert.equal(survivorId, 'survivor-session');
}

async function run(): Promise<void> {
  await assertMergeIsIdempotentWhenSourceWasAlreadyDeleted();
}

void run();
