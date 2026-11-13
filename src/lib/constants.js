// =============================================================================
// CONFIGURACIÓN
// =============================================================================
// Derivados de biblioteca_app.json por scripts/build-data.mjs
export const BOOKS_URL = '/data/books-core.json';

export const SYNOPSES_URL = '/data/synopses.json';

export const AUTHORS_URL = '/authors.json';

export const COLLECTIONS_URL = '/collections.json';

export const HOOKS_URL = '/hooks.json';

export const INITIAL_LOAD = 42;

export const LOAD_MORE_COUNT = 21;

// =============================================================================
// MICROCOPY
// =============================================================================
export const COPY = {
  loading: 'Preparando tu biblioteca...',
  noResults: 'Ningún libro coincide con estos filtros',
  noResultsHint: 'Prueba con menos restricciones',
  curated: 'Selección para ti',
  archive: 'Tu biblioteca completa',
  forToday: 'Para hoy',
  easyPrized: 'Premiados accesibles',
  byMood: 'Según tu momento',
  showingOf: (shown, total) => `${shown} de ${total} libros`,
  readNow: 'Lo leo ahora',
  readLater: 'Para después',
  alreadyRead: 'Ya lo leí',
  stats: {
    title: 'Tu biblioteca',
    books: 'libros',
    pages: 'páginas',
    hours: 'horas de lectura',
    awarded: 'premiados',
    message: 'Tienes lecturas para muchos años. Qué lujo.',
  },
  tabs: {
    library: 'Biblioteca',
    recommend: 'Descubrir',
    saved: 'Guardados',
    stats: 'Stats',
    authors: 'Autores',
    collections: 'Colecciones'
  },
  sanctuary: {
    enter: 'Modo santuario',
    exit: 'Salir'
  },
  saved: {
    empty: 'Aún no has guardado libros',
    emptyHint: 'Explora la biblioteca y guarda los que te interesen',
    reading: 'Leyendo',
    want: 'Quiero leer',
    read: 'Leídos',
    backupHint: 'Tus listas solo viven en este dispositivo.',
    export: 'Exportar copia',
    import: 'Importar copia'
  }
};

export const DEFAULT_FILTERS = {
  search: '',
  difficulty: null,
  hasAwards: false,
  mood: null,
  experience: null,
  moment: null,
  theme: null,
  genres: [],
  minAcclaim: null,
  length: null,
  language: null
};

export const ACCLAIM_FILTER_OPTIONS = [
  { id: 1, label: '1+ critica' },
  { id: 2, label: '2+ critica' },
  { id: 3, label: '3+ critica' },
  { id: 4, label: '4+ critica' }
];

export const LENGTH_FILTER_OPTIONS = [
  { id: 'short', label: 'Corto', max: 250 },
  { id: 'medium', label: 'Medio', min: 251, max: 450 },
  { id: 'long', label: 'Largo', min: 451, max: 700 },
  { id: 'epic', label: 'Epico', min: 701 }
];

export const LANGUAGE_FILTER_OPTIONS = [
  { id: 'es', label: 'Espanol' },
  { id: 'en', label: 'Ingles' },
  { id: 'fr', label: 'Frances' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Portugues' },
  { id: 'de', label: 'Aleman' },
  { id: 'unknown', label: 'Sin detectar' }
];

export const NATIONALITY_LANGUAGE_PATTERNS = {
  es: ['espanol', 'espanola', 'argentin', 'mexican', 'colombian', 'chilen', 'peruan', 'uruguay', 'nicaragu', 'cuban', 'venezolan', 'bolivian', 'paraguay', 'ecuator', 'guatemal', 'honduren', 'salvadoren', 'costarric', 'dominican', 'puertorriq'],
  en: ['estadounidense', 'american', 'britanic', 'ingles', 'irland', 'canad', 'australian', 'neozeland', 'escoces', 'gales'],
  fr: ['frances', 'franco'],
  it: ['italian'],
  pt: ['portugues', 'brasil'],
  de: ['aleman', 'austriac', 'german']
};

export const SPOILER_LEVELS = [
  {
    id: 'vibes',
    label: 'Vibes',
    description: 'Solo tono general y sensaciones.'
  },
  {
    id: 'lore',
    label: 'Lore',
    description: 'Contexto, temas y por que importa.'
  },
  {
    id: 'personajes',
    label: 'Personajes',
    description: 'Vista breve de personajes y situacion inicial.'
  },
  {
    id: 'detalles',
    label: 'Detalles',
    description: 'Ficha completa con sinopsis extendida.'
  }
];

export const SPOILER_RANK = {
  vibes: 0,
  lore: 1,
  personajes: 2,
  detalles: 3
};

// =============================================================================
// COMPONENTE: FilterSheet
// =============================================================================
// Definición de filtros con alma
export const SOUL_FILTERS = {
  experience: {
    label: '¿Qué quieres sentir?',
    options: [
      { id: 'cry', icon: '💔', label: 'Me hará llorar', moods: ['emotivo', 'íntimo'], vibes: ['dramático'] },
      { id: 'grip', icon: '🔥', label: 'No podré soltarlo', moods: ['tenso', 'inquietante'], vibes: ['intriga', 'policial', 'psicológico'] },
      { id: 'think', icon: '🧠', label: 'Me hará pensar', moods: ['reflexivo'], vibes: ['ensayo', 'filosófico'] },
      { id: 'smile', icon: '😂', label: 'Me hará sonreír', moods: ['ligero', 'entretenido', 'irónico'], vibes: ['humor'] },
      { id: 'escape', icon: '🌌', label: 'Otro mundo', moods: ['inmersivo', 'imaginativo', 'especulativo'], vibes: ['fantasía', 'ciencia ficción'] }
    ]
  },
  moment: {
    label: '¿Cuándo lo leerás?',
    options: [
      { id: 'commute', icon: '🚇', label: 'En el metro', maxPages: 250, desc: 'Breve y ágil' },
      { id: 'weekend', icon: '☕', label: 'Fin de semana', minPages: 200, maxPages: 400, desc: 'Ideal para 2-3 días' },
      { id: 'vacation', icon: '🏖️', label: 'Vacaciones', moods: ['entretenido', 'inmersivo', 'ligero'], desc: 'Puro disfrute' },
      { id: 'nights', icon: '🌙', label: 'Noches largas', moods: ['tenso', 'inmersivo', 'inquietante'], desc: 'Que no te deje dormir' },
      { id: 'epic', icon: '📚', label: 'Proyecto épico', minPages: 500, desc: 'Más de 500 páginas' }
    ]
  },
  theme: {
    label: '¿Qué te interesa?',
    options: [
      { id: 'identity', icon: '🪞', label: 'Identidad', vibes: ['psicológico', 'memorias'], keywords: ['memoria', 'identidad'] },
      { id: 'love', icon: '❤️', label: 'Amor', vibes: ['romántico', 'erótico'], moods: ['emotivo', 'íntimo'] },
      { id: 'power', icon: '⚔️', label: 'Poder', vibes: ['histórico', 'político', 'historia'] },
      { id: 'crime', icon: '🔍', label: 'Crimen', vibes: ['policial', 'intriga', 'noir'] },
      { id: 'worlds', icon: '✨', label: 'Otros mundos', vibes: ['fantasía', 'ciencia ficción', 'aventura'] },
      { id: 'real', icon: '📰', label: 'Vida real', vibes: ['crónica', 'memorias', 'ensayo', 'divulgación'] }
    ]
  }
};
