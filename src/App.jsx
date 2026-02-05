import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from './wizardPreferences.js';
import { buildTodayPicks } from './todayPicks.js';
import { getBookAwardLabels, isAwardCollection } from './bookAwards.js';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================
const BOOKS_URL = '/biblioteca_app.json';
const AUTHORS_URL = '/authors.json';
const COLLECTIONS_URL = '/collections.json';
const HOOKS_URL = '/hooks.json';
const INITIAL_LOAD = 42;
const LOAD_MORE_COUNT = 21;
const FONT_STACK_BODY = "'Sora', 'Avenir Next', 'Segoe UI', sans-serif";
const FONT_STACK_DISPLAY = "'DM Serif Display', 'Iowan Old Style', 'Baskerville', serif";

// =============================================================================
// TEMAS - Editorial Contrast
// =============================================================================
const THEMES = {
  night: {
    name: 'Nocturno',
    icon: '☀',
    bg: {
      primary: '#101214',
      secondary: '#181b20',
      tertiary: '#21252b',
      elevated: '#2b3038',
    },
    text: {
      primary: '#f6f2ec',
      secondary: '#d7d0c6',
      tertiary: '#ada599',
      muted: '#7e776c',
    },
    accent: '#e34c36',
    accentHover: '#ef6a57',
    accentMuted: 'rgba(227, 76, 54, 0.18)',
    border: {
      subtle: 'rgba(246, 242, 236, 0.08)',
      default: 'rgba(246, 242, 236, 0.16)',
      strong: 'rgba(246, 242, 236, 0.24)',
    },
    overlay: 'rgba(8, 10, 12, 0.84)',
    success: '#5e9270',
    glass: {
      bg: 'rgba(24, 27, 32, 0.84)',
      bgStrong: 'rgba(24, 27, 32, 0.94)',
      border: 'rgba(246, 242, 236, 0.12)',
      shadow: '0 10px 24px rgba(0, 0, 0, 0.42)',
      shadowElevated: '0 22px 42px -12px rgba(0, 0, 0, 0.52)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #e34c36 0%, #f07c69 100%)',
      subtle: 'linear-gradient(180deg, rgba(227, 76, 54, 0.12) 0%, transparent 100%)',
      card: 'linear-gradient(170deg, rgba(43, 48, 56, 0.96) 0%, rgba(33, 37, 43, 0.98) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
    },
    typography: {
      body: FONT_STACK_BODY,
      display: FONT_STACK_DISPLAY,
    },
  },
  day: {
    name: 'Día',
    icon: '☾',
    bg: {
      primary: '#fbfaf7',
      secondary: '#f2eee8',
      tertiary: '#e8e2d9',
      elevated: '#ffffff',
    },
    text: {
      primary: '#1f1b18',
      secondary: '#4b433c',
      tertiary: '#787067',
      muted: '#a39a90',
    },
    accent: '#d9412b',
    accentHover: '#b93220',
    accentMuted: 'rgba(217, 65, 43, 0.12)',
    border: {
      subtle: 'rgba(31, 27, 24, 0.08)',
      default: 'rgba(31, 27, 24, 0.16)',
      strong: 'rgba(31, 27, 24, 0.24)',
    },
    overlay: 'rgba(251, 250, 247, 0.9)',
    success: '#4f835f',
    glass: {
      bg: 'rgba(255, 255, 255, 0.84)',
      bgStrong: 'rgba(255, 255, 255, 0.94)',
      border: 'rgba(255, 255, 255, 0.8)',
      shadow: '0 8px 22px rgba(24, 20, 18, 0.1)',
      shadowElevated: '0 18px 36px -14px rgba(24, 20, 18, 0.14)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #d9412b 0%, #ea6956 100%)',
      subtle: 'linear-gradient(180deg, rgba(217, 65, 43, 0.1) 0%, transparent 100%)',
      card: 'linear-gradient(170deg, rgba(255, 255, 255, 1) 0%, rgba(251, 250, 247, 1) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(31,27,24,0.03) 50%, transparent 100%)',
    },
    typography: {
      body: FONT_STACK_BODY,
      display: FONT_STACK_DISPLAY,
    },
  }
};

// =============================================================================
// HAPTIC FEEDBACK - Vibraciones sutiles estilo iOS
// =============================================================================
const haptic = {
  // Feedback ligero - para tocar elementos
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  // Feedback medio - para selecciones
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  // Feedback fuerte - para acciones importantes
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  // Feedback de éxito - para confirmaciones
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20]);
    }
  },
  // Feedback de error
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }
};

// =============================================================================
// HOOK: useTouchAnimation - Estado de presión para animaciones
// =============================================================================
const useTouchAnimation = () => {
  const [isPressed, setIsPressed] = useState(false);
  
  const touchProps = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => { setIsPressed(true); haptic.light(); },
    onTouchEnd: () => setIsPressed(false),
    onTouchCancel: () => setIsPressed(false),
  };
  
  return { isPressed, touchProps };
};

