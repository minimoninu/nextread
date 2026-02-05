const LIST_READING = 'reading';
const LIST_WANT = 'want';
const LIST_READ = 'read';

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hashString = (value) => {
  const text = String(value ?? '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildDateSeed = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const getBookAwards = (book) => toArray(book?.aw || book?.awards);

const getBookAclaim = (book) => toNumber(book?.ac, 0);

const getBookPages = (book) => toNumber(book?.pg ?? book?.pages, 0);

const getBookDifficulty = (book) => normalizeText(book?.d || book?.difficulty).toLowerCase();

const getPrimaryAuthor = (book) => {
  const authors = toArray(book?.a || book?.authors);
  const firstAuthor = normalizeText(authors[0]);
  return firstAuthor || 'unknown';
};

const scoreBook = ({ book, hook, listStatus, seed }) => {
  let score = 0;

  if (listStatus === LIST_READING) score += 35;
  if (listStatus === LIST_WANT) score += 16;

  if (hook?.hook) score += 14;
  if (hook?.why_matters) score += 10;
  if (hook?.perfect_for) score += 6;

  const awards = getBookAwards(book);
  if (awards.length > 0) score += 14;

  const acclaim = getBookAclaim(book);
  score += Math.min(12, acclaim * 3);

  const pages = getBookPages(book);
  if (pages > 0 && pages <= 280) score += 10;
  if (pages > 280 && pages <= 420) score += 6;
  if (pages >= 800) score -= 6;

  const difficulty = getBookDifficulty(book);
  if (difficulty === 'ligero') score += 8;
  if (difficulty === 'medio') score += 4;
  if (difficulty === 'denso') score -= 3;

  const seriesIndex = toNumber(book?.si, 0);
  if (seriesIndex > 1) score -= 6;

  score += (hashString(`${seed}:${book?.id}`) % 1000) / 1000;

  return score;
};

const buildReason = ({ book, hook, listStatus }) => {
  if (listStatus === LIST_READING) {
    return 'Ya esta en "Leyendo": es la opcion mas directa para hoy.';
  }

  const awards = getBookAwards(book);
  const acclaim = getBookAclaim(book);

  if (awards.length > 0 && acclaim > 0) {
    return 'Combina premios y aclamacion critica.';
  }

  if (awards.length > 0) {
    return `Tiene ${awards.length} premio(s) en sus metadatos.`;
  }

  if (acclaim > 0) {
    return `Tiene aclamacion critica (${acclaim}/5).`;
  }

  if (hook?.why_matters) {
    return hook.why_matters;
  }

  const pages = getBookPages(book);
  if (pages > 0 && pages <= 320) {
    return `Lectura abordable para hoy (${pages} paginas).`;
  }

  if (hook?.perfect_for) {
    return `Ideal para: ${hook.perfect_for}`;
  }

  return 'Buena opcion por equilibrio entre impacto y dificultad.';
};

const buildCandidate = (book, hooks, lists, seed) => {
  const listStatus = lists?.[book.id] ?? null;
  const hook = hooks?.[String(book.id)] ?? null;

  return {
    book,
    hook,
    listStatus,
    score: scoreBook({ book, hook, listStatus, seed }),
    reason: buildReason({ book, hook, listStatus }),
  };
};

const pickDiverseTop = (sortedCandidates, count) => {
  const picks = [];

  for (let i = 0; i < sortedCandidates.length && picks.length < count; i += 1) {
    const candidate = sortedCandidates[i];
    const currentAuthor = getPrimaryAuthor(candidate.book);
    const currentSeries = normalizeText(candidate.book?.s);

    const repeatsAuthor = picks.some((pick) => getPrimaryAuthor(pick.book) === currentAuthor);
    const repeatsSeries = currentSeries && picks.some((pick) => normalizeText(pick.book?.s) === currentSeries);

    const remainingSlots = count - picks.length;
    const remainingItems = sortedCandidates.length - i;

    if ((repeatsAuthor || repeatsSeries) && remainingItems > remainingSlots) {
      continue;
    }

    picks.push(candidate);
  }

  if (picks.length < count) {
    for (let i = 0; i < sortedCandidates.length && picks.length < count; i += 1) {
      const candidate = sortedCandidates[i];
      if (!picks.some((pick) => pick.book.id === candidate.book.id)) {
        picks.push(candidate);
      }
    }
  }

  return picks;
};

export const buildTodayPicks = ({ books = [], hooks = {}, lists = {}, count = 3, date = new Date() }) => {
  const source = Array.isArray(books) ? books.filter(Boolean) : [];
  if (source.length === 0 || count <= 0) return [];

  const unread = source.filter((book) => lists?.[book.id] !== LIST_READ);
  const pool = unread.length > 0 ? unread : source;

  const seed = buildDateSeed(date);
  const candidates = pool.map((book) => buildCandidate(book, hooks, lists, seed));

  const sorted = candidates.sort((a, b) => b.score - a.score);
  return pickDiverseTop(sorted, count).slice(0, count);
};

export const __todayPicksInternals = {
  buildDateSeed,
  scoreBook,
  buildReason,
  getPrimaryAuthor,
};
