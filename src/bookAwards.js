const BOOK_AWARD_PATTERNS = [
  { label: 'Booker Prize', regex: /\b(booker|man booker)\b/ },
  { label: 'Pulitzer Prize', regex: /\bpulitzer\b/ },
  { label: 'Premio Goncourt', regex: /\bgoncourt\b/ },
  { label: 'Hugo Award', regex: /\bhugo\b/ },
  { label: 'Nebula Award', regex: /\bnebula\b/ },
  { label: 'National Book Award', regex: /national book award/ },
  { label: 'National Book Critics Circle', regex: /national book critics circle/ },
  { label: 'Costa Book Award', regex: /costa book award|costa award/ },
  { label: 'PEN/Hemingway Award', regex: /pen\/?hemingway/ },
  { label: 'Premio Renaudot', regex: /\brenaudot\b/ },
  { label: 'Premio Llibreter', regex: /\bllibreter\b/ },
  { label: 'Prix Femina', regex: /prix femina/ },
  { label: 'Prix Medicis', regex: /prix medicis/ }
];

const AUTHOR_LEVEL_AWARD_HINTS = [
  /\bnobel\b/,
  /\bcervantes\b/,
  /principe de asturias/,
  /premio de la paz/,
  /academia sueca/,
  /medalla nacional/
];

const NEGATIVE_AWARD_HINTS = /\b(finalista|shortlist|longlist|nominad[oa]s?|preseleccionad[oa]s?|candidat[oa]s?)\b/;

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasAuthorLevelAwardHint = (text) => AUTHOR_LEVEL_AWARD_HINTS.some((regex) => regex.test(text));

const detectBookAwardLabels = (text) => {
  const labels = [];
  BOOK_AWARD_PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(text)) {
      labels.push(pattern.label);
    }
  });
  return labels;
};

const isValidEvidence = (text) => {
  if (!text) return false;
  if (NEGATIVE_AWARD_HINTS.test(text)) return false;
  return true;
};

export const getBookAwardLabels = (book = {}, hook = {}) => {
  const labels = new Set();

  const safeBook = book || {};
  const safeHook = hook || {};

  const explicitAwards = Array.isArray(safeBook.aw || safeBook.awards) ? (safeBook.aw || safeBook.awards) : [];
  explicitAwards.forEach((award) => {
    const normalized = normalize(award);
    if (!isValidEvidence(normalized)) return;
    if (hasAuthorLevelAwardHint(normalized)) return;

    const detected = detectBookAwardLabels(normalized);
    if (detected.length > 0) {
      detected.forEach((label) => labels.add(label));
      return;
    }

    if (normalized.includes('premio') || normalized.includes('award') || normalized.includes('prize')) {
      labels.add(String(award).trim());
    }
  });

  const evidenceTexts = [
    safeHook.why_matters,
    safeHook.hook,
    safeBook.hook,
    safeBook.why_matters
  ];

  evidenceTexts.forEach((text) => {
    const normalized = normalize(text);
    if (!isValidEvidence(normalized)) return;

    // Si solo menciona premio de autor (Nobel/Cervantes), no cuenta como premio del libro.
    if (hasAuthorLevelAwardHint(normalized) && detectBookAwardLabels(normalized).length === 0) return;

    detectBookAwardLabels(normalized).forEach((label) => labels.add(label));
  });

  return Array.from(labels);
};

export const isBookAwarded = (book = {}, hook = {}) => getBookAwardLabels(book, hook).length > 0;

export const isAwardCollection = (collection = {}) => {
  const normalized = normalize(`${collection.id || ''} ${collection.title || ''} ${collection.subtitle || ''}`);

  if (!normalized) return false;
  if (normalized.includes('nobel')) return false;

  if (Array.isArray(collection.criteria?.awards) && collection.criteria.awards.length > 0) {
    return true;
  }

  if (/\b(pulitzer|booker|goncourt|award|prize|premio|premiados)\b/.test(normalized)) {
    return true;
  }

  return collection.emoji === '🏆';
};
