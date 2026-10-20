import assert from 'node:assert/strict';
import { getTrainingPdfDateRange } from './trainingPdfDateRange';

process.env.TZ = 'Europe/Madrid';

assert.deepEqual(getTrainingPdfDateRange('2026-10-20', '2026-10-20'), {
  startInclusive: '2026-10-19T22:00:00.000Z',
  endExclusive: '2026-10-20T22:00:00.000Z',
});

assert.deepEqual(getTrainingPdfDateRange('2026-03-29', '2026-03-29'), {
  startInclusive: '2026-03-28T23:00:00.000Z',
  endExclusive: '2026-03-29T22:00:00.000Z',
});

console.log('trainingPdfDateRange: all tests passed');
