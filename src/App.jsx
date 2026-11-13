import { useState, useMemo, useEffect, useCallback } from 'react';
import { getBookAwardLabels } from './bookAwards.js';
import { AuthorModal } from './components/AuthorModal.jsx';
import { AuthorsView } from './components/AuthorsView.jsx';
import { BookCover } from './components/BookCover.jsx';
import { BookModal } from './components/BookModal.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { CollectionsSection, CollectionHeader } from './components/CollectionsSection.jsx';
import { CollectionsView, CollectionDetailView } from './components/CollectionsView.jsx';
import { ExperienceModal } from './components/ExperienceModal.jsx';
import { FeaturedCollections } from './components/FeaturedCollections.jsx';
import { FilterSheet } from './components/FilterSheet.jsx';
import { HeroBook } from './components/HeroBook.jsx';
import { NarrativeShelf } from './components/NarrativeShelf.jsx';
import { SanctuaryButton } from './components/SanctuaryButton.jsx';
import { RouteView } from './components/RouteView.jsx';
import { SavedView } from './components/SavedView.jsx';
import { StatsModal } from './components/StatsModal.jsx';
import { ThemeModal } from './components/ThemeModal.jsx';
import { TodayMode } from './components/TodayMode.jsx';
import { Wizard } from './components/Wizard.jsx';
import { haptic } from './components/ui.jsx';
import { useDebounce, useLocalStorage, useIsMobile } from './hooks.js';
import { normalizeFilters, parsePages, parseAcclaim, getBookOriginalLanguage, matchesLengthFilter, resolveCollectionBooks } from './lib/bookUtils.js';
import { BOOKS_URL, SYNOPSES_URL, ROUTE_URL, AUTHORS_URL, COLLECTIONS_URL, HOOKS_URL, INITIAL_LOAD, LOAD_MORE_COUNT, COPY, DEFAULT_FILTERS, SOUL_FILTERS } from './lib/constants.js';
import { mergeLists, sanitizeRouteDone } from './listsBackup.js';
import { FONT_STACK_BODY, THEMES } from './theme.js';
import { buildTodayPicks } from './todayPicks.js';