// =============================================================================
// COMPONENTE: Touchable - Wrapper con animación táctil
// =============================================================================
const Touchable = memo(({ 
  children, 
  onClick, 
  style = {}, 
  scale = 0.97,
  className = '',
  hapticType = 'light',
  disabled = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => {
    if (disabled) return;
    setIsPressed(true);
    if (hapticType && haptic[hapticType]) {
      haptic[hapticType]();
    }
  };
  
  const handleRelease = () => setIsPressed(false);
  
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };
  
  return (
    <div
      onClick={handleClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      className={className}
      style={{
        ...style,
        transform: isPressed ? `scale(${scale})` : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Touchable.displayName = 'Touchable';

// =============================================================================
// COMPONENTE: ActionButton - Botón con microinteracciones Apple
// =============================================================================
const ActionButton = memo(({ 
  children, 
  onClick, 
  variant = 'primary', // 'primary' | 'secondary'
  isActive = false,
  activeColor,
  theme,
  style = {},
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const t = theme;
  
  const handlePress = () => {
    if (disabled) return;
    setIsPressed(true);
  };
  
  const handleRelease = () => setIsPressed(false);
  
  const isPrimary = variant === 'primary';
  
  const baseStyles = isPrimary ? {
    background: isActive ? t.accent : t.accent,
    color: t.bg.primary,
    border: 'none',
    padding: '15px',
    fontSize: '15px',
  } : {
    background: isActive ? (activeColor || t.accent) : t.bg.tertiary,
    color: isActive ? t.bg.primary : t.text.secondary,
    border: `1px solid ${isActive ? 'transparent' : t.border.default}`,
    padding: '13px',
    fontSize: '14px',
  };
  
  return (
    <button
      onClick={onClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      disabled={disabled}
      style={{
        ...baseStyles,
        width: '100%',
        borderRadius: '14px',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Ripple effect layer */}
      <span style={{
        position: 'absolute',
        inset: 0,
        background: isPressed ? 'rgba(255,255,255,0.1)' : 'transparent',
        transition: 'background 150ms ease',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

// =============================================================================
// MICROCOPY
// =============================================================================
const COPY = {
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
    read: 'Leídos'
  }
};

const DEFAULT_FILTERS = {
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

const ACCLAIM_FILTER_OPTIONS = [
  { id: 1, label: '1+ critica' },
  { id: 2, label: '2+ critica' },
  { id: 3, label: '3+ critica' },
  { id: 4, label: '4+ critica' }
];

const LENGTH_FILTER_OPTIONS = [
  { id: 'short', label: 'Corto', max: 250 },
  { id: 'medium', label: 'Medio', min: 251, max: 450 },
  { id: 'long', label: 'Largo', min: 451, max: 700 },
  { id: 'epic', label: 'Epico', min: 701 }
];

const LANGUAGE_FILTER_OPTIONS = [
  { id: 'es', label: 'Espanol' },
  { id: 'en', label: 'Ingles' },
  { id: 'fr', label: 'Frances' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Portugues' },
  { id: 'de', label: 'Aleman' },
  { id: 'unknown', label: 'Sin detectar' }
];

const NATIONALITY_LANGUAGE_PATTERNS = {
  es: ['espanol', 'espanola', 'argentin', 'mexican', 'colombian', 'chilen', 'peruan', 'uruguay', 'nicaragu', 'cuban', 'venezolan', 'bolivian', 'paraguay', 'ecuator', 'guatemal', 'honduren', 'salvadoren', 'costarric', 'dominican', 'puertorriq'],
  en: ['estadounidense', 'american', 'britanic', 'ingles', 'irland', 'canad', 'australian', 'neozeland', 'escoces', 'gales'],
  fr: ['frances', 'franco'],
  it: ['italian'],
  pt: ['portugues', 'brasil'],
  de: ['aleman', 'austriac', 'german']
};

const normalizeFilters = (value = {}) => {
  const next = { ...DEFAULT_FILTERS, ...value };
  next.genres = Array.isArray(next.genres) ? next.genres.filter(Boolean) : [];
  next.minAcclaim = Number.isFinite(Number(next.minAcclaim)) ? Number(next.minAcclaim) : null;
  return next;
};

const parsePages = (book) => {
  const raw = Number(book?.pg ?? book?.pages ?? 0);
  return Number.isFinite(raw) ? raw : 0;
};

const parseAcclaim = (book) => {
  const raw = Number(book?.ac ?? 0);
  return Number.isFinite(raw) ? raw : 0;
};

const normalizeForMatch = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-z]+/g, ' ')
    .trim();

const toLanguageCode = (value) => {
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

const detectLanguageFromNationality = (nationality) => {
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

const getBookOriginalLanguage = (book, authorsData) => {
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

const matchesLengthFilter = (book, lengthFilter) => {
  if (!lengthFilter) return true;
  const pages = parsePages(book);
  const option = LENGTH_FILTER_OPTIONS.find((item) => item.id === lengthFilter);
  if (!option || pages <= 0) return false;
  if (option.min && pages < option.min) return false;
  if (option.max && pages > option.max) return false;
  return true;
};

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

const useIntersectionObserver = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const useEscapeKey = (onClose) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);
};

const getModalCloseButtonStyle = (t) => ({
  width: '36px',
  height: '36px',
  minWidth: '36px',
  borderRadius: '8px',
  border: `1px solid ${t.border.default}`,
  background: t.bg.elevated,
  color: t.text.secondary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  transition: 'transform 120ms ease, opacity 120ms ease',
});

const SECTION_TITLE_STYLE = (t) => ({
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: t.text.tertiary,
  marginBottom: '8px',
});

// =============================================================================
// COMPONENTE: BookCover
// =============================================================================
const BookCover = memo(({ book, onClick, theme, listStatus, sanctuary, hasAwardOverride }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const t = THEMES[theme];
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const hasAward = typeof hasAwardOverride === 'boolean'
    ? hasAwardOverride
    : (book.aw || book.awards || []).length > 0;
  const statusColor = listStatus === 'reading'
    ? t.accent
    : listStatus === 'read'
    ? t.success
    : listStatus === 'want'
    ? '#8e7a69'
    : t.accent;
  
  const size = sanctuary ? { width: '148px', height: '222px' } : { width: '122px', height: '186px' };
  
  const handlePress = () => {
    setIsPressed(true);
    haptic.light();
  };
  
  const handleRelease = () => setIsPressed(false);
  
  return (
    <div 
      ref={ref}
      onClick={() => onClick?.(book)}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      className="book-cover"
      style={{
        ...size,
        flexShrink: 0,
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${t.border.default}`,
        boxShadow: isPressed 
          ? '0 2px 8px rgba(0,0,0,0.22)' 
          : '0 8px 14px rgba(0,0,0,0.14)',
        background: t.bg.secondary,
        transform: isPressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {(!isVisible || (!imgLoaded && !imgError)) && (
        <div 
          className="skeleton"
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, ${t.bg.secondary} 0%, ${t.bg.elevated} 50%, ${t.bg.secondary} 100%)`,
            backgroundSize: '200% 100%',
          }} 
        />
      )}
      
      {isVisible && !imgError && (
        <img 
          src={coverUrl}
          alt={title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 220ms ease'
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      
      {imgError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '10px',
          background: t.bg.secondary
        }}>
          <div style={{ fontFamily: t.typography.display, fontSize: '11px', fontWeight: 600, color: t.text.primary, lineHeight: 1.3 }}>
            {title.slice(0, 50)}
          </div>
          <div style={{ fontSize: '10px', color: t.text.tertiary, marginTop: '4px' }}>
            {authors[0]}
          </div>
        </div>
      )}
      
      {!sanctuary && (hasAward || listStatus) && (
        <div style={{
          position: 'absolute', bottom: '7px', right: '7px',
          minWidth: '20px', height: '20px',
          padding: '0 6px',
          borderRadius: '6px',
          border: `1px solid ${t.bg.primary}`,
          background: statusColor,
          color: t.bg.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          lineHeight: 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.22)'
        }}>
          {listStatus === 'reading' ? '◐' : listStatus === 'read' ? '✔' : listStatus === 'want' ? '○' : '★'}
        </div>
      )}
    </div>
  );
});

BookCover.displayName = 'BookCover';

// =============================================================================
// COMPONENTE: Shelf (estante horizontal)
// =============================================================================
const Shelf = ({ title, books, onBookClick, theme, getListStatus, sanctuary }) => {
  const t = THEMES[theme];
  if (!books || books.length === 0) return null;
  
  return (
    <section style={{ marginBottom: sanctuary ? '48px' : '40px' }}>
      {!sanctuary && (
        <h2 style={{
          fontFamily: t.typography.display,
          fontSize: '22px',
          fontWeight: 400,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: t.text.primary,
          marginBottom: '18px',
          paddingLeft: '2px'
        }}>
          {title}
        </h2>
      )}
      <div style={{
        display: 'flex',
        gap: sanctuary ? '18px' : '12px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginLeft: '-16px',
        marginRight: '-16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {books.map(book => (
          <BookCover 
            key={book.id} 
            book={book} 
            onClick={onBookClick}
            theme={theme}
            listStatus={getListStatus?.(book.id)}
            sanctuary={sanctuary}
          />
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: HeroBook (libro destacado con hook)
// =============================================================================
const HeroBook = ({ book, hook, onClick, theme }) => {
  const t = THEMES[theme];
  if (!book || !hook) return null;
  
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || 'Sin título';
  const authors = (book.a || []).join(', ');
  const pages = book.pg || 300;
  const darkOverlay = theme === 'day'
    ? 'linear-gradient(100deg, rgba(15, 13, 11, 0.88) 0%, rgba(15, 13, 11, 0.72) 46%, rgba(15, 13, 11, 0.24) 100%)'
    : 'linear-gradient(100deg, rgba(8, 9, 11, 0.9) 0%, rgba(8, 9, 11, 0.72) 46%, rgba(8, 9, 11, 0.26) 100%)';
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <div 
        onClick={() => onClick(book)}
        style={{
          position: 'relative',
          minHeight: '360px',
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${t.border.default}`,
          cursor: 'pointer',
          boxShadow: '0 16px 34px rgba(0,0,0,0.2)',
          backgroundImage: `${darkOverlay}, url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 160ms ease, box-shadow 160ms ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 22px 42px rgba(0,0,0,0.24)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 16px 34px rgba(0,0,0,0.2)'; }}
      >
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '640px',
          padding: '34px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <p style={{
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {hook.experience ? `Selección ${hook.experience}` : 'Selección editorial'}
          </p>
          <h2 style={{
            fontFamily: t.typography.display,
            fontSize: 'clamp(2.4rem, 7vw, 4rem)',
            fontWeight: 400,
            color: '#ffffff',
            lineHeight: 1.02,
            maxWidth: '540px',
            textWrap: 'balance'
          }}>
            {title}
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.1vw, 1.25rem)',
            lineHeight: 1.35,
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '560px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {hook.hook}
          </p>
          <p style={{
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.78)',
            marginTop: '2px'
          }}>
            {authors} · {pages} páginas
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '11px 22px',
              borderRadius: '999px',
              background: '#1f1b18',
              border: '1px solid rgba(255,255,255,0.16)',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Abrir libro
            </span>
            <span style={{
              padding: '11px 22px',
              borderRadius: '999px',
              background: '#ffffff',
              color: '#1f1b18',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Ver detalle
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: NarrativeShelf (estante con hooks visibles)
// =============================================================================
const NarrativeShelf = ({ title, subtitle, books, hooks, onBookClick, theme, getBookAwardLabel, getBookReason }) => {
  const t = THEMES[theme];
  if (!books || books.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          fontFamily: t.typography.display,
          fontSize: '28px',
          fontWeight: 400,
          color: t.text.primary,
          marginBottom: '4px'
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: t.text.tertiary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {subtitle}
          </p>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '26px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginLeft: '-16px',
        marginRight: '-16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {books.map(book => {
          const hook = hooks[String(book.id)];
          const coverUrl = `/portadas/${book.id}.jpg`;
          const title = book.t || 'Sin título';
          const authors = (book.a || []).join(', ');
          const awardLabel = typeof getBookAwardLabel === 'function' ? getBookAwardLabel(book) : null;
          const reason = typeof getBookReason === 'function' ? getBookReason(book) : null;
          const verdict = awardLabel
            ? 'RAVE'
            : reason
            ? 'POSITIVO'
            : hook?.experience
            ? hook.experience.toUpperCase()
            : 'LECTURA';
          
          return (
            <div
              key={book.id}
              onClick={() => onBookClick(book)}
              style={{
                flexShrink: 0,
                width: '198px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 140ms ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{
                width: '198px',
                height: '298px',
                borderRadius: '0',
                overflow: 'hidden',
                border: `1px solid ${t.border.default}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                marginBottom: '14px',
                background: t.bg.elevated
              }}>
                <img
                  src={coverUrl}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h3 style={{
                fontFamily: t.typography.display,
                fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
                fontWeight: 400,
                color: t.text.primary,
                lineHeight: 1.08,
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textWrap: 'balance'
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: t.text.tertiary,
                marginBottom: '10px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {authors}
              </p>
              <p style={{
                fontSize: '13px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: t.accent,
                fontWeight: 700
              }}>
                {verdict}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: FeaturedCollections (colecciones destacadas)
// =============================================================================
const FeaturedCollections = ({ collections, onSelect, theme, getCollectionCount }) => {
  const t = THEMES[theme];
  
  // Seleccionar 4 colecciones destacadas
  const featured = collections.filter(c => 
    ['pulitzer', 'noir-nordico', 'literatura-japonesa', 'espanola-contemporanea'].includes(c.id)
  ).slice(0, 4);
  
  if (featured.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontFamily: t.typography.display,
        fontSize: '20px',
        fontWeight: 400,
        color: t.text.primary,
        marginBottom: '16px'
      }}>
        Explora por colección
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {featured.map(collection => (
          <button
            key={collection.id}
            onClick={() => onSelect(collection)}
            style={{
              padding: '16px',
              borderRadius: '16px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.elevated,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Barra de color */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: collection.color
            }} />
            
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {collection.emoji}
            </div>
            <h3 style={{
              fontFamily: t.typography.display,
              fontSize: '15px',
              fontWeight: 600,
              color: t.text.primary,
              marginBottom: '4px'
            }}>
              {collection.title}
            </h3>
            <p style={{ fontSize: '11px', color: t.text.tertiary }}>
              {(typeof getCollectionCount === 'function' ? getCollectionCount(collection) : collection.count)} libros
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: BottomNav (solo móvil)
// =============================================================================
const BottomNav = ({ activeTab, onTabChange, theme, savedCount }) => {
  const t = THEMES[theme];
  
  const tabs = [
    { id: 'library', icon: '📚', label: COPY.tabs.library },
    { id: 'collections', icon: '📒', label: COPY.tabs.collections },
    { id: 'recommend', icon: '✨', label: COPY.tabs.recommend },
    { id: 'saved', icon: '♡', label: COPY.tabs.saved, badge: savedCount },
    { id: 'authors', icon: '👤', label: COPY.tabs.authors },
  ];
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      background: t.bg.primary,
      borderTop: `1px solid ${t.border.default}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '66px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            color: activeTab === tab.id ? t.text.primary : t.text.tertiary,
            transition: 'color 120ms ease'
          }}
        >
          {activeTab === tab.id && (
            <span style={{
              position: 'absolute',
              top: '-1px',
              width: '18px',
              height: '2px',
              borderRadius: '999px',
              background: t.accent
            }} />
          )}
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>{tab.label}</span>
          
          {/* Badge */}
          {tab.badge > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: 'calc(50% - 16px)',
              minWidth: '16px',
              height: '16px',
              borderRadius: '6px',
              background: t.accent,
              color: t.bg.primary,
              fontSize: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// =============================================================================
// COMPONENTE: SanctuaryButton (botón flotante para salir)
// =============================================================================
const SanctuaryButton = ({ onExit, theme }) => {
  const t = THEMES[theme];
  
  return (
    <button
      onClick={onExit}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 70,
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        border: `1px solid ${t.border.default}`,
        background: t.bg.primary,
        color: t.text.secondary,
        boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'transform 120ms ease, opacity 120ms ease',
        opacity: 0.8
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '0.8'; }}
      title={COPY.sanctuary.exit}
    >
      ✕
    </button>
  );
};

// =============================================================================
// COMPONENTE: CollectionsSection (colecciones curadas)
// =============================================================================
const CollectionsSection = ({ collections, selectedCollection, onSelectCollection, theme, getCollectionCount }) => {
  const t = THEMES[theme];
  
  if (!collections || collections.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '34px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '14px' 
      }}>
        <h2 style={{ 
          fontFamily: t.typography.display, 
          fontSize: '24px',
          fontWeight: 400,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: t.text.primary 
        }}>
          Colecciones
        </h2>
        {selectedCollection && (
          <button
            onClick={() => onSelectCollection(null)}
            style={{
              background: t.accentMuted,
              border: `1px solid ${t.accent}`,
              color: t.accent,
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            → Ver todo
          </button>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {collections.map(coll => {
          const isSelected = selectedCollection?.id === coll.id;
          const totalBooks = typeof getCollectionCount === 'function' ? getCollectionCount(coll) : coll.count;
          return (
            <div
              key={coll.id}
              onClick={() => onSelectCollection(isSelected ? null : coll)}
              style={{
                minWidth: '220px',
                padding: '16px',
                borderRadius: '12px',
                background: t.bg.elevated,
                border: `1px solid ${isSelected ? t.accent : t.border.default}`,
                cursor: 'pointer',
                transition: 'all 120ms ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ 
                fontSize: '24px', 
                marginBottom: '6px', 
                display: 'block' 
              }}>
                {coll.emoji}
              </span>
              
              <h3 style={{ 
                fontFamily: t.typography.display,
                fontSize: '20px',
                fontWeight: 400,
                color: t.text.primary,
                marginBottom: '6px',
                lineHeight: 1.05
              }}>
                {coll.title}
              </h3>
              
              <p style={{ 
                fontSize: '12px', 
                color: t.text.tertiary,
                marginBottom: '10px',
                lineHeight: 1.4
              }}>
                {coll.subtitle}
              </p>
              
              <span style={{ 
                fontSize: '11px', 
                color: isSelected ? t.accent : t.text.muted,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                {totalBooks} libros
              </span>
              
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isSelected ? t.accent : (coll.color || t.border.default),
                opacity: isSelected ? 1 : 0.75
              }} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: CollectionHeader (header cuando hay colección seleccionada)
// =============================================================================
const CollectionHeader = ({ collection, onClear, theme, countOverride }) => {
  const t = THEMES[theme];
  
  if (!collection) return null;

  const totalBooks = Number.isFinite(countOverride) ? countOverride : collection.count;
  
  return (
    <div style={{
      padding: '22px',
      borderRadius: '12px',
      background: t.bg.elevated,
      border: `1px solid ${t.border.default}`,
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <span style={{ fontSize: '40px' }}>{collection.emoji}</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontFamily: t.typography.display, 
            fontSize: '32px', 
            fontWeight: 400, 
            color: t.text.primary,
            marginBottom: '6px',
            lineHeight: 1
          }}>
            {collection.title}
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: t.text.secondary,
            marginBottom: '12px',
            lineHeight: 1.6
          }}>
            {collection.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '13px', 
              color: collection.color,
              fontWeight: 600
            }}>
              {totalBooks} libros
            </span>
            <button
              onClick={onClear}
              style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.default}`,
                color: t.text.secondary,
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ← Volver a biblioteca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: SavedView (vista de guardados)
// =============================================================================
const SavedView = ({ books, lists, onBookClick, theme, getListStatus }) => {
  const t = THEMES[theme];
  
  const savedBooks = useMemo(() => {
    const reading = books.filter(b => lists[b.id] === 'reading');
    const want = books.filter(b => lists[b.id] === 'want');
    const read = books.filter(b => lists[b.id] === 'read');
    return { reading, want, read };
  }, [books, lists]);
  
  const totalSaved = savedBooks.reading.length + savedBooks.want.length + savedBooks.read.length;
  
  if (totalSaved === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>♡</div>
        <p style={{ fontSize: '18px', color: t.text.secondary, marginBottom: '8px' }}>{COPY.saved.empty}</p>
        <p style={{ fontSize: '14px', color: t.text.tertiary }}>{COPY.saved.emptyHint}</p>
      </div>
    );
  }
  
  return (
    <div>
      {savedBooks.reading.length > 0 && (
        <Shelf 
          title={`◐ ${COPY.saved.reading} (${savedBooks.reading.length})`}
          books={savedBooks.reading}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.want.length > 0 && (
        <Shelf 
          title={`○ ${COPY.saved.want} (${savedBooks.want.length})`}
          books={savedBooks.want}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.read.length > 0 && (
        <Shelf 
          title={`✔ ${COPY.saved.read} (${savedBooks.read.length})`}
          books={savedBooks.read}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE: AuthorsView (explorar autores)
// =============================================================================
const AuthorsView = ({ books, authorsData, onAuthorClick, theme }) => {
  const t = THEMES[theme];
  const [searchQuery, setSearchQuery] = useState('');
  
  // Obtener autores únicos de la biblioteca con conteo de libros
  const libraryAuthors = useMemo(() => {
    const authorMap = {};
    books.forEach(book => {
      const bookAuthors = book.a || book.authors || [];
      bookAuthors.forEach(author => {
        if (!authorMap[author]) {
          authorMap[author] = { name: author, bookCount: 0, hasData: !!authorsData[author] };
        }
        authorMap[author].bookCount++;
      });
    });
    return Object.values(authorMap).sort((a, b) => {
      // Primero los que tienen datos, luego por cantidad de libros
      if (a.hasData !== b.hasData) return b.hasData - a.hasData;
      return b.bookCount - a.bookCount;
    });
  }, [books, authorsData]);
  
  // Filtrar por búsqueda
  const filteredAuthors = useMemo(() => {
    if (!searchQuery) return libraryAuthors;
    const query = searchQuery.toLowerCase();
    return libraryAuthors.filter(a => a.name.toLowerCase().includes(query));
  }, [libraryAuthors, searchQuery]);
  
  // Separar autores con y sin biografía
  const authorsWithBio = filteredAuthors.filter(a => a.hasData);
  const authorsWithoutBio = filteredAuthors.filter(a => !a.hasData);
  
  const AuthorCard = ({ author }) => {
    const data = authorsData[author.name];
    return (
      <div
        onClick={() => onAuthorClick(author.name)}
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: t.bg.secondary,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: `1px solid ${t.border.subtle}`
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.background = t.bg.tertiary;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.background = t.bg.secondary;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h3 style={{ 
            fontFamily: t.typography.display, 
            fontSize: '16px', 
            fontWeight: 600, 
            color: t.text.primary,
            flex: 1
          }}>
            {author.name}
          </h3>
          <span style={{ 
            fontSize: '12px', 
            color: t.accent,
            background: t.accentMuted,
            padding: '2px 8px',
            borderRadius: '10px',
            marginLeft: '8px'
          }}>
            {author.bookCount} {author.bookCount === 1 ? 'libro' : 'libros'}
          </span>
        </div>
        
        {data && (
          <>
            <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '8px' }}>
              {data.years} · {data.nationality}
            </p>
            <p style={{ 
              fontSize: '13px', 
              color: t.text.secondary, 
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {data.bio}
            </p>
          </>
        )}
        
        {!data && (
          <p style={{ fontSize: '13px', color: t.text.muted, fontStyle: 'italic' }}>
            Toca para ver sus libros
          </p>
        )}
      </div>
    );
  };
  
  return (
    <div>
      {/* Búsqueda */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Buscar autor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${t.border.default}`,
            background: t.bg.secondary,
            color: t.text.primary,
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        padding: '16px',
        background: t.bg.secondary,
        borderRadius: '12px'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: t.text.primary }}>{libraryAuthors.length}</div>
          <div style={{ fontSize: '11px', color: t.text.tertiary }}>autores en biblioteca</div>
        </div>
        <div style={{ width: '1px', background: t.border.default }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: t.accent }}>{authorsWithBio.length}</div>
          <div style={{ fontSize: '11px', color: t.text.tertiary }}>con biografía</div>
        </div>
      </div>
      
      {/* Autores con biografía */}
      {authorsWithBio.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontFamily: t.typography.display, 
            fontSize: '18px', 
            color: t.text.primary, 
            marginBottom: '16px' 
          }}>
            Autores destacados
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {authorsWithBio.slice(0, 20).map(author => (
              <AuthorCard key={author.name} author={author} />
            ))}
          </div>
          {authorsWithBio.length > 20 && (
            <p style={{ fontSize: '13px', color: t.text.tertiary, textAlign: 'center', marginTop: '16px' }}>
              Y {authorsWithBio.length - 20} autores más...
            </p>
          )}
        </section>
      )}
      
      {/* Autores sin biografía */}
      {authorsWithoutBio.length > 0 && (
        <section>
          <h2 style={{ 
            fontFamily: t.typography.display, 
            fontSize: '18px', 
            color: t.text.primary, 
            marginBottom: '16px' 
          }}>
            Otros autores ({authorsWithoutBio.length})
          </h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px' 
          }}>
            {authorsWithoutBio.slice(0, 50).map(author => (
              <button
                key={author.name}
                onClick={() => onAuthorClick(author.name)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: `1px solid ${t.border.default}`,
                  background: t.bg.tertiary,
                  color: t.text.secondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {author.name} ({author.bookCount})
              </button>
            ))}
          </div>
          {authorsWithoutBio.length > 50 && (
            <p style={{ fontSize: '13px', color: t.text.tertiary, textAlign: 'center', marginTop: '16px' }}>
              Y {authorsWithoutBio.length - 50} autores más...
            </p>
          )}
        </section>
      )}
      
      {filteredAuthors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '16px', color: t.text.secondary }}>No se encontraron autores</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE: CollectionsView
// =============================================================================
const resolveCollectionBooks = (collection, books, awardedBookIds = new Set()) => {
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

const CollectionsView = ({ collections, books, awardedBookIds, onCollectionClick, theme }) => {
  const t = THEMES[theme];
  
  // Contar libros por coleccion
  const getCollectionCount = (collection) => {
    return resolveCollectionBooks(collection, books, awardedBookIds).length;
  };
  
  // Agrupar colecciones por tipo
  const grouped = {
    regions: collections.filter(c => ['🇫🇷', '🇺🇸', '🇪🇸', '🇷🇺', '🇯🇵', '🇮🇹', '🇬🇧'].includes(c.emoji)),
    awards: collections.filter(c => isAwardCollection(c)),
    genres: collections.filter(c => ['🔍', '✨', '🏛️', '🚀', '📝', '😄'].includes(c.emoji)),
    series: collections.filter(c => ['🥸', '🕵️', '🦁'].includes(c.emoji)),
    difficulty: collections.filter(c => ['☀️', '🧠', '⚡', '📖'].includes(c.emoji))
  };
  
  const Section = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontFamily: t.typography.display, 
          fontSize: '16px', 
          color: t.text.tertiary,
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {title}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {items.map(collection => {
            const count = getCollectionCount(collection);
            if (count === 0) return null;
            return (
              <div
                key={collection.id}
                onClick={() => onCollectionClick(collection)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: t.bg.secondary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${t.border.subtle}`
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.background = t.bg.tertiary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.background = t.bg.secondary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{collection.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontFamily: t.typography.display, 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: t.text.primary,
                      marginBottom: '2px'
                    }}>
                      {collection.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '8px' }}>
                      {collection.subtitle}
                    </p>
                    <span style={{ 
                      fontSize: '12px', 
                      color: t.accent,
                      background: t.accentMuted,
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {count} {count === 1 ? 'libro' : 'libros'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };
  
  return (
    <div>
      <p style={{ fontSize: '14px', color: t.text.secondary, marginBottom: '24px', lineHeight: 1.6 }}>
        Explora tu biblioteca organizada en colecciones temáticas, por autor, premios, género y más.
      </p>
      
      <Section title="Por Región" items={grouped.regions} />
      <Section title="Premios Literarios" items={grouped.awards} />
      <Section title="Géneros y Estilos" items={grouped.genres} />
      <Section title="Series" items={grouped.series} />
      <Section title="Por Dificultad y Extensión" items={grouped.difficulty} />
    </div>
  );
};

// =============================================================================
// COMPONENTE: CollectionDetailView
// =============================================================================
const CollectionDetailView = ({ collection, books, awardedBookIds, onBookClick, onBack, theme, getListStatus }) => {
  const t = THEMES[theme];
  
  // Filtrar libros según criterios
  const filteredBooks = useMemo(() => {
    return resolveCollectionBooks(collection, books, awardedBookIds);
  }, [collection, books, awardedBookIds]);
  
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: t.accent,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ← Volver a colecciones
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ fontSize: '48px' }}>{collection.emoji}</span>
          <div>
            <h1 style={{ 
              fontFamily: t.typography.display, 
              fontSize: '28px', 
              fontWeight: 600, 
              color: t.text.primary,
              marginBottom: '4px'
            }}>
              {collection.title}
            </h1>
            <p style={{ fontSize: '14px', color: t.text.tertiary }}>
              {collection.subtitle} · {filteredBooks.length} libros
            </p>
          </div>
        </div>
        
        <p style={{ fontSize: '15px', color: t.text.secondary, lineHeight: 1.6 }}>
          {collection.description}
        </p>
      </div>
      
      {/* Grid de libros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
        gap: '16px' 
      }}>
        {filteredBooks.map(book => {
          const listStatus = getListStatus(book.id);
          return (
            <div
              key={book.id}
              onClick={() => onBookClick(book)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <img
                src={`/portadas/${book.id}.jpg`}
                alt={book.t || book.title}
                style={{
                  width: '100%',
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 3"><rect fill="%23333" width="2" height="3"/></svg>'; }}
              />
              {listStatus && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: t.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  {listStatus === 'want' ? '♡' : listStatus === 'reading' ? '📖' : '✔'}
                </div>
              )}
              <p style={{
                fontSize: '12px',
                color: t.text.secondary,
                marginTop: '8px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {book.t || book.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: RelatedBooksSection - Libros relacionados inline
// =============================================================================
const RelatedBooksSection = memo(({ currentBook, books, hooks, onBookClick, theme, t }) => {
  const currentHook = hooks[String(currentBook.id)];
  
  // Encontrar libros relacionados por múltiples criterios
  const relatedBooks = useMemo(() => {
    if (!currentHook) return [];
    
    const scores = {};
    const currentThemes = new Set(currentHook.themes || []);
    const currentExperience = currentHook.experience;
    const currentAuthors = new Set(currentBook.a || []);
    
    books.forEach(book => {
      if (book.id === currentBook.id) return;
      
      let score = 0;
      const bookHook = hooks[String(book.id)];
      
      // Mismo autor: +10
      (book.a || []).forEach(author => {
        if (currentAuthors.has(author)) score += 10;
      });
      
      // Mismos temas: +3 por tema
      if (bookHook?.themes) {
        bookHook.themes.forEach(thm => {
          if (currentThemes.has(thm)) score += 3;
        });
      }
      
      // Misma experiencia: +5
      if (bookHook?.experience === currentExperience) score += 5;
      
      // Mismo vibe: +2
      const currentVibes = new Set(currentBook.v || []);
      (book.v || []).forEach(vibe => {
        if (currentVibes.has(vibe)) score += 2;
      });
      
      if (score > 0) {
        scores[book.id] = { book, score };
      }
    });
    
    return Object.values(scores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.book);
  }, [currentBook, books, hooks, currentHook]);
  
  if (relatedBooks.length === 0) return null;
  
  return (
    <div>
      <h3 style={{
        fontSize: '13px',
        fontWeight: 600,
        color: t.text.secondary,
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Si te gusta este, también...
      </h3>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginLeft: '-24px',
        marginRight: '-24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        scrollbarWidth: 'none'
      }}>
        {relatedBooks.map(book => (
          <div
            key={book.id}
            onClick={() => onBookClick(book)}
            style={{
              flexShrink: 0,
              width: '72px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '72px',
              height: '108px',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              marginBottom: '6px',
              transition: 'transform 0.15s ease',
              background: t.bg.tertiary
            }}>
              <img 
                src={`/portadas/${book.id}.jpg`}
                alt={book.t}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { 
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <p style={{
              fontSize: '10px',
              color: t.text.secondary,
              textAlign: 'center',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {book.t}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

RelatedBooksSection.displayName = 'RelatedBooksSection';

const SPOILER_LEVELS = [
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

const SPOILER_RANK = {
  vibes: 0,
  lore: 1,
  personajes: 2,
  detalles: 3
};

const buildSynopsisPreview = (synopsis, maxLength = 280) => {
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

// =============================================================================
// COMPONENTE: BookModal
// =============================================================================
const BookModal = memo(({ book, onClose, theme, currentList, onListChange, onAuthorClick, onThemeClick, onExperienceClick, onBookClick, bookHook, books, hooks }) => {
  const [imgError, setImgError] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [spoilerLevel, setSpoilerLevel] = useLocalStorage('nextread_spoiler_level', 'vibes');
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  if (!book) return null;
  
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const awards = useMemo(() => getBookAwardLabels(book, bookHook || {}), [book, bookHook]);
  const vibes = book.v || book.vibes || [];
  const series = book.s || book.series;
  const seriesIndex = book.si || book.series_index;
  const pages = book.pg || book.pages || 300;
  const hours = book.h || book.reading_time_hours || Math.round(pages / 40 * 10) / 10;
  const difficulty = book.d || book.difficulty || 'medio';
  const synopsis = book.syn || book.synopsis || '';
  
  // Hook data
  const hook = book.hook || '';
  const themes = book.themes || [];
  const idealFor = book.ideal_for || '';
  const experience = book.experience || '';
  const bookType = book.book_type || '';
  const activeSpoilerLevel = SPOILER_RANK[spoilerLevel] === undefined ? 'vibes' : spoilerLevel;
  const spoilerRank = SPOILER_RANK[activeSpoilerLevel];
  const canSeeLore = spoilerRank >= SPOILER_RANK.lore;
  const canSeeCharacters = spoilerRank >= SPOILER_RANK.personajes;
  const canSeeDetails = spoilerRank >= SPOILER_RANK.detalles;
  const activeSpoilerMeta = SPOILER_LEVELS.find(level => level.id === activeSpoilerLevel) || SPOILER_LEVELS[0];
  const synopsisPreview = useMemo(() => buildSynopsisPreview(synopsis), [synopsis]);
  const loreVisualTokens = useMemo(() => {
    const tokens = [];
    const hookThemes = Array.isArray(bookHook?.themes) ? bookHook.themes : [];
    const safeVibes = Array.isArray(vibes) ? vibes : [];
    safeVibes.slice(0, 3).forEach((vibe) => tokens.push({ label: vibe, accent: false }));
    hookThemes.slice(0, 3).forEach((thm) => tokens.push({ label: thm, accent: true }));
    if (book.m) tokens.push({ label: `Mood: ${book.m}`, accent: false });
    if (difficulty) tokens.push({ label: `Dificultad: ${difficulty}`, accent: false });
    return tokens.slice(0, 6);
  }, [bookHook, vibes, book.m, difficulty]);

  useEffect(() => {
    if (SPOILER_RANK[spoilerLevel] === undefined) {
      setSpoilerLevel('vibes');
    }
  }, [spoilerLevel, setSpoilerLevel]);

  useEffect(() => {
    if (!canSeeDetails && synopsisExpanded) {
      setSynopsisExpanded(false);
    }
  }, [canSeeDetails, synopsisExpanded]);
  
  const handleListClick = (listId) => {
    onListChange(book.id, currentList === listId ? null : listId);
  };
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${title}`}
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px 16px 0 0',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          borderBottom: 'none',
          boxShadow: '0 -16px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.24s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        {/* Handle de arrastre */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '12px',
          paddingBottom: '8px'
        }}>
          <div style={{ 
            width: '36px', 
            height: '5px', 
            borderRadius: '3px', 
            background: t.border.strong,
            opacity: 0.6
          }} />
        </div>
        
        {/* Header */}
        <div style={{ padding: '8px 24px 0', position: 'relative' }}>
          <button 
            onClick={onClose}
            aria-label="Cerrar detalle del libro"
            style={{
              position: 'absolute', top: '0', right: '16px',
              ...getModalCloseButtonStyle(t)
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.95'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{
              width: '100px', height: '150px',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              flexShrink: 0,
              background: t.bg.tertiary
            }}>
              {!imgError ? (
                <img src={coverUrl} alt={title} 
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     onError={() => setImgError(true)} />
              ) : (
                <div style={{ 
                  width: '100%', height: '100%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.text.muted, fontSize: '32px'
                }}>📖</div>
              )}
            </div>
            
            <div style={{ flex: 1, paddingTop: '8px' }}>
              <h2 style={{
                fontFamily: t.typography.display,
                fontSize: '20px',
                fontWeight: 600,
                color: t.text.primary,
                lineHeight: 1.3,
                marginBottom: '6px'
              }}>
                {title}
              </h2>
              <p style={{ fontSize: '14px', color: t.text.secondary, marginBottom: '8px' }}>
                {authors.map((author, i) => (
                  <span key={author}>
                    <button
                      type="button"
                      aria-label={`Abrir autor ${author}`}
                      onClick={(e) => { e.stopPropagation(); onAuthorClick?.(author); }}
                      style={{ 
                        font: 'inherit',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        borderBottom: `1px dotted ${t.text.tertiary}`,
                        color: t.text.secondary,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = t.accent}
                      onMouseLeave={e => e.currentTarget.style.color = t.text.secondary}
                    >
                      {author}
                    </button>
                    {i < authors.length - 1 && ', '}
                  </span>
                ))}
              </p>
              {series && (
                <p style={{ fontSize: '12px', color: t.text.tertiary }}>
                  {series} · #{seriesIndex}
                </p>
              )}
              
              {awards.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  {awards.slice(0, 2).map((award, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: t.accentMuted,
                      color: t.accent
                    }}>
                      ★ {award}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Metadatos */}
        <div style={{ padding: '20px 24px', display: 'flex', gap: '32px' }}>
          <div>
            <span style={{ fontSize: '22px', fontWeight: 500, color: t.text.primary }}>{pages}</span>
            <span style={{ fontSize: '12px', color: t.text.tertiary, marginLeft: '4px' }}>páginas</span>
          </div>
          <div>
            <span style={{ fontSize: '22px', fontWeight: 500, color: t.text.primary }}>{hours}h</span>
            <span style={{ fontSize: '12px', color: t.text.tertiary, marginLeft: '4px' }}>lectura</span>
          </div>
          <div>
            <span style={{ fontSize: '22px', fontWeight: 500, color: t.text.primary }}>
              {difficulty === 'ligero' ? '○' : difficulty === 'denso' ? '●' : '◐'}
            </span>
            <span style={{ fontSize: '12px', color: t.text.tertiary, marginLeft: '4px' }}>{difficulty}</span>
          </div>
        </div>

        {/* Anti-spoilers + Lore visual */}
        <div style={{ padding: '0 24px 18px' }}>
          <p style={SECTION_TITLE_STYLE(t)}>
            Nivel de informacion
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SPOILER_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSpoilerLevel(level.id);
                }}
                aria-pressed={activeSpoilerLevel === level.id}
                style={{
                  fontSize: '12px',
                  minHeight: '36px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${activeSpoilerLevel === level.id ? t.accent : t.border.default}`,
                  background: activeSpoilerLevel === level.id ? t.accentMuted : t.bg.elevated,
                  color: activeSpoilerLevel === level.id ? t.accent : t.text.secondary,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 120ms ease'
                }}
              >
                {level.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: t.text.tertiary, marginTop: '8px' }}>
            {activeSpoilerMeta.description}
          </p>

          {loreVisualTokens.length > 0 && (
            <>
              <p style={{ ...SECTION_TITLE_STYLE(t), marginTop: '12px' }}>
                Mapa visual del lore (sin spoiler)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {loreVisualTokens.map((token, idx) => (
                  <span
                    key={`${token.label}-${idx}`}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: token.accent ? t.accentMuted : t.bg.elevated,
                      color: token.accent ? t.accent : t.text.secondary,
                      border: `1px solid ${token.accent ? t.accent : t.border.default}`
                    }}
                  >
                    {token.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Vibes */}
        {vibes.length > 0 && (
          <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {vibes.slice(0, 4).map((vibe, i) => (
              <span key={i} style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: t.bg.tertiary,
                color: t.text.secondary
              }}>
                {vibe}
              </span>
            ))}
          </div>
        )}
        
        {/* Hook - Por qué leer este libro */}
        {bookHook && (
          <div style={{ 
            padding: '0 24px 20px'
          }}>
            {/* El gancho principal */}
            {bookHook.hook && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}05)`,
                borderLeft: `3px solid ${t.accent}`,
                marginBottom: '12px'
              }}>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: t.text.primary,
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  "{bookHook.hook}"
                </p>
              </div>
            )}
            
            {/* Meta info del hook */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {/* Perfecto para */}
              {canSeeLore && bookHook.perfect_for && (
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: t.bg.tertiary,
                  color: t.text.secondary
                }}>
                  👤 {bookHook.perfect_for}
                </span>
              )}
              
              {/* Experiencia - Clickeable */}
              {bookHook.experience && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onExperienceClick?.(bookHook.experience); }}
                  aria-label={`Abrir experiencia ${bookHook.experience}`}
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: t.accentMuted,
                    color: t.accent,
                    fontWeight: 600,
                    border: `1px solid ${t.accent}`,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {bookHook.experience}
                </button>
              )}
            </div>
            
            {/* Por qué importa */}
            {canSeeLore && bookHook.why_matters && (
              <p style={{
                fontSize: '12px',
                color: t.text.tertiary,
                margin: 0,
                lineHeight: 1.5
              }}>
                💡 {bookHook.why_matters}
              </p>
            )}
            
            {/* Temas */}
            {canSeeLore && bookHook.themes && bookHook.themes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {bookHook.themes.map(thm => (
                  <button 
                    key={thm} 
                    onClick={(e) => { e.stopPropagation(); onThemeClick?.(thm); }}
                    aria-label={`Abrir tema ${thm}`}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${t.border.default}`,
                      background: t.bg.elevated,
                      color: t.text.secondary,
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.borderColor = t.accent;
                      e.currentTarget.style.color = t.accent;
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.borderColor = t.border.default;
                      e.currentTarget.style.color = t.text.secondary;
                    }}
                  >
                    {thm}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Hook fallback (solo si no hay hook enriquecido) */}
        {!bookHook && hook && (
          <div style={{ 
            padding: '20px 24px',
            background: `linear-gradient(135deg, ${t.accent}11, ${t.accent}05)`,
            borderLeft: `3px solid ${t.accent}`,
            marginBottom: '16px'
          }}>
            <p style={{
              fontSize: '15px',
              lineHeight: 1.8,
              color: t.text.primary,
              fontStyle: 'italic',
              marginBottom: themes.length > 0 ? '16px' : 0
            }}>
              {hook}
            </p>
            
            {/* Temas */}
            {canSeeLore && themes.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                marginBottom: idealFor ? '12px' : 0
              }}>
                {themes.map(theme => (
                  <span 
                    key={theme}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: t.bg.secondary,
                      color: t.text.secondary,
                      border: `1px solid ${t.border.subtle}`
                    }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}
            
            {/* Para quién es */}
            {canSeeLore && idealFor && (
              <p style={{
                fontSize: '12px',
                color: t.text.tertiary,
                marginTop: '8px'
              }}>
                👤 <strong style={{ color: t.text.secondary }}>Ideal para:</strong> {idealFor}
              </p>
            )}
            
            {/* Experiencia y tipo */}
            {canSeeLore && (experience || bookType) && (
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '8px',
                fontSize: '12px',
                color: t.text.tertiary
              }}>
                {experience && (
                  <span>✨ {experience}</span>
                )}
                {bookType && (
                  <span style={{ color: t.accent }}>📚 {bookType}</span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Sinopsis */}
        {synopsis && (
          <div style={{ padding: '0 24px 20px' }}>
            {!canSeeCharacters && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: t.bg.secondary,
                border: `1px solid ${t.border.subtle}`
              }}>
                <p style={{ fontSize: '12px', color: t.text.tertiary, lineHeight: 1.5 }}>
                  🔒 Sinopsis oculta en este nivel. Cambia a <strong style={{ color: t.text.secondary }}>Personajes</strong> o <strong style={{ color: t.text.secondary }}>Detalles</strong> para verla.
                </p>
              </div>
            )}
            {canSeeCharacters && (
              <>
                <p style={{
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: t.text.secondary,
                  ...((canSeeDetails && !synopsisExpanded) ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  } : {})
                }}>
                  {canSeeDetails ? synopsis : synopsisPreview}
                </p>
                {!canSeeDetails && synopsis.length > synopsisPreview.length && (
                  <p style={{ fontSize: '12px', color: t.text.tertiary, marginTop: '8px' }}>
                    Para ver la sinopsis completa, cambia a nivel <strong style={{ color: t.text.secondary }}>Detalles</strong>.
                  </p>
                )}
                {canSeeDetails && synopsis.length > 150 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSynopsisExpanded(!synopsisExpanded); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: t.accent,
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '8px 0 0 0',
                      fontWeight: 500
                    }}
                  >
                    {synopsisExpanded ? '← Ver menos' : 'Ver más →'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Libros relacionados */}
        {books && books.length > 0 && (
          <div style={{ padding: '0 24px 20px' }}>
            <RelatedBooksSection 
              currentBook={book}
              books={books}
              hooks={hooks}
              onBookClick={(relatedBook) => {
                onClose();
                setTimeout(() => onBookClick?.(relatedBook), 100);
              }}
              theme={theme}
              t={t}
            />
          </div>
        )}
        
        {/* Acciones con microinteracciones */}
        <div style={{ 
          padding: '20px 24px 32px', 
          borderTop: `1px solid ${t.border.default}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <ActionButton 
            onClick={() => { handleListClick('reading'); haptic.medium(); }}
            variant="primary"
            isActive={currentList === 'reading'}
            theme={t}
          >
            {currentList === 'reading' ? '◐ Leyendo' : COPY.readNow}
          </ActionButton>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <ActionButton 
              onClick={() => { handleListClick('want'); haptic.light(); }}
              variant="secondary"
              isActive={currentList === 'want'}
              activeColor="#8e7a69"
              theme={t}
              style={{ flex: 1 }}
            >
              {currentList === 'want' ? '○ En lista' : COPY.readLater}
            </ActionButton>
            <ActionButton 
              onClick={() => { handleListClick('read'); haptic.success(); }}
              variant="secondary"
              isActive={currentList === 'read'}
              activeColor={t.success}
              theme={t}
              style={{ flex: 1 }}
            >
              {currentList === 'read' ? '✔ Leído' : COPY.alreadyRead}
            </ActionButton>
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
// Definición de filtros con alma
const SOUL_FILTERS = {
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

const FilterSheet = ({ filters, setFilters, moods, genres, onClose, theme }) => {
  const t = THEMES[theme];
  const [activeSection, setActiveSection] = useState('experience');
  useEscapeKey(onClose);
  
  const ChipButton = ({ active, onClick, children, large }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: large ? '44px' : '36px',
        padding: large ? '12px 14px' : '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${active ? t.accent : t.border.default}`,
        background: active ? t.accentMuted : t.bg.elevated,
        color: active ? t.accent : t.text.secondary,
        fontSize: large ? '14px' : '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 120ms ease',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {children}
    </button>
  );

  const SectionTab = ({ id, label, active }) => (
    <button
      onClick={() => setActiveSection(id)}
      aria-pressed={active}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        border: `1px solid ${active ? t.accent : 'transparent'}`,
        background: active ? t.accentMuted : 'transparent',
        color: active ? t.accent : t.text.tertiary,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 120ms ease'
      }}
    >
      {label}
    </button>
  );

  const hasAnyFilter = filters.experience || filters.moment || filters.theme ||
    filters.difficulty || filters.hasAwards || filters.mood ||
    filters.length || filters.language || filters.minAcclaim ||
    (filters.genres && filters.genres.length > 0);

  const getActiveFiltersSummary = () => {
    const parts = [];
    if (filters.experience) {
      const exp = SOUL_FILTERS.experience.options.find(o => o.id === filters.experience);
      if (exp) parts.push(`${exp.icon} ${exp.label}`);
    }
    if (filters.moment) {
      const mom = SOUL_FILTERS.moment.options.find(o => o.id === filters.moment);
      if (mom) parts.push(`${mom.icon} ${mom.label}`);
    }
    if (filters.theme) {
      const th = SOUL_FILTERS.theme.options.find(o => o.id === filters.theme);
      if (th) parts.push(`${th.icon} ${th.label}`);
    }
    if (filters.difficulty) parts.push(`⚡ ${filters.difficulty}`);
    if (filters.hasAwards) parts.push('🏆 premiados');
    if (filters.genres.length > 0) parts.push(`🏷 ${filters.genres.length} generos`);
    if (filters.minAcclaim) parts.push(`⭐ ${filters.minAcclaim}+ critica`);
    if (filters.length) {
      const lengthLabel = LENGTH_FILTER_OPTIONS.find(o => o.id === filters.length)?.label;
      if (lengthLabel) parts.push(`📏 ${lengthLabel}`);
    }
    if (filters.language) {
      const languageLabel = LANGUAGE_FILTER_OPTIONS.find(o => o.id === filters.language)?.label;
      if (languageLabel) parts.push(`🌍 ${languageLabel}`);
    }
    return parts.join(' · ');
  };
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de búsqueda"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '16px 16px 0 0',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          borderBottom: 'none',
          boxShadow: '0 -16px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.24s cubic-bezier(0.2, 0, 0, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Handle de arrastre */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '12px',
          paddingBottom: '4px'
        }}>
          <div style={{ 
            width: '36px', 
            height: '5px', 
            borderRadius: '3px', 
            background: t.border.strong,
            opacity: 0.6
          }} />
        </div>
        
        {/* Header */}
        <div style={{ padding: '12px 24px 16px', borderBottom: `1px solid ${t.border.default}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: t.typography.display, fontSize: '22px', color: t.text.primary }}>
              Encuentra tu libro
            </h3>
            <button
              onClick={onClose}
              aria-label="Cerrar filtros"
              style={getModalCloseButtonStyle(t)}
            >
              ✕
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            background: t.bg.secondary,
            borderRadius: '8px',
            border: `1px solid ${t.border.default}`,
            padding: '4px'
          }}>
            <SectionTab id="experience" label="Sentir" active={activeSection === 'experience'} />
            <SectionTab id="moment" label="Momento" active={activeSection === 'moment'} />
            <SectionTab id="theme" label="Tema" active={activeSection === 'theme'} />
            <SectionTab id="classic" label="Clásicos" active={activeSection === 'classic'} />
          </div>
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Resumen de filtros activos con gradiente */}
          {hasAnyFilter && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: t.accentMuted,
              marginBottom: '20px',
              border: `1px solid ${t.accent}`
            }}>
              <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '4px' }}>Buscando:</p>
              <p style={{ fontSize: '14px', color: t.text.primary, fontWeight: 500 }}>
                {getActiveFiltersSummary()}
              </p>
            </div>
          )}
          
          {/* Sección: Experiencia */}
          {activeSection === 'experience' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.experience.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SOUL_FILTERS.experience.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.experience === opt.id}
                    onClick={() => setFilters(f => ({ 
                      ...f, 
                      experience: f.experience === opt.id ? null : opt.id 
                    }))}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección: Momento */}
          {activeSection === 'moment' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.moment.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SOUL_FILTERS.moment.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.moment === opt.id}
                    onClick={() => setFilters(f => ({ 
                      ...f, 
                      moment: f.moment === opt.id ? null : opt.id 
                    }))}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <div>
                      <div>{opt.label}</div>
                      {opt.desc && <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>}
                    </div>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección: Tema */}
          {activeSection === 'theme' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.theme.label}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {SOUL_FILTERS.theme.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.theme === opt.id}
                    onClick={() => setFilters(f => ({ 
                      ...f, 
                      theme: f.theme === opt.id ? null : opt.id 
                    }))}
                  >
                    <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección: Filtros clásicos */}
          {activeSection === 'classic' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Genero
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {genres.slice(0, 24).map(g => (
                    <ChipButton
                      key={g}
                      active={filters.genres.includes(g)}
                      onClick={() => setFilters(f => ({
                        ...f,
                        genres: f.genres.includes(g)
                          ? f.genres.filter(item => item !== g)
                          : [...f.genres, g]
                      }))}
                    >
                      {g}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Dificultad
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'ligero', icon: '○', label: 'Ligero' },
                    { id: 'medio', icon: '◐', label: 'Medio' },
                    { id: 'denso', icon: '●', label: 'Denso' }
                  ].map(d => (
                    <ChipButton
                      key={d.id}
                      active={filters.difficulty === d.id}
                      onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d.id ? null : d.id }))}
                    >
                      {d.icon} {d.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Aclamacion critica
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ACCLAIM_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.minAcclaim === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        minAcclaim: f.minAcclaim === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Longitud
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LENGTH_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.length === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        length: f.length === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Idioma original (estimado)
                </p>
                <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '10px' }}>
                  Basado en nacionalidad del autor si no hay metadato explicito.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LANGUAGE_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.language === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        language: f.language === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Atmósfera
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {moods.slice(0, 10).map(m => (
                    <ChipButton
                      key={m}
                      active={filters.mood === m}
                      onClick={() => setFilters(f => ({ ...f, mood: f.mood === m ? null : m }))}
                    >
                      {m}
                    </ChipButton>
                  ))}
                </div>
              </div>
              
              <div>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Especial
                </p>
                <ChipButton
                  active={filters.hasAwards}
                  onClick={() => setFilters(f => ({ ...f, hasAwards: !f.hasAwards }))}
                >
                  🏆 Solo premiados
                </ChipButton>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ 
          padding: '16px 24px 24px', 
          borderTop: `1px solid ${t.border.default}`,
          display: 'flex', 
          gap: '12px' 
        }}>
          <button 
            onClick={() => setFilters({ 
              ...DEFAULT_FILTERS,
              search: filters.search
            })}
            style={{
              flex: 1, padding: '14px',
              minHeight: '44px',
              borderRadius: '8px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.elevated,
              color: t.text.secondary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
          >
            Limpiar filtros
          </button>
          <button 
            onClick={onClose}
            style={{
              flex: 1, padding: '14px',
              minHeight: '44px',
              borderRadius: '8px',
              border: `1px solid ${t.accent}`,
              background: t.accent,
              color: t.bg.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'filter 120ms ease'
            }}
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: StatsModal
// =============================================================================
const StatsModal = ({ books, awardedBookIds, onClose, theme }) => {
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  const stats = useMemo(() => {
    const totalPages = books.reduce((sum, b) => sum + (b.pg || b.pages || 250), 0);
    const totalHours = Math.round(totalPages / 40);
    const awarded = awardedBookIds instanceof Set
      ? awardedBookIds.size
      : books.filter(b => (b.aw || b.awards || []).length > 0).length;
    return { total: books.length, pages: totalPages.toLocaleString(), hours: totalHours.toLocaleString(), awarded };
  }, [books, awardedBookIds]);
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Estadísticas de biblioteca"
        style={{
          width: '100%',
          maxWidth: '360px',
          borderRadius: '14px',
          padding: '24px',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: t.typography.display, fontSize: '20px', color: t.text.primary }}>{COPY.stats.title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar estadísticas"
            style={getModalCloseButtonStyle(t)}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.books}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.pages}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.pages}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.hours}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.hours}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.accent }}>{stats.awarded}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.awarded}</div>
          </div>
        </div>
        
        <p style={{ fontSize: '14px', textAlign: 'center', fontStyle: 'italic', color: t.text.secondary }}>
          {COPY.stats.message}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: AuthorModal
// =============================================================================
const AuthorModal = ({ authorName, authorData, books, hooks, onClose, onBookClick, onThemeClick, theme }) => {
  const t = THEMES[theme];
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);
  useEscapeKey(onClose);
  
  // Detectar scroll para sombra dinámica
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Obtener libros de este autor
  const authorBooks = useMemo(() => {
    if (!authorName) return [];
    return books.filter(book => {
      const bookAuthors = book.a || book.authors || [];
      return bookAuthors.some(a => a.toLowerCase() === authorName.toLowerCase());
    });
  }, [authorName, books]);
  
  if (!authorName) return null;
  
  const data = authorData || {};
  const hasData = Object.keys(data).length > 0;
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Autor ${authorName}`}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '14px',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        {/* Header con sombra dinámica */}
        <div style={{ 
          padding: '20px 24px 14px', 
          position: 'sticky', 
          top: 0, 
          background: t.bg.primary,
          borderRadius: '14px 14px 0 0',
          zIndex: 1,
          transition: 'box-shadow 120ms ease',
          boxShadow: scrolled ? `0 1px 0 ${t.border.default}` : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontFamily: t.typography.display, 
                fontSize: '24px', 
                fontWeight: 600, 
                color: t.text.primary,
                marginBottom: '4px'
              }}>
                {hasData ? data.name : authorName}
              </h2>
              {hasData && data.years && (
                <p style={{ fontSize: '14px', color: t.text.tertiary }}>
                  {data.years} · {data.nationality}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar autor"
              style={getModalCloseButtonStyle(t)}
            >
              ✕
            </button>
          </div>
        </div>
        
        <div style={{ padding: '0 24px 24px' }}>
          {hasData ? (
            <>
              {/* Biografía */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={SECTION_TITLE_STYLE(t)}>
                  Biografía
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: t.text.secondary }}>
                  {data.bio}
                </p>
              </div>
              
              {/* Importancia */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={SECTION_TITLE_STYLE(t)}>
                  Por qué es importante
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  lineHeight: 1.6, 
                  color: t.text.primary,
                  padding: '12px 16px',
                  background: t.accentMuted,
                  borderRadius: '8px',
                  border: `1px solid ${t.accent}`
                }}>
                  {data.importance}
                </p>
              </div>
              
              {/* Premios */}
              {data.awards && data.awards.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={SECTION_TITLE_STYLE(t)}>
                    Reconocimientos
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.awards.map((award, i) => (
                      <span key={i} style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        background: t.bg.elevated,
                        border: `1px solid ${t.border.default}`,
                        color: t.text.secondary
                      }}>
                        ★ {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Obras destacadas */}
              {data.notable_works && data.notable_works.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={SECTION_TITLE_STYLE(t)}>
                    Obras destacadas
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {data.notable_works.map((work, i) => (
                      <li key={i} style={{ 
                        fontSize: '14px', 
                        color: t.text.secondary, 
                        marginBottom: '4px' 
                      }}>
                        {work}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p style={{ 
              fontSize: '14px', 
              color: t.text.tertiary, 
              textAlign: 'center',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              Aún no tenemos información biográfica sobre este autor.
            </p>
          )}
          
          {/* Libros en tu biblioteca */}
          {authorBooks.length > 0 && (
            <>
              {/* Temas que explora este autor */}
              {(() => {
                const authorThemes = {};
                authorBooks.forEach(book => {
                  const bookHook = hooks?.[String(book.id)];
                  if (bookHook?.themes) {
                    bookHook.themes.forEach(thm => {
                      authorThemes[thm] = (authorThemes[thm] || 0) + 1;
                    });
                  }
                });
                const topThemes = Object.entries(authorThemes)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([name]) => name);
                
                if (topThemes.length === 0) return null;
                
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={SECTION_TITLE_STYLE(t)}>
                      Temas que explora
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {topThemes.map(thm => (
                        <button 
                          key={thm}
                          onClick={() => onThemeClick?.(thm)}
                          style={{
                            fontSize: '12px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: t.bg.elevated,
                            border: `1px solid ${t.border.default}`,
                            color: t.text.secondary,
                            cursor: 'pointer',
                            transition: 'all 120ms ease'
                          }}
                          onMouseEnter={e => { 
                            e.currentTarget.style.borderColor = t.accent;
                            e.currentTarget.style.color = t.accent;
                          }}
                          onMouseLeave={e => { 
                            e.currentTarget.style.borderColor = t.border.default;
                            e.currentTarget.style.color = t.text.secondary;
                          }}
                        >
                          {thm}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              <div>
                <h3 style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  En tu biblioteca ({authorBooks.length})
                </h3>
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginLeft: '-24px',
                  marginRight: '-24px',
                  paddingLeft: '24px',
                  paddingRight: '24px'
                }}>
                  {authorBooks.slice(0, 10).map(book => {
                    const coverUrl = `/portadas/${book.id}.jpg`;
                    const title = book.t || book.title || 'Sin título';
                    return (
                      <div 
                        key={book.id}
                        onClick={() => { onClose(); setTimeout(() => onBookClick(book), 100); }}
                        style={{
                          width: '80px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'transform 120ms ease'
                        }}
                      >
                        <div style={{
                          width: '80px',
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: `1px solid ${t.border.default}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                          marginBottom: '6px',
                          background: t.bg.elevated
                        }}>
                          <img 
                            src={coverUrl} 
                            alt={title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: t.text.secondary,
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: ThemeModal - Libros por tema
// =============================================================================
const ThemeModal = ({ themeName, books, hooks, onClose, onBookClick, onExperienceClick, theme }) => {
  const t = THEMES[theme];
  const contentRef = useRef(null);
  useEscapeKey(onClose);
  
  const themeEmojis = {
    amor: '❤️', muerte: '💀', familia: '👨‍👩‍👧', memoria: '🧠', identidad: '🪞',
    guerra: '⚔️', poder: '👑', soledad: '🌙', viaje: '🧭', tiempo: '⏳',
    naturaleza: '🌿', arte: '🎨', música: '🎵', política: '🏛️', ciencia: '🔬',
    religión: '✏️', locura: '🌀', venganza: '🔥', infancia: '🧒', vejez: '👴',
    amistad: '🤝', traición: '🗡️', libertad: '🕊️', supervivencia: '🏕️', obsesión: '👁️',
    pérdida: '🥀', redención: '🌅', destino: '⭐', violencia: '👥', escritura: '✍️',
    América: '🇺🇸', España: '🇪🇸', juventud: '🌱', historia: '📜', vida: '🌻'
  };
  
  // Encontrar libros con este tema
  const themeBooks = useMemo(() => {
    return books.filter(book => {
      const bookHook = hooks[String(book.id)];
      return bookHook?.themes?.includes(themeName);
    }).slice(0, 40);
  }, [books, hooks, themeName]);
  
  // Agrupar por experiencia
  const experienceGroups = useMemo(() => {
    const groups = {};
    themeBooks.forEach(book => {
      const bookHook = hooks[String(book.id)];
      const exp = bookHook?.experience || 'otros';
      if (!groups[exp]) groups[exp] = [];
      groups[exp].push(book);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [themeBooks, hooks]);
  
  if (!themeName) return null;
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Tema ${themeName}`}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '16px 16px 0 0',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          borderBottom: 'none',
          overflow: 'hidden',
          boxShadow: '0 -16px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.24s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '5px', borderRadius: '3px', background: t.border.strong, opacity: 0.6 }} />
        </div>
        
        {/* Header */}
        <div style={{ 
          padding: '0 24px 18px', 
          textAlign: 'center',
          background: t.bg.primary,
          borderBottom: `1px solid ${t.border.default}`,
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            aria-label="Cerrar tema"
            style={{
              ...getModalCloseButtonStyle(t),
              position: 'absolute',
              top: '-2px',
              right: '24px'
            }}
          >
            ✕
          </button>
          <span style={{ fontSize: '44px', marginBottom: '8px', display: 'block' }}>
            {themeEmojis[themeName] || '📚'}
          </span>
          <h2 style={{
            fontFamily: t.typography.display,
            fontSize: '24px',
            fontWeight: 600,
            color: t.text.primary,
            marginBottom: '4px',
            textTransform: 'capitalize'
          }}>
            {themeName}
          </h2>
          <p style={{ fontSize: '14px', color: t.text.tertiary }}>
            {themeBooks.length} libros en tu biblioteca
          </p>
        </div>
        
        {/* Lista agrupada por experiencia */}
        <div style={{ padding: '16px 24px 28px', maxHeight: '60vh', overflowY: 'auto' }}>
          {experienceGroups.map(([experience, expBooks]) => (
            <div key={experience} style={{ marginBottom: '24px' }}>
              <button
                onClick={() => experience !== 'otros' && onExperienceClick?.(experience)}
                disabled={experience === 'otros'}
                style={{ 
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: experience !== 'otros' ? 'pointer' : 'default',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '12px', color: t.accent, fontWeight: 700, textTransform: 'capitalize' }}>
                  ✨ {experience}
                </span>
                <span style={{ fontSize: '11px', color: t.text.muted }}>({expBooks.length})</span>
                {experience !== 'otros' && <span style={{ fontSize: '14px', color: t.text.muted, marginLeft: 'auto' }}>›</span>}
              </button>
              
              {/* Scroll horizontal de covers */}
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginLeft: '-24px',
                marginRight: '-24px',
                paddingLeft: '24px',
                paddingRight: '24px',
                scrollbarWidth: 'none'
              }}>
                {expBooks.slice(0, 10).map(book => (
                  <div
                    key={book.id}
                    onClick={() => onBookClick(book)}
                    style={{ flexShrink: 0, width: '80px', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: '80px',
                      height: '120px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: `1px solid ${t.border.default}`,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                      marginBottom: '6px',
                      background: t.bg.elevated
                    }}>
                      <img 
                        src={`/portadas/${book.id}.jpg`}
                        alt={book.t}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: t.text.secondary,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {book.t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: ExperienceModal - Libros por experiencia
// =============================================================================
const ExperienceModal = ({ experience, books, hooks, onClose, onBookClick, onAuthorClick, theme }) => {
  const t = THEMES[theme];
  const contentRef = useRef(null);
  useEscapeKey(onClose);
  
  const experienceEmojis = {
    devastador: '💔', perturbador: '😰', melancólico: '🌧️', nostálgico: '🕰️',
    épico: '⚔️', monumental: '🏛️', absorbente: '🌀', hipnótico: '👁️',
    tenso: '😬', vertiginoso: '🎢', brutal: '💀', desgarrador: '😢',
    conmovedor: '🥺', íntimo: '💭', reflexivo: '🤔', filosófico: '🧠',
    sardónico: '😏', irónico: '🎭', divertido: '😄', luminoso: '☀️',
    onírico: '🌙', misterioso: '🔮', aterrador: '😱', inquietante: '💻',
    agridulce: '🏋', contemplativo: '🧘', sombrío: '🌑', visceral: '👥'
  };
  
  const experienceDescriptions = {
    devastador: 'Te dejará sin aliento. Prepárate para sentir.',
    perturbador: 'Inquietante de la mejor manera. Te hará pensar días después.',
    melancólico: 'Belleza triste. Para momentos contemplativos.',
    nostálgico: 'Te transportará a otros tiempos.',
    épico: 'Grande en escala y ambición.',
    monumental: 'Obras que definen generaciones.',
    absorbente: 'Imposible de soltar.',
    hipnótico: 'Caerás en su ritmo.',
    tenso: 'Mantendrá tu pulso acelerado.',
    vertiginoso: 'Velocidad narrativa que atrapa.',
    brutal: 'Sin concesiones. Honesto hasta doler.',
    desgarrador: 'Romperá algo dentro de ti.',
    conmovedor: 'Tocará tu corazón.',
    íntimo: 'Como leer el diario de alguien.',
    reflexivo: 'Para pensar profundamente.',
    filosófico: 'Grandes preguntas, sin respuestas fáciles.',
    sardónico: 'Ironía inteligente y mordaz.',
    onírico: 'Entre el sueño y la realidad.',
    aterrador: 'Para quien busca miedo de verdad.'
  };
  
  // Encontrar libros con esta experiencia
  const experienceBooks = useMemo(() => {
    return books.filter(book => {
      const bookHook = hooks[String(book.id)];
      return bookHook?.experience === experience;
    }).slice(0, 40);
  }, [books, hooks, experience]);
  
  if (!experience) return null;
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Experiencia ${experience}`}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '16px 16px 0 0',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          borderBottom: 'none',
          overflow: 'hidden',
          boxShadow: '0 -16px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.24s cubic-bezier(0.2, 0, 0, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '5px', borderRadius: '3px', background: t.border.strong, opacity: 0.6 }} />
        </div>
        
        {/* Header */}
        <div style={{ 
          padding: '0 24px 18px',
          textAlign: 'center',
          borderBottom: `1px solid ${t.border.default}`,
          background: t.bg.primary,
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            aria-label="Cerrar experiencia"
            style={{
              ...getModalCloseButtonStyle(t),
              position: 'absolute',
              top: '-2px',
              right: '24px'
            }}
          >
            ✕
          </button>
          <span style={{ fontSize: '52px', marginBottom: '12px', display: 'block' }}>
            {experienceEmojis[experience] || '✨'}
          </span>
          <h2 style={{
            fontFamily: t.typography.display,
            fontSize: '26px',
            fontWeight: 600,
            color: t.text.primary,
            marginBottom: '8px',
            textTransform: 'capitalize'
          }}>
            {experience}
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: t.text.secondary,
            maxWidth: '300px',
            margin: '0 auto 8px'
          }}>
            {experienceDescriptions[experience] || 'Una experiencia de lectura única.'}
          </p>
          <p style={{ fontSize: '13px', color: t.text.tertiary }}>
            {experienceBooks.length} libros
          </p>
        </div>
        
        {/* Grid de libros */}
        <div style={{ padding: '24px', maxHeight: '55vh', overflowY: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px'
          }}>
            {experienceBooks.map(book => {
              const authors = (book.a || []).slice(0, 1);
              
              return (
                <div key={book.id} onClick={() => onBookClick(book)} style={{ cursor: 'pointer' }}>
                  <div style={{
                    aspectRatio: '2/3',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${t.border.default}`,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                    marginBottom: '8px',
                    background: t.bg.elevated
                  }}>
                    <img 
                      src={`/portadas/${book.id}.jpg`}
                      alt={book.t}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: t.text.primary,
                    lineHeight: 1.2,
                    marginBottom: '2px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {book.t}
                  </p>
                  {authors[0] && (
                    <button
                      type="button"
                      aria-label={`Abrir autor ${authors[0]}`}
                      onClick={(e) => { e.stopPropagation(); onAuthorClick?.(authors[0]); }}
                      style={{
                        font: 'inherit',
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '11px',
                        color: t.text.tertiary,
                        cursor: 'pointer'
                      }}
                    >
                      {authors[0]}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Wizard - Sistema de Recomendación Inteligente
// =============================================================================

// Estructura de preguntas ramificadas
const WIZARD_QUESTIONS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEL 1: La Puerta de Entrada
  // ═══════════════════════════════════════════════════════════════════════════
  root: {
    key: 'root',
    question: '¿Qué quieres que te dé este libro?',
    hint: 'La pregunta fundamental',
    options: [
      { id: 'feel', icon: '💔', label: 'Sentir', desc: 'Una experiencia emocional', next: 'feel_type' },
      { id: 'travel', icon: '🌍', label: 'Viajar', desc: 'Transportarme a otro lugar o tiempo', next: 'travel_where' },
      { id: 'think', icon: '🧠', label: 'Pensar', desc: 'Reflexionar profundamente', next: 'think_about' },
      { id: 'tension', icon: '⚡', label: 'Tensión', desc: 'Adrenalina, no poder soltarlo', next: 'tension_type' },
      { id: 'discover', icon: '✨', label: 'Descubrir', desc: 'Algo que me sorprenda', next: 'discover_type' },
      { id: 'laugh', icon: '🎭', label: 'Reír', desc: 'Pasarlo bien, divertirme', next: 'laugh_type' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: SENTIR 💔
  // ═══════════════════════════════════════════════════════════════════════════
  feel_type: {
    key: 'feel_type',
    question: '¿Qué tipo de impacto emocional buscas?',
    hint: 'Sé sincero contigo mismo',
    options: [
      { id: 'devastate', icon: '💀', label: 'Devastarme', desc: 'Que me destruya (de la mejor manera)', 
        experiences: ['devastador', 'desgarrador', 'brutal'], next: 'devastate_through' },
      { id: 'move', icon: '🥺', label: 'Conmoverme', desc: 'Que toque mi corazón', 
        experiences: ['conmovedor', 'melancólico', 'íntimo'], next: 'move_how' },
      { id: 'disturb', icon: '😰', label: 'Inquietarme', desc: 'Que me perturbe y me haga pensar', 
        experiences: ['perturbador', 'inquietante', 'sombrío'], next: 'disturb_how' },
      { id: 'awe', icon: '✨', label: 'Maravillarme', desc: 'Sentir asombro y admiración', 
        experiences: ['épico', 'onírico', 'monumental'], next: 'awe_how' }
    ]
  },

  devastate_through: {
    key: 'devastate_through',
    question: '¿A través de qué quieres ser devastado?',
    hint: 'El vehículo del impacto',
    options: [
      { id: 'tragic_love', icon: '💔', label: 'Amor trágico', desc: 'Amor que destruye o se pierde',
        themes: ['amor', 'pérdida', 'traición'], experiences: ['desgarrador', 'devastador'], next: 'time_commitment' },
      { id: 'broken_family', icon: '👨‍👩‍👧', label: 'Familia rota', desc: 'Disfunción, trauma familiar',
        themes: ['familia', 'trauma', 'padre', 'madre', 'infancia'], experiences: ['devastador'], next: 'time_commitment' },
      { id: 'war_violence', icon: '⚔️', label: 'Guerra y violencia', desc: 'La humanidad en su peor momento',
        themes: ['guerra', 'violencia', 'supervivencia'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'death_loss', icon: '💀', label: 'Muerte y pérdida', desc: 'El duelo, la ausencia',
        themes: ['muerte', 'duelo', 'pérdida', 'vejez'], experiences: ['devastador', 'elegíaco'], next: 'time_commitment' }
    ]
  },

  move_how: {
    key: 'move_how',
    question: '¿Qué tipo de historia te conmueve?',
    hint: 'Lo que toca tu corazón',
    options: [
      { id: 'love_story', icon: '💕', label: 'Historias de amor', desc: 'Romance, conexión',
        themes: ['amor', 'matrimonio'], experiences: ['conmovedor', 'romántico'], moods: ['emotivo'], next: 'time_commitment' },
      { id: 'coming_of_age', icon: '🌱', label: 'Crecer', desc: 'Juventud, descubrimiento',
        themes: ['juventud', 'infancia', 'identidad'], experiences: ['nostálgico', 'agridulce'], next: 'time_commitment' },
      { id: 'friendship', icon: '🤝', label: 'Amistad', desc: 'Vínculos que perduran',
        themes: ['amistad', 'lealtad'], experiences: ['conmovedor', 'íntimo'], next: 'time_commitment' },
      { id: 'redemption', icon: '🌅', label: 'Redención', desc: 'Segundas oportunidades',
        themes: ['redención', 'perdón', 'cambio'], experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' }
    ]
  },

  disturb_how: {
    key: 'disturb_how',
    question: '¿Qué tipo de inquietud buscas?',
    hint: 'Lo que te quita el sueño',
    options: [
      { id: 'psychological', icon: '🧠', label: 'Psicológica', desc: 'La mente bajo presión',
        themes: ['obsesión', 'locura', 'culpa'], vibes: ['psicológico'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'existential', icon: '🕳️', label: 'Existencial', desc: 'Preguntas sin respuesta',
        themes: ['identidad', 'vacío', 'alienación'], experiences: ['perturbador', 'sombrío'], next: 'time_commitment' },
      { id: 'social', icon: '👁️', label: 'Social', desc: 'Lo que está mal en la sociedad',
        themes: ['poder', 'violencia', 'injusticia'], experiences: ['perturbador', 'brutal'], next: 'time_commitment' },
      { id: 'uncanny', icon: '💻', label: 'Lo extraño', desc: 'Algo no está bien aquí',
        experiences: ['inquietante', 'onírico'], moods: ['inquietante', 'oscuro'], next: 'time_commitment' }
    ]
  },

  awe_how: {
    key: 'awe_how',
    question: '¿Qué te maravilla?',
    hint: 'Lo sublime',
    options: [
      { id: 'epic_scale', icon: '🏔️', label: 'Escala épica', desc: 'Historias monumentales',
        experiences: ['épico', 'monumental'], themes: ['historia', 'poder'], next: 'time_commitment' },
      { id: 'beautiful_prose', icon: '✍️', label: 'Prosa hermosa', desc: 'El lenguaje como arte',
        experiences: ['elegíaco', 'poético'], moods: ['reflexivo'], next: 'time_commitment' },
      { id: 'imagination', icon: '🌙', label: 'La imaginación', desc: 'Mundos imposibles',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'human_spirit', icon: '🔥', label: 'El espíritu humano', desc: 'Triunfo contra todo',
        themes: ['supervivencia', 'libertad', 'esperanza'], experiences: ['épico', 'luminoso'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: VIAJAR 🌍
  // ═══════════════════════════════════════════════════════════════════════════
  travel_where: {
    key: 'travel_where',
    question: '¿A dónde quieres ir?',
    hint: 'Tu destino literario',
    options: [
      { id: 'past', icon: '🏛️', label: 'Al pasado', desc: 'Vivir otra época', 
        vibes: ['histórico'], next: 'past_when' },
      { id: 'impossible', icon: '🚀', label: 'A lo imposible', desc: 'Mundos que no existen', 
        vibes: ['fantasía', 'ciencia ficción', 'especulativo'], next: 'impossible_type' },
      { id: 'dark_places', icon: '🌑', label: 'A lo oscuro', desc: 'Callejones, crímenes, secretos', 
        vibes: ['noir', 'policial', 'intriga'], moods: ['tenso', 'oscuro'], next: 'dark_type' },
      { id: 'faraway', icon: '🗺️', label: 'A tierras lejanas', desc: 'Culturas, lugares exóticos', 
        themes: ['viaje', 'aventura'], next: 'faraway_where' }
    ]
  },

  past_when: {
    key: 'past_when',
    question: '¿Qué época te atrae?',
    hint: 'El tiempo es relativo',
    options: [
      { id: 'ancient', icon: '🏛️', label: 'Antigüedad', desc: 'Grecia, Roma, antes del 500',
        keywords: ['griego', 'romano', 'antiguo', 'imperio', 'mitología'], next: 'historical_fiction' },
      { id: 'medieval', icon: '⚔️', label: 'Medieval', desc: 'Reyes, caballeros, castillos',
        keywords: ['medieval', 'rey', 'castillo', 'caballero'], next: 'historical_fiction' },
      { id: 'century_19', icon: '🎩', label: 'Siglo XIX', desc: 'Victoriano, revoluciones',
        keywords: ['victoriano', 'siglo xix', 'revolución', 'napoleón'], next: 'historical_fiction' },
      { id: 'world_wars', icon: '💣', label: 'Guerras Mundiales', desc: '1914-1945',
        keywords: ['guerra mundial', 'nazi', 'trinchera', 'holocaust'], themes: ['guerra'], next: 'war_focus' },
      { id: 'recent_past', icon: '📺', label: 'Siglo XX tardío', desc: 'Guerra Fría, 60s-90s',
        keywords: ['guerra fría', '60s', '70s', '80s'], next: 'historical_fiction' }
    ]
  },

  war_focus: {
    key: 'war_focus',
    question: '¿Qué aspecto de la guerra?',
    hint: 'La guerra tiene muchas caras',
    options: [
      { id: 'soldiers', icon: '🪖', label: 'Los soldados', desc: 'En el frente, las trincheras',
        themes: ['guerra', 'soldado', 'muerte'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'civilians', icon: '👨‍👩‍👧', label: 'Los civiles', desc: 'Vivir bajo la guerra',
        themes: ['guerra', 'familia', 'supervivencia'], experiences: ['devastador', 'conmovedor'], next: 'time_commitment' },
      { id: 'resistance', icon: '✊', label: 'La resistencia', desc: 'Luchar desde las sombras',
        themes: ['guerra', 'resistencia', 'libertad'], experiences: ['tenso', 'épico'], next: 'time_commitment' },
      { id: 'aftermath', icon: '🕊️', label: 'Las secuelas', desc: 'Después de que todo termina',
        themes: ['guerra', 'trauma', 'memoria'], experiences: ['melancólico', 'devastador'], next: 'time_commitment' }
    ]
  },

  historical_fiction: {
    key: 'historical_fiction',
    question: '¿Ficción o hechos reales?',
    hint: 'Historia y literatura',
    options: [
      { id: 'fiction', icon: '📖', label: 'Novela histórica', desc: 'Ficción ambientada en la época',
        vibes: ['ficción', 'histórico'], next: 'time_commitment' },
      { id: 'nonfiction', icon: '📚', label: 'Historia real', desc: 'Hechos documentados',
        vibes: ['historia', 'crónica', 'memorias'], next: 'time_commitment' }
    ]
  },

  impossible_type: {
    key: 'impossible_type',
    question: '¿Qué tipo de imposible?',
    hint: 'Los límites de la realidad',
    options: [
      { id: 'epic_fantasy', icon: '⚔️', label: 'Fantasía épica', desc: 'Guerras, reinos, magia',
        vibes: ['fantasía'], experiences: ['épico', 'monumental'], next: 'time_commitment' },
      { id: 'scifi', icon: '🚀', label: 'Ciencia ficción', desc: 'Futuros, tecnología, espacio',
        vibes: ['ciencia ficción'], moods: ['especulativo'], next: 'time_commitment' },
      { id: 'magical_realism', icon: '🌙', label: 'Realismo mágico', desc: 'Lo mágico en lo cotidiano',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'weird', icon: '👁️', label: 'Lo extraño', desc: 'Inclasificable, perturbador',
        experiences: ['inquietante', 'onírico'], vibes: ['especulativo'], next: 'time_commitment' }
    ]
  },

  dark_type: {
    key: 'dark_type',
    question: '¿Qué tipo de oscuridad?',
    hint: 'Las sombras tienen matices',
    options: [
      { id: 'noir_classic', icon: '🕵️', label: 'Noir clásico', desc: 'Detectives, femme fatales',
        vibes: ['noir', 'policial'], themes: ['detective', 'crimen'], next: 'time_commitment' },
      { id: 'psychological_thriller', icon: '🧠', label: 'Thriller psicológico', desc: 'La mente es el campo de batalla',
        vibes: ['psicológico', 'intriga'], experiences: ['perturbador', 'tenso'], next: 'time_commitment' },
      { id: 'crime', icon: '🔪', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'asesinato', 'misterio'], moods: ['tenso'], next: 'time_commitment' },
      { id: 'gothic', icon: '🏚️', label: 'Gótico', desc: 'Casas encantadas, secretos familiares',
        vibes: ['oscuro'], moods: ['inquietante'], themes: ['secreto', 'familia'], next: 'time_commitment' }
    ]
  },

  faraway_where: {
    key: 'faraway_where',
    question: '¿Qué región del mundo?',
    hint: 'El mapa literario',
    options: [
      { id: 'americas', icon: '🌎', label: 'Las Américas', desc: 'Del Norte al Sur',
        themes: ['América'], next: 'americas_where' },
      { id: 'europe', icon: '🇪🇺', label: 'Europa', desc: 'El viejo continente',
        next: 'europe_where' },
      { id: 'asia', icon: '🌏', label: 'Asia', desc: 'Oriente',
        themes: ['Japón', 'China', 'India'], next: 'time_commitment' },
      { id: 'other', icon: '🌍', label: 'África y más', desc: 'Otros mundos',
        themes: ['África', 'viaje'], next: 'time_commitment' }
    ]
  },

  americas_where: {
    key: 'americas_where',
    question: '¿Qué parte de las Américas?',
    options: [
      { id: 'usa', icon: '🇺🇸', label: 'Estados Unidos', themes: ['América', 'Nueva York'], next: 'usa_where' },
      { id: 'latam', icon: '🌴', label: 'Latinoamérica', themes: ['México', 'Argentina', 'Colombia'], next: 'time_commitment' },
      { id: 'caribbean', icon: '🏝️', label: 'Caribe', themes: ['Caribe', 'isla'], next: 'time_commitment' }
    ]
  },

  usa_where: {
    key: 'usa_where',
    question: '¿Qué Estados Unidos?',
    options: [
      { id: 'deep_south', icon: '🏚️', label: 'El Sur profundo', desc: 'Mississippi, Alabama...',
        themes: ['América', 'sur'], keywords: ['sur', 'mississippi'], next: 'time_commitment' },
      { id: 'new_york', icon: '🗽', label: 'Nueva York', desc: 'La gran ciudad',
        themes: ['Nueva York', 'ciudad'], next: 'time_commitment' },
      { id: 'west', icon: '🤠', label: 'El Oeste', desc: 'Fronteras, desiertos',
        themes: ['oeste', 'frontera'], vibes: ['aventura'], next: 'time_commitment' },
      { id: 'small_town', icon: '🏘️', label: 'América profunda', desc: 'Pueblos, suburbios',
        themes: ['América', 'pueblo'], next: 'time_commitment' }
    ]
  },

  europe_where: {
    key: 'europe_where',
    question: '¿Qué parte de Europa?',
    options: [
      { id: 'spain', icon: '🇪🇸', label: 'España', themes: ['España'], next: 'time_commitment' },
      { id: 'france', icon: '🇫🇷', label: 'Francia', themes: ['Francia', 'París'], next: 'time_commitment' },
      { id: 'uk', icon: '🇬🇧', label: 'Reino Unido', themes: ['Inglaterra', 'Londres'], next: 'time_commitment' },
      { id: 'russia', icon: '🇷🇺', label: 'Rusia', themes: ['Rusia'], next: 'time_commitment' },
      { id: 'italy', icon: '🇮🇹', label: 'Italia', themes: ['Italia', 'Roma'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: PENSAR 🧠
  // ═══════════════════════════════════════════════════════════════════════════
  think_about: {
    key: 'think_about',
    question: '¿Sobre qué quieres reflexionar?',
    hint: 'Las grandes preguntas',
    options: [
      { id: 'existence', icon: '🌌', label: 'La existencia', desc: 'Vida, muerte, tiempo',
        themes: ['muerte', 'vida', 'tiempo', 'identidad', 'memoria', 'soledad'], next: 'existence_focus' },
      { id: 'relationships', icon: '👥', label: 'Las relaciones', desc: 'Amor, familia, amistad',
        themes: ['amor', 'familia', 'amistad'], next: 'relationship_focus' },
      { id: 'society', icon: '⚖️', label: 'La sociedad', desc: 'Poder, justicia, violencia',
        themes: ['poder', 'política', 'libertad', 'violencia'], next: 'society_focus' },
      { id: 'art_creation', icon: '🎨', label: 'El arte', desc: 'Creación, verdad, belleza',
        themes: ['arte', 'escritura', 'música', 'creación'], next: 'time_commitment' }
    ]
  },

  existence_focus: {
    key: 'existence_focus',
    question: '¿Qué aspecto de la existencia?',
    options: [
      { id: 'identity', icon: '🪞', label: 'Quién soy', desc: 'Identidad, autenticidad',
        themes: ['identidad', 'búsqueda'], next: 'time_commitment' },
      { id: 'mortality', icon: '⏳', label: 'La mortalidad', desc: 'Muerte, tiempo, finitud',
        themes: ['muerte', 'tiempo', 'vejez'], next: 'time_commitment' },
      { id: 'memory', icon: '🧠', label: 'La memoria', desc: 'Pasado, recuerdos, olvido',
        themes: ['memoria', 'pasado', 'nostalgia'], experiences: ['nostálgico', 'melancólico'], next: 'time_commitment' },
      { id: 'loneliness', icon: '🌙', label: 'La soledad', desc: 'Aislamiento, conexión',
        themes: ['soledad', 'alienación'], experiences: ['melancólico', 'íntimo'], next: 'time_commitment' }
    ]
  },

  relationship_focus: {
    key: 'relationship_focus',
    question: '¿Qué tipo de relación?',
    options: [
      { id: 'romantic', icon: '💕', label: 'Amor romántico', themes: ['amor', 'matrimonio'], next: 'love_ending' },
      { id: 'family', icon: '👨‍👩‍👧', label: 'Familia', themes: ['familia', 'padre', 'madre', 'infancia'], next: 'time_commitment' },
      { id: 'friendship', icon: '🤝', label: 'Amistad', themes: ['amistad'], next: 'time_commitment' },
      { id: 'marriage', icon: '👍', label: 'Matrimonio', desc: 'El día a día del amor',
        themes: ['matrimonio', 'pareja'], next: 'time_commitment' }
    ]
  },

  love_ending: {
    key: 'love_ending',
    question: '¿Cómo prefieres que termine?',
    hint: 'Spoiler controlado',
    options: [
      { id: 'happy', icon: '💕', label: 'Bien', desc: 'Final feliz',
        experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' },
      { id: 'tragic', icon: '💔', label: 'Mal', desc: 'Tragedia, pérdida',
        themes: ['pérdida'], experiences: ['devastador', 'desgarrador'], next: 'time_commitment' },
      { id: 'ambiguous', icon: '❓', label: 'Ambiguo', desc: 'Abierto a interpretación',
        next: 'time_commitment' }
    ]
  },

  society_focus: {
    key: 'society_focus',
    question: '¿Qué aspecto de la sociedad?',
    options: [
      { id: 'power', icon: '👑', label: 'El poder', desc: 'Quién manda y por qué',
        themes: ['poder', 'política'], next: 'time_commitment' },
      { id: 'justice', icon: '⚖️', label: 'La justicia', desc: 'Lo correcto, el sistema',
        themes: ['justicia', 'ley', 'crimen'], next: 'time_commitment' },
      { id: 'violence', icon: '👥', label: 'La violencia', desc: 'Por qué nos destruimos',
        themes: ['violencia', 'guerra'], experiences: ['brutal', 'perturbador'], next: 'time_commitment' },
      { id: 'freedom', icon: '🕊️', label: 'La libertad', desc: 'Opresión y liberación',
        themes: ['libertad', 'revolución', 'resistencia'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: TENSIÓN ⚡
  // ═══════════════════════════════════════════════════════════════════════════
  tension_type: {
    key: 'tension_type',
    question: '¿Qué tipo de tensión?',
    hint: 'Tu dosis de adrenalina',
    options: [
      { id: 'crime', icon: '🔪', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'detective', 'misterio'], moods: ['tenso'], next: 'crime_focus' },
      { id: 'horror', icon: '😱', label: 'Terror', desc: 'Miedo genuino',
        experiences: ['aterrador', 'inquietante'], moods: ['oscuro', 'inquietante'], next: 'horror_type' },
      { id: 'psychological', icon: '🧠', label: 'Psicológica', desc: 'La mente bajo presión',
        vibes: ['psicológico'], themes: ['obsesión', 'locura', 'culpa'], next: 'time_commitment' },
      { id: 'action', icon: '🎢', label: 'Vertiginosa', desc: 'Ritmo imparable',
        experiences: ['vertiginoso', 'absorbente', 'tenso'], vibes: ['aventura'], next: 'time_commitment' }
    ]
  },

  crime_focus: {
    key: 'crime_focus',
    question: '¿Qué te atrae del crimen?',
    options: [
      { id: 'detective', icon: '🔍', label: 'El detective', desc: 'Seguir la investigación',
        themes: ['detective'], vibes: ['policial'], next: 'time_commitment' },
      { id: 'criminal_mind', icon: '🎭', label: 'El criminal', desc: 'Entender la mente oscura',
        themes: ['psicópata', 'obsesión'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'noir', icon: '🌃', label: 'Atmósfera noir', desc: 'La ciudad, las sombras',
        vibes: ['noir'], moods: ['oscuro', 'tenso'], next: 'time_commitment' },
      { id: 'procedural', icon: '📋', label: 'Procedimiento', desc: 'El sistema, la ley',
        themes: ['justicia', 'policía'], next: 'time_commitment' }
    ]
  },

  horror_type: {
    key: 'horror_type',
    question: '¿Qué tipo de terror?',
    options: [
      { id: 'supernatural', icon: '💻', label: 'Sobrenatural', desc: 'Fantasmas, demonios',
        moods: ['oscuro', 'inquietante'], next: 'time_commitment' },
      { id: 'psychological_horror', icon: '🧠', label: 'Psicológico', desc: 'El horror en la mente',
        vibes: ['psicológico'], experiences: ['perturbador', 'inquietante'], next: 'time_commitment' },
      { id: 'cosmic', icon: '🌌', label: 'Cósmico', desc: 'Lo incomprensible, Lovecraft',
        experiences: ['aterrador', 'onírico'], next: 'time_commitment' },
      { id: 'human_horror', icon: '🔪', label: 'El horror humano', desc: 'Lo que somos capaces de hacer',
        experiences: ['brutal', 'perturbador'], themes: ['violencia'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: DESCUBRIR ✨
  // ═══════════════════════════════════════════════════════════════════════════
  discover_type: {
    key: 'discover_type',
    question: '¿Qué tipo de descubrimiento?',
    hint: 'La aventura de lo nuevo',
    options: [
      { id: 'hidden_gems', icon: '💎', label: 'Joyas ocultas', desc: 'Libros que nadie conoce',
        filter: { noAwards: true, lowProfile: true }, next: 'hidden_gem_type' },
      { id: 'classics', icon: '🏆', label: 'Clásicos pendientes', desc: 'Los que todos conocen menos yo',
        filter: { hasAwards: true, canonical: true }, next: 'classic_type' },
      { id: 'new_voices', icon: '🌱', label: 'Voces nuevas', desc: 'Autores contemporáneos',
        filter: { contemporary: true }, next: 'time_commitment' },
      { id: 'total_random', icon: '🎲', label: 'Sorpresa total', desc: 'No me des opciones, elige tú',
        algorithm: 'random_quality', direct: true }
    ]
  },

  hidden_gem_type: {
    key: 'hidden_gem_type',
    question: '¿De qué tipo?',
    hint: 'Joyas por descubrir',
    options: [
      { id: 'emotional', icon: '💔', label: 'Emocionales', experiences: ['conmovedor', 'devastador', 'íntimo'], next: 'time_commitment' },
      { id: 'thrilling', icon: '⚡', label: 'Trepidantes', experiences: ['tenso', 'absorbente', 'vertiginoso'], next: 'time_commitment' },
      { id: 'thoughtful', icon: '🧠', label: 'Reflexivas', experiences: ['contemplativo', 'filosófico'], next: 'time_commitment' },
      { id: 'any_gem', icon: '✨', label: 'Lo que sea', next: 'time_commitment' }
    ]
  },

  classic_type: {
    key: 'classic_type',
    question: '¿Qué tipo de clásico?',
    options: [
      { id: 'nobel', icon: '🏅', label: 'Premios Nobel', filter: { award: 'Nobel de Literatura' }, next: 'time_commitment' },
      { id: 'spanish', icon: '🇪🇸', label: 'Clásicos en español', filter: { award: 'Premio hispano importante' }, next: 'time_commitment' },
      { id: 'american', icon: '🇺🇸', label: 'Clásicos americanos', filter: { award: 'Pulitzer' }, next: 'time_commitment' },
      { id: 'any_classic', icon: '📚', label: 'Cualquier clásico', next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: REÍR 🎭
  // ═══════════════════════════════════════════════════════════════════════════
  laugh_type: {
    key: 'laugh_type',
    question: '¿Qué tipo de humor?',
    hint: 'Hay muchas formas de reír',
    options: [
      { id: 'sardonic', icon: '😏', label: 'Sardónico', desc: 'Ironía mordaz',
        experiences: ['sardónico', 'irónico'], vibes: ['satírico'], next: 'time_commitment' },
      { id: 'light', icon: '😄', label: 'Ligero', desc: 'Simple diversión',
        moods: ['ligero', 'entretenido'], vibes: ['humor'], next: 'time_commitment' },
      { id: 'absurd', icon: '🤪', label: 'Absurdo', desc: 'Lo ridículo de la vida',
        experiences: ['sardónico', 'agridulce'], next: 'time_commitment' },
      { id: 'bittersweet', icon: '🏋', label: 'Agridulce', desc: 'Ríe mientras llora',
        experiences: ['agridulce'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREGUNTAS UNIVERSALES (NIVEL FINAL)
  // ═══════════════════════════════════════════════════════════════════════════
  time_commitment: {
    key: 'time_commitment',
    question: '¿Cuánto tiempo puedes dedicar?',
    hint: 'Para las próximas semanas',
    options: [
      { id: 'afternoon', icon: '☕', label: 'Una tarde', desc: 'Menos de 150 páginas',
        pages: { max: 150 }, difficulty: ['ligero'], next: 'series_preference' },
      { id: 'weekend', icon: '🌙', label: 'Un fin de semana', desc: '150-300 páginas',
        pages: { min: 100, max: 300 }, difficulty: ['ligero', 'medio'], next: 'series_preference' },
      { id: 'weeks', icon: '📅', label: 'Unas semanas', desc: '300-500 páginas',
        pages: { min: 250, max: 500 }, next: 'series_preference' },
      { id: 'project', icon: '🏔️', label: 'Un proyecto', desc: 'Más de 500 páginas',
        pages: { min: 450 }, next: 'series_preference' }
    ]
  },

  series_preference: {
    key: 'series_preference',
    question: '¿Serie o libro único?',
    hint: '¿Quieres compromiso a largo plazo?',
    options: [
      { id: 'standalone', icon: '📖', label: 'Libro único', desc: 'Empieza y termina',
        standalone: true, next: 'difficulty_preference' },
      { id: 'series', icon: '📚', label: 'Parte de una serie', desc: 'Me gusta cuando hay más',
        wantsSeries: true, next: 'difficulty_preference' },
      { id: 'either', icon: '🎲', label: 'Me da igual', next: 'difficulty_preference' }
    ]
  },

  difficulty_preference: {
    key: 'difficulty_preference',
    question: '¿Qué nivel de desafío?',
    hint: 'Tu zona de confort literaria',
    options: [
      { id: 'easy', icon: '🌿', label: 'Lectura fluida', desc: 'Que fluya sin esfuerzo',
        difficulty: ['ligero'], moods: ['entretenido', 'ligero'], next: 'risk_preference' },
      { id: 'medium', icon: '⚖️', label: 'Equilibrado', desc: 'Ni muy fácil ni muy difícil',
        difficulty: ['medio'], next: 'risk_preference' },
      { id: 'challenging', icon: '🧗', label: 'Desafiante', desc: 'Quiero que me exija',
        difficulty: ['denso'], vibes: ['filosófico'], next: 'risk_preference' }
    ]
  },

  risk_preference: {
    key: 'risk_preference',
    question: '¿Cuánto quieres arriesgarte?',
    hint: 'La última pregunta',
    options: [
      { id: 'safe', icon: '🏠', label: 'Zona segura', desc: 'Algo que probablemente me guste',
        riskLevel: 'safe', boost: { awards: true, known: true } },
      { id: 'curious', icon: '🔍', label: 'Curioso', desc: 'Abierto a sorpresas',
        riskLevel: 'balanced' },
      { id: 'adventurous', icon: '🎲', label: 'Aventurero', desc: 'Territorio desconocido',
        riskLevel: 'adventurous', boost: { unknown: true, noAwards: true } }
    ]
  }
};

const Wizard = ({ books, hooks, onSelect, onClose, theme }) => {
  // Estado del wizard
  const [path, setPath] = useState(['root']); // Camino de preguntas
  const [answers, setAnswers] = useState({}); // Respuestas por pregunta
  const [preferences, setPreferences] = useState({}); // Preferencias acumuladas
  const [result, setResult] = useState(null);
  const [resultIndex, setResultIndex] = useState(0);
  
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  // Pregunta actual basada en el path
  const currentQuestionKey = path[path.length - 1];
  const currentQuestion = WIZARD_QUESTIONS[currentQuestionKey];
  const isComplete = !currentQuestion || currentQuestion.key === 'risk_preference' && answers[currentQuestion.key];
  
  // Contar preguntas respondidas
  const questionsAnswered = Object.keys(answers).length;
  const estimatedTotal = Math.min(8, questionsAnswered + 3); // Estimación dinámica
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE SCORING NUEVO
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateScore = useCallback((book) => {
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
    
    const matchDetails = {
      themes: [],
      experiences: false,
      vibes: [],
      moods: false,
      pages: false,
      difficulty: false,
      series: false,
      awards: false,
      hook: !!bookHook
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // MATCH DIRECTO (0-120 puntos) - LO MÁS IMPORTANTE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Themes que eligió el usuario (hasta 75 pts)
    const userThemes = preferences.themes || [];
    const themeMatches = bookThemes.filter(t => userThemes.includes(t));
    if (themeMatches.length > 0) {
      score += themeMatches.length * 25;
      matchDetails.themes = themeMatches;
    }
    
    // Experience (hasta 40 pts)
    const userExperiences = preferences.experiences || [];
    if (bookExperience && userExperiences.includes(bookExperience)) {
      score += 40;
      matchDetails.experiences = true;
    }
    
    // Vibes/género (hasta 45 pts)
    const userVibes = preferences.vibes || [];
    const vibeMatches = bookVibes.filter(v => userVibes.includes(v));
    if (vibeMatches.length > 0) {
      score += vibeMatches.length * 15;
      matchDetails.vibes = vibeMatches;
    }
    
    // Mood del libro (20 pts)
    const userMoods = preferences.moods || [];
    if (bookMood && userMoods.includes(bookMood)) {
      score += 20;
      matchDetails.moods = true;
    }
    
    // Keywords en synopsis (bonus de 15 pts)
    const keywords = preferences.keywords || [];
    if (keywords.length > 0 && book.syn) {
      const synLower = book.syn.toLowerCase();
      const keywordMatch = keywords.some(kw => synLower.includes(kw.toLowerCase()));
      if (keywordMatch) score += 15;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FILTROS DUROS (Penalización o Descalificación)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Páginas
    const pagePrefs = preferences.pages;
    if (pagePrefs) {
      const maxPages = pagePrefs.max || 9999;
      const minPages = pagePrefs.min || 0;
      
      if (pages > maxPages) {
        score -= 60; // Penalización fuerte por exceder
      } else if (pages < minPages) {
        score -= 40; // Penalización por ser muy corto
      } else {
        score += 15; // Bonus por encajar
        matchDetails.pages = true;
      }
    }
    
    // Dificultad
    const diffPrefs = preferences.difficulty;
    if (diffPrefs && diffPrefs.length > 0) {
      if (diffPrefs.includes(difficulty)) {
        score += 15;
        matchDetails.difficulty = true;
      } else {
        score -= 35;
      }
    }
    
    // Serie vs Standalone
    if (preferences.standalone === true && hasSeries) {
      score -= 100; // Descalificar si quiere standalone y es serie
    }
    if (preferences.wantsSeries === true && !hasSeries) {
      score -= 25; // Penalizar si quiere serie y no es
    }
    if (preferences.wantsSeries === true && hasSeries) {
      score += 10;
      matchDetails.series = true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CALIDAD (Reducido: 0-15 puntos máximo)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Hook disponible (ahora vale menos)
    if (bookHook) {
      score += 5;
    }
    
    // Premios (valen menos, pero bonus si el usuario eligió "zona segura")
    if (awards.length > 0) {
      matchDetails.awards = true;
      if (preferences.riskLevel === 'safe') {
        score += 15; // Bonus si quiere zona segura
      } else {
        score += 3; // Mínimo
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FACTOR DESCUBRIMIENTO (0-25 puntos)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (preferences.riskLevel === 'adventurous') {
      // Boost a libros sin premio
      if (awards.length === 0) score += 15;
      // Boost a libros sin hook (menos conocidos)
      if (!bookHook) score += 10;
    }
    
    // Filtros especiales para descubrimiento
    if (preferences.filter) {
      if (preferences.filter.noAwards && awards.length === 0) score += 20;
      if (preferences.filter.hasAwards && awards.length > 0) score += 20;
      if (preferences.filter.award && awards.includes(preferences.filter.award)) score += 25;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ALEATORIEDAD CONTROLADA (0-20 puntos)
    // ═══════════════════════════════════════════════════════════════════════
    
    score += Math.random() * 20;
    
    return { score: Math.max(0, score), matchDetails };
  }, [hooks, preferences]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OBTENER RECOMENDACIONES CON POOL DIVERSIFICADO
  // ═══════════════════════════════════════════════════════════════════════════
  const getRecommendations = useCallback(() => {
    // Calcular score para todos los libros
    const scored = books.map(book => {
      const { score, matchDetails } = calculateScore(book);
      return { book, score, matchDetails };
    });
    
    // Ordenar por score
    scored.sort((a, b) => b.score - a.score);
    
    // Filtrar los que tienen score muy negativo
    const valid = scored.filter(s => s.score > 0);
    
    if (valid.length === 0) {
      // Si no hay válidos, tomar los mejores de todos modos
      return scored.slice(0, 8);
    }
    
    // Pool diversificado
    const pickRandom = (arr, count) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };
    
    // Tier 1: Top 3 matches (de los 10 mejores)
    const tier1Pool = valid.slice(0, 10);
    const tier1 = pickRandom(tier1Pool, 3);
    
    // Tier 2: Buenos matches con sorpresa (posiciones 10-40)
    const tier2Pool = valid.slice(10, 40);
    const tier2 = tier2Pool.length > 0 ? pickRandom(tier2Pool, 3) : [];
    
    // Tier 3: Joyas ocultas (score > 40 pero fuera del top 40)
    const tier3Pool = valid.slice(40).filter(s => s.score > 40);
    const tier3 = tier3Pool.length > 0 ? pickRandom(tier3Pool, 2) : [];
    
    // Combinar y mezclar
    let result = [...tier1, ...tier2, ...tier3];
    result = result.sort(() => Math.random() - 0.5);
    
    // Asegurar que tenemos al menos 8
    while (result.length < 8 && valid.length > result.length) {
      const remaining = valid.filter(v => !result.some(r => r.book.id === v.book.id));
      if (remaining.length > 0) {
        result.push(remaining[0]);
      } else break;
    }
    
    return result.slice(0, 8);
  }, [books, calculateScore]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAR RAZÓN PERSONALIZADA
  // ═══════════════════════════════════════════════════════════════════════════
  const generateReason = useCallback((book, matchDetails) => {
    const bookHook = hooks[String(book.id)];
    const reasons = [];
    const whyMatches = [];
    
    // Razón principal: el hook
    if (bookHook?.hook) {
      reasons.push(bookHook.hook);
    }
    
    // Por qué encaja
    if (matchDetails.themes?.length > 0) {
      whyMatches.push(`Explora ${matchDetails.themes.slice(0, 2).join(' y ')}`);
    }
    if (matchDetails.experiences) {
      const expLabels = {
        devastador: 'te devastará',
        conmovedor: 'te conmoverá',
        perturbador: 'te inquietará',
        épico: 'es épico',
        monumental: 'es monumental',
        melancólico: 'tiene melancolía hermosa',
        sardónico: 'tiene ironía mordaz',
        tenso: 'te mantendrá en tensión'
      };
      const exp = bookHook?.experience;
      if (exp && expLabels[exp]) {
        whyMatches.push(expLabels[exp]);
      }
    }
    if (matchDetails.pages) {
      whyMatches.push('encaja con tu tiempo disponible');
    }
    
    return {
      main: reasons[0] || 'Este libro encaja con lo que buscas.',
      whyMatches: whyMatches.slice(0, 3),
      perfectFor: bookHook?.perfect_for,
      experience: bookHook?.experience,
      themes: bookHook?.themes?.slice(0, 4) || [],
      whyMatters: bookHook?.why_matters
    };
  }, [hooks]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MANEJAR SELECCIÓN DE OPCIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSelect = (option) => {
    haptic.medium();
    
    // Guardar respuesta
    const newAnswers = { ...answers, [currentQuestion.key]: option.id };
    setAnswers(newAnswers);
    
    // Acumular preferencias de esta opción
    const newPrefs = applyOptionToPreferences(preferences, option);
    setPreferences(newPrefs);
    
    // Si es sorpresa total, generar resultado inmediato
    if (option.direct || option.algorithm === 'random_quality') {
      const recs = getRecommendations();
      setResult(recs);
      setResultIndex(0);
      return;
    }
    
    // Determinar siguiente pregunta
    if (option.next) {
      setPath([...path, option.next]);
    } else {
      // Fin del wizard - generar resultados
      const recs = getRecommendations();
      setResult(recs);
      setResultIndex(0);
    }
  };
  
  // Volver atrás
  const handleBack = () => {
    if (path.length > 1) {
      const newPath = path.slice(0, -1);
      const lastKey = path[path.length - 1];
      
      // Remover respuesta y preferencias de la última pregunta
      const newAnswers = { ...answers };
      delete newAnswers[lastKey];
      setAnswers(newAnswers);
      
      const rebuiltPreferences = buildPreferencesFromAnswers(newAnswers, newPath, WIZARD_QUESTIONS);
      setPreferences(rebuiltPreferences);
      
      setPath(newPath);
    }
  };
  
  // Reiniciar
  const handleStartOver = () => {
    setPath(['root']);
    setAnswers({});
    setPreferences({});
    setResult(null);
    setResultIndex(0);
  };
  
  // Probar otro libro
  const handleTryAnother = () => {
    haptic.light();
    if (result && resultIndex < result.length - 1) {
      setResultIndex(resultIndex + 1);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Resultado
  // ═══════════════════════════════════════════════════════════════════════════
  if (result && result.length > 0) {
    const { book, matchDetails } = result[resultIndex];
    const bookHook = hooks[String(book.id)];
    const reason = generateReason(book, matchDetails);
    const coverUrl = `/portadas/${book.id}.jpg`;
    const pages = book.pg || 300;
    const hours = book.h || Math.round(pages / 40);
    const awards = book.aw || [];
    
    return (
      <div 
        onClick={onClose}
        role="presentation"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: t.overlay,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Resultado del wizard"
          style={{
            width: '100%', maxWidth: '440px',
            borderRadius: '14px',
            background: t.bg.primary,
            border: `1px solid ${t.border.default}`,
            boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
            animation: 'scaleIn 0.2s ease',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            background: t.bg.primary,
            borderBottom: `1px solid ${t.border.default}`,
            padding: '24px 24px 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: t.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tu próxima lectura
              </p>
              <button onClick={onClose} aria-label="Cerrar wizard" style={getModalCloseButtonStyle(t)}>✕</button>
            </div>
            
            {/* Portada y título */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ 
                width: '110px', height: '165px', flexShrink: 0,
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(0,0,0,0.25)'
              }}>
                <img src={coverUrl} alt={book.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ 
                  fontFamily: t.typography.display, fontSize: '22px', fontWeight: 600,
                  color: t.text.primary, marginBottom: '8px', lineHeight: 1.2
                }}>
                  {book.t}
                </h2>
                <p style={{ fontSize: '15px', color: t.accent, marginBottom: '12px' }}>
                  {(book.a || ['Desconocido']).join(', ')}
                </p>
                
                {/* Badges de premios */}
                {awards.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {awards.slice(0, 2).map((award, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '4px 8px',
                        background: `${t.accent}20`, color: t.accent,
                        borderRadius: '6px', fontWeight: 500
                      }}>
                        ★ {award.replace('Premio hispano importante', 'Premio literario')}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: t.text.secondary }}>
                  <span>{pages} pág</span>
                  <span>~{hours}h</span>
                  <span style={{ textTransform: 'capitalize' }}>{book.d || 'medio'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Por qué este libro */}
          <div style={{ padding: '0 24px 24px' }}>
            {/* Hook principal */}
            <div style={{ 
              background: t.bg.tertiary, 
              borderRadius: '14px', 
              padding: '16px',
              marginBottom: '16px',
              borderLeft: `3px solid ${t.accent}`
            }}>
              <p style={{ 
                fontSize: '15px', color: t.text.primary, 
                lineHeight: 1.5, fontStyle: 'italic'
              }}>
                "{reason.main}"
              </p>
            </div>
            
            {/* Por qué encaja */}
            {reason.whyMatches.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '8px', fontWeight: 600 }}>
                  POR QUÉ ENCAJA CONTIGO:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {reason.whyMatches.map((match, i) => (
                    <span key={i} style={{
                      fontSize: '13px', padding: '6px 12px',
                      background: t.bg.secondary,
                      borderRadius: '20px', color: t.text.secondary
                    }}>
                      ✔ {match}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Perfect for */}
            {reason.perfectFor && (
              <p style={{ fontSize: '13px', color: t.text.secondary, marginBottom: '16px' }}>
                <span style={{ color: t.accent }}>👤</span> Perfecto para: {reason.perfectFor}
              </p>
            )}
            
            {/* Temas */}
            {reason.themes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {reason.themes.map((theme, i) => (
                  <span key={i} style={{
                    fontSize: '12px', padding: '4px 10px',
                    background: t.border.subtle,
                    borderRadius: '12px', color: t.text.tertiary
                  }}>
                    {theme}
                  </span>
                ))}
              </div>
            )}
            
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { onSelect(book); haptic.success(); }}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '14px', border: 'none',
                  background: t.gradient?.accent || t.accent,
                  color: t.bg.primary,
                  fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${t.accent}40`
                }}
              >
                📖 Lo leo ahora
              </button>
              {resultIndex < result.length - 1 && (
                <button
                  onClick={handleTryAnother}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    border: `1px solid ${t.border.default}`,
                    background: 'transparent',
                    color: t.text.secondary,
                    fontSize: '15px', fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Otro →
                </button>
              )}
            </div>
            
            {/* Indicador de posición */}
            <div style={{ 
              display: 'flex', justifyContent: 'center', gap: '6px', 
              marginTop: '16px'
            }}>
              {result.slice(0, 8).map((_, i) => (
                <div key={i} style={{
                  width: i === resultIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === resultIndex ? t.accent : t.border.default,
                  transition: 'all 200ms ease'
                }} />
              ))}
            </div>
            
            {/* Empezar de nuevo */}
            <button
              onClick={handleStartOver}
              style={{
                width: '100%', marginTop: '16px',
                padding: '12px', background: 'none',
                border: 'none', color: t.text.tertiary,
                fontSize: '13px', cursor: 'pointer'
              }}
            >
              ← Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Preguntas
  // ═══════════════════════════════════════════════════════════════════════════
  if (!currentQuestion) return null;
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Preguntas del wizard"
        style={{
          width: '100%', maxWidth: '440px',
          borderRadius: '14px', padding: '24px',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {path.length > 1 ? (
            <button onClick={handleBack} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              ← Atrás
            </button>
          ) : <div />}
          <button onClick={onClose} aria-label="Cerrar wizard" style={getModalCloseButtonStyle(t)}>✕</button>
        </div>
        
        {/* Progress visual (camino recorrido) */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px' }}>
          {path.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '3px',
              borderRadius: '2px',
              background: i < path.length - 1 ? t.accent : `${t.accent}40`,
              transition: 'all 300ms ease'
            }} />
          ))}
          {/* Espacios para preguntas futuras estimadas */}
          {[...Array(Math.max(0, estimatedTotal - path.length))].map((_, i) => (
            <div key={`future-${i}`} style={{
              flex: 1, height: '3px',
              borderRadius: '2px',
              background: t.border.subtle
            }} />
          ))}
        </div>
        
        {/* Número de pregunta */}
        <p style={{ 
          fontSize: '12px', color: t.text.tertiary, 
          marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'
        }}>
          Pregunta {path.length}
        </p>
        
        {/* Pregunta */}
        <h2 style={{ 
          fontFamily: t.typography.display,
          fontSize: '24px', fontWeight: 600,
          color: t.text.primary,
          marginBottom: '8px',
          lineHeight: 1.3
        }}>
          {currentQuestion.question}
        </h2>
        
        {currentQuestion.hint && (
          <p style={{ 
            fontSize: '14px', color: t.text.tertiary, 
            marginBottom: '28px'
          }}>
            {currentQuestion.hint}
          </p>
        )}
        
        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQuestion.options.map(option => (
            <Touchable
              key={option.id}
              onClick={() => handleSelect(option)}
              scale={0.98}
              hapticType="light"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: answers[currentQuestion.key] === option.id 
                  ? `${t.accent}15` 
                  : t.bg.secondary,
                border: `1.5px solid ${answers[currentQuestion.key] === option.id ? t.accent : t.border.subtle}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '26px' }}>{option.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '16px', fontWeight: 600, 
                    color: t.text.primary, marginBottom: '2px'
                  }}>
                    {option.label}
                  </p>
                  {option.desc && (
                    <p style={{ fontSize: '13px', color: t.text.tertiary }}>
                      {option.desc}
                    </p>
                  )}
                </div>
                {answers[currentQuestion.key] === option.id && (
                  <span style={{ color: t.accent, fontSize: '18px' }}>✔</span>
                )}
              </div>
            </Touchable>
          ))}
        </div>
        
        {/* Nota al pie para la primera pregunta */}
        {path.length === 1 && (
          <p style={{ 
            fontSize: '12px', color: t.text.muted, 
            textAlign: 'center', marginTop: '24px'
          }}>
            Tus respuestas nos ayudan a encontrar el libro perfecto para ti
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: TodayMode (seleccion diaria guiada)
// =============================================================================
const TodayMode = ({ picks, onBookClick, onExit, theme, getListStatus }) => {
  const t = THEMES[theme];
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    []
  );

  if (!picks || picks.length === 0) {
    return (
      <section style={{ padding: '24px 0' }}>
        <div style={{
          borderRadius: '16px',
          border: `1px solid ${t.border.default}`,
          background: t.bg.secondary,
          padding: '24px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: t.text.secondary, marginBottom: '12px' }}>
            No hay recomendaciones disponibles para hoy.
          </p>
          <button
            onClick={onExit}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.tertiary,
              color: t.text.primary,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div style={{
        marginBottom: '20px',
        borderRadius: '18px',
        padding: '20px',
        background: `linear-gradient(135deg, ${t.accent}22, transparent)`,
        border: `1px solid ${t.border.default}`
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Seleccion diaria
            </p>
            <h2 style={{
              fontFamily: t.typography.display,
              fontSize: '28px',
              fontWeight: 600,
              color: t.text.primary,
              marginTop: '8px'
            }}>
              Que leer hoy
            </h2>
            <p style={{ fontSize: '14px', color: t.text.secondary, marginTop: '8px' }}>
              {todayLabel}
            </p>
          </div>
          <button
            onClick={onExit}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.secondary,
              color: t.text.secondary,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Salir de Hoy
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {picks.map((pick, index) => {
          const book = pick.book;
          const title = book.t || book.title || 'Sin titulo';
          const authors = book.a || book.authors || ['Desconocido'];
          const pages = book.pg || book.pages;
          const awards = (book.aw || book.awards || []).length;
          const listStatus = getListStatus?.(book.id);

          return (
            <article
              key={book.id}
              style={{
                borderRadius: '14px',
                border: `1px solid ${t.border.default}`,
                background: t.bg.secondary,
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <BookCover
                  book={book}
                  onClick={onBookClick}
                  theme={theme}
                  listStatus={listStatus}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: t.text.tertiary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Opcion {index + 1}
                  </p>
                  <h3 style={{ fontSize: '18px', color: t.text.primary, marginTop: '6px', lineHeight: 1.3 }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '13px', color: t.text.secondary, marginTop: '4px' }}>
                    {authors.join(', ')}
                  </p>
                  <p style={{ fontSize: '13px', color: t.text.secondary, marginTop: '10px', lineHeight: 1.45 }}>
                    {pick.reason}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {book.m && (
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: t.bg.tertiary,
                        color: t.text.tertiary
                      }}>
                        {book.m}
                      </span>
                    )}
                    {pages && (
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: t.bg.tertiary,
                        color: t.text.tertiary
                      }}>
                        {pages} pags
                      </span>
                    )}
                    {awards > 0 && (
                      <span style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: `${t.accent}22`,
                        color: t.accent
                      }}>
                        {awards} premio{awards > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onBookClick?.(book)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: t.accent,
                      color: t.bg.primary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

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
    Promise.all([
      fetch(BOOKS_URL).then(r => r.json()),
      fetch(AUTHORS_URL).then(r => r.json()).catch(() => ({})),
      fetch(COLLECTIONS_URL).then(r => r.json()).catch(() => []),
      fetch(HOOKS_URL).then(r => r.json()).catch(() => ({}))
    ]).then(([booksData, authorsJson, collectionsData, hooksData]) => {
      setBooks(booksData);
      setAuthorsData(authorsJson);
      setCollections(collectionsData);
      setHooks(hooksData);
      setLoading(false);
    }).catch(() => setLoading(false));
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
