import { isAwardCollection } from '../bookAwards.js';
import { DEFAULT_FILTERS, LENGTH_FILTER_OPTIONS, NATIONALITY_LANGUAGE_PATTERNS } from './constants.js';

export const coverThumbUrl = (bookId) => `/portadas/thumbs/${bookId}.webp`;

export const normalizeFilters = (value = {}) => {
  const next = { ...DEFAULT_FILTERS, ...value };
  next.genres = Array.isArray(next.genres) ? next.genres.filter(Boolean) : [];
  next.minAcclaim = Number.isFinite(Number(next.minAcclaim)) ? Number(next.minAcclaim) : null;
  return next;
};

export const parsePages = (book) => {
  const raw = Number(book?.pg ?? book?.pages ?? 0);
  return Number.isFinite(raw) ? raw : 0;
};

export const parseAcclaim = (book) => {
  const raw = Number(book?.ac ?? 0);
  return Number.isFinite(raw) ? raw : 0;
};

export const normalizeForMatch = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-z]+/g, ' ')
    .trim();

export const toLanguageCode = (value) => {
  const normalized = normalizeForMatch(value);
  if (!normalized) return null;
  if (normalized === 'es' || normalized.includes('espanol') || normalized.includes('spanish')) return 'es';
  if (normalized === 'en' || normalized.includes('ingles') || normalized.includes('english')) return 'en';
  if (normalized === 'fr' || normalized.includes('frances') || normalized.includes('french')) return 'fr';
  if (normalized === 'it' || normalized.includes('italiano') || normalized.includes('italian')) return 'it';
  if (normalized === 'pt' || normalized.includes('portugues') || normalized.includes('portuguese')) return 'pt';
  if (normalized === 'de' || normalized.includes('aleman') || normalized.includes('german')) return 'de';
  return null;
};

export const detectLanguageFromNationality = (nationality) => {
  const normalized = normalizeForMatch(nationality);
  if (!normalized) return null;

  const score = { es: 0, en: 0, fr: 0, it: 0, pt: 0, de: 0 };
  Object.entries(NATIONALITY_LANGUAGE_PATTERNS).forEach(([lang, patterns]) => {
    patterns.forEach((pattern) => {
      if (normalized.includes(pattern)) score[lang] += 1;
    });
  });

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  if (!ranked[0] || ranked[0][1] === 0) return null;
  if (ranked[1] && ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
};

export const getBookOriginalLanguage = (book, authorsData) => {
  const explicitOriginal = toLanguageCode(
    book?.original_language || book?.originalLanguage || book?.idioma_original || book?.lang_original
  );
  if (explicitOriginal) return explicitOriginal;

  const authors = Array.isArray(book?.a || book?.authors) ? (book?.a || book?.authors) : [];
  const detected = authors
    .map((authorName) => detectLanguageFromNationality(authorsData?.[authorName]?.nationality))
    .filter(Boolean);

  if (detected.length === 0) return 'unknown';
  const counts = detected.reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ranked[0]) return 'unknown';
  if (ranked[1] && ranked[0][1] === ranked[1][1]) return 'unknown';
  return ranked[0][0];
};

export const matchesLengthFilter = (book, lengthFilter) => {
  if (!lengthFilter) return true;
  const pages = parsePages(book);
  const option = LENGTH_FILTER_OPTIONS.find((item) => item.id === lengthFilter);
  if (!option || pages <= 0) return false;
  if (option.min && pages < option.min) return false;
  if (option.max && pages > option.max) return false;
  return true;
};

// =============================================================================
// COMPONENTE: CollectionsView
// =============================================================================
export const resolveCollectionBooks = (collection, books, awardedBookIds = new Set()) => {
  const safeBooks = Array.isArray(books) ? books.filter(Boolean) : [];
  const byId = new Map(safeBooks.map((book) => [book.id, book]));

  let resolved = [];

  if (Array.isArray(collection?.bookIds) && collection.bookIds.length > 0) {
    resolved = collection.bookIds
      .map((id) => byId.get(id))
      .filter(Boolean);
  } else {
    const criteria = collection?.criteria;
    if (!criteria) return [];

    resolved = safeBooks.filter((book) => {
      const authors = book.a || book.authors || [];
      const vibes = book.v || book.vibes || [];
      const series = book.s || book.series;
      const pages = book.pg || book.pages || 300;
      const difficulty = book.d || book.difficulty || 'medio';

      if (criteria.authors && criteria.authors.some((author) => authors.includes(author))) return true;
      if (criteria.awards && awardedBookIds.has(book.id)) return true;
      if (criteria.vibes && criteria.vibes.some((vibe) => vibes.includes(vibe))) return true;
      if (criteria.series && series === criteria.series) return true;
      if (criteria.difficulty && difficulty === criteria.difficulty) {
        if (criteria.maxPages && pages > criteria.maxPages) return false;
        return true;
      }
      if (criteria.maxPages && !criteria.difficulty && pages <= criteria.maxPages) return true;
      if (criteria.minPages && pages >= criteria.minPages) return true;

      return false;
    });
  }

  if (isAwardCollection(collection)) {
    return resolved.filter((book) => awardedBookIds.has(book.id));
  }

  return resolved;
};

export const buildSynopsisPreview = (synopsis, maxLength = 280) => {
  const compact = String(synopsis || '').replace(/\s+/g, ' ').trim();
  if (!compact || compact.length <= maxLength) return compact;
  const chunk = compact.slice(0, maxLength);
  const breakpoints = ['. ', '; ', ', '];
  let cut = -1;
  breakpoints.forEach((bp) => {
    const idx = chunk.lastIndexOf(bp);
    if (idx > cut) cut = idx;
  });
  const safeCut = cut > 160 ? cut + 1 : maxLength;
  return `${chunk.slice(0, safeCut).trim()}...`;
};
