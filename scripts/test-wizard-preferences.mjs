import assert from 'node:assert/strict';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from '../src/wizardPreferences.js';

// applyOptionToPreferences tests
assert.deepEqual(applyOptionToPreferences(null, null), {}, 'Should return empty object if both args are null');
assert.deepEqual(applyOptionToPreferences(undefined, undefined), {}, 'Should return empty object if both args are undefined');
assert.deepEqual(applyOptionToPreferences({ themes: ['a'] }, null), { themes: ['a'] }, 'Should return preferences if option is null');

const prefs1 = applyOptionToPreferences({}, { themes: ['fantasy'], experiences: ['epic'], pages: '<300' });
assert.deepEqual(
  prefs1,
  { themes: ['fantasy'], experiences: ['epic'], pages: '<300' },
  'Should correctly apply initial option'
);

const prefs2 = applyOptionToPreferences(prefs1, { themes: ['scifi'], difficulty: 'easy', standalone: false, wantsSeries: true });
assert.deepEqual(
  prefs2,
  { themes: ['fantasy', 'scifi'], experiences: ['epic'], pages: '<300', difficulty: 'easy', standalone: false, wantsSeries: true },
  'Should correctly concatenate arrays and add/overwrite primitives'
);

const prefs3 = applyOptionToPreferences(prefs2, { standalone: true, wantsSeries: false });
assert.equal(prefs3.standalone, true, 'Should overwrite boolean false with true');
assert.equal(prefs3.wantsSeries, false, 'Should overwrite boolean true with false');

const prefs4 = applyOptionToPreferences({ riskLevel: 'low', filter: { maxPages: 500 }, boost: { rating: 1.5 } }, { riskLevel: 'high', filter: { maxPages: 200 }, boost: { rating: 2.0 } });
assert.deepEqual(
  prefs4,
  { riskLevel: 'high', filter: { maxPages: 200 }, boost: { rating: 2.0 } },
  'Should overwrite complex/other primitive properties'
);

const prefs5 = applyOptionToPreferences({}, { vibes: ['chill'], moods: ['happy'], keywords: ['robot'] });
assert.deepEqual(
  prefs5,
  { vibes: ['chill'], moods: ['happy'], keywords: ['robot'] },
  'Should handle vibes, moods, keywords'
);

const prefs6 = applyOptionToPreferences(prefs5, { vibes: ['dark'], moods: ['sad'], keywords: ['ai'] });
assert.deepEqual(
  prefs6,
  { vibes: ['chill', 'dark'], moods: ['happy', 'sad'], keywords: ['robot', 'ai'] },
  'Should concatenate vibes, moods, keywords'
);

// buildPreferencesFromAnswers tests
const answers = { q1: 'opt2', q2: 'opt1', q3: 'non-existent' };
const path = ['q1', 'q2', 'q3', 'q4'];
const questions = {
  q1: { options: [{ id: 'opt1', themes: ['scifi'] }, { id: 'opt2', themes: ['fantasy'] }] },
  q2: { options: [{ id: 'opt1', difficulty: 'hard' }, { id: 'opt2', difficulty: 'easy' }] },
  q3: { options: [{ id: 'opt1', pages: '>500' }] }
};

const finalPrefs = buildPreferencesFromAnswers(answers, path, questions);
assert.deepEqual(
  finalPrefs,
  { themes: ['fantasy'], difficulty: 'hard' },
  'Should correctly build preferences from answers ignoring missing options or missing answers'
);

const emptyPrefs = buildPreferencesFromAnswers({}, [], {});
assert.deepEqual(emptyPrefs, {}, 'Should handle empty inputs safely');

console.log('test:wizard-preferences OK');