// =============================================================================
// COMPONENTE PRINCIPAL: App
// =============================================================================
export default function App() {
  const [books, setBooks] = useState([]);
  const [authorsData, setAuthorsData] = useState({});
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [hooks, setHooks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState('curated');
  const [theme, setTheme] = useLocalStorage('nextread_theme', 'night');
  const [lists, setLists] = useLocalStorage('nextread_lists', {});
  const [storedFilters, setStoredFilters] = useLocalStorage('nextread_filters', DEFAULT_FILTERS);
  const [routeDone, setRouteDone] = useLocalStorage('nextread_route_done', {});
  const [routeItems, setRouteItems] = useState([]);
  const [activeTab, setActiveTab] = useState('library');
  const [sanctuaryMode, setSanctuaryMode] = useState(false);
  const [curationSeed, setCurationSeed] = useState(() => Date.now());
  const [todayMode, setTodayMode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('today') === '1';
    } catch {
      return false;
    }
  });

  const filters = useMemo(() => normalizeFilters(storedFilters), [storedFilters]);
  const setFilters = useCallback((update) => {
    setStoredFilters(prev => {
      const normalizedPrev = normalizeFilters(prev);
      const next = typeof update === 'function' ? update(normalizedPrev) : update;
      return normalizeFilters(next);
    });
  }, [setStoredFilters]);
  
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const t = THEMES[theme];
  const isMobile = useIsMobile();
  
  // Contar libros guardados
  const savedCount = useMemo(() => Object.keys(lists).length, [lists]);
  const todayPicks = useMemo(
    () => buildTodayPicks({ books, hooks, lists, count: 3 }),
    [books, hooks, lists]
  );
  const awardMetaByBookId = useMemo(() => {
    const next = {};
    books.forEach((book) => {
      const hook = hooks[String(book.id)] || {};
      const labels = getBookAwardLabels(book, hook);
      next[book.id] = {
        labels,
        isAwarded: labels.length > 0
      };
    });
    return next;
  }, [books, hooks]);
  const awardedBookIds = useMemo(() => {
    const ids = new Set();
    Object.entries(awardMetaByBookId).forEach(([bookId, meta]) => {
      if (meta?.isAwarded) ids.add(Number(bookId));
    });
    return ids;
  }, [awardMetaByBookId]);
  const originalLanguageByBookId = useMemo(() => {
    const next = {};
    books.forEach((book) => {
      next[book.id] = getBookOriginalLanguage(book, authorsData);
    });
    return next;
  }, [books, authorsData]);
  
  // Cargar libros, autores, colecciones y hooks
  useEffect(() => {
    let cancelled = false;
    const mergeSynopses = (book, synopses) => {
      const syn = synopses[book.id];
      return syn ? { ...book, syn } : book;
    };

    // Carga inicial: lo mínimo para pintar la biblioteca.
    Promise.all([
      fetch(BOOKS_URL).then(r => r.json()),
      fetch(COLLECTIONS_URL).then(r => r.json()).catch(() => []),
      fetch(HOOKS_URL).then(r => r.json()).catch(() => ({}))
    ]).then(([booksData, collectionsData, hooksData]) => {
      if (cancelled) return;
      setBooks(booksData);
      setCollections(collectionsData);
      setHooks(hooksData);
      setLoading(false);

      // En segundo plano: sinopsis (la parte más pesada) y autores.
      fetch(SYNOPSES_URL).then(r => r.json()).then((synopses) => {
        if (cancelled) return;
        setBooks(prev => prev.map(book => mergeSynopses(book, synopses)));
        setSelectedBook(prev => (prev ? mergeSynopses(prev, synopses) : prev));
      }).catch(() => {});
      fetch(AUTHORS_URL).then(r => r.json()).then((authorsJson) => {
        if (!cancelled) setAuthorsData(authorsJson);
      }).catch(() => {});
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (todayMode) {
        params.set('today', '1');
      } else {
        params.delete('today');
      }
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    } catch {}
  }, [todayMode]);
  
  // Reset visible count
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [debouncedSearch, filters]);
  
  // Manejar tabs
  const handleTabChange = (tab) => {
    if (tab === 'recommend') {
      setShowWizard(true);
    } else if (tab === 'stats') {
      setShowStats(true);
    } else {
      setActiveTab(tab);
    }
  };

  const toggleTodayMode = useCallback(() => {
    setTodayMode(prev => !prev);
    setActiveTab('library');
    setSelectedCollection(null);
    setShowFilters(false);
  }, []);

  const rerollCuratedShelves = useCallback(() => {
    setCurationSeed((prev) => prev + 1);
  }, []);
  
  // Listas
  const getListStatus = useCallback((bookId) => lists[bookId] || null, [lists]);
  
  const handleListChange = useCallback((bookId, listId) => {
    setLists(prev => {
      if (!listId) {
        const next = { ...prev };
        delete next[bookId];
        return next;
      }
      return { ...prev, [bookId]: listId };
    });
  }, [setLists]);

  const handleImportLists = useCallback((imported, importedRoute) => {
    setLists(prev => mergeLists(prev, imported));
    if (importedRoute) {
      setRouteDone(prev => ({ ...sanitizeRouteDone(prev), ...sanitizeRouteDone(importedRoute) }));
    }
  }, [setLists, setRouteDone]);

  // La ruta se descarga la primera vez que se abre su pestaña.
  useEffect(() => {
    if (activeTab !== 'route' || routeItems.length > 0) return;
    let cancelled = false;
    fetch(ROUTE_URL).then(r => r.json()).then((data) => {
      if (!cancelled) setRouteItems(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeTab, routeItems.length]);

  // Marcar una obra de la ruta también la mueve a "Leídos" si está en la biblioteca.
  const handleToggleRouteDone = useCallback((item) => {
    const wasDone = Boolean(routeDone[item.n]) || (item.bookId != null && lists[item.bookId] === 'read');
    setRouteDone(prev => {
      const next = { ...prev };
      if (wasDone) delete next[item.n];
      else next[item.n] = true;
      return next;
    });
    if (item.bookId != null) {
      setLists(prev => {
        const next = { ...prev };
        if (wasDone) {
          if (next[item.bookId] === 'read') delete next[item.bookId];
        } else {
          next[item.bookId] = 'read';
        }
        return next;
      });
    }
  }, [routeDone, lists, setRouteDone, setLists]);

  const getBookAwardLabel = useCallback((book) => {
    const labels = awardMetaByBookId[book.id]?.labels || [];
    return labels[0] || null;
  }, [awardMetaByBookId]);

  const selectedCollectionBookIds = useMemo(() => {
    if (!selectedCollection) return null;
    const ids = new Set();
    resolveCollectionBooks(selectedCollection, books, awardedBookIds).forEach((book) => {
      ids.add(book.id);
    });
    return ids;
  }, [selectedCollection, books, awardedBookIds]);
  
  // Filtrado
  const filteredBooks = useMemo(() => {
    const searchLower = debouncedSearch.trim().toLowerCase();

    return books.filter(book => {
      // Filtro por colección
      if (selectedCollectionBookIds && !selectedCollectionBookIds.has(book.id)) return false;

      const bookHook = hooks[String(book.id)] || {};
      const bookMood = book.m;
      const bookVibes = Array.isArray(book.v) ? book.v : [];
      const isAwardedBook = awardMetaByBookId[book.id]?.isAwarded || false;

      // Búsqueda por texto
      if (searchLower) {
        const searchableText = [
          book.t || book.title || '',
          (book.a || book.authors || []).join(' '),
          (Array.isArray(book.v) ? book.v : []).join(' '),
          (Array.isArray(book.themes) ? book.themes : []).join(' '),
          book.syn || '',
          bookHook.hook || '',
          bookHook.why_matters || '',
          bookHook.perfect_for || '',
          (Array.isArray(bookHook.themes) ? bookHook.themes : []).join(' '),
          bookHook.experience || ''
        ].join(' ').toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }

      // Filtros clásicos
      if (filters.difficulty && String(book.d || book.difficulty || '').toLowerCase() !== filters.difficulty) return false;
      if (filters.hasAwards && !isAwardedBook) return false;
      if (filters.mood && book.m !== filters.mood) return false;
      if (filters.genres.length > 0 && !filters.genres.some(g => bookVibes.includes(g))) return false;
      if (filters.minAcclaim && parseAcclaim(book) < filters.minAcclaim) return false;
      if (filters.length && !matchesLengthFilter(book, filters.length)) return false;
      if (filters.language && (originalLanguageByBookId[book.id] || 'unknown') !== filters.language) return false;

      // FILTROS CON ALMA
      // Filtro por experiencia
      if (filters.experience) {
        const expFilter = SOUL_FILTERS.experience.options.find(o => o.id === filters.experience);
        if (expFilter) {
          const moodMatch = expFilter.moods?.some(m => bookMood === m);
          const vibeMatch = expFilter.vibes?.some(v => bookVibes.includes(v));
          if (!moodMatch && !vibeMatch) return false;
        }
      }
      
      // Filtro por momento
      if (filters.moment) {
        const momFilter = SOUL_FILTERS.moment.options.find(o => o.id === filters.moment);
        if (momFilter) {
          const bookPages = parsePages(book);
          // Filtro por páginas
          if (momFilter.maxPages && bookPages > momFilter.maxPages) return false;
          if (momFilter.minPages && bookPages < momFilter.minPages) return false;
          // Filtro por mood (para vacaciones, noches largas)
          if (momFilter.moods) {
            const moodMatch = momFilter.moods.some(m => bookMood === m);
            if (!moodMatch) return false;
          }
        }
      }
      
      // Filtro por tema
      if (filters.theme) {
        const themeFilter = SOUL_FILTERS.theme.options.find(o => o.id === filters.theme);
        if (themeFilter) {
          const vibeMatch = themeFilter.vibes?.some(v => bookVibes.includes(v));
          const moodMatch = themeFilter.moods?.some(m => bookMood === m);
          const keywordMatch = themeFilter.keywords?.some(k => {
            const keyword = String(k || '').toLowerCase();
            if (!keyword) return false;
            const text = `${book.syn || ''} ${bookHook.hook || ''} ${bookHook.why_matters || ''}`.toLowerCase();
            return text.includes(keyword);
          });
          if (!vibeMatch && !moodMatch && !keywordMatch) return false;
        }
      }

      return true;
    });
  }, [books, hooks, debouncedSearch, filters, selectedCollectionBookIds, originalLanguageByBookId, awardMetaByBookId]);

  const selectedCollectionCount = useMemo(() => {
    return selectedCollectionBookIds ? selectedCollectionBookIds.size : 0;
  }, [selectedCollectionBookIds]);
  const getCollectionCount = useCallback((collection) => (
    resolveCollectionBooks(collection, books, awardedBookIds).length
  ), [books, awardedBookIds]);
  
  const visibleBooks = useMemo(() => filteredBooks.slice(0, visibleCount), [filteredBooks, visibleCount]);
  
  // Estantes narrativos basados en hooks
  const narrativeShelves = useMemo(() => {
    if (viewMode !== 'curated' || selectedCollection) return null;
    
    // Solo trabajamos con libros que tienen hooks
    const booksWithHooks = books.filter(b => hooks[String(b.id)]);
    
    if (booksWithHooks.length === 0) return null;

    const hashSeed = (input) => {
      const text = String(input || '');
      let hash = 0;
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash << 5) - hash + text.charCodeAt(index);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const seededNoise = (bookId, salt = '') => {
      const seed = hashSeed(`${curationSeed}:${bookId}:${salt}`);
      return (seed % 1000) / 1000;
    };

    const pickUniqueByAuthor = (scoredBooks, limit = 8) => {
      const picked = [];
      const seenAuthors = new Set();

      scoredBooks.forEach((item) => {
        const primaryAuthor = (item.book.a || [])[0] || `book-${item.book.id}`;
        if (picked.length >= limit) return;
        if (seenAuthors.has(primaryAuthor)) return;
        seenAuthors.add(primaryAuthor);
        picked.push(item);
      });

      if (picked.length < limit) {
        scoredBooks.forEach((item) => {
          if (picked.length >= limit) return;
          if (!picked.some((entry) => entry.book.id === item.book.id)) {
            picked.push(item);
          }
        });
      }

      return picked;
    };

    const pickVariedShelf = (items, limit, salt) => {
      const sorted = [...items].sort((a, b) => b.score - a.score);
      if (sorted.length === 0) return [];

      const poolSize = Math.min(sorted.length, Math.max(limit * 4, 20));
      const pool = sorted.slice(0, poolSize);
      const scoreRange = pool.length > 1 ? Math.max(0, pool[0].score - pool[pool.length - 1].score) : 0;
      const jitter = Math.max(9, scoreRange * 0.32);
      const varied = pool
        .map((item) => ({
          ...item,
          score: item.score + (seededNoise(item.book.id, salt) * jitter),
        }))
        .sort((a, b) => b.score - a.score);

      return pickUniqueByAuthor(varied, limit);
    };

    const toReasonMap = (items) => {
      const next = {};
      items.forEach((item) => {
        next[item.book.id] = item.reason || 'Por equilibrio de calidad y perfil del estante.';
      });
      return next;
    };
    
    // Hero: rotación por semilla para evitar repetición constante
    const heroRanked = booksWithHooks
      .map((book) => {
        const hook = hooks[String(book.id)] || {};
        const score = (hook.why_matters ? hook.why_matters.length * 0.14 : 0)
          + (parseAcclaim(book) * 10)
          + (awardMetaByBookId[book.id]?.isAwarded ? 16 : 0)
          + (seededNoise(book.id, 'hero') * 6);
        return { book, score };
      })
      .sort((a, b) => b.score - a.score);

    const heroBook = heroRanked[0].book;
    const heroHook = hooks[String(heroBook.id)];
    const candidates = booksWithHooks.filter((book) => book.id !== heroBook.id);
    const cantPutDownExperience = new Set([
      'absorbente', 'perturbador', 'tenso', 'intrigante', 'vertiginoso', 'hipnótico',
      'adictivo', 'intenso', 'escalofriante', 'oscuro', 'visceral'
    ]);
    
    // "Libros que cambiaron todo" - impacto + prestigio + señal narrativa
    const changedEverythingItems = pickVariedShelf(
      candidates
        .map((book) => {
          const h = hooks[String(book.id)];
          const whyLength = h?.why_matters ? h.why_matters.length : 0;
          const acclaim = parseAcclaim(book);
          const awardBoost = awardMetaByBookId[book.id]?.isAwarded ? 28 : 0;
          const themesBoost = Array.isArray(h?.themes) ? h.themes.length * 2.5 : 0;
          const score = (whyLength * 0.28) + (acclaim * 14) + awardBoost + themesBoost;
          const awardLabel = awardMetaByBookId[book.id]?.labels?.[0];
          let reason = 'Tiene impacto literario y señal fuerte en el hook.';
          if (awardLabel) {
            reason = `Premiado (${awardLabel}) y con impacto crítico.`;
          } else if (acclaim >= 2) {
            reason = `Muy bien valorado (${acclaim}/5) y con señal de impacto.`;
          } else if (whyLength >= 80) {
            reason = 'El hook lo marca como obra transformadora.';
          }
          return { book, score, whyLength, reason };
        })
        .filter((item) => item.whyLength >= 45 || item.score >= 35)
      , 8, 'changed'
    );
    
    // "Para una tarde" - abordables + ritmo + calidad
    const forAnAfternoonItems = pickVariedShelf(
      candidates
        .map((book) => {
          const pages = parsePages(book);
          const difficulty = String(book.d || '').toLowerCase();
          const hook = hooks[String(book.id)] || {};
          const awardBoost = awardMetaByBookId[book.id]?.isAwarded ? 14 : 0;
          const acclaim = parseAcclaim(book);
          const distanceToIdeal = pages > 0 ? Math.abs(pages - 190) : 999;
          const paceBoost = pages > 0 && pages <= 280 ? 24 : 0;
          const readabilityBoost = difficulty === 'ligero' ? 12 : difficulty === 'medio' ? 7 : -5;
          const score = paceBoost + readabilityBoost + awardBoost + (acclaim * 8) - (distanceToIdeal * 0.06) +
            (hook.experience === 'adictivo' ? 5 : 0);
          const reason = pages > 0
            ? `Lectura ágil: ${pages} páginas y dificultad ${difficulty || 'media'}.`
            : `Lectura ágil y accesible para una tarde.`;
          return { book, score, pages, difficulty, reason };
        })
        .filter((item) => item.pages >= 80 && item.pages <= 300 && item.difficulty !== 'denso')
      , 8, 'afternoon'
    );
    
    // "No podrás soltarlo" - intensidad narrativa + tensión
    const cantPutDownItems = pickVariedShelf(
      candidates
        .map((book) => {
          const hook = hooks[String(book.id)] || {};
          const exp = String(hook.experience || '').toLowerCase();
          const mood = String(book.m || '').toLowerCase();
          const acclaim = parseAcclaim(book);
          const awardBoost = awardMetaByBookId[book.id]?.isAwarded ? 10 : 0;
          const hookText = `${hook.hook || ''} ${hook.why_matters || ''}`.toLowerCase();
          const hookIntensity = /(adictiv|imposible soltar|vertigin|intrig|tensi|obsesi)/.test(hookText) ? 8 : 0;
          const expBoost = cantPutDownExperience.has(exp) ? 20 : 0;
          const moodBoost = ['tenso', 'inquietante', 'oscuro'].includes(mood) ? 8 : 0;
          const score = expBoost + moodBoost + hookIntensity + (acclaim * 9) + awardBoost;
          const primarySignal = hook.experience || book.m || 'intensidad narrativa';
          const reason = `Señal fuerte de tensión: ${primarySignal}.`;
          return { book, score, exp, mood, reason };
        })
        .filter((item) => cantPutDownExperience.has(item.exp) || ['tenso', 'inquietante', 'oscuro'].includes(item.mood))
      , 8, 'cantputdown'
    );
    
    // "Viaje interior" - contemplativos, íntimos
    const innerJourneyItems = pickVariedShelf(
      candidates
      .filter(b => {
        const h = hooks[String(b.id)];
        return ['contemplativo', 'melancólico', 'íntimo', 'nostálgico', 'evocador', 'trascendente'].includes(h?.experience);
      })
      .map((book) => {
        const h = hooks[String(book.id)] || {};
        const score = (h.why_matters ? h.why_matters.length * 0.2 : 0) + (parseAcclaim(book) * 8);
        const reason = `Perfil introspectivo (${h.experience || book.m || 'contemplativo'}).`;
        return { book, score, reason };
      })
    , 8, 'innerjourney'
    );
    
    return { 
      heroBook, 
      heroHook,
      changedEverything: changedEverythingItems.map((item) => item.book),
      changedEverythingReasons: toReasonMap(changedEverythingItems),
      forAnAfternoon: forAnAfternoonItems.map((item) => item.book),
      forAnAfternoonReasons: toReasonMap(forAnAfternoonItems),
      cantPutDown: cantPutDownItems.map((item) => item.book),
      cantPutDownReasons: toReasonMap(cantPutDownItems),
      innerJourney: innerJourneyItems.map((item) => item.book),
      innerJourneyReasons: toReasonMap(innerJourneyItems),
    };
  }, [books, hooks, viewMode, selectedCollection, awardMetaByBookId, curationSeed]);
  
  const moods = useMemo(() => {
    const moodSet = new Set(books.map(b => b.m).filter(Boolean));
    return Array.from(moodSet).sort();
  }, [books]);

  const genres = useMemo(() => {
    const counts = new Map();
    books.forEach((book) => {
      const bookGenres = Array.isArray(book.v) ? book.v : [];
      bookGenres.forEach((genre) => {
        if (!genre) return;
        counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
  }, [books]);
  
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredBooks.length));
  }, [filteredBooks.length]);
  
  const hasFiltersActive = filters.difficulty || filters.mood || filters.hasAwards ||
    filters.experience || filters.moment || filters.theme || debouncedSearch ||
    filters.length || filters.language || filters.minAcclaim ||
    (filters.genres && filters.genres.length > 0);
  
  // CSS global para microinteracciones minimalistas
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { 
        from { opacity: 0; } 
        to { opacity: 1; } 
      }
      
      @keyframes slideUp { 
        from { opacity: 0; transform: translateY(18px); } 
        to { opacity: 1; transform: translateY(0); } 
      }
      
      @keyframes scaleIn { 
        from { opacity: 0; transform: scale(0.985); } 
        to { opacity: 1; transform: scale(1); } 
      }
      
      @keyframes shimmer { 
        0% { background-position: -200% 0; } 
        100% { background-position: 200% 0; } 
      }
      
      :root {
        --ease-standard: cubic-bezier(0.2, 0, 0, 1);
        --duration-fast: 120ms;
        --duration-normal: 180ms;
        --duration-slow: 240ms;
      }
      
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0;
        -webkit-tap-highlight-color: transparent;
      }
      
      html, body, #root { min-height: 100vh; }
      
      body { 
        font-family: ${FONT_STACK_BODY}; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        touch-action: manipulation;
      }
      
      ::-webkit-scrollbar { width: 7px; height: 7px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { 
        background: rgba(127, 127, 127, 0.28); 
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover { 
        background: rgba(127, 127, 127, 0.42); 
      }
      
      .touchable {
        transition: transform var(--duration-fast) var(--ease-standard),
                    opacity var(--duration-fast) var(--ease-standard);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      }
      
      .touchable:active {
        transform: scale(0.985);
        opacity: 0.96;
      }
      
      .book-cover {
        transition: transform var(--duration-fast) var(--ease-standard),
                    box-shadow var(--duration-fast) var(--ease-standard),
                    border-color var(--duration-fast) var(--ease-standard);
      }
      
      .book-cover:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.12);
      }
      
      .book-cover:active {
        transform: scale(0.99);
      }
      
      .modal-sheet {
        animation: slideUp var(--duration-slow) var(--ease-standard);
      }
      
      .modal-overlay {
        animation: fadeIn var(--duration-normal) var(--ease-standard);
      }
      
      .stagger-item {
        opacity: 0;
        animation: fadeIn var(--duration-normal) var(--ease-standard) forwards;
      }
      
      .stagger-item:nth-child(1) { animation-delay: 0ms; }
      .stagger-item:nth-child(2) { animation-delay: 50ms; }
      .stagger-item:nth-child(3) { animation-delay: 100ms; }
      .stagger-item:nth-child(4) { animation-delay: 150ms; }
      .stagger-item:nth-child(5) { animation-delay: 200ms; }
      .stagger-item:nth-child(6) { animation-delay: 250ms; }
      .stagger-item:nth-child(7) { animation-delay: 300ms; }
      .stagger-item:nth-child(8) { animation-delay: 350ms; }
      
      :focus-visible {
        outline: 2px solid rgba(217, 65, 43, 0.62);
        outline-offset: 2px;
      }
      
      .skeleton {
        background: linear-gradient(90deg, 
          rgba(127, 127, 127, 0.08) 25%, 
          rgba(127, 127, 127, 0.16) 50%, 
          rgba(127, 127, 127, 0.08) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.6s infinite linear;
        border-radius: 8px;
      }
      
      button, [role="button"], .touchable {
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center',
        background: t.bg.primary
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <p style={{ fontSize: '14px', color: t.text.secondary }}>{COPY.loading}</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: t.bg.primary, 
      transition: 'background 180ms ease',
      paddingBottom: isMobile && !sanctuaryMode ? '80px' : '0'
    }}>
      {/* Header (oculto en modo santuario) */}
      {!sanctuaryMode && (
        <header style={{ 
          position: 'sticky', top: 0, zIndex: 50,
          background: t.bg.primary,
          borderBottom: `1px solid ${t.border.default}`,
          padding: '16px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'background 180ms ease'
        }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              {/* Logo - Click para volver a Home */}
              <div 
                onClick={() => { 
                  setActiveTab('library'); 
                  setTodayMode(false);
                  setViewMode('curated');
                  setFilters(DEFAULT_FILTERS);
                  setSelectedBook(null);
                  setSelectedAuthor(null);
                  setSelectedCollection(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'opacity 120ms ease'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                title="Volver al inicio"
              >
                <span style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  border: `1px solid ${t.border.default}`,
                  background: t.bg.elevated,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: t.text.secondary
                }}>
                  NR
                </span>
                <div>
                  <h1 style={{ fontFamily: t.typography.display, fontSize: '24px', fontWeight: 400, color: t.text.primary, letterSpacing: '0.01em', lineHeight: 1 }}>NextRead</h1>
                  <p style={{ fontSize: '11px', color: t.text.tertiary, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{books.length} libros</p>
                </div>
              </div>
              
              {/* Búsqueda (solo si estamos en biblioteca) */}
              {activeTab === 'library' && !todayMode && (
                <input
                  type="text"
                  placeholder="Buscar titulo, autor, tema o hook..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  style={{
                    flex: 1,
                    maxWidth: '360px',
                    padding: '11px 16px',
                    borderRadius: '999px',
                    border: `1px solid ${t.border.default}`,
                    background: t.bg.elevated,
                    color: t.text.primary,
                    fontSize: '13px',
                    letterSpacing: '0.01em',
                    outline: 'none',
                    display: isMobile ? 'none' : 'block'
                  }}
                />
              )}
              
              {/* Acciones */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Santuario */}
                <button 
                  onClick={() => setSanctuaryMode(true)}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '8px',
                    border: `1px solid ${t.border.default}`,
                    background: t.bg.elevated,
                    color: t.text.secondary,
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={COPY.sanctuary.enter}
                >
                  ○
                </button>
                
                {/* Theme toggle */}
                <button 
                  onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '8px',
                    border: `1px solid ${t.border.default}`,
                    background: t.bg.elevated,
                    color: t.text.secondary,
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={THEMES[theme === 'night' ? 'day' : 'night'].name}
                >
                  {THEMES[theme].icon}
                </button>

                {/* Modo Hoy */}
                <button
                  onClick={toggleTodayMode}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '8px',
                    border: `1px solid ${todayMode ? t.accent : t.border.default}`,
                    background: todayMode ? t.accentMuted : t.bg.elevated,
                    color: todayMode ? t.accent : t.text.secondary,
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={todayMode ? 'Salir de Hoy' : 'Que leer hoy'}
                >
                  H
                </button>

                {/* Ruta de lectura */}
                <button
                  onClick={() => setActiveTab(activeTab === 'route' ? 'library' : 'route')}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '8px',
                    border: `1px solid ${activeTab === 'route' ? t.accent : t.border.default}`,
                    background: activeTab === 'route' ? t.accentMuted : t.bg.elevated,
                    color: activeTab === 'route' ? t.accent : t.text.secondary,
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Ruta de lectura"
                  aria-label="Ruta de lectura"
                  aria-pressed={activeTab === 'route'}
                >
                  🧭
                </button>
                
                {/* Stats (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => setShowStats(true)}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${t.border.default}`,
                      background: t.bg.elevated,
                      color: t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Estadísticas"
                  >
                    ◔
                  </button>
                )}
                
                {/* Autores (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => setActiveTab('authors')}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${activeTab === 'authors' ? t.accent : t.border.default}`,
                      background: activeTab === 'authors' ? t.accentMuted : t.bg.elevated,
                      color: activeTab === 'authors' ? t.accent : t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Autores"
                  >
                    👤
                  </button>
                )}
                
                {/* Filtros (solo en biblioteca) */}
                {activeTab === 'library' && !todayMode && (
                  <button 
                    onClick={() => setShowFilters(true)}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${hasFiltersActive ? t.accent : t.border.default}`,
                      background: hasFiltersActive ? t.accentMuted : t.bg.elevated,
                      color: hasFiltersActive ? t.accent : t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ⚙
                  </button>
                )}
                
                {/* Wizard (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => { setShowWizard(true); haptic.medium(); }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${t.accent}`,
                      background: t.accent,
                      color: t.bg.primary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      transition: 'filter 120ms ease, transform 120ms ease',
                    }}
                    onMouseEnter={e => { 
                      e.target.style.filter = 'brightness(1.04)'; 
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => { 
                      e.target.style.filter = 'brightness(1)'; 
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ¿Qué leo?
                  </button>
                )}
              </div>
            </div>
            
            {/* Búsqueda móvil */}
            {isMobile && activeTab === 'library' && !todayMode && (
              <input
                type="text"
                placeholder="Buscar titulo, autor, tema o hook..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '11px 16px',
                  borderRadius: '999px',
                  border: `1px solid ${t.border.default}`,
                  background: t.bg.elevated,
                  color: t.text.primary,
                  fontSize: '13px',
                  letterSpacing: '0.01em',
                  outline: 'none'
                }}
              />
            )}
            
            {/* Toggle Curado/Archivo (solo en biblioteca) */}
            {activeTab === 'library' && !todayMode && (
              <div style={{ 
                display: 'flex', gap: '4px', 
                marginTop: '16px', padding: '4px',
                borderRadius: '999px',
                background: t.bg.secondary,
                border: `1px solid ${t.border.default}`
              }}>
                <button
                  onClick={() => setViewMode('curated')}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '999px',
                    border: `1px solid ${viewMode === 'curated' ? t.border.default : 'transparent'}`,
                    background: viewMode === 'curated' ? t.bg.elevated : 'transparent',
                    color: viewMode === 'curated' ? t.text.primary : t.text.tertiary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'all 120ms ease'
                  }}
                >
                  {COPY.curated}
                </button>
                <button
                  onClick={() => setViewMode('archive')}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '999px',
                    border: `1px solid ${viewMode === 'archive' ? t.border.default : 'transparent'}`,
                    background: viewMode === 'archive' ? t.bg.elevated : 'transparent',
                    color: viewMode === 'archive' ? t.text.primary : t.text.tertiary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'all 120ms ease'
                  }}
                >
                  {COPY.archive}
                </button>
              </div>
            )}
          </div>
        </header>
      )}
      
      {/* Main */}
      <main style={{ 
        maxWidth: '1024px', 
        margin: '0 auto', 
        padding: sanctuaryMode ? '40px 16px' : '20px 16px 64px'
      }}>
        {/* MODO SANTUARIO */}
        {sanctuaryMode && narrativeShelves && (
          <>
            {/* Hero simplificado en sanctuary */}
            <HeroBook 
              book={narrativeShelves.heroBook}
              hook={narrativeShelves.heroHook}
              onClick={setSelectedBook}
              theme={theme}
            />
            <SanctuaryButton onExit={() => setSanctuaryMode(false)} theme={theme} />
          </>
        )}
        
        {/* VISTA HOY */}
        {!sanctuaryMode && activeTab === 'library' && todayMode && (
          <TodayMode
            picks={todayPicks}
            onBookClick={setSelectedBook}
            onExit={() => setTodayMode(false)}
            theme={theme}
            getListStatus={getListStatus}
          />
        )}

        {/* VISTA BIBLIOTECA */}
        {!sanctuaryMode && activeTab === 'library' && !todayMode && (
          <>
            {/* Colecciones */}
            {!hasFiltersActive && (
              <CollectionsSection 
                collections={collections}
                selectedCollection={selectedCollection}
                onSelectCollection={setSelectedCollection}
                theme={theme}
                getCollectionCount={getCollectionCount}
              />
            )}
            
            {/* Header de colección seleccionada */}
            {selectedCollection && (
              <CollectionHeader 
                collection={selectedCollection}
                onClear={() => setSelectedCollection(null)}
                theme={theme}
                countOverride={selectedCollectionCount}
              />
            )}
            
            {/* Libros de la colección */}
            {selectedCollection && (
              <>
                <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '20px' }}>
                  {COPY.showingOf(visibleBooks.length, filteredBooks.length)}
                </p>
                
                {visibleBooks.length > 0 ? (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '16px'
                    }}>
                      {visibleBooks.map(book => (
                        <BookCover 
                          key={book.id} 
                          book={book} 
                          onClick={setSelectedBook}
                          theme={theme}
                          listStatus={getListStatus(book.id)}
                          hasAwardOverride={awardMetaByBookId[book.id]?.isAwarded}
                        />
                      ))}
                    </div>
                    
                    {visibleCount < filteredBooks.length && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                        <button 
                          onClick={handleLoadMore}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: `1px solid ${t.border.default}`,
                            background: t.bg.tertiary,
                            color: t.text.secondary,
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Cargar más
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <p style={{ fontSize: '16px', color: t.text.secondary }}>No hay libros en esta colección</p>
                  </div>
                )}
              </>
            )}
            
            {/* Modo Curado (solo cuando no hay colección) */}
            {!selectedCollection && viewMode === 'curated' && narrativeShelves && !hasFiltersActive && (
              <>
                {/* Hero: Tu libro de hoy */}
                <HeroBook 
                  book={narrativeShelves.heroBook}
                  hook={narrativeShelves.heroHook}
                  onClick={setSelectedBook}
                  theme={theme}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                  <button
                    onClick={rerollCuratedShelves}
                    style={{
                      border: `1px solid ${t.border.default}`,
                      background: t.bg.tertiary,
                      color: t.text.secondary,
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    Cambiar recomendaciones
                  </button>
                </div>
                
                {/* Estante: Libros que cambiaron todo */}
                {narrativeShelves.changedEverything.length > 0 && (
                  <NarrativeShelf 
                    title="Libros que cambiaron todo"
                    subtitle="Obras que revolucionaron la literatura"
                    books={narrativeShelves.changedEverything}
                    hooks={hooks}
                    onBookClick={setSelectedBook}
                    theme={theme}
                    getBookAwardLabel={getBookAwardLabel}
                    getBookReason={(book) => narrativeShelves.changedEverythingReasons?.[book.id] || null}
                  />
                )}
                
                {/* Estante: No podrás soltarlo */}
                {narrativeShelves.cantPutDown.length > 0 && (
                  <NarrativeShelf 
                    title="No podrás soltarlo"
                    subtitle="Adictivos, intensos, absorbentes"
                    books={narrativeShelves.cantPutDown}
                    hooks={hooks}
                    onBookClick={setSelectedBook}
                    theme={theme}
                    getBookAwardLabel={getBookAwardLabel}
                    getBookReason={(book) => narrativeShelves.cantPutDownReasons?.[book.id] || null}
                  />
                )}
                
                {/* Estante: Para una tarde */}
                {narrativeShelves.forAnAfternoon.length > 0 && (
                  <NarrativeShelf 
                    title="Para una tarde"
                    subtitle="Lectura completa en pocas horas"
                    books={narrativeShelves.forAnAfternoon}
                    hooks={hooks}
                    onBookClick={setSelectedBook}
                    theme={theme}
                    getBookAwardLabel={getBookAwardLabel}
                    getBookReason={(book) => narrativeShelves.forAnAfternoonReasons?.[book.id] || null}
                  />
                )}
                
                {/* Estante: Viaje interior */}
                {narrativeShelves.innerJourney.length > 0 && (
                  <NarrativeShelf 
                    title="Viaje interior"
                    subtitle="Introspectivos, transformadores"
                    books={narrativeShelves.innerJourney}
                    hooks={hooks}
                    onBookClick={setSelectedBook}
                    theme={theme}
                    getBookAwardLabel={getBookAwardLabel}
                    getBookReason={(book) => narrativeShelves.innerJourneyReasons?.[book.id] || null}
                  />
                )}
                
                {/* Colecciones destacadas */}
                <FeaturedCollections 
                  collections={collections}
                  onSelect={setSelectedCollection}
                  theme={theme}
                  getCollectionCount={getCollectionCount}
                />
              </>
            )}
            
            {/* Modo Archivo */}
            {!selectedCollection && (viewMode === 'archive' || hasFiltersActive) && (
              <>
                <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '20px' }}>
                  {COPY.showingOf(visibleBooks.length, filteredBooks.length)}
                </p>
                
                {visibleBooks.length > 0 ? (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '16px'
                    }}>
                      {visibleBooks.map(book => (
                        <BookCover 
                          key={book.id} 
                          book={book} 
                          onClick={setSelectedBook}
                          theme={theme}
                          listStatus={getListStatus(book.id)}
                          hasAwardOverride={awardMetaByBookId[book.id]?.isAwarded}
                        />
                      ))}
                    </div>
                    
                    {visibleCount < filteredBooks.length && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                        <button 
                          onClick={handleLoadMore}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: `1px solid ${t.border.default}`,
                            background: t.bg.tertiary,
                            color: t.text.secondary,
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Cargar más
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <p style={{ fontSize: '18px', color: t.text.secondary, marginBottom: '8px' }}>{COPY.noResults}</p>
                    <p style={{ fontSize: '14px', color: t.text.tertiary }}>{COPY.noResultsHint}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
        
        {/* VISTA GUARDADOS */}
        {!sanctuaryMode && activeTab === 'saved' && (
          <SavedView 
            books={books}
            lists={lists}
            onBookClick={setSelectedBook}
            theme={theme}
            getListStatus={getListStatus}
            onImportLists={handleImportLists}
            routeDone={routeDone}
          />
        )}

        {/* VISTA RUTA DE LECTURA */}
        {!sanctuaryMode && activeTab === 'route' && (
          <RouteView
            items={routeItems}
            books={books}
            lists={lists}
            routeDone={routeDone}
            onToggleDone={handleToggleRouteDone}
            onBookClick={setSelectedBook}
            theme={theme}
          />
        )}
        
        {/* VISTA AUTORES */}
        {!sanctuaryMode && activeTab === 'authors' && (
          <AuthorsView
            books={books}
            authorsData={authorsData}
            onAuthorClick={setSelectedAuthor}
            theme={theme}
          />
        )}
        
        {/* VISTA COLECCIONES */}
        {!sanctuaryMode && activeTab === 'collections' && !selectedCollection && (
          <CollectionsView
            collections={collections}
            books={books}
            awardedBookIds={awardedBookIds}
            onCollectionClick={setSelectedCollection}
            theme={theme}
          />
        )}
        
        {/* VISTA DETALLE DE COLECCIÓN */}
        {!sanctuaryMode && activeTab === 'collections' && selectedCollection && (
          <CollectionDetailView
            collection={selectedCollection}
            books={books}
            awardedBookIds={awardedBookIds}
            onBookClick={setSelectedBook}
            onBack={() => setSelectedCollection(null)}
            theme={theme}
            getListStatus={getListStatus}
          />
        )}
      </main>
      
      {/* Bottom Nav (solo móvil, oculto en santuario) */}
      {isMobile && !sanctuaryMode && (
        <BottomNav 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          theme={theme}
          savedCount={savedCount}
        />
      )}
      
      {/* Modales */}
      {selectedBook && (
        <BookModal 
          book={selectedBook} 
          onClose={() => setSelectedBook(null)}
          theme={theme}
          currentList={getListStatus(selectedBook.id)}
          onListChange={handleListChange}
          onAuthorClick={(author) => { setSelectedBook(null); setTimeout(() => setSelectedAuthor(author), 150); }}
          onThemeClick={(thm) => { setSelectedBook(null); setTimeout(() => setSelectedTheme(thm), 150); }}
          onExperienceClick={(exp) => { setSelectedBook(null); setTimeout(() => setSelectedExperience(exp), 150); }}
          onBookClick={(book) => { setSelectedBook(null); setTimeout(() => setSelectedBook(book), 150); }}
          bookHook={hooks[String(selectedBook.id)]}
          books={books}
          hooks={hooks}
        />
      )}
      
      {selectedAuthor && (
        <AuthorModal
          authorName={selectedAuthor}
          authorData={authorsData[selectedAuthor]}
          books={books}
          hooks={hooks}
          onClose={() => setSelectedAuthor(null)}
          onBookClick={(book) => { setSelectedAuthor(null); setTimeout(() => setSelectedBook(book), 150); }}
          onThemeClick={(thm) => { setSelectedAuthor(null); setTimeout(() => setSelectedTheme(thm), 150); }}
          theme={theme}
        />
      )}
      
      {/* Modal de Tema */}
      {selectedTheme && (
        <ThemeModal
          themeName={selectedTheme}
          books={books}
          hooks={hooks}
          onBookClick={(book) => { setSelectedTheme(null); setTimeout(() => setSelectedBook(book), 150); }}
          onExperienceClick={(exp) => { setSelectedTheme(null); setTimeout(() => setSelectedExperience(exp), 150); }}
          onClose={() => setSelectedTheme(null)}
          theme={theme}
        />
      )}
      
      {/* Modal de Experiencia */}
      {selectedExperience && (
        <ExperienceModal
          experience={selectedExperience}
          books={books}
          hooks={hooks}
          onBookClick={(book) => { setSelectedExperience(null); setTimeout(() => setSelectedBook(book), 150); }}
          onAuthorClick={(author) => { setSelectedExperience(null); setTimeout(() => setSelectedAuthor(author), 150); }}
          onClose={() => setSelectedExperience(null)}
          theme={theme}
        />
      )}
      
      {showFilters && (
        <FilterSheet 
          filters={filters} 
          setFilters={setFilters} 
          moods={moods}
          genres={genres}
          onClose={() => setShowFilters(false)}
          theme={theme}
        />
      )}
      
      {showStats && (
        <StatsModal books={books} awardedBookIds={awardedBookIds} onClose={() => setShowStats(false)} theme={theme} />
      )}
      
      {showWizard && (
        <Wizard 
          books={books}
          hooks={hooks}
          onSelect={(book) => { setShowWizard(false); setSelectedBook(book); }}
          onClose={() => setShowWizard(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
