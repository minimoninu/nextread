import assert from 'node:assert/strict';
import { buildTodayPicks } from '../src/todayPicks.js';

const books = [
  {
    id: 1,
    t: 'Book A',
    a: ['Author A'],
    d: 'ligero',
    pg: 220,
    aw: ['Prize'],
    ac: 4,
  },
  {
    id: 2,
    t: 'Book B',
    a: ['Author A'],
    d: 'medio',
    pg: 520,
    aw: [],
    ac: 1,
  },
  {
    id: 3,
    t: 'Book C',
    a: ['Author B'],
    d: 'medio',
    pg: 280,
    aw: [],
    ac: 0,
  },
  {
    id: 4,
    t: 'Book D',
    a: ['Author C'],
    d: 'denso',
    pg: 900,
    aw: ['Prize'],
    ac: 0,
  }
];

const hooks = {
  '1': { hook: 'Great hook', why_matters: 'Important classic' },
  '2': { hook: 'Another hook' },
  '3': { hook: 'Short and nice' },
};

const lists = {
  2: 'read',
  3: 'reading',
};

const date = new Date('2026-02-05T10:00:00');

const picksA = buildTodayPicks({ books, hooks, lists, count: 3, date });
const picksB = buildTodayPicks({ books, hooks, lists, count: 3, date });

assert.equal(picksA.length, 3, 'should return requested count');
assert.deepEqual(
  picksA.map((entry) => entry.book.id),
  picksB.map((entry) => entry.book.id),
  'same date should produce deterministic order'
);
assert.ok(!picksA.some((entry) => entry.book.id === 2), 'read books should be excluded when unread exist');
assert.ok(
  picksA.some((entry) => entry.book.id === 3),
  'book in reading list should be prioritized into picks'
);
assert.ok(picksA.every((entry) => typeof entry.reason === 'string' && entry.reason.length > 0), 'every pick should include reason');

console.log('test:today-picks OK');
