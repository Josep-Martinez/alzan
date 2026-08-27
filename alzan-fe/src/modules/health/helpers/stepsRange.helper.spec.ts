import assert from 'node:assert/strict';
import { addDays, format } from 'date-fns';
import {
  MAX_MANUAL_STEPS_RANGE_DAYS,
  buildManualStepsDateRange,
  getManualStepsRangeDayCount,
  isManualStepsRangeValid,
} from './stepsRange.helper';

const date = (value: string) => new Date(`${value}T12:00:00`);

function assertBuildsAnInclusiveRange(): void {
  assert.deepEqual(buildManualStepsDateRange(date('2026-08-26'), date('2026-08-28')), [
    '2026-08-26',
    '2026-08-27',
    '2026-08-28',
  ]);
}

function assertEnforcesTheThirtyDayInclusiveLimit(): void {
  const start = date('2026-08-01');
  const validEnd = addDays(start, MAX_MANUAL_STEPS_RANGE_DAYS - 1);
  const invalidEnd = addDays(start, MAX_MANUAL_STEPS_RANGE_DAYS);

  assert.equal(getManualStepsRangeDayCount(start, validEnd), MAX_MANUAL_STEPS_RANGE_DAYS);
  assert.equal(isManualStepsRangeValid(start, validEnd), true);
  assert.equal(isManualStepsRangeValid(start, invalidEnd), false);
}

function assertRejectsReversedRanges(): void {
  const start = date('2026-08-28');
  const end = date('2026-08-26');

  assert.equal(getManualStepsRangeDayCount(start, end), 0);
  assert.equal(isManualStepsRangeValid(start, end), false);
  assert.deepEqual(buildManualStepsDateRange(start, end), []);
}

function assertDateKeysAreStableAcrossLocalTime(): void {
  const range = buildManualStepsDateRange(date('2026-08-26'), date('2026-08-27'));

  assert.deepEqual(range, [format(date('2026-08-26'), 'yyyy-MM-dd'), format(date('2026-08-27'), 'yyyy-MM-dd')]);
}

assertBuildsAnInclusiveRange();
assertEnforcesTheThirtyDayInclusiveLimit();
assertRejectsReversedRanges();
assertDateKeysAreStableAcrossLocalTime();
