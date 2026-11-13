import assert from 'node:assert/strict';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from '../src/wizardPreferences.js';

// No muta la entrada y tolera valores vacíos
const base = { themes: ['a'] };
const next = applyOptionToPreferences(base, { themes: ['b'], pages: 'short', standalone: false });
assert.deepEqual(base, { themes: ['a'] });
assert.deepEqual(next, { themes: ['a', 'b'], pages: 'short', standalone: false });
assert.deepEqual(applyOptionToPreferences(null, null), {});
assert.deepEqual(applyOptionToPreferences(undefined, { moods: ['x'] }), { moods: ['x'] });

// Las listas se acumulan; los escalares se sobreescriben
const acc = applyOptionToPreferences(
  applyOptionToPreferences({}, { vibes: ['v1'], difficulty: 'ligero' }),
  { vibes: ['v2'], difficulty: 'denso', wantsSeries: true }
);
assert.deepEqual(acc, { vibes: ['v1', 'v2'], difficulty: 'denso', wantsSeries: true });

const questions = {
  root: { options: [{ id: 'r1', moods: ['oscuro'] }, { id: 'r2', moods: ['ligero'] }] },
  length: { options: [{ id: 'l1', pages: 'long' }] }
};
assert.deepEqual(
  buildPreferencesFromAnswers({ root: 'r1', length: 'l1' }, ['root', 'length'], questions),
  { moods: ['oscuro'], pages: 'long' }
);
// Solo cuentan las preguntas del camino actual; respuestas desconocidas se ignoran
assert.deepEqual(buildPreferencesFromAnswers({ root: 'r2', length: 'l1' }, ['root'], questions), { moods: ['ligero'] });
assert.deepEqual(buildPreferencesFromAnswers({ root: 'zzz' }, ['root', 'missing'], questions), {});
assert.deepEqual(buildPreferencesFromAnswers(), {});

console.log('test:wizard-preferences OK');
