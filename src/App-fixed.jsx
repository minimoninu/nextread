import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================
const BOOKS_URL = '/biblioteca_app.json';
const INITIAL_LOAD = 42;
const LOAD_MORE_COUNT = 21;

// =============================================================================
// HOOKS
// =============================================================================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px', threshold: 0, ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
};

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
};

// =============================================================================
// COMPONENTE: BookCover
// =============================================================================
const BookCover = memo(({ book, onClick, showAward = true }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const hasAward = (book.aw || book.awards || []).length > 0;
  
  return (
    <div 
      ref={ref}
      className="relative cursor-pointer group flex-shrink-0"
      onClick={() => onClick?.(book)}
      style={{ width: '120px', height: '180px' }}
    >
      <div 
        className="absolute inset-0 rounded-lg overflow-hidden transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1"
        style={{ 
          background: 'var(--bg-overlay)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {/* Skeleton */}
        {(!isVisible || (!imgLoaded && !imgError)) && (
          <div className="absolute inset-0 skeleton" />
        )}
        
        {/* Imagen */}
        {isVisible && !imgError && (
          <img 
            src={coverUrl}
            alt={title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
        
        {/* Fallback */}
        {imgError && (
          <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: 'var(--bg-overlay)' }}>
            <h3 className="font-serif text-xs font-semibold leading-tight line-clamp-3" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
              {authors[0]}
            </p>
          </div>
        )}
        
        {/* Badge premio - solo 1 indicador */}
        {hasAward && showAward && (
          <div 
            className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}
          >
            ★
          </div>
        )}
      </div>
    </div>
  );
});

BookCover.displayName = 'BookCover';

// =============================================================================
// COMPONENTE: Shelf (estante horizontal)
// =============================================================================
const Shelf = ({ title, books, onBookClick }) => {
  if (!books || books.length === 0) return null;
  
  return (
    <section className="mb-10">
      <h2 className="font-serif text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {books.map(book => (
          <BookCover key={book.id} book={book} onClick={onBookClick} />
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: BookModal
// =============================================================================
const BookModal = memo(({ book, onClose, currentList, onListChange }) => {
  const [imgError, setImgError] = useState(false);
  if (!book) return null;
  
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const awards = book.aw || book.awards || [];
  const vibes = book.v || book.vibes || [];
  const pages = book.pg || book.pages || 300;
  const hours = book.h || book.reading_time_hours || Math.round(pages / 40 * 10) / 10;
  const difficulty = book.d || book.difficulty || 'medio';
  const synopsis = book.syn || book.synopsis || '';
  
  return (
    <div 
      className="modal-overlay animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="modal-content animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
          
          <div className="flex gap-4">
            {/* Portada */}
            <div 
              className="w-24 h-36 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: 'var(--bg-overlay)', boxShadow: 'var(--shadow)' }}
            >
              {!imgError ? (
                <img src={coverUrl} alt={title} className="w-full h-full object-cover" 
                     onError={() => setImgError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: 'var(--text-muted)' }}>
                  📖
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="font-serif text-xl font-semibold leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                {authors.join(', ')}
              </p>
              
              {awards.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {awards.slice(0, 2).map((award, i) => (
                    <span 
                      key={i} 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      ★ {award}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Metadatos */}
        <div className="px-6 py-4">
          <div className="flex gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{pages}</span>
              <span className="ml-1 text-xs">pág</span>
            </div>
            <div>
              <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{hours}h</span>
              <span className="ml-1 text-xs">lectura</span>
            </div>
            <div>
              <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {difficulty === 'ligero' ? '○' : difficulty === 'denso' ? '●' : '◐'}
              </span>
              <span className="ml-1 text-xs">{difficulty}</span>
            </div>
          </div>
        </div>
        
        {/* Vibes */}
        {vibes.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {vibes.slice(0, 4).map((vibe, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
                >
                  {vibe}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Sinopsis */}
        {synopsis && (
          <div className="px-6 pb-4">
            <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
              {synopsis}
            </p>
          </div>
        )}
        
        {/* Acciones */}
        <div className="p-6 pt-2 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => onListChange(book.id, currentList === 'reading' ? null : 'reading')}
            className="w-full py-3 rounded-xl font-medium transition-all"
            style={{ 
              background: currentList === 'reading' ? 'var(--success)' : 'var(--accent)',
              color: 'var(--bg-base)'
            }}
          >
            {currentList === 'reading' ? '◐ Leyendo' : 'Lo leo ahora'}
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={() => onListChange(book.id, currentList === 'want' ? null : 'want')}
              className="btn-secondary flex-1"
              style={currentList === 'want' ? { background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
            >
              {currentList === 'want' ? '○ En lista' : 'Para después'}
            </button>
            <button 
              onClick={() => onListChange(book.id, currentList === 'read' ? null : 'read')}
              className="btn-secondary flex-1"
              style={currentList === 'read' ? { background: 'var(--success)', color: 'var(--bg-base)', borderColor: 'var(--success)' } : {}}
            >
              {currentList === 'read' ? '✓ Leído' : 'Ya lo leí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BookModal.displayName = 'BookModal';

// =============================================================================
// COMPONENTE: FilterSheet
// =============================================================================
const FilterSheet = ({ filters, setFilters, moods, onClose }) => {
  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div 
        className="modal-content animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>Filtros</h3>
            <button onClick={onClose} className="p-2 -m-2" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
          
          {/* Estado narrado */}
          {(filters.difficulty || filters.mood || filters.hasAwards) && (
            <p 
              className="text-xs mb-4 px-3 py-2 rounded-lg"
              style={{ background: 'var(--accent-bg)', color: 'var(--text-secondary)' }}
            >
              Buscando: {filters.difficulty || 'cualquier energía'}
              {filters.mood && ` · ${filters.mood}`}
              {filters.hasAwards && ' · premiados'}
            </p>
          )}
          
          {/* Energía */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Energía
            </p>
            <div className="flex gap-2">
              {['ligero', 'medio', 'denso'].map(d => (
                <button
                  key={d}
                  onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d ? null : d }))}
                  className={`chip ${filters.difficulty === d ? 'chip-active' : ''}`}
                >
                  {d === 'ligero' ? '○' : d === 'denso' ? '●' : '◐'} {d}
                </button>
              ))}
            </div>
          </div>
          
          {/* Atmósfera */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Atmósfera
            </p>
            <div className="flex flex-wrap gap-2">
              {moods.slice(0, 8).map(m => (
                <button
                  key={m}
                  onClick={() => setFilters(f => ({ ...f, mood: f.mood === m ? null : m }))}
                  className={`chip ${filters.mood === m ? 'chip-active' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          {/* Extras */}
          <div className="mb-6">
            <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Extras
            </p>
            <button
              onClick={() => setFilters(f => ({ ...f, hasAwards: !f.hasAwards }))}
              className={`chip ${filters.hasAwards ? 'chip-active' : ''}`}
            >
              ★ Premiados
            </button>
          </div>
          
          {/* Acciones */}
          <div className="flex gap-3">
            <button 
              onClick={() => setFilters({ search: '', difficulty: null, hasAwards: false, mood: null })}
              className="btn-secondary flex-1"
            >
              Limpiar
            </button>
            <button onClick={onClose} className="btn-primary flex-1">
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: StatsModal
// =============================================================================
const StatsModal = ({ books, onClose }) => {
  const stats = useMemo(() => {
    const totalPages = books.reduce((sum, b) => sum + (b.pg || b.pages || 250), 0);
    const totalHours = Math.round(totalPages / 40);
    const awarded = books.filter(b => (b.aw || b.awards || []).length > 0).length;
    return { total: books.length, pages: totalPages, hours: totalHours, awarded };
  }, [books]);
  
  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div 
        className="modal-content animate-scaleIn"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '20rem' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Tu biblioteca</h3>
            <button onClick={onClose} className="p-2 -m-2" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
          
          {/* Stats grid monocromo */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: stats.total.toLocaleString(), label: 'libros' },
              { value: stats.pages.toLocaleString(), label: 'páginas' },
              { value: stats.hours.toLocaleString(), label: 'horas' },
              { value: stats.awarded, label: 'premiados', accent: true }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
                <div 
                  className="text-2xl font-semibold"
                  style={{ color: stat.accent ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Mensaje positivo */}
          <p className="text-sm text-center italic" style={{ color: 'var(--text-secondary)' }}>
            Tienes lecturas para muchos años. Qué lujo.
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Wizard
// =============================================================================
const Wizard = ({ books, onSelect, onClose }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ energy: null, mood: null, time: null });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const STEPS = [
    {
      question: '¿Cómo está tu energía hoy?',
      hint: 'No hay respuesta correcta',
      key: 'energy',
      options: [
        { id: 'low', label: 'Baja', icon: '○', desc: 'Prefiero algo ligero' },
        { id: 'medium', label: 'Normal', icon: '◐', desc: 'Abierto a todo' },
        { id: 'high', label: 'Alta', icon: '●', desc: 'Listo para un reto' }
      ]
    },
    {
      question: '¿Qué atmósfera te atrae?',
      hint: 'Elige una o ninguna',
      key: 'mood',
      options: [
        { id: 'calm', label: 'Calma', icon: '〰', moods: ['reflexivo', 'íntimo', 'ligero'] },
        { id: 'intense', label: 'Intensidad', icon: '⚡', moods: ['tenso', 'oscuro', 'intenso'] },
        { id: 'wonder', label: 'Asombro', icon: '✧', moods: ['imaginativo', 'especulativo'] },
        { id: 'emotion', label: 'Emoción', icon: '◇', moods: ['emotivo', 'entretenido'] }
      ]
    },
    {
      question: '¿Cuánto tiempo tienes?',
      hint: 'Para las próximas semanas',
      key: 'time',
      options: [
        { id: 'short', label: 'Poco', icon: '·', maxPages: 250 },
        { id: 'medium', label: 'Normal', icon: '··', maxPages: 400 },
        { id: 'long', label: 'Mucho', icon: '···', maxPages: 9999 }
      ]
    }
  ];
  
  const currentStep = STEPS[step];
  
  const findBook = () => {
    setLoading(true);
    setTimeout(() => {
      const scored = books.map(book => {
        let score = Math.random() * 10;
        const diff = book.d || book.difficulty;
        const pages = book.pg || book.pages || 300;
        const mood = book.m;
        
        // Energía
        if (answers.energy === 'low' && diff === 'ligero') score += 20;
        if (answers.energy === 'high' && diff === 'denso') score += 15;
        if (answers.energy === 'medium' && diff === 'medio') score += 10;
        
        // Mood
        if (answers.mood) {
          const moodOpt = STEPS[1].options.find(o => o.id === answers.mood);
          if (moodOpt?.moods?.includes(mood)) score += 25;
        }
        
        // Tiempo
        if (answers.time) {
          const timeOpt = STEPS[2].options.find(o => o.id === answers.time);
          if (timeOpt && pages <= timeOpt.maxPages) score += 15;
        }
        
        return { book, score };
      });
      
      scored.sort((a, b) => b.score - a.score);
      setResult(scored[0].book);
      setLoading(false);
    }, 800);
  };
  
  const handleSelect = (optionId) => {
    setAnswers(prev => ({ ...prev, [currentStep.key]: prev[currentStep.key] === optionId ? null : optionId }));
  };
  
  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      findBook();
    }
  };
  
  const handleBack = () => {
    if (result) {
      setResult(null);
    } else if (step > 0) {
      setStep(s => s - 1);
    }
  };
  
  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div 
        className="modal-content animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {step > 0 || result ? (
              <button onClick={handleBack} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ← Atrás
              </button>
            ) : <div />}
            <button onClick={onClose} className="p-2 -m-2" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
          
          {loading ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 animate-pulse">📚</div>
              <p style={{ color: 'var(--text-secondary)' }}>Buscando tu próxima lectura...</p>
            </div>
          ) : result ? (
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Creemos que este libro es para ti
              </p>
              <div 
                className="w-32 h-48 mx-auto mb-4 rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-overlay)', boxShadow: 'var(--shadow)' }}
              >
                <img 
                  src={`/portadas/${result.id}.jpg`} 
                  alt={result.t} 
                  className="w-full h-full object-cover"
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {result.t || result.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {(result.a || result.authors || [])[0]}
              </p>
              <button onClick={() => onSelect(result)} className="btn-primary w-full mb-2">
                Lo leo ahora
              </button>
              <button onClick={() => setResult(null)} className="btn-secondary w-full">
                Ver otra opción
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex gap-1 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: i <= step ? 'var(--accent)' : 'var(--bg-overlay)' }}
                  />
                ))}
              </div>
              
              {/* Question */}
              <h2 className="font-serif text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                {currentStep.question}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {currentStep.hint}
              </p>
              
              {/* Options */}
              <div className="space-y-2 mb-6">
                {currentStep.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3"
                    style={{
                      background: answers[currentStep.key] === opt.id ? 'var(--accent-bg)' : 'var(--bg-overlay)',
                      border: `1px solid ${answers[currentStep.key] === opt.id ? 'var(--accent)' : 'var(--border-default)'}`,
                      color: answers[currentStep.key] === opt.id ? 'var(--accent)' : 'var(--text-primary)'
                    }}
                  >
                    <span className="text-xl w-8">{opt.icon}</span>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      {opt.desc && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Next */}
              <button
                onClick={handleNext}
                disabled={!answers[currentStep.key]}
                className="btn-primary w-full"
                style={{ opacity: answers[currentStep.key] ? 1 : 0.5 }}
              >
                {step < STEPS.length - 1 ? 'Continuar' : 'Ver recomendación'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: ThemeToggle
// =============================================================================
const ThemeToggle = ({ theme, setTheme }) => (
  <button
    onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
    className="btn-ghost"
    title={theme === 'night' ? 'Modo día' : 'Modo noche'}
  >
    {theme === 'night' ? '☀' : '☾'}
  </button>
);

// =============================================================================
// COMPONENTE PRINCIPAL: App
// =============================================================================
export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState('curated');
  const [theme, setTheme] = useLocalStorage('nextread_theme', 'night');
  const [lists, setLists] = useLocalStorage('nextread_lists', {});
  
  const [filters, setFilters] = useState({
    search: '',
    difficulty: null,
    hasAwards: false,
    mood: null
  });
  
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Cargar libros
  useEffect(() => {
    fetch(BOOKS_URL)
      .then(r => r.json())
      .then(data => { setBooks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  
  // Reset visible count
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [debouncedSearch, filters.difficulty, filters.hasAwards, filters.mood]);
  
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
  
  // Filtrado
  const filteredBooks = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return books.filter(book => {
      if (searchLower) {
        const title = (book.t || book.title || '').toLowerCase();
        const authors = (book.a || book.authors || []).join(' ').toLowerCase();
        if (!title.includes(searchLower) && !authors.includes(searchLower)) return false;
      }
      if (filters.difficulty && (book.d || book.difficulty) !== filters.difficulty) return false;
      if (filters.hasAwards && (book.aw || book.awards || []).length === 0) return false;
      if (filters.mood && book.m !== filters.mood) return false;
      return true;
    });
  }, [books, debouncedSearch, filters]);
  
  const visibleBooks = useMemo(() => filteredBooks.slice(0, visibleCount), [filteredBooks, visibleCount]);
  
  // Estantes curados
  const curatedShelves = useMemo(() => {
    if (viewMode !== 'curated') return null;
    return {
      forToday: books.filter(b => (b.pg || b.pages || 300) < 280).slice(0, 8),
      easyPrized: books.filter(b => (b.d || b.difficulty) === 'ligero' && (b.aw || b.awards || []).length > 0).slice(0, 8),
      byMood: books.filter(b => ['reflexivo', 'emotivo', 'íntimo'].includes(b.m)).slice(0, 8)
    };
  }, [books, viewMode]);
  
  const moods = useMemo(() => {
    return [...new Set(books.map(b => b.m).filter(Boolean))].sort();
  }, [books]);
  
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredBooks.length));
  }, [filteredBooks.length]);
  
  const hasFiltersActive = filters.difficulty || filters.mood || filters.hasAwards || debouncedSearch;
  
  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-4xl mb-4" style={{ color: 'var(--accent)' }}>📚</div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Preparando tu biblioteca...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-40 safe-top"
        style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <h1 className="font-serif text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  NextRead
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{books.length} libros</p>
              </div>
            </div>
            
            {/* Búsqueda */}
            <div className="hidden sm:block flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="input-quiet"
              />
            </div>
            
            {/* Acciones */}
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button onClick={() => setShowStats(true)} className="btn-ghost" title="Estadísticas">◔</button>
              <button 
                onClick={() => setShowFilters(true)} 
                className="btn-ghost"
                style={hasFiltersActive ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}}
                title="Filtros"
              >
                ⚙
              </button>
              <button onClick={() => setShowWizard(true)} className="btn-primary">
                ¿Qué leo?
              </button>
            </div>
          </div>
          
          {/* Búsqueda mobile */}
          <div className="sm:hidden mt-3">
            <input
              type="text"
              placeholder="Buscar..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-quiet"
            />
          </div>
          
          {/* Toggle Curado/Archivo */}
          <div className="flex gap-1 mt-4 p-1 rounded-lg" style={{ background: 'var(--bg-raised)' }}>
            <button
              onClick={() => setViewMode('curated')}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ 
                background: viewMode === 'curated' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'curated' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'curated' ? 'var(--shadow)' : 'none'
              }}
            >
              Selección para ti
            </button>
            <button
              onClick={() => setViewMode('archive')}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ 
                background: viewMode === 'archive' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'archive' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'archive' ? 'var(--shadow)' : 'none'
              }}
            >
              Tu biblioteca completa
            </button>
          </div>
        </div>
      </header>
      
      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 safe-bottom">
        {/* Modo Curado */}
        {viewMode === 'curated' && curatedShelves && !hasFiltersActive && (
          <div>
            <Shelf title="Para hoy" books={curatedShelves.forToday} onBookClick={setSelectedBook} />
            <Shelf title="Premiados accesibles" books={curatedShelves.easyPrized} onBookClick={setSelectedBook} />
            <Shelf title="Según tu momento" books={curatedShelves.byMood} onBookClick={setSelectedBook} />
          </div>
        )}
        
        {/* Modo Archivo */}
        {(viewMode === 'archive' || hasFiltersActive) && (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {visibleBooks.length} de {filteredBooks.length} libros
            </p>
            
            {visibleBooks.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {visibleBooks.map(book => (
                    <BookCover key={book.id} book={book} onClick={setSelectedBook} />
                  ))}
                </div>
                
                {visibleCount < filteredBooks.length && (
                  <div className="flex justify-center mt-8">
                    <button onClick={handleLoadMore} className="btn-secondary">
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Ningún libro coincide con estos filtros
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Prueba con menos restricciones
                </p>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Modales */}
      {selectedBook && (
        <BookModal 
          book={selectedBook} 
          onClose={() => setSelectedBook(null)}
          currentList={getListStatus(selectedBook.id)}
          onListChange={handleListChange}
        />
      )}
      
      {showFilters && (
        <FilterSheet 
          filters={filters} 
          setFilters={setFilters} 
          moods={moods}
          onClose={() => setShowFilters(false)}
        />
      )}
      
      {showStats && (
        <StatsModal books={books} onClose={() => setShowStats(false)} />
      )}
      
      {showWizard && (
        <Wizard 
          books={books} 
          onSelect={(book) => { setShowWizard(false); setSelectedBook(book); }}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
