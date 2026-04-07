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

// Negative Award Hints Tests
const shortlistAwardBook = { id: 6, aw: ['Booker Prize shortlist'] };
assert.deepEqual(getBookAwardLabels(shortlistAwardBook, {}), [], 'Debe ignorar shortlist en book.aw');

const candidatoAwardBook = { id: 7, awards: ['Candidato al Premio Planeta'] };
assert.deepEqual(getBookAwardLabels(candidatoAwardBook, {}), [], 'Debe ignorar candidato en book.awards');

const finalistaHookObj = { why_matters: 'Fue finalista del Premio Nadal.' };
assert.deepEqual(getBookAwardLabels({}, finalistaHookObj), [], 'Debe ignorar finalista en hook.why_matters');

const longlistHookObj = { hook: 'Longlisted for the Women\'s Prize for Fiction' };
assert.deepEqual(getBookAwardLabels({}, longlistHookObj), [], 'Debe ignorar longlist en hook.hook');

const mixedHookObj = { why_matters: 'Finalista del Premio Booker 2020' };
assert.deepEqual(getBookAwardLabels({}, mixedHookObj), [], 'Debe ignorar si la evidencia tiene hint negativo incluso con palabras clave de premio');

console.log('test:book-awards OK');
