import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import WizardPsicologico from './WizardPsicologico';
import BibliotecaStats from './BibliotecaStats';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================
const BOOKS_URL = '/biblioteca_app.json';
const INITIAL_LOAD = 50;      // Libros a mostrar inicialmente
const LOAD_MORE_COUNT = 30;   // Libros a cargar en cada scroll
const SEARCH_DEBOUNCE = 300;  // ms de debounce para búsqueda

// =============================================================================
// CONSTANTES DE COLORES
// =============================================================================
const MOOD_COLORS = {
  'oscuro': { bg: '#1a1a2e', accent: '#e94560' },
  'tenso': { bg: '#16213e', accent: '#e94560' },
  'inquietante': { bg: '#0f0f23', accent: '#9b59b6' },
  'intenso': { bg: '#2c1810', accent: '#ff6b35' },
  'emotivo': { bg: '#1a3a3a', accent: '#48c9b0' },
  'íntimo': { bg: '#2d2a4a', accent: '#a29bfe' },
  'reflexivo': { bg: '#1e272e', accent: '#74b9ff' },
  'ligero': { bg: '#2d3436', accent: '#ffeaa7' },
  'irónico': { bg: '#2d3436', accent: '#fab1a0' },
  'imaginativo': { bg: '#2d2a4a', accent: '#a29bfe' },
  'especulativo': { bg: '#1e3a3a', accent: '#55efc4' },
  'inmersivo': { bg: '#2d3436', accent: '#dfe6e9' },
  'entretenido': { bg: '#2d2a4a', accent: '#fd79a8' },
  'default': { bg: '#2c3e50', accent: '#3498db' }
};

const getMoodColor = (mood) => MOOD_COLORS[mood] || MOOD_COLORS['default'];

