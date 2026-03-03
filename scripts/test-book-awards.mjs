import assert from 'node:assert/strict';
import { getBookAwardLabels, isBookAwarded, isAwardCollection } from '../src/bookAwards.js';

const explicitAuthorAward = {
  id: 1,
  t: 'Book By Nobel Author',
  aw: ['Nobel de Literatura']
};

const explicitBookAward = {
  id: 2,
  t: 'Booker Winner',
  aw: ['Booker Prize']
};

const finalistSignal = {
  id: 3,
  t: 'Pulitzer Finalist'
};

const finalistHook = {
  why_matters: 'Finalista del Pulitzer 2019'
};

const winnerHook = {
  why_matters: 'Ganó el Booker y redefinió el género.'
};

const goncourtHook = {
  why_matters: 'Premio Goncourt 2016'
};

assert.equal(isBookAwarded(explicitAuthorAward, {}), false, 'Nobel del autor no debe contar como premio del libro');
assert.equal(isBookAwarded(explicitBookAward, {}), true, 'Booker explícito sí debe contar');
assert.equal(isBookAwarded(finalistSignal, finalistHook), false, 'Finalista no debe contar como premiado');
assert.equal(isBookAwarded({ id: 4, t: 'Ganador Booker' }, winnerHook), true, 'Ganó Booker sí debe contar');

const labels = getBookAwardLabels({ id: 5, t: 'Goncourt Winner' }, goncourtHook);
assert.ok(labels.includes('Premio Goncourt'), 'Debe detectar Premio Goncourt en señales de hook');

assert.equal(isAwardCollection({ id: 'pulitzer', title: 'Ganadores Pulitzer', emoji: '🏆' }), true, 'Pulitzer sí es colección de premios');
assert.equal(isAwardCollection({ id: 'premio-nobel', title: 'Premio Nobel', emoji: '🏅' }), false, 'Nobel no debe contarse como premio de libro');

// --- getBookAwardLabels Tests ---

// 1. Empty / Null Inputs
assert.deepEqual(getBookAwardLabels(), [], 'Returns empty array when no args provided');
assert.deepEqual(getBookAwardLabels(null, null), [], 'Returns empty array for null args');
assert.deepEqual(getBookAwardLabels({}, {}), [], 'Returns empty array for empty objects');

// 2. Malformed Strings and Arrays
assert.deepEqual(getBookAwardLabels({ aw: 'Booker Prize' }, {}), [], 'book.aw as a string is ignored (expects array)');
assert.deepEqual(getBookAwardLabels({ aw: [null, undefined, ''] }, {}), [], 'Ignores empty or null explicit awards');

// 3. Negative Hints (isValidEvidence)
assert.deepEqual(getBookAwardLabels({}, { why_matters: 'Finalista del Premio Pulitzer' }), [], 'finalista hint invalidates evidence');
assert.deepEqual(getBookAwardLabels({}, { hook: 'Shortlist for the Booker Prize' }), [], 'shortlist hint invalidates evidence');
assert.deepEqual(getBookAwardLabels({ aw: ['Candidato al Premio Goncourt'] }), [], 'candidato hint invalidates explicit award');

// 4. Exact Matches vs Partial Matches
assert.deepEqual(getBookAwardLabels({ aw: ['National Book Award'] }), ['National Book Award'], 'Exact match for explicit award');
assert.deepEqual(getBookAwardLabels({}, { why_matters: 'Ganador del Premio Goncourt en 2020' }), ['Premio Goncourt'], 'Partial match extracting known label');
assert.deepEqual(getBookAwardLabels({ aw: ['Premio Random Desconocido'] }), ['Premio Random Desconocido'], 'Generic awards containing premio are kept exactly');
assert.deepEqual(getBookAwardLabels({ aw: ['Un premio sin importancia'] }), ['Un premio sin importancia'], 'Case insensitive match for premio in explicit award');
assert.deepEqual(getBookAwardLabels({ aw: ['Un reconocimiento'] }), [], 'Explicit award without premio/award/prize is ignored if no known label');

// 5. Author Level Awards
assert.deepEqual(getBookAwardLabels({ aw: ['Premio Nobel de Literatura'] }), [], 'Author level award is ignored as a book award');
assert.deepEqual(getBookAwardLabels({}, { hook: 'Ganó el Nobel de Literatura' }), [], 'Author level award in hook is ignored');
assert.deepEqual(getBookAwardLabels({}, { why_matters: 'Ganó el Nobel y también el Pulitzer por este libro' }), ['Pulitzer Prize'], 'Author level award combined with book award extracts book award');

// 6. Combining Multiple Evidences
const combinedBook = { aw: ['Hugo Award'], hook: 'Ganó el Nebula Award' };
const combinedHook = { hook: 'También ganó el Booker Prize', why_matters: 'Ganador del Premio Goncourt' };
const combinedLabels = getBookAwardLabels(combinedBook, combinedHook);
assert.equal(combinedLabels.includes('Hugo Award'), true);
assert.equal(combinedLabels.includes('Nebula Award'), true);
assert.equal(combinedLabels.includes('Booker Prize'), true);
assert.equal(combinedLabels.includes('Premio Goncourt'), true);
assert.equal(combinedLabels.length, 4, 'Should extract unique awards from multiple fields');

console.log('test:book-awards OK');
