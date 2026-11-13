// Lógica pura de la ruta de lectura (compartida por la app y scripts/build-data.mjs).

export const ROUTE_STAGES = [
  { id: '1810-1879', from: 1810, to: 1879, label: '1810–1879', title: 'La novela moderna', goal: 'Aprender las convenciones fundamentales de novela, cuento, narrador, personaje y conflicto.' },
  { id: '1880-1919', from: 1880, to: 1919, label: '1880–1919', title: 'Nuevas voces y técnicas', goal: 'Ampliar el mapa sin disparar la dificultad: naturalismo, cuento, policial, proto-modernismo.' },
  { id: '1920-1949', from: 1920, to: 1949, label: '1920–1949', title: 'El modernismo', goal: 'Introducir modernismo, narradores no fiables, flujo de conciencia, absurdo y nuevas estructuras.' },
  { id: '1950-1979', from: 1950, to: 1979, label: '1950–1979', title: 'La gran complejidad del siglo XX', goal: 'Consolidar al lector frente a textos filosóficos, fragmentarios y culturalmente más diversos.' },
  { id: '1980-1999', from: 1980, to: 1999, label: '1980–1999', title: 'La experimentación como norma', goal: 'Convertir posmodernismo, memoria y polifonía en recursos familiares.' },
  { id: '2000-2026', from: 2000, to: 2026, label: '2000–2026', title: 'Leer el presente', goal: 'Leer narrativa contemporánea entendiendo de dónde vienen sus procedimientos.' }
];

export const ACCESS_LABELS = { 1: 'Muy accesible', 2: 'Accesible', 3: 'Intermedia', 4: 'Exigente', 5: 'Muy exigente' };

export const stageIdForYear = (year) =>
  (ROUTE_STAGES.find((stage) => year >= stage.from && year <= stage.to) || ROUTE_STAGES[ROUTE_STAGES.length - 1]).id;

export const normalizeTitle = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(el|la|los|las|un|una|de|del|y|o)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const lastName = (author) => normalizeTitle(author).split(' ').pop();

// Busca en la biblioteca el libro que corresponde a una obra de la ruta.
// Exige coincidencia de apellido del autor y de título (exacto o uno contenido en el otro).
export const matchRouteItem = (item, books, aliases = {}) => {
  const surname = lastName(item.a);
  const byAuthor = books.filter((book) => (book.a || []).some((name) => normalizeTitle(name).split(' ').includes(surname)));
  const sameTitle = aliases.same?.[item.n];
  if (sameTitle) {
    const hit = byAuthor.find((book) => normalizeTitle(book.t) === normalizeTitle(sameTitle));
    if (hit) return { bookId: hit.id };
  }
  const title = normalizeTitle(item.t);
  const exact = byAuthor.find((book) => normalizeTitle(book.t) === title);
  if (exact) return { bookId: exact.id };
  const partial = byAuthor.find((book) => {
    const other = normalizeTitle(book.t);
    return other.length >= 4 && (other.startsWith(title) || title.startsWith(other));
  });
  if (partial) return { bookId: partial.id };
  const container = aliases.in?.[item.n];
  if (container) {
    const hit = books.find(
      (book) => book.t === container.title && (book.a || []).some((name) => name.includes(container.author))
    );
    if (hit) return { inBookId: hit.id };
  }
  return {};
};

// Una obra cuenta como leída si se marcó en la ruta o si su libro está en la lista "read".
export const isRouteItemDone = (item, routeDone = {}, lists = {}) =>
  Boolean(routeDone[item.n]) || (item.bookId != null && lists[item.bookId] === 'read');

export const summarizeRoute = (items, routeDone = {}, lists = {}) => {
  const byStage = {};
  let done = 0;
  let next = null;
  for (const item of items) {
    const stage = (byStage[item.stage] ||= { total: 0, done: 0 });
    stage.total += 1;
    if (isRouteItemDone(item, routeDone, lists)) {
      stage.done += 1;
      done += 1;
    } else if (!next) {
      next = item;
    }
  }
  return { total: items.length, done, next, byStage };
};