const generateCoverGradient = (book) => {
  const colors = getMoodColor(book.m);
  const title = book.t || book.title || '';
  const hash = title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(145deg, ${colors.bg} 0%, hsl(${hue}, 30%, 18%) 50%, ${colors.bg} 100%)`;
};

// =============================================================================
// HOOK: useDebounce
// =============================================================================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// =============================================================================
// HOOK: useIntersectionObserver (para lazy loading)
// =============================================================================
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // Solo necesitamos detectar una vez
      }
    }, { rootMargin: '100px', threshold: 0, ...options });
    
    if (ref.current) observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, []);
  
  return [ref, isVisible];
};

// =============================================================================
// COMPONENTE: BookCover (memoizado)
// =============================================================================
const BookCover = memo(({ book, onClick, size = 'medium' }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const sizes = {
    small: { container: 'w-20 h-28', text: 'text-[9px]', author: 'text-[8px]' },
    medium: { container: 'w-28 h-40 sm:w-32 sm:h-44', text: 'text-[11px]', author: 'text-[10px]' },
    large: { container: 'w-32 h-48', text: 'text-xs', author: 'text-[11px]' }
  };
  
  const s = sizes[size];
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const awards = book.aw || book.awards || [];
  const series = book.s || book.series;
  const seriesIndex = book.si || book.series_index;
  
  return (
    <div 
      ref={ref}
      className={`${s.container} rounded-lg shadow-xl cursor-pointer relative overflow-hidden flex-shrink-0 group book-card`}
      style={{ background: imgError ? generateCoverGradient(book) : '#1a1a1a' }}
      onClick={() => onClick?.(book)}
    >
      {/* Skeleton mientras no es visible o cargando */}
      {(!isVisible || (!imgLoaded && !imgError)) && (
        <div className="absolute inset-0 skeleton" />
      )}
      
      {/* Imagen - solo se carga cuando es visible */}
      {isVisible && !imgError && (
        <img 
          src={coverUrl}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Fallback generativo */}
      {imgError && (
        <>
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 p-3 flex flex-col justify-end">
            <h3 className={`font-serif font-bold ${s.text} leading-tight text-white mb-1 line-clamp-3 drop-shadow-lg`}>
              {title}
            </h3>
            <p className={`${s.author} text-white/80 truncate drop-shadow`}>{authors[0]}</p>
          </div>
        </>
      )}
      
      {/* Badge premio */}
      {awards.length > 0 && (
        <div className="book-badge absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg z-10">
          🏆
        </div>
      )}
      
      {/* Badge serie */}
      {series && (
        <div className="book-badge absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium z-10">
          #{seriesIndex}
        </div>
      )}
      
      {/* Overlay hover */}
      <div className="book-overlay absolute inset-0 bg-black/60 flex items-center justify-center z-20">
        <span className="text-white text-xs font-medium px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm transform group-hover:scale-105 transition-transform">
          Ver detalles
        </span>
      </div>
    </div>
  );
});

BookCover.displayName = 'BookCover';

// =============================================================================
// COMPONENTE: BookModal (memoizado)
// =============================================================================
const BookModal = memo(({ book, onClose }) => {
  const [imgError, setImgError] = useState(false);
  if (!book) return null;
  
  const colors = getMoodColor(book.m);
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const awards = book.aw || book.awards || [];
  const vibes = book.v || book.vibes || [];
  const series = book.s || book.series;
  const seriesIndex = book.si || book.series_index;
  const pages = book.pg || book.pages || 300;
  const hours = book.h || book.reading_time_hours || Math.round(pages / 40 * 10) / 10;
  const difficulty = book.d || book.difficulty || 'medio';
  const acclaim = book.ac || book.acclaim_score || 5;
  const synopsis = book.syn || book.synopsis || '';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm modal-backdrop" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 modal-content" onClick={e => e.stopPropagation()}>
        <div className="h-36 rounded-t-2xl relative overflow-hidden" style={{ background: generateCoverGradient(book) }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/90" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg hover:bg-black/70 hover:rotate-90 transition-all duration-200 z-10 btn-interactive">×</button>
        </div>
        
        <div className="p-6 -mt-16 relative">
          <div 
            className="w-24 h-36 rounded-lg mb-4 shadow-2xl border-2 border-zinc-800 overflow-hidden animate-popIn hover-glow"
            style={{ background: imgError ? generateCoverGradient(book) : '#1a1a1a' }}
          >
            {!imgError && (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} loading="lazy" />
            )}
          </div>
          
          <h2 className="font-serif text-2xl font-bold text-white mb-1 animate-slideUp">{title}</h2>
          <p className="text-zinc-400 text-lg animate-slideUp" style={{ animationDelay: '50ms' }}>{authors.join(', ')}</p>
          {series && <p className="text-zinc-500 text-sm mt-1 animate-slideUp" style={{ animationDelay: '100ms' }}>{series} #{seriesIndex}</p>}
          
          {awards.length > 0 && (
            <div className="flex flex-wrap gap-2 my-4">
              {awards.map((award, i) => (
                <span 
                  key={i} 
                  className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium animate-popIn hover:bg-amber-500/30 transition-colors cursor-default"
                  style={{ animationDelay: `${150 + i * 50}ms` }}
                >
                  🏆 {award}
                </span>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-4 gap-3 my-5">
            {[
              { value: pages, label: 'páginas' },
              { value: `${hours}h`, label: 'lectura' },
              { value: difficulty === 'ligero' ? '☀️' : difficulty === 'denso' ? '🌙' : '🌤️', label: difficulty, isEmoji: true },
              { value: acclaim, label: 'score', color: colors.accent },
            ].map((stat, i) => (
              <div 
                key={i}
                className="bg-zinc-800/80 rounded-xl p-3 text-center stagger-item hover:bg-zinc-800 transition-colors cursor-default"
                style={{ animationDelay: `${200 + i * 50}ms` }}
              >
                <div className={`text-xl font-bold ${stat.isEmoji ? '' : 'text-white'}`} style={stat.color ? { color: stat.color } : {}}>
                  {stat.value}
                </div>
                <div className="text-zinc-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-5">
            {vibes.slice(0,5).map((vibe, i) => (
              <span 
                key={i} 
                className="px-3 py-1 rounded-full text-sm transition-all duration-200 hover:scale-105 cursor-default stagger-item"
                style={{ backgroundColor: `${colors.accent}20`, color: colors.accent, animationDelay: `${400 + i * 30}ms` }}
              >
                {vibe}
              </span>
            ))}
            {book.m && (
              <span 
                className="px-3 py-1 rounded-full text-sm border font-medium transition-all duration-200 hover:scale-105 cursor-default stagger-item" 
                style={{ borderColor: colors.accent, color: colors.accent, animationDelay: '550ms' }}
              >
                {book.m}
              </span>
            )}
          </div>
          
          {synopsis && (
            <p className="text-zinc-400 text-sm mb-5 line-clamp-4 animate-fadeIn" style={{ animationDelay: '300ms' }}>{synopsis}</p>
          )}
          
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-black py-3 rounded-xl font-semibold btn-interactive btn-ripple hover:bg-zinc-100 active:bg-zinc-200">
              ✅ Lo leo ahora
            </button>
            <button className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-semibold btn-interactive btn-ripple hover:bg-zinc-700 active:bg-zinc-600">
              ⏳ Para después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BookModal.displayName = 'BookModal';

// =============================================================================
// COMPONENTE: LoadMoreTrigger (Intersection Observer para infinite scroll)
// =============================================================================
const LoadMoreTrigger = ({ onLoadMore, hasMore }) => {
  const [ref, isVisible] = useIntersectionObserver({ rootMargin: '200px' });
  
  useEffect(() => {
    if (isVisible && hasMore) {
      onLoadMore();
    }
  }, [isVisible, hasMore, onLoadMore]);
  
  if (!hasMore) return null;
  
  return (
    <div ref={ref} className="col-span-full flex justify-center py-8">
      <div className="flex items-center gap-3 text-zinc-500">
        <div className="spinner" />
        <span className="text-sm">Cargando más libros...</span>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: SkeletonGrid (para carga inicial)
// =============================================================================
const SkeletonGrid = ({ count = 21 }) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton w-28 h-40 sm:w-32 sm:h-44 rounded-lg" style={{ animationDelay: `${i * 50}ms` }} />
    ))}
  </div>
);

// =============================================================================
// COMPONENTE PRINCIPAL: App
// =============================================================================
export default function App() {
  // Estados principales
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    difficulty: null,
    hasAwards: false,
    mood: null
  });
  
  // Estado para infinite scroll
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  
  // Debounce de búsqueda
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE);
  
  // Cargar libros
  useEffect(() => {
    fetch(BOOKS_URL)
      .then(r => r.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
        console.log(`✅ ${data.length} libros cargados`);
      })
      .catch(err => {
        console.error('Error cargando libros:', err);
        setLoading(false);
      });
  }, []);
  
  // Reset visibleCount cuando cambian filtros
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [debouncedSearch, filters.difficulty, filters.hasAwards, filters.mood]);
  
  // Filtrar libros (memoizado)
  const filteredBooks = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    
    return books.filter(book => {
      // Búsqueda
      if (searchLower) {
        const title = (book.t || book.title || '').toLowerCase();
        const authors = (book.a || book.authors || []).join(' ').toLowerCase();
        const vibes = (book.v || book.vibes || []).join(' ').toLowerCase();
        if (!title.includes(searchLower) && !authors.includes(searchLower) && !vibes.includes(searchLower)) {
          return false;
        }
      }
      
      // Dificultad
      if (filters.difficulty) {
        const bookDiff = book.d || book.difficulty;
        if (bookDiff !== filters.difficulty) return false;
      }
      
      // Premios
      if (filters.hasAwards) {
        const awards = book.aw || book.awards || [];
        if (awards.length === 0) return false;
      }
      
      // Mood
      if (filters.mood) {
        if (book.m !== filters.mood) return false;
      }
      
      return true;
    });
  }, [books, debouncedSearch, filters.difficulty, filters.hasAwards, filters.mood]);
  
  // Libros visibles (paginación)
  const visibleBooks = useMemo(() => {
    return filteredBooks.slice(0, visibleCount);
  }, [filteredBooks, visibleCount]);
  
  // Handler para cargar más (memoizado)
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredBooks.length));
  }, [filteredBooks.length]);
  
  // Stats (memoizado)
  const stats = useMemo(() => ({
    total: books.length,
    withAwards: books.filter(b => (b.aw || b.awards || []).length > 0).length,
    filtered: filteredBooks.length,
    visible: visibleBooks.length
  }), [books, filteredBooks.length, visibleBooks.length]);
  
  // Moods únicos (memoizado)
  const moods = useMemo(() => {
    const moodSet = new Set(books.map(b => b.m).filter(Boolean));
    return Array.from(moodSet).sort();
  }, [books]);
  
  // Handler para Sorpréndeme (memoizado)
  const handleSurprise = useCallback(() => {
    if (filteredBooks.length === 0) return;
    let count = 0;
    const interval = setInterval(() => {
      const randomBook = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];
      setSelectedBook(randomBook);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const finalBook = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];
        setSelectedBook(finalBook);
      }
    }, 100);
  }, [filteredBooks]);
  
  // Handler para seleccionar libro (memoizado)
  const handleSelectBook = useCallback((book) => {
    setSelectedBook(book);
  }, []);
  
  // Verificar si hay más libros por cargar
  const hasMore = visibleCount < filteredBooks.length;
  
  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-xl shadow-lg animate-pulse">📚</div>
              <div>
                <h1 className="font-serif text-xl font-bold">NextRead</h1>
                <p className="text-zinc-500 text-xs">Cargando biblioteca...</p>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <SkeletonGrid count={21} />
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">📚</div>
              <div>
                <h1 className="font-serif text-xl font-bold leading-tight">NextRead</h1>
                <p className="text-zinc-500 text-xs">{stats.total} libros • {stats.withAwards} premiados</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-sm hidden sm:block">
              <input 
                type="text" 
                placeholder="🔍 Buscar título, autor..." 
                value={filters.search} 
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm placeholder-zinc-600 input-animated" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowStats(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-xl font-semibold text-sm whitespace-nowrap btn-interactive"
                title="Estadísticas"
              >
                📊
              </button>
              <button 
                onClick={handleSurprise}
                disabled={filteredBooks.length === 0}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap btn-interactive btn-ripple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎲 <span className="hidden sm:inline">Sorpréndeme</span>
              </button>
              <button 
                onClick={() => setShowWizard(true)} 
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-black px-4 sm:px-5 py-2 rounded-xl font-semibold text-sm whitespace-nowrap btn-interactive btn-ripple hover:shadow-lg hover:shadow-amber-500/25"
              >
                🎯 <span className="hidden sm:inline">¿Qué leo?</span>
              </button>
            </div>
          </div>
          
          {/* Búsqueda móvil */}
          <div className="mt-3 sm:hidden">
            <input 
              type="text" 
              placeholder="🔍 Buscar título, autor..." 
              value={filters.search} 
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm placeholder-zinc-600 input-animated" 
            />
          </div>
        </div>
      </header>
      
      {/* Filtros */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {['ligero', 'medio', 'denso'].map(d => (
            <button 
              key={d} 
              onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d ? null : d }))}
              className={`filter-chip px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filters.difficulty === d ? 'bg-white text-black active shadow-lg' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {d === 'ligero' ? '☀️' : d === 'denso' ? '🌙' : '🌤️'} <span className="hidden sm:inline">{d}</span>
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
          <button 
            onClick={() => setFilters(f => ({ ...f, hasAwards: !f.hasAwards }))}
            className={`filter-chip px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filters.hasAwards ? 'bg-amber-500 text-black active shadow-lg shadow-amber-500/25' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'}`}
          >
            🏆 <span className="hidden sm:inline">Premiados</span>
          </button>
          <select 
            value={filters.mood || ''} 
            onChange={e => setFilters(f => ({ ...f, mood: e.target.value || null }))}
            className="bg-zinc-800/80 text-zinc-300 px-3 sm:px-4 py-1.5 rounded-full text-sm cursor-pointer border-0 focus:outline-none"
          >
            <option value="">Mood</option>
            {moods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex-1" />
          <span className="text-zinc-500 text-sm whitespace-nowrap">
            <span key={filteredBooks.length} className="counter-animate inline-block animate-popIn font-medium text-zinc-400">
              {filteredBooks.length}
            </span>
            <span className="hidden sm:inline"> libros</span>
          </span>
        </div>
      </div>
      
      {/* Grid de libros */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 safe-area-bottom">
        {visibleBooks.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
            {visibleBooks.map(book => (
              <BookCover key={book.id} book={book} onClick={handleSelectBook} />
            ))}
            
            {/* Trigger para cargar más */}
            <LoadMoreTrigger onLoadMore={handleLoadMore} hasMore={hasMore} />
          </div>
        ) : (
          <div className="text-center py-20 animate-fadeIn">
            <div className="text-6xl mb-4 animate-bounce-slow">📭</div>
            <p className="text-zinc-500">Sin resultados</p>
            <p className="text-zinc-600 text-sm mt-2">Prueba con otros filtros</p>
          </div>
        )}
        
        {/* Indicador de progreso */}
        {hasMore && visibleBooks.length > 0 && (
          <div className="text-center mt-4 text-zinc-600 text-sm">
            Mostrando {visibleBooks.length} de {filteredBooks.length}
          </div>
        )}
      </main>
      
      {/* Modales */}
      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
      {showWizard && <WizardPsicologico books={books} onSelect={b => { setShowWizard(false); setSelectedBook(b); }} onClose={() => setShowWizard(false)} />}
      {showStats && <BibliotecaStats books={books} onClose={() => setShowStats(false)} />}
    </div>
  );
}
