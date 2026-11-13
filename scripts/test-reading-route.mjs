import assert from 'node:assert/strict';
import { matchRouteItem, stageIdForYear, isRouteItemDone, summarizeRoute, normalizeTitle } from '../src/readingRoute.js';

const books = [
  { id: 1, t: 'Rojo y negro', a: ['Stendhal'] },
  { id: 2, t: 'El conde de Montecristo (Penguin Clásicos)', a: ['Alexandre Dumas'] },
  { id: 3, t: 'Fiesta', a: ['Ernest Hemingway'] },
  { id: 4, t: 'Cuentos completos', a: ['Flannery O’Connor'] },
  { id: 5, t: 'Germinal', a: ['Émile Zola'] },
  { id: 6, t: 'Nada', a: ['Otra Autora'] }
];
const aliases = { same: { 75: 'Fiesta' }, in: { 115: { title: 'Cuentos completos', author: 'O’Connor' } } };

assert.equal(normalizeTitle('El Conde de Montecristo (Penguin Clásicos)'), 'conde montecristo');
assert.deepEqual(matchRouteItem({ n: 6, t: 'Rojo y negro', a: 'Stendhal' }, books, aliases), { bookId: 1 });
assert.deepEqual(matchRouteItem({ n: 13, t: 'El conde de Montecristo', a: 'Alexandre Dumas' }, books, aliases), { bookId: 2 });
assert.deepEqual(matchRouteItem({ n: 75, t: 'El sol también sale', a: 'Ernest Hemingway' }, books, aliases), { bookId: 3 });
assert.deepEqual(matchRouteItem({ n: 115, t: 'Un hombre bueno es difícil de encontrar', a: "Flannery O'Connor" }, books, aliases), { inBookId: 4 });
// Mismo autor, otro título: no cuenta. Mismo título, otro autor: tampoco.
assert.deepEqual(matchRouteItem({ n: 31, t: 'Nana', a: 'Émile Zola' }, books, aliases), {});
assert.deepEqual(matchRouteItem({ n: 101, t: 'Nada', a: 'Carmen Laforet' }, books, aliases), {});

assert.equal(stageIdForYear(1811), '1810-1879');
assert.equal(stageIdForYear(1919), '1880-1919');
assert.equal(stageIdForYear(2024), '2000-2026');

const items = [
  { n: 1, stage: 'a', bookId: 10 },
  { n: 2, stage: 'a' },
  { n: 3, stage: 'b', bookId: 11 }
];
assert.equal(isRouteItemDone(items[0], {}, { 10: 'read' }), true);
assert.equal(isRouteItemDone(items[0], {}, { 10: 'want' }), false);
assert.equal(isRouteItemDone(items[1], { 2: true }, {}), true);
const summary = summarizeRoute(items, { 2: true }, { 10: 'read' });
assert.equal(summary.done, 2);
assert.equal(summary.next.n, 3);
assert.deepEqual(summary.byStage, { a: { total: 2, done: 2 }, b: { total: 1, done: 0 } });
assert.equal(summarizeRoute(items, { 1: true, 2: true, 3: true }, {}).next, null);

console.log('test:reading-route OK');
