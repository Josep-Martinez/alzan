import assert from 'node:assert/strict';
import { getDaySwitcherMarkerPresentation } from './daySwitcherPresentation.helper';

const trainingMarkedDay = getDaySwitcherMarkerPresentation({
  variant: 'training',
  isMarked: true,
  isOverTarget: false,
  isSelected: false,
  primaryColor: '#007AFF',
});

assert.deepEqual(trainingMarkedDay, {
  borderColor: undefined,
  dotColor: '#007AFF',
});

const nutritionVacationDay = getDaySwitcherMarkerPresentation({
  variant: 'nutrition',
  isMarked: true,
  isOverTarget: false,
  isSelected: false,
  primaryColor: '#007AFF',
});

assert.deepEqual(nutritionVacationDay, {
  borderColor: '#7C3AED',
  dotColor: '#7C3AED',
});

const nutritionOverTargetDay = getDaySwitcherMarkerPresentation({
  variant: 'nutrition',
  isMarked: false,
  isOverTarget: true,
  isSelected: true,
  primaryColor: '#007AFF',
});

assert.deepEqual(nutritionOverTargetDay, {
  borderColor: '#D97706',
  dotColor: '#FFFFFF',
});

console.log('DaySwitcher presentation regression checks passed.');
