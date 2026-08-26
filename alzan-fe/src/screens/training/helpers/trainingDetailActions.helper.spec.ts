import assert from 'node:assert/strict';
import { canDeleteActivitySession } from './trainingDetailActions.helper';

assert.equal(canDeleteActivitySession('session-1', false, false), true);
assert.equal(canDeleteActivitySession(undefined, false, false), false);
assert.equal(canDeleteActivitySession('session-1', true, false), false);
assert.equal(canDeleteActivitySession('session-1', false, true), false);

console.log('training detail action tests passed');
