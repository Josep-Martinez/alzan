import assert from 'node:assert/strict';
import { hasNutritionPdfRecords } from './nutritionPdfRecords';

assert.equal(hasNutritionPdfRecords([]), false);
assert.equal(hasNutritionPdfRecords([{ adherence_status: 'skipped' }]), false);
assert.equal(hasNutritionPdfRecords([{ adherence_status: 'extra_meal' }]), true);
assert.equal(hasNutritionPdfRecords([{ adherence_status: 'done_as_planned' }]), true);

console.log('nutritionPdfRecords: all tests passed');
