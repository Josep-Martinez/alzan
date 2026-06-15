import { strict as assert } from 'assert';
import { ConfigService } from '@nestjs/config';
import { SupabaseAdminService } from '../../../core/supabase/supabase.service';
import { CanonicalActivityWriterService } from './canonical-activity-writer.service';
import { IntegrationSyncStateService } from './integration-sync-state.service';
import { RawPayloadService } from './raw-payload.service';
import { SuuntoCloudSyncService } from './suunto-cloud-sync.service';

type JsonRecord = Record<string, unknown>;

interface SuuntoCloudSyncServicePrivate {
  fetchWorkoutSummaries(accessToken: string): Promise<JsonRecord[]>;
  getSuunto<T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T>;
}

type CapturedRequest = {
  accessToken: string | null;
  params: Record<string, string> | null;
  path: string | null;
};

function createService(response: JsonRecord[]): {
  capturedRequest: CapturedRequest;
  service: SuuntoCloudSyncServicePrivate;
} {
  const capturedRequest: CapturedRequest = {
    accessToken: null,
    params: null,
    path: null,
  };
  const service = new SuuntoCloudSyncService(
    { get: () => 'unused' } as unknown as ConfigService,
    {} as unknown as SupabaseAdminService,
    {} as unknown as RawPayloadService,
    {} as unknown as IntegrationSyncStateService,
    {} as unknown as CanonicalActivityWriterService,
  ) as unknown as SuuntoCloudSyncServicePrivate;
  service.getSuunto = async <T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T> => {
    capturedRequest.path = path;
    capturedRequest.accessToken = accessToken;
    capturedRequest.params = params ?? null;
    return response as T;
  };
  return { capturedRequest, service };
}

async function assertWorkoutSummariesAreLimitedToLastTwentyDays(): Promise<void> {
  const originalNow = Date.now;
  const fixedNowMs = Date.parse('2026-06-15T10:00:00.000Z');
  const cutoffMs = fixedNowMs - 20 * 24 * 60 * 60 * 1000;
  Date.now = (): number => fixedNowMs;
  try {
    const { capturedRequest, service } = createService([
      { startTime: '2026-06-14T09:00:00.000Z', workoutKey: 'recent-iso' },
      { startTime: new Date(cutoffMs).toISOString(), workoutKey: 'boundary-iso' },
      { startTimeInSeconds: Math.floor((fixedNowMs - 1000) / 1000), workoutKey: 'recent-seconds' },
      { startTime: fixedNowMs - 2000, workoutKey: 'recent-millis' },
      { startTime: '2026-05-25T09:00:00.000Z', workoutKey: 'old-iso' },
      { workoutKey: 'undated' },
    ]);

    const actualWorkouts = await service.fetchWorkoutSummaries('access-token');

    assert.equal(capturedRequest.path, '/v2/workouts');
    assert.equal(capturedRequest.accessToken, 'access-token');
    assert.equal(capturedRequest.params?.since, String(cutoffMs));
    assert.deepEqual(
      actualWorkouts.map(workout => workout.workoutKey),
      ['recent-iso', 'boundary-iso', 'recent-seconds', 'recent-millis'],
    );
  } finally {
    Date.now = originalNow;
  }
}

async function run(): Promise<void> {
  await assertWorkoutSummariesAreLimitedToLastTwentyDays();
}

void run();
