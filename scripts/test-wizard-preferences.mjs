import assert from 'node:assert/strict';
import { buildPreferencesFromAnswers } from '../src/wizardPreferences.js';

// Test empty inputs for buildPreferencesFromAnswers
assert.deepEqual(buildPreferencesFromAnswers(), {}, 'should return empty object with no arguments');
assert.deepEqual(buildPreferencesFromAnswers({}, [], {}), {}, 'should return empty object with empty arguments');
assert.deepEqual(buildPreferencesFromAnswers({ q1: 'a1' }, [], {}), {}, 'should return empty object with empty path');
assert.deepEqual(buildPreferencesFromAnswers({}, ['q1'], {}), {}, 'should return empty object with empty answers');
assert.deepEqual(buildPreferencesFromAnswers({}, [], { q1: {} }), {}, 'should return empty object with empty path and answers');
assert.deepEqual(buildPreferencesFromAnswers({ q1: 'a1' }, ['q1'], {}), {}, 'should return empty object when question is missing');
assert.deepEqual(buildPreferencesFromAnswers({ q1: 'a1' }, ['q1'], { q1: { options: [] } }), {}, 'should return empty object when option is missing');

console.log('test:wizard-preferences OK');
