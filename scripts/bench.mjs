import fs from 'fs';
import { performance } from 'perf_hooks';

// Simulate the logic of calculateScore and getRecommendations
const rawBooks = Array.from({ length: 50000 }).map((_, i) => ({
  id: String(i),
  title: `Book ${i}`,
  v: i % 2 === 0 ? ['dark', 'thriller'] : ['light', 'romance'],
  m: i % 3 === 0 ? 'sad' : 'happy',
  pg: 200 + (i % 400),
  d: i % 5 === 0 ? 'hard' : 'medium',
  s: i % 4 === 0 ? 'series1' : null,
  aw: i % 10 === 0 ? ['Hugo'] : []
}));

const hooks = {};
for (const book of rawBooks) {
  hooks[book.id] = { themes: ['magic', 'dragons'], experience: 'immersive' };
}

const preferences = {
  themes: ['magic'],
  experiences: ['immersive'],
  vibes: ['dark'],
  moods: ['sad'],
  keywords: ['magic'],
  pages: { min: 200, max: 500 },
  difficulty: ['hard'],
  standalone: true,
  riskLevel: 'safe'
};

const calculateScore = (book) => {
  let score = 0;
  const bookHook = hooks[String(book.id)];
  const bookVibes = book.v || [];
  const bookMood = book.m || '';
  const bookThemes = bookHook?.themes || [];
  const bookExperience = bookHook?.experience || '';
  const pages = book.pg || 300;
  const difficulty = book.d || 'medio';
  const hasSeries = !!book.s;
  const awards = book.aw || [];

  const matchDetails = { themes: [], experiences: false, vibes: [], moods: false, pages: false, difficulty: false, series: false, awards: false, hook: !!bookHook };

  // MATCH DIRECTO
  const userThemes = preferences.themes || [];
  const themeMatches = bookThemes.filter(t => userThemes.includes(t));
  if (themeMatches.length > 0) { score += themeMatches.length * 25; matchDetails.themes = themeMatches; }

  const userExperiences = preferences.experiences || [];
  if (bookExperience && userExperiences.includes(bookExperience)) { score += 40; matchDetails.experiences = true; }

  const userVibes = preferences.vibes || [];
  const vibeMatches = bookVibes.filter(v => userVibes.includes(v));
  if (vibeMatches.length > 0) { score += vibeMatches.length * 15; matchDetails.vibes = vibeMatches; }

  const userMoods = preferences.moods || [];
  if (bookMood && userMoods.includes(bookMood)) { score += 20; matchDetails.moods = true; }

  // FILTROS DUROS
  const pagePrefs = preferences.pages;
  if (pagePrefs) {
    const maxPages = pagePrefs.max || 9999;
    const minPages = pagePrefs.min || 0;
    if (pages > maxPages) { score -= 60; } else if (pages < minPages) { score -= 40; } else { score += 15; matchDetails.pages = true; }
  }

  const diffPrefs = preferences.difficulty;
  if (diffPrefs && diffPrefs.length > 0) {
    if (diffPrefs.includes(difficulty)) { score += 15; matchDetails.difficulty = true; } else { score -= 35; }
  }

  if (preferences.standalone === true && hasSeries) { score -= 100; }
  if (preferences.wantsSeries === true && !hasSeries) { score -= 25; }
  if (preferences.wantsSeries === true && hasSeries) { score += 10; matchDetails.series = true; }

  if (bookHook) { score += 5; }
  if (awards.length > 0) {
    matchDetails.awards = true;
    if (preferences.riskLevel === 'safe') { score += 15; } else { score += 3; }
  }

  if (preferences.riskLevel === 'adventurous') {
    if (awards.length === 0) score += 15;
    if (!bookHook) score += 10;
  }

  if (preferences.filter) {
    if (preferences.filter.noAwards && awards.length === 0) score += 20;
    if (preferences.filter.hasAwards && awards.length > 0) score += 20;
    if (preferences.filter.award && awards.includes(preferences.filter.award)) score += 25;
  }

  score += Math.random() * 20;

  return { score: Math.max(0, score), matchDetails };
};

// Original
const getRecommendationsOriginal = () => {
  const scored = rawBooks.map(book => {
    const { score, matchDetails } = calculateScore(book);
    return { book, score, matchDetails };
  });

  scored.sort((a, b) => b.score - a.score);

  const valid = scored.filter(s => s.score > 0);

  if (valid.length === 0) {
    return scored.slice(0, 8);
  }
  return valid.slice(0, 8);
};

// Optimized
const getRecommendationsOptimized = () => {
  const valid = [];
  let hasValid = false;
  const backup = [];

  for (let i = 0; i < rawBooks.length; i++) {
    const book = rawBooks[i];
    const { score, matchDetails } = calculateScore(book);

    if (score > 0) {
      valid.push({ book, score, matchDetails });
      hasValid = true;
    } else if (!hasValid) {
      backup.push({ book, score, matchDetails });
    }
  }

  if (valid.length > 0) {
    valid.sort((a, b) => b.score - a.score);
    return valid.slice(0, 8);
  } else {
    backup.sort((a, b) => b.score - a.score);
    return backup.slice(0, 8);
  }
};

const runBenchmark = () => {
  // Warmup
  for (let i = 0; i < 5; i++) {
    getRecommendationsOriginal();
    getRecommendationsOptimized();
  }

  const startOriginal = performance.now();
  for (let i = 0; i < 10; i++) {
    getRecommendationsOriginal();
  }
  const endOriginal = performance.now();

  const startOptimized = performance.now();
  for (let i = 0; i < 10; i++) {
    getRecommendationsOptimized();
  }
  const endOptimized = performance.now();

  console.log(`Original: ${(endOriginal - startOriginal) / 10} ms`);
  console.log(`Optimized: ${(endOptimized - startOptimized) / 10} ms`);
  console.log(`Improvement: ${(((endOriginal - startOriginal) - (endOptimized - startOptimized)) / (endOriginal - startOriginal) * 100).toFixed(2)}%`);
};

runBenchmark();
