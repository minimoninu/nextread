import fs from 'fs';

const booksData = JSON.parse(fs.readFileSync('public/biblioteca_app.json', 'utf8'));
const hooksData = JSON.parse(fs.readFileSync('public/hooks.json', 'utf8'));

function getBookAwardLabels(book, bookHook) {
  const labels = [];
  if (Array.isArray(book.aw)) labels.push(...book.aw);
  else if (Array.isArray(book.awards)) labels.push(...book.awards);

  if (Array.isArray(bookHook?.awards)) labels.push(...bookHook.awards);

  return [...new Set(labels)];
}

const RUNS = 100;

function benchmarkOriginal() {
  const start = performance.now();
  for (let i = 0; i < RUNS; i++) {
    const next = {};
    booksData.forEach((book) => {
      const hook = hooksData[String(book.id)] || {};
      const labels = getBookAwardLabels(book, hook);
      next[book.id] = {
        labels,
        isAwarded: labels.length > 0
      };
    });
  }
  return performance.now() - start;
}

function benchmarkOptimized() {
  const start = performance.now();
  for (let i = 0; i < RUNS; i++) {
    const next = {};
    booksData.forEach((book) => {
      const hook = hooksData[String(book.id)] || {};
      const labels = getBookAwardLabels(book, hook);
      if (labels.length > 0) {
        next[book.id] = {
          labels,
          isAwarded: true
        };
      }
    });
  }
  return performance.now() - start;
}

const origTime = benchmarkOriginal();
const optTime = benchmarkOptimized();

console.log(`Original: ${origTime.toFixed(2)}ms`);
console.log(`Optimized: ${optTime.toFixed(2)}ms`);
console.log(`Improvement: ${((origTime - optTime) / origTime * 100).toFixed(2)}%`);
