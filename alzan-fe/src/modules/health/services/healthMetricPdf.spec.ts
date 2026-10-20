import assert from 'node:assert/strict';
import { summarizeHealthMetricPdfRows, type HealthMetricPdfSample } from './healthMetricPdf';

const sample = (overrides: Partial<HealthMetricPdfSample>): HealthMetricPdfSample => ({
  provider: 'suunto',
  source_channel: 'cloud',
  metric_type: 'hrv_rmssd',
  recorded_at: '2026-10-20T08:30:00.000Z',
  local_date: '2026-10-20',
  unit: 'ms',
  value: 42,
  ...overrides,
});

const t = (key: string, options?: Record<string, string | number>) =>
  Object.entries(options ?? {}).reduce(
    (message, [name, value]) => message.replace(`{{${name}}}`, String(value)),
    key === 'health.pdfMetricStats' ? 'Average {{average}} · range {{minimum}}–{{maximum}} · {{count}} readings' : key,
  );

const rows = summarizeHealthMetricPdfRows(
  [
    sample({ metric_type: 'heart_rate', value: 60, unit: 'bpm' }),
    sample({ metric_type: 'heart_rate', value: 79, unit: 'bpm', recorded_at: '2026-10-20T09:30:00.000Z' }),
    sample({ metric_type: 'recovery_balance', value: 0.5, unit: 'fraction' }),
    sample({ metric_type: 'recovery_balance', value: 0.68, unit: 'fraction', recorded_at: '2026-10-20T11:30:00.000Z' }),
    sample({ metric_type: 'stress_state', value: 1, unit: 'enum' }),
    sample({ metric_type: 'stress_state', value: 4, unit: 'enum', recorded_at: '2026-10-20T11:30:00.000Z' }),
    sample({ metric_type: 'spo2', value: 98.2, unit: '%' }),
    sample({ metric_type: 'spo2', value: 98.5, unit: '%', recorded_at: '2026-10-20T11:30:00.000Z' }),
    sample({ metric_type: 'unsupported' }),
  ],
  t,
);
assert.deepEqual(rows, [
  {
    date: '2026-10-20',
    metric: 'health.heartRate',
    value: 'Average 70 bpm · range 60 bpm–79 bpm · 2 readings',
    provider: 'Suunto',
  },
  {
    date: '2026-10-20',
    metric: 'health.pdfRecoveryBalance',
    value: '68%',
    provider: 'Suunto',
  },
  {
    date: '2026-10-20',
    metric: 'health.pdfSpo2',
    value: 'Average 98.4 % · range 98.2 %–98.5 % · 2 readings',
    provider: 'Suunto',
  },
  {
    date: '2026-10-20',
    metric: 'health.pdfStressState',
    value: 'health.suuntoStressRelaxing (1) · health.suuntoStressful (1)',
    provider: 'Suunto',
  },
]);
assert.match(rows[0].value, /Average 70 bpm · range 60 bpm–79 bpm · 2 readings/);
assert.match(rows[2].value, /Average 98\.4 % · range 98\.2 %–98\.5 % · 2 readings/);

console.log('healthMetricPdf: all tests passed');
