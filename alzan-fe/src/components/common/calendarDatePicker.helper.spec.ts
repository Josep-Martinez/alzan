import assert from 'node:assert/strict';
import {
  buildCalendarMonth,
  formatCalendarDate,
  isCalendarDateSelectable,
  isSameCalendarDate,
} from './calendarDatePicker.helper';

const date = (value: string): Date => new Date(`${value}T12:00:00`);

assert.equal(formatCalendarDate(date('2026-08-16')), '2026-08-16');
assert.equal(isSameCalendarDate(new Date('2026-08-16T00:00:00'), new Date('2026-08-16T23:59:59')), true);
assert.equal(isSameCalendarDate(date('2026-08-16'), date('2026-08-17')), false);

const augustDays = buildCalendarMonth(date('2026-08-16'));
assert.equal(augustDays.length, 42);
assert.equal(formatCalendarDate(augustDays[0]), '2026-07-27');
assert.equal(formatCalendarDate(augustDays[41]), '2026-09-06');

assert.equal(isCalendarDateSelectable(date('2026-08-26'), date('2026-08-01'), date('2026-08-31')), true);
assert.equal(isCalendarDateSelectable(date('2026-07-31'), date('2026-08-01'), date('2026-08-31')), false);
assert.equal(isCalendarDateSelectable(date('2026-09-01'), date('2026-08-01'), date('2026-08-31')), false);
assert.equal(isCalendarDateSelectable(date('2026-08-26')), true);

console.log('calendarDatePicker.helper.spec.ts passed');
