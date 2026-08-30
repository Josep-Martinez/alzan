import assert from 'node:assert/strict';
import { addWeeks, startOfWeek } from 'date-fns';
import { getTrainingHorizonWeek } from './trainingCalendarRange';

const referenceDate = new Date(2026, 7, 26, 12);
const currentWeek = startOfWeek(referenceDate, { weekStartsOn: 1 });
const horizon = getTrainingHorizonWeek(referenceDate);

assert.equal(horizon.getTime(), addWeeks(currentWeek, 5).getTime());

console.log('trainingPlanService: all tests passed');
