import assert from 'node:assert/strict';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from '../src/wizardPreferences.js';

// Test: Handling null/undefined inputs
const nullPrefs = applyOptionToPreferences(null, { themes: ['dark'] });
assert.deepEqual(nullPrefs, { themes: ['dark'] }, 'Should handle null preferences');

const noOption = applyOptionToPreferences({ themes: ['dark'] }, null);
assert.deepEqual(noOption, { themes: ['dark'] }, 'Should return preferences if option is null');

// Test: Merging arrays and setting scalar values
const initialPrefs = { themes: ['light'], pages: 100, custom: 'preserved' };
const option = {
  themes: ['dark'],
  vibes: ['chill'],
  difficulty: 'hard',
  standalone: true
};

const mergedPrefs = applyOptionToPreferences(initialPrefs, option);

assert.deepEqual(
  mergedPrefs.themes,
  ['light', 'dark'],
  'Should merge arrays for existing keys'
);
assert.deepEqual(
  mergedPrefs.vibes,
  ['chill'],
  'Should create arrays for new keys'
);
assert.equal(
  mergedPrefs.pages,
  100,
  'Should preserve existing values not updated'
);
assert.equal(
  mergedPrefs.custom,
  'preserved',
  'Should preserve custom existing keys'
);
assert.equal(
  mergedPrefs.difficulty,
  'hard',
  'Should set new scalar values'
);
assert.equal(
  mergedPrefs.standalone,
  true,
  'Should properly set boolean values'
);

// Test: Original inputs are not mutated
assert.deepEqual(
  initialPrefs,
  { themes: ['light'], pages: 100, custom: 'preserved' },
  'Original preferences object should not be mutated'
);
assert.deepEqual(
  option,
  { themes: ['dark'], vibes: ['chill'], difficulty: 'hard', standalone: true },
  'Option object should not be mutated'
);

// Test: Edge case for boolean options
const falseBooleanOption = { standalone: false, wantsSeries: false };
const booleanMergedPrefs = applyOptionToPreferences({}, falseBooleanOption);
assert.equal(booleanMergedPrefs.standalone, false, 'Should set boolean standalone when false');
assert.equal(booleanMergedPrefs.wantsSeries, false, 'Should set boolean wantsSeries when false');


// Test: buildPreferencesFromAnswers
const questions = {
  q1: {
    options: [
      { id: 'opt1', themes: ['space'] },
      { id: 'opt2', themes: ['fantasy'] }
    ]
  },
  q2: {
    options: [
      { id: 'opt3', difficulty: 'easy' }
    ]
  }
};
const answers = { q1: 'opt1', q2: 'opt3', q3: 'opt4' };
const path = ['q1', 'q2', 'q3'];

const builtPrefs = buildPreferencesFromAnswers(answers, path, questions);
assert.deepEqual(
  builtPrefs,
  { themes: ['space'], difficulty: 'easy' },
  'Should build preferences from answers correctly, skipping missing options'
);

console.log('test:wizard-preferences OK');
