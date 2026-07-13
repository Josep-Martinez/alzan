import { strict as assert } from 'assert';
import { ConfigService } from '@nestjs/config';
import { SupabaseAdminService } from '../../../core/supabase/supabase.service';
import { CanonicalActivityWriterService } from './canonical-activity-writer.service';
import { ImportReconciliationService } from './import-reconciliation.service';
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
    {} as unknown as ImportReconciliationService,
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

async function assertSyncSkipsAlreadyImportedWorkouts(): Promise<void> {
  const importedWorkoutKeys: string[] = [];
  const savedStates: JsonRecord[] = [];
  const service = new SuuntoCloudSyncService(
    { get: () => 'unused' } as unknown as ConfigService,
    {} as unknown as SupabaseAdminService,
    {} as unknown as RawPayloadService,
    {
      saveState: async (state: JsonRecord): Promise<void> => void savedStates.push(state),
    } as unknown as IntegrationSyncStateService,
    {} as unknown as CanonicalActivityWriterService,
    {} as unknown as ImportReconciliationService,
  ) as unknown as {
    fetchWorkoutSummaries(accessToken: string): Promise<JsonRecord[]>;
    findExistingWorkoutKeys(userId: string, workoutKeys: string[]): Promise<Set<string>>;
    getUsableToken(
      userId: string,
    ): Promise<{ accessToken: string; connectionId: string; expiresAt: string | null; refreshToken: string | null }>;
    importWorkout(userId: string, accessToken: string, workoutKey: string, summary: JsonRecord): Promise<void>;
    markConnectionSuccess(userId: string, syncedAt: string): Promise<void>;
    reconcileRecentSuuntoSessions(userId: string): Promise<number>;
    syncActivities(userId: string): Promise<{
      activitiesImported: number;
      activitiesSkipped: number;
      activitiesReconciled: number;
    }>;
  };

  service.getUsableToken = async () => ({
    accessToken: 'access-token',
    connectionId: 'connection-id',
    expiresAt: null,
    refreshToken: null,
  });
  service.fetchWorkoutSummaries = async () => [
    { startTime: '2026-06-14T09:00:00.000Z', workoutKey: 'existing-workout' },
    { startTime: '2026-06-15T09:00:00.000Z', workoutKey: 'new-workout' },
  ];
  service.findExistingWorkoutKeys = async (_userId: string, workoutKeys: string[]) => {
    assert.deepEqual(workoutKeys, ['existing-workout', 'new-workout']);
    return new Set(['existing-workout']);
  };
  service.importWorkout = async (_userId: string, accessToken: string, workoutKey: string) => {
    assert.equal(accessToken, 'access-token');
    importedWorkoutKeys.push(workoutKey);
  };
  service.markConnectionSuccess = async () => undefined;
  service.reconcileRecentSuuntoSessions = async () => 3;

  const result = await service.syncActivities('user-id');

  assert.deepEqual(importedWorkoutKeys, ['new-workout']);
  assert.equal(result.activitiesImported, 1);
  assert.equal(result.activitiesSkipped, 1);
  assert.equal(result.activitiesReconciled, 3);
  assert.equal(savedStates.length, 1);
}

async function run(): Promise<void> {
  await assertWorkoutSummariesAreLimitedToLastTwentyDays();
  await assertSyncSkipsAlreadyImportedWorkouts();
}

void run();
