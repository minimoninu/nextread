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
assert.equal(isAwardCollection({}), false, 'Empty object should return false');
assert.equal(isAwardCollection({ id: 'some-id', title: 'Some Title', subtitle: 'Some Subtitle' }), false, 'No matching criteria, keywords, or emoji should return false');
assert.equal(isAwardCollection({ id: 'normal', criteria: { awards: ['Some Award'] } }), true, 'criteria.awards with items should return true');
assert.equal(isAwardCollection({ id: 'normal', criteria: { awards: [] } }), false, 'criteria.awards empty should return false');
assert.equal(isAwardCollection({ id: 'booker-collection' }), true, 'Keyword in id should return true');
assert.equal(isAwardCollection({ title: 'Best Prize Winners' }), true, 'Keyword in title should return true');
assert.equal(isAwardCollection({ subtitle: 'An award collection' }), true, 'Keyword in subtitle should return true');
assert.equal(isAwardCollection({ id: 'normal-collection', emoji: '🏆' }), true, 'Emoji 🏆 should return true even without keywords');
assert.equal(isAwardCollection({ title: 'Nobel Prize Winners' }), false, 'Nobel should return false even if it contains the word Prize');

console.log('test:book-awards OK');
