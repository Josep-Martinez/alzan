import assert from 'node:assert/strict';
import { COMPACT_PREVIEW_ACTION_BREAKPOINT, isCompactPreviewLayout } from './scheduledWorkoutPreviewLayout.helper';

assert.equal(isCompactPreviewLayout(COMPACT_PREVIEW_ACTION_BREAKPOINT - 1), true);
assert.equal(isCompactPreviewLayout(COMPACT_PREVIEW_ACTION_BREAKPOINT), false);
assert.equal(isCompactPreviewLayout(1024), false);

console.log('scheduledWorkoutPreviewLayout.helper.spec.ts passed');
