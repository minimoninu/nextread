import assert from 'node:assert/strict';
import { buildListsBackup, parseListsBackup, mergeLists } from '../src/listsBackup.js';

const lists = { 12: 'reading', 40: 'want', 7: 'read' };
const backup = buildListsBackup(lists, new Date('2026-01-02T03:04:05Z'));
assert.equal(backup.kind, 'nextread-lists');
assert.equal(backup.exportedAt, '2026-01-02T03:04:05.000Z');

const roundTrip = parseListsBackup(JSON.stringify(backup));
assert.deepEqual(roundTrip.lists, { 7: 'read', 12: 'reading', 40: 'want' });
assert.equal(roundTrip.count, 3);

// Entradas inválidas se descartan
const dirty = { kind: 'nextread-lists', version: 1, lists: { 5: 'want', abc: 'read', 9: 'borrado', __proto__: 'read' } };
assert.deepEqual(parseListsBackup(JSON.stringify(dirty)).lists, { 5: 'want' });

assert.throws(() => parseListsBackup('no es json'), /JSON válido/);
assert.throws(() => parseListsBackup('{"lists":{"1":"read"}}'), /no es una copia/);
assert.throws(() => parseListsBackup('{"kind":"nextread-lists","lists":{}}'), /ningún libro/);
assert.throws(() => parseListsBackup('null'), /no es una copia/);

// Merge: lo importado gana, lo demás se conserva
assert.deepEqual(mergeLists({ 1: 'want', 2: 'read' }, { 2: 'reading', 3: 'want' }), { 1: 'want', 2: 'reading', 3: 'want' });
assert.deepEqual(mergeLists(null, { 3: 'want' }), { 3: 'want' });

// Progreso de la ruta dentro de la copia
const withRoute = buildListsBackup({ 1: 'want' }, new Date(), { 3: true, 9: false, x: true });
assert.deepEqual(withRoute.routeDone, { 3: true });
assert.deepEqual(parseListsBackup(JSON.stringify(withRoute)).routeDone, { 3: true });
assert.equal(parseListsBackup('{"kind":"nextread-lists","lists":{},"routeDone":{"4":true}}').count, 0);

console.log('test:lists-backup OK');
