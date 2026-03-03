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

// Additional tests for isAwardCollection
assert.equal(isAwardCollection(), false, 'Empty input should return false');
assert.equal(isAwardCollection({}), false, 'Empty object should return false');

// Collections with 'nobel'
assert.equal(isAwardCollection({ id: 'nobel-prize', title: 'Nobel Prize Winners' }), false, 'Nobel prize should return false');
assert.equal(isAwardCollection({ title: 'Nobel winners', emoji: '🏆' }), false, 'Nobel winners even with emoji should return false');

// Collections with criteria.awards
assert.equal(isAwardCollection({ id: 'custom', title: 'Custom', criteria: { awards: ['Some Award'] } }), true, 'Criteria with awards should return true');
assert.equal(isAwardCollection({ id: 'custom', title: 'Custom', criteria: { awards: [] } }), false, 'Criteria with empty awards array should return false');

// Collections with specific keywords
assert.equal(isAwardCollection({ id: 'booker-prize', title: 'Great Books' }), true, 'ID with keyword booker should return true');
assert.equal(isAwardCollection({ id: 'random', title: 'Goncourt Winners' }), true, 'Title with keyword goncourt should return true');
assert.equal(isAwardCollection({ id: 'random', title: 'Great Books', subtitle: 'Some prize winners' }), true, 'Subtitle with keyword prize should return true');
assert.equal(isAwardCollection({ id: 'premiados', title: 'Los Premiados' }), true, 'Keyword premiados should return true');
assert.equal(isAwardCollection({ id: 'award-winners', title: 'Award Winners' }), true, 'Keyword award should return true');
assert.equal(isAwardCollection({ id: 'premio-planeta', title: 'Premio Planeta' }), true, 'Keyword premio should return true');

// Collections with emoji
assert.equal(isAwardCollection({ id: 'random', title: 'Trophy Collection', emoji: '🏆' }), true, 'Emoji trophy should return true');
assert.equal(isAwardCollection({ id: 'random', title: 'Medal Collection', emoji: '🏅' }), false, 'Emoji medal should return false');

// Negative tests for non-matching collections
assert.equal(isAwardCollection({ id: 'best-sellers', title: 'Best Sellers' }), false, 'Non-matching keywords should return false');
assert.equal(isAwardCollection({ id: 'favorites', title: 'My Favorites', subtitle: 'Top rated books' }), false, 'Non-matching keywords in subtitle should return false');

console.log('test:book-awards OK');
