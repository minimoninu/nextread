import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';

// =============================================================================
// CONFIGURACIÃ“N
// =============================================================================
const BOOKS_URL = '/biblioteca_app.json';
const AUTHORS_URL = '/authors.json';
const COLLECTIONS_URL = '/collections.json';
const HOOKS_URL = '/hooks.json';
const INITIAL_LOAD = 42;
const LOAD_MORE_COUNT = 21;

// =============================================================================
// TEMAS - Quiet Material Library con Glassmorphism
// =============================================================================
const THEMES = {
  night: {
    name: 'Nocturno',
    icon: '⭐',
    bg: {
      primary: '#1a1917',
      secondary: '#242320',
      tertiary: '#2d2b28',
      elevated: '#363330',
    },
    text: {
      primary: '#f5f3ef',
      secondary: '#b8b5ad',
      tertiary: '#8a867d',
      muted: '#5c5850',
    },
    accent: '#c9a456',
    accentHover: '#d4b36a',
    accentMuted: 'rgba(201, 164, 86, 0.15)',
    border: {
      subtle: 'rgba(245, 243, 239, 0.06)',
      default: 'rgba(245, 243, 239, 0.1)',
      strong: 'rgba(245, 243, 239, 0.15)',
    },
    overlay: 'rgba(10, 10, 9, 0.85)',
    success: '#7d9a6d',
    // Glassmorphism
    glass: {
      bg: 'rgba(36, 35, 32, 0.75)',
      bgStrong: 'rgba(45, 43, 40, 0.85)',
      border: 'rgba(245, 243, 239, 0.08)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      shadowElevated: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #c9a456 0%, #d4b36a 100%)',
      subtle: 'linear-gradient(180deg, rgba(201, 164, 86, 0.08) 0%, transparent 100%)',
      card: 'linear-gradient(145deg, rgba(54, 51, 48, 0.9) 0%, rgba(45, 43, 40, 0.95) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
    }
  },
  day: {
    name: 'Día',
    icon: '⭐',
    bg: {
      primary: '#f8f6f1',
      secondary: '#f0ede6',
      tertiary: '#e8e4db',
      elevated: '#ffffff',
    },
    text: {
      primary: '#2a2825',
      secondary: '#5a5752',
      tertiary: '#8a857d',
      muted: '#b5b0a5',
    },
    accent: '#a68a3a',
    accentHover: '#8a7030',
    accentMuted: 'rgba(166, 138, 58, 0.12)',
    border: {
      subtle: 'rgba(42, 40, 37, 0.05)',
      default: 'rgba(42, 40, 37, 0.1)',
      strong: 'rgba(42, 40, 37, 0.15)',
    },
    overlay: 'rgba(248, 246, 241, 0.85)',
    success: '#5a7a5a',
    // Glassmorphism
    glass: {
      bg: 'rgba(255, 255, 255, 0.7)',
      bgStrong: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(255, 255, 255, 0.5)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      shadowElevated: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #a68a3a 0%, #c9a456 100%)',
      subtle: 'linear-gradient(180deg, rgba(166, 138, 58, 0.06) 0%, transparent 100%)',
      card: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 241, 0.98) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%)',
    }
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

// =============================================================================
// COMPONENTE: BookCover
// =============================================================================
const BookCover = memo(({ book, onClick, theme, listStatus, sanctuary }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const t = THEMES[theme];
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const hasAward = (book.aw || book.awards || []).length > 0;
  
  // Tamaño más grande en modo santuario
  const size = sanctuary ? { width: '140px', height: '210px' } : { width: '120px', height: '180px' };
  
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
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: isPressed 
          ? '0 2px 8px rgba(0,0,0,0.2)' 
          : '0 4px 16px rgba(0,0,0,0.18)',
        background: t.bg.tertiary,
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Skeleton mejorado */}
      {(!isVisible || (!imgLoaded && !imgError)) && (
        <div 
          className="skeleton"
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, ${t.bg.secondary} 0%, ${t.bg.tertiary} 50%, ${t.bg.secondary} 100%)`,
            backgroundSize: '200% 100%',
          }} 
        />
      )}
      
      {/* Imagen con fade-in */}
      {isVisible && !imgError && (
        <img 
          src={coverUrl}
          alt={title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      
      {/* Fallback elegante */}
      {imgError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '12px',
          background: `linear-gradient(145deg, ${t.bg.tertiary}, ${t.bg.elevated})`
        }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '11px', fontWeight: 600, color: t.text.primary, lineHeight: 1.3 }}>
            {title.slice(0, 50)}
          </div>
          <div style={{ fontSize: '10px', color: t.text.tertiary, marginTop: '4px' }}>
            {authors[0]}
          </div>
        </div>
      )}
      
      {/* Indicador con animación */}
      {!sanctuary && (hasAward || listStatus) && (
        <div style={{
          position: 'absolute', bottom: '6px', right: '6px',
          width: '20px', height: '20px',
          borderRadius: '50%',
          background: listStatus === 'reading' ? t.accent : 
                     listStatus === 'read' ? t.success : 
                     listStatus === 'want' ? '#5a7a8a' : t.accent,
          color: t.bg.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          transform: isPressed ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform 150ms ease'
        }}>
          {listStatus === 'reading' ? 'â—' : listStatus === 'read' ? 'âœ“' : listStatus === 'want' ? 'â—‹' : 'â˜…'}
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
    <section style={{ marginBottom: sanctuary ? '56px' : '48px' }}>
      {!sanctuary && (
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: t.text.primary,
          marginBottom: '20px',
          paddingLeft: '4px'
        }}>
          {title}
        </h2>
      )}
      <div style={{
        display: 'flex',
        gap: sanctuary ? '20px' : '16px',
        overflowX: 'auto',
        paddingBottom: '16px',
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
  
  return (
    <section style={{ marginBottom: '48px' }}>
      {/* Etiqueta */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${t.accent}20, ${t.accent}10)`,
          color: t.accent,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          âœ¨ Tu libro de hoy
        </span>
      </div>
      
      {/* Card principal */}
      <div 
        onClick={() => onClick(book)}
        style={{
          display: 'flex',
          gap: '24px',
          padding: '24px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${t.bg.elevated}, ${t.bg.tertiary})`,
          border: `1px solid ${t.border.subtle}`,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Portada */}
        <div style={{
          flexShrink: 0,
          width: '120px',
          height: '180px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
        }}>
          <img 
            src={coverUrl} 
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            fontWeight: 600,
            color: t.text.primary,
            marginBottom: '6px',
            lineHeight: 1.2
          }}>
            {title}
          </h2>
          <p style={{ fontSize: '14px', color: t.text.secondary, marginBottom: '4px' }}>
            {authors}
          </p>
          <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '16px' }}>
            {pages} páginas
          </p>
          
          {/* Hook */}
          <p style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: t.text.secondary,
            fontStyle: 'italic',
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            "{hook.hook}"
          </p>
          
          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {hook.experience && (
              <span style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: t.accentMuted,
                color: t.accent,
                fontWeight: 600
              }}>
                âœ¨ {hook.experience}
              </span>
            )}
            {hook.themes?.slice(0, 2).map(theme => (
              <span key={theme} style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '12px',
                border: `1px solid ${t.border.subtle}`,
                color: t.text.tertiary
              }}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: NarrativeShelf (estante con hooks visibles)
// =============================================================================
const NarrativeShelf = ({ title, subtitle, books, hooks, onBookClick, theme }) => {
  const t = THEMES[theme];
  if (!books || books.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: t.text.primary,
          marginBottom: '4px'
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: t.text.tertiary }}>
            {subtitle}
          </p>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '16px',
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
          
          return (
            <div
              key={book.id}
              onClick={() => onBookClick(book)}
              style={{
                flexShrink: 0,
                width: '280px',
                padding: '16px',
                borderRadius: '16px',
                background: t.bg.elevated,
                border: `1px solid ${t.border.subtle}`,
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                {/* Mini portada */}
                <div style={{
                  flexShrink: 0,
                  width: '60px',
                  height: '90px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <img src={coverUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: t.text.primary,
                    marginBottom: '4px',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {title}
                  </h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: t.text.tertiary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {authors}
                  </p>
                  {hook?.experience && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      background: t.accentMuted,
                      color: t.accent,
                      fontWeight: 600
                    }}>
                      {hook.experience}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Mini hook */}
              {hook && (
                <p style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: t.text.secondary,
                  fontStyle: 'italic',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  "{hook.hook}"
                </p>
              )}
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
const FeaturedCollections = ({ collections, onSelect, theme }) => {
  const t = THEMES[theme];
  
  // Seleccionar 4 colecciones destacadas
  const featured = collections.filter(c => 
    ['premio-nobel', 'noir-nordico', 'literatura-japonesa', 'espana-contemporanea'].includes(c.id)
  ).slice(0, 4);
  
  if (featured.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontFamily: 'Georgia, serif',
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
              fontFamily: 'Georgia, serif',
              fontSize: '15px',
              fontWeight: 600,
              color: t.text.primary,
              marginBottom: '4px'
            }}>
              {collection.title}
            </h3>
            <p style={{ fontSize: '11px', color: t.text.tertiary }}>
              {collection.count} libros
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
    { id: 'collections', icon: '📚', label: COPY.tabs.collections },
    { id: 'recommend', icon: '⭐', label: COPY.tabs.recommend },
    { id: 'saved', icon: '⭐', label: COPY.tabs.saved, badge: savedCount },
    { id: 'authors', icon: '📚', label: COPY.tabs.authors },
  ];
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      background: t.bg.elevated,
      borderTop: `1px solid ${t.border.subtle}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '64px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
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
            color: activeTab === tab.id ? t.accent : t.text.tertiary,
            transition: 'color 0.2s ease'
          }}
        >
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
              borderRadius: '8px',
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
        borderRadius: '50%',
        border: 'none',
        background: t.bg.elevated,
        color: t.text.secondary,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: 0.8
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.8'; }}
      title={COPY.sanctuary.exit}
    >
      âœ•
    </button>
  );
};

// =============================================================================
// COMPONENTE: CollectionsSection (colecciones curadas)
// =============================================================================
const CollectionsSection = ({ collections, selectedCollection, onSelectCollection, theme }) => {
  const t = THEMES[theme];
  
  if (!collections || collections.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '32px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px' 
      }}>
        <h2 style={{ 
          fontFamily: 'Georgia, serif', 
          fontSize: '18px', 
          color: t.text.primary 
        }}>
          Colecciones
        </h2>
        {selectedCollection && (
          <button
            onClick={() => onSelectCollection(null)}
            style={{
              background: t.accentMuted,
              border: 'none',
              color: t.accent,
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            âœ• Ver todo
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
          return (
            <div
              key={coll.id}
              onClick={() => onSelectCollection(isSelected ? null : coll)}
              style={{
                minWidth: '200px',
                padding: '16px',
                borderRadius: '16px',
                background: isSelected ? t.accent : t.bg.secondary,
                border: `1px solid ${isSelected ? t.accent : t.border.subtle}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Emoji decorativo */}
              <span style={{ 
                fontSize: '32px', 
                marginBottom: '8px', 
                display: 'block' 
              }}>
                {coll.emoji}
              </span>
              
              {/* Título */}
              <h3 style={{ 
                fontSize: '15px', 
                fontWeight: 600, 
                color: isSelected ? t.bg.primary : t.text.primary,
                marginBottom: '4px'
              }}>
                {coll.title}
              </h3>
              
              {/* Subtítulo */}
              <p style={{ 
                fontSize: '12px', 
                color: isSelected ? t.bg.secondary : t.text.tertiary,
                marginBottom: '8px',
                lineHeight: 1.4
              }}>
                {coll.subtitle}
              </p>
              
              {/* Contador */}
              <span style={{ 
                fontSize: '11px', 
                color: isSelected ? t.bg.tertiary : t.text.muted,
                fontWeight: 500
              }}>
                {coll.count} libros
              </span>
              
              {/* Barra de color decorativa */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: coll.color || t.accent,
                opacity: isSelected ? 0 : 0.6
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
const CollectionHeader = ({ collection, onClear, theme }) => {
  const t = THEMES[theme];
  
  if (!collection) return null;
  
  return (
    <div style={{
      padding: '24px',
      borderRadius: '16px',
      background: `linear-gradient(135deg, ${collection.color}22, ${collection.color}11)`,
      border: `1px solid ${collection.color}44`,
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <span style={{ fontSize: '48px' }}>{collection.emoji}</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontFamily: 'Georgia, serif', 
            fontSize: '24px', 
            fontWeight: 600, 
            color: t.text.primary,
            marginBottom: '4px'
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
              {collection.count} libros
            </span>
            <button
              onClick={onClear}
              style={{
                background: 'none',
                border: `1px solid ${t.border.default}`,
                color: t.text.secondary,
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              â† Volver a biblioteca
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
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>â™¡</div>
        <p style={{ fontSize: '18px', color: t.text.secondary, marginBottom: '8px' }}>{COPY.saved.empty}</p>
        <p style={{ fontSize: '14px', color: t.text.tertiary }}>{COPY.saved.emptyHint}</p>
      </div>
    );
  }
  
  return (
    <div>
      {savedBooks.reading.length > 0 && (
        <Shelf 
          title={`â— ${COPY.saved.reading} (${savedBooks.reading.length})`}
          books={savedBooks.reading}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.want.length > 0 && (
        <Shelf 
          title={`â—‹ ${COPY.saved.want} (${savedBooks.want.length})`}
          books={savedBooks.want}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.read.length > 0 && (
        <Shelf 
          title={`âœ“ ${COPY.saved.read} (${savedBooks.read.length})`}
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
            fontFamily: 'Georgia, serif', 
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
              {data.years} Â· {data.nationality}
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
            fontFamily: 'Georgia, serif', 
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
            fontFamily: 'Georgia, serif', 
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
const CollectionsView = ({ collections, books, onCollectionClick, theme }) => {
  const t = THEMES[theme];
  
  const getCollectionCount = (collection) => {
    if (collection.bookIds && collection.bookIds.length > 0) {
      return collection.bookIds.filter(id => books.some(b => b && b.id === id)).length;
    }
    return collection.count || 0;
  };
  
  return (
    <div>
      <p style={{ fontSize: '14px', color: t.text.secondary, marginBottom: '24px', lineHeight: 1.6 }}>
        Explora tu biblioteca organizada en colecciones tematicas.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {collections.map(collection => {
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
                <span style={{ fontSize: '28px' }}>{collection.emoji || '📚'}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontFamily: 'Georgia, serif', 
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
    </div>
  );
};

// =============================================================================
// COMPONENTE: CollectionDetailView
// =============================================================================
const CollectionDetailView = ({ collection, books, onBookClick, onBack, theme, getListStatus }) => {
  const t = THEMES[theme];
  
  const filteredBooks = useMemo(() => {
    if (collection.bookIds && collection.bookIds.length > 0) {
      return books.filter(book => book && collection.bookIds.includes(book.id));
    }
    return [];
  }, [collection, books]);
  
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: t.accent, fontSize: '14px', cursor: 'pointer', padding: '0', marginBottom: '16px' }}>
          Volver a colecciones
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ fontSize: '48px' }}>{collection.emoji}</span>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: t.text.primary, marginBottom: '4px' }}>{collection.title}</h1>
            <p style={{ fontSize: '14px', color: t.text.tertiary }}>{collection.subtitle} - {filteredBooks.length} libros</p>
          </div>
        </div>
        <p style={{ fontSize: '15px', color: t.text.secondary, lineHeight: 1.6 }}>{collection.description}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {filteredBooks.map(book => (
          <div key={book.id} onClick={() => onBookClick(book)} style={{ cursor: 'pointer' }}>
            <div style={{ aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', background: t.bg.tertiary }}>
              <img src={book.c || `/portadas/${book.id}.jpg`} alt={book.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: 500, color: t.text.primary, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.t}</h4>
            <p style={{ fontSize: '11px', color: t.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(book.a || [])[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

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

// =============================================================================
// COMPONENTE: BookModal
// =============================================================================
const BookModal = memo(({ book, onClose, theme, currentList, onListChange, onAuthorClick, onThemeClick, onExperienceClick, onBookClick, bookHook, books, hooks }) => {
  const [imgError, setImgError] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const t = THEMES[theme];
  
  if (!book) return null;
  
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
  const synopsis = book.syn || book.synopsis || '';
  
  // Hook data
  const hook = book.hook || '';
  const themes = book.themes || [];
  const idealFor = book.ideal_for || '';
  const experience = book.experience || '';
  const bookType = book.book_type || '';
  
  const handleListClick = (listId) => {
    onListChange(book.id, currentList === listId ? null : listId);
  };
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px 24px 0 0',
          background: t.glass?.bgStrong || t.bg.elevated,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          borderBottom: 'none',
          boxShadow: t.glass?.shadowElevated || '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
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
            style={{
              position: 'absolute', top: '0', right: '16px',
              width: '32px', height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: t.glass?.bg || t.bg.tertiary,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: t.text.secondary,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={e => { e.target.style.background = t.bg.tertiary; e.target.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.target.style.background = t.glass?.bg || t.bg.tertiary; e.target.style.transform = 'scale(1)'; }}
          >
            âœ•
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
                }}>ðŸ“–</div>
              )}
            </div>
            
            <div style={{ flex: 1, paddingTop: '8px' }}>
              <h2 style={{
                fontFamily: 'Georgia, serif',
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
                    <span 
                      onClick={(e) => { e.stopPropagation(); onAuthorClick?.(author); }}
                      style={{ 
                        cursor: 'pointer',
                        borderBottom: `1px dotted ${t.text.tertiary}`,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={e => e.target.style.color = t.accent}
                      onMouseLeave={e => e.target.style.color = t.text.secondary}
                    >
                      {author}
                    </span>
                    {i < authors.length - 1 && ', '}
                  </span>
                ))}
              </p>
              {series && (
                <p style={{ fontSize: '12px', color: t.text.tertiary }}>
                  {series} Â· #{seriesIndex}
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
                      â˜… {award}
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
              {difficulty === 'ligero' ? 'â—‹' : difficulty === 'denso' ? 'â—' : 'â—'}
            </span>
            <span style={{ fontSize: '12px', color: t.text.tertiary, marginLeft: '4px' }}>{difficulty}</span>
          </div>
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
            
            {/* Meta info del hook */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {/* Perfecto para */}
              {bookHook.perfect_for && (
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: t.bg.tertiary,
                  color: t.text.secondary
                }}>
                  ðŸ‘¤ {bookHook.perfect_for}
                </span>
              )}
              
              {/* Experiencia - Clickeable */}
              {bookHook.experience && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onExperienceClick?.(bookHook.experience); }}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: t.accentMuted,
                    color: t.accent,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { 
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.background = t.accent;
                    e.target.style.color = t.bg.primary;
                  }}
                  onMouseLeave={e => { 
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = t.accentMuted;
                    e.target.style.color = t.accent;
                  }}
                >
                  âœ¨ {bookHook.experience}
                </button>
              )}
            </div>
            
            {/* Por qué importa */}
            {bookHook.why_matters && (
              <p style={{
                fontSize: '12px',
                color: t.text.tertiary,
                margin: 0,
                lineHeight: 1.5
              }}>
                ðŸ’¡ {bookHook.why_matters}
              </p>
            )}
            
            {/* Temas */}
            {bookHook.themes && bookHook.themes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {bookHook.themes.map(thm => (
                  <button 
                    key={thm} 
                    onClick={(e) => { e.stopPropagation(); onThemeClick?.(thm); }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${t.border.subtle}`,
                      background: 'transparent',
                      color: t.text.tertiary,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { 
                      e.target.style.background = t.accentMuted; 
                      e.target.style.color = t.accent;
                      e.target.style.borderColor = t.accent;
                    }}
                    onMouseLeave={e => { 
                      e.target.style.background = 'transparent'; 
                      e.target.style.color = t.text.tertiary;
                      e.target.style.borderColor = t.border.subtle;
                    }}
                  >
                    {thm}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Hook - Por qué leer este libro */}
        {hook && (
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
            {themes.length > 0 && (
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
            {idealFor && (
              <p style={{
                fontSize: '12px',
                color: t.text.tertiary,
                marginTop: '8px'
              }}>
                ðŸ‘¤ <strong style={{ color: t.text.secondary }}>Ideal para:</strong> {idealFor}
              </p>
            )}
            
            {/* Experiencia y tipo */}
            {(experience || bookType) && (
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '8px',
                fontSize: '12px',
                color: t.text.tertiary
              }}>
                {experience && (
                  <span>âœ¨ {experience}</span>
                )}
                {bookType && (
                  <span style={{ color: t.accent }}>ðŸ“š {bookType}</span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Sinopsis */}
        {synopsis && (
          <div style={{ padding: '0 24px 20px' }}>
            <p style={{
              fontSize: '14px',
              lineHeight: 1.7,
              color: t.text.secondary,
              ...(!synopsisExpanded ? {
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              } : {})
            }}>
              {synopsis}
            </p>
            {synopsis.length > 150 && (
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
                {synopsisExpanded ? 'â† Ver menos' : 'Ver más â†’'}
              </button>
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
          borderTop: `1px solid ${t.border.subtle}`,
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
            {currentList === 'reading' ? 'â— Leyendo' : COPY.readNow}
          </ActionButton>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <ActionButton 
              onClick={() => { handleListClick('want'); haptic.light(); }}
              variant="secondary"
              isActive={currentList === 'want'}
              activeColor="#5a7a8a"
              theme={t}
              style={{ flex: 1 }}
            >
              {currentList === 'want' ? 'â—‹ En lista' : COPY.readLater}
            </ActionButton>
            <ActionButton 
              onClick={() => { handleListClick('read'); haptic.success(); }}
              variant="secondary"
              isActive={currentList === 'read'}
              activeColor={t.success}
              theme={t}
              style={{ flex: 1 }}
            >
              {currentList === 'read' ? 'âœ“ Leído' : COPY.alreadyRead}
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
    label: 'Â¿Qué quieres sentir?',
    options: [
      { id: 'cry', icon: '📚', label: 'Me hará llorar', moods: ['emotivo', 'íntimo'], vibes: ['dramático'] },
      { id: 'grip', icon: '📚', label: 'No podré soltarlo', moods: ['tenso', 'inquietante'], vibes: ['intriga', 'policial', 'psicológico'] },
      { id: 'think', icon: '📚', label: 'Me hará pensar', moods: ['reflexivo'], vibes: ['ensayo', 'filosófico'] },
      { id: 'smile', icon: '📚', label: 'Me hará sonreír', moods: ['ligero', 'entretenido', 'irónico'], vibes: ['humor'] },
      { id: 'escape', icon: '📚', label: 'Otro mundo', moods: ['inmersivo', 'imaginativo', 'especulativo'], vibes: ['fantasía', 'ciencia ficción'] }
    ]
  },
  moment: {
    label: 'Â¿Cuándo lo leerás?',
    options: [
      { id: 'commute', icon: '📚', label: 'En el metro', maxPages: 250, desc: 'Breve y ágil' },
      { id: 'weekend', icon: '⭐', label: 'Fin de semana', minPages: 200, maxPages: 400, desc: 'Ideal para 2-3 días' },
      { id: 'vacation', icon: '📚', label: 'Vacaciones', moods: ['entretenido', 'inmersivo', 'ligero'], desc: 'Puro disfrute' },
      { id: 'nights', icon: '📚', label: 'Noches largas', moods: ['tenso', 'inmersivo', 'inquietante'], desc: 'Que no te deje dormir' },
      { id: 'epic', icon: '📚', label: 'Proyecto épico', minPages: 500, desc: 'Más de 500 páginas' }
    ]
  },
  theme: {
    label: 'Â¿Qué te interesa?',
    options: [
      { id: 'identity', icon: '📚', label: 'Identidad', vibes: ['psicológico', 'memorias'], keywords: ['memoria', 'identidad'] },
      { id: 'love', icon: '⭐', label: 'Amor', vibes: ['romántico', 'erótico'], moods: ['emotivo', 'íntimo'] },
      { id: 'power', icon: '⭐', label: 'Poder', vibes: ['histórico', 'político', 'historia'] },
      { id: 'crime', icon: '📚', label: 'Crimen', vibes: ['policial', 'intriga', 'noir'] },
      { id: 'worlds', icon: '⭐', label: 'Otros mundos', vibes: ['fantasía', 'ciencia ficción', 'aventura'] },
      { id: 'real', icon: '📚', label: 'Vida real', vibes: ['crónica', 'memorias', 'ensayo', 'divulgación'] }
    ]
  }
};

const FilterSheet = ({ filters, setFilters, moods, onClose, theme }) => {
  const t = THEMES[theme];
  const [activeSection, setActiveSection] = useState('experience');
  
  const ChipButton = ({ active, onClick, children, large }) => (
    <button
      onClick={onClick}
      style={{
        padding: large ? '12px 16px' : '6px 14px',
        borderRadius: large ? '12px' : '20px',
        border: `1.5px solid ${active ? t.accent : t.border.default}`,
        background: active ? t.accentMuted : t.bg.tertiary,
        color: active ? t.accent : t.text.secondary,
        fontSize: large ? '14px' : '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
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
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: 'none',
        background: active ? t.accent : 'transparent',
        color: active ? t.bg.primary : t.text.tertiary,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      {label}
    </button>
  );

  const hasAnyFilter = filters.experience || filters.moment || filters.theme || 
                       filters.difficulty || filters.hasAwards;

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
    if (filters.difficulty) parts.push(`âš¡ ${filters.difficulty}`);
    if (filters.hasAwards) parts.push('ðŸ† premiados');
    return parts.join(' Â· ');
  };
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          background: t.glass?.bgStrong || t.bg.elevated,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          borderBottom: 'none',
          boxShadow: t.glass?.shadowElevated || '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
        <div style={{ padding: '12px 24px 16px', borderBottom: `1px solid ${t.border.subtle}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: t.text.primary }}>
              Encuentra tu libro
            </h3>
            <button onClick={onClose} style={{ 
              background: t.glass?.bg || 'transparent', 
              border: 'none', 
              color: t.text.tertiary, 
              fontSize: '20px', 
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease'
            }}>âœ•</button>
          </div>
          
          {/* Tabs con glass */}
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            background: t.glass?.bg || t.bg.tertiary, 
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '24px', 
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
              borderRadius: '14px',
              background: t.gradient?.subtle || `linear-gradient(135deg, ${t.accent}15, ${t.accent}05)`,
              marginBottom: '20px',
              borderLeft: `3px solid ${t.accent}`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
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
              <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '16px' }}>
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
              <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '16px' }}>
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
              <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '16px' }}>
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
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: t.text.tertiary, marginBottom: '12px' }}>
                  Dificultad
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'ligero', icon: '⭐', label: 'Ligero' },
                    { id: 'medio', icon: '⭐', label: 'Medio' },
                    { id: 'denso', icon: '⭐', label: 'Denso' }
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
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: t.text.tertiary, marginBottom: '12px' }}>
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
                <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: t.text.tertiary, marginBottom: '12px' }}>
                  Especial
                </p>
                <ChipButton
                  active={filters.hasAwards}
                  onClick={() => setFilters(f => ({ ...f, hasAwards: !f.hasAwards }))}
                >
                  ðŸ† Solo premiados
                </ChipButton>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ 
          padding: '16px 24px 24px', 
          borderTop: `1px solid ${t.border.subtle}`,
          display: 'flex', 
          gap: '12px' 
        }}>
          <button 
            onClick={() => setFilters({ 
              search: filters.search, 
              difficulty: null, 
              hasAwards: false, 
              mood: null,
              experience: null,
              moment: null,
              theme: null
            })}
            style={{
              flex: 1, padding: '14px',
              borderRadius: '12px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.tertiary,
              color: t.text.secondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Limpiar filtros
          </button>
          <button 
            onClick={onClose}
            style={{
              flex: 1, padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: t.accent,
              color: t.bg.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
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
const StatsModal = ({ books, onClose, theme }) => {
  const t = THEMES[theme];
  
  const stats = useMemo(() => {
    const totalPages = books.reduce((sum, b) => sum + (b.pg || b.pages || 250), 0);
    const totalHours = Math.round(totalPages / 40);
    const awarded = books.filter(b => (b.aw || b.awards || []).length > 0).length;
    return { total: books.length, pages: totalPages.toLocaleString(), hours: totalHours.toLocaleString(), awarded };
  }, [books]);
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          borderRadius: '20px',
          padding: '24px',
          background: t.bg.elevated,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: t.text.primary }}>{COPY.stats.title}</h3>
          <button onClick={onClose} style={{ 
            background: 'none', border: 'none', 
            color: t.text.tertiary, fontSize: '20px', cursor: 'pointer' 
          }}>âœ•</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: t.bg.tertiary }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.books}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: t.bg.tertiary }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.pages}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.pages}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: t.bg.tertiary }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.hours}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.hours}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: t.bg.tertiary }}>
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '24px',
          background: t.glass?.bgStrong || t.bg.elevated,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          boxShadow: t.glass?.shadowElevated || '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header con sombra dinámica */}
        <div style={{ 
          padding: '24px 24px 16px', 
          position: 'sticky', 
          top: 0, 
          background: t.glass?.bgStrong || t.bg.elevated,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '24px 24px 0 0',
          zIndex: 1,
          transition: 'box-shadow 200ms ease',
          boxShadow: scrolled ? `0 1px 0 ${t.border.subtle}, 0 4px 12px rgba(0,0,0,0.1)` : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontFamily: 'Georgia, serif', 
                fontSize: '24px', 
                fontWeight: 600, 
                color: t.text.primary,
                marginBottom: '4px'
              }}>
                {hasData ? data.name : authorName}
              </h2>
              {hasData && data.years && (
                <p style={{ fontSize: '14px', color: t.text.tertiary }}>
                  {data.years} Â· {data.nationality}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ 
              background: t.bg.tertiary, border: 'none', 
              color: t.text.secondary, fontSize: '16px', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>âœ•</button>
          </div>
        </div>
        
        <div style={{ padding: '0 24px 24px' }}>
          {hasData ? (
            <>
              {/* Biografía */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: t.text.tertiary, 
                  marginBottom: '8px' 
                }}>
                  Biografía
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: t.text.secondary }}>
                  {data.bio}
                </p>
              </div>
              
              {/* Importancia */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: t.text.tertiary, 
                  marginBottom: '8px' 
                }}>
                  Por qué es importante
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  lineHeight: 1.6, 
                  color: t.text.primary,
                  fontStyle: 'italic',
                  padding: '12px 16px',
                  background: t.accentMuted,
                  borderRadius: '8px',
                  borderLeft: `3px solid ${t.accent}`
                }}>
                  {data.importance}
                </p>
              </div>
              
              {/* Premios */}
              {data.awards && data.awards.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    color: t.text.tertiary, 
                    marginBottom: '8px' 
                  }}>
                    Reconocimientos
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.awards.map((award, i) => (
                      <span key={i} style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: t.bg.tertiary,
                        color: t.text.secondary
                      }}>
                        â˜… {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Obras destacadas */}
              {data.notable_works && data.notable_works.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    color: t.text.tertiary, 
                    marginBottom: '8px' 
                  }}>
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
                    <h3 style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      color: t.text.tertiary, 
                      marginBottom: '8px' 
                    }}>
                      Temas que explora
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {topThemes.map(thm => (
                        <button 
                          key={thm}
                          onClick={() => onThemeClick?.(thm)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: 'transparent',
                            border: `1px solid ${t.border.default}`,
                            color: t.text.secondary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { 
                            e.target.style.background = t.accentMuted; 
                            e.target.style.color = t.accent;
                            e.target.style.borderColor = t.accent;
                          }}
                          onMouseLeave={e => { 
                            e.target.style.background = 'transparent'; 
                            e.target.style.color = t.text.secondary;
                            e.target.style.borderColor = t.border.default;
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
                <h3 style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: t.text.tertiary, 
                  marginBottom: '12px' 
                }}>
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
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '80px',
                          height: '120px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          marginBottom: '6px',
                          background: t.bg.tertiary
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
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);
  
  // Detectar scroll para sombra dinámica
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);
  
  const themeEmojis = {
    amor: '❤️', muerte: '💀', familia: '👨‍👩‍👧', memoria: '🧠', identidad: '🪞',
    guerra: '⚔️', poder: '👑', soledad: '🌙', viaje: '🧭', tiempo: '⏳',
    naturaleza: '🌿', arte: '🎨', musica: '🎵', politica: '🏛️', ciencia: '🔬',
    religion: '✝️', locura: '🌀', venganza: '🔥', infancia: '🧒', vejez: '👴',
    amistad: '🤝', traicion: '🗡️', libertad: '🕊️', supervivencia: '🏕️', obsesion: '👁️',
    perdida: '🥀', redencion: '🌅', destino: '⭐', violencia: '💥', escritura: '✍️',
    America: '🇺🇸', Espana: '🇪🇸', juventud: '🌱', historia: '📜', vida: '🌻'
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          background: t.glass?.bgStrong || t.bg.primary,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          borderBottom: 'none',
          overflow: 'hidden',
          boxShadow: t.glass?.shadowElevated || '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '5px', borderRadius: '3px', background: t.border.strong, opacity: 0.6 }} />
        </div>
        
        {/* Header con gradiente sutil */}
        <div style={{ 
          padding: '0 24px 20px', 
          textAlign: 'center',
          background: t.gradient?.subtle || 'transparent'
        }}>
          <span style={{ fontSize: '44px', marginBottom: '8px', display: 'block' }}>
            {themeEmojis[themeName] || 'ðŸ“š'}
          </span>
          <h2 style={{
            fontFamily: 'Georgia, serif',
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
        <div style={{ padding: '0 24px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
          {experienceGroups.map(([experience, expBooks]) => (
            <div key={experience} style={{ marginBottom: '24px' }}>
              <div 
                onClick={() => experience !== 'otros' && onExperienceClick?.(experience)}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  cursor: experience !== 'otros' ? 'pointer' : 'default'
                }}
              >
                <span style={{ fontSize: '12px', color: t.accent, fontWeight: 600, textTransform: 'capitalize' }}>
                  âœ¨ {experience}
                </span>
                <span style={{ fontSize: '11px', color: t.text.muted }}>({expBooks.length})</span>
                {experience !== 'otros' && <span style={{ fontSize: '14px', color: t.text.muted, marginLeft: 'auto' }}>â€º</span>}
              </div>
              
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      marginBottom: '6px',
                      background: t.bg.tertiary
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
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef(null);
  
  // Detectar scroll para sombra dinámica
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);
  
  const experienceEmojis = {
    devastador: 'ðŸ’”', perturbador: 'ðŸ˜°', melancólico: 'ðŸŒ§ï¸', nostálgico: 'ðŸ•°ï¸',
    épico: 'âš”ï¸', monumental: 'ðŸ›ï¸', absorbente: 'ðŸŒ€', hipnótico: 'ðŸ‘ï¸',
    tenso: 'ðŸ˜¬', vertiginoso: 'ðŸŽ¢', brutal: 'ðŸ’€', desgarrador: 'ðŸ˜¢',
    conmovedor: 'ðŸ¥º', íntimo: 'ðŸ’', reflexivo: 'ðŸ¤”', filosófico: 'ðŸ§ ',
    sardónico: 'ðŸ˜', irónico: 'ðŸŽ', divertido: 'ðŸ˜„', luminoso: 'â˜€ï¸',
    onírico: 'ðŸŒ™', misterioso: 'ðŸ”®', aterrador: 'ðŸ˜±', inquietante: 'ðŸ‘»',
    agridulce: 'ðŸ‹', contemplativo: 'ðŸ§˜', sombrío: 'ðŸŒ‘', visceral: 'ðŸ’¥'
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        ref={contentRef}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          background: t.glass?.bgStrong || t.bg.primary,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          borderBottom: 'none',
          overflow: 'hidden',
          boxShadow: t.glass?.shadowElevated || '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '5px', borderRadius: '3px', background: t.border.strong, opacity: 0.6 }} />
        </div>
        
        {/* Header con gradiente sutil */}
        <div style={{ 
          padding: '0 24px 24px',
          textAlign: 'center',
          borderBottom: `1px solid ${t.border.subtle}`,
          background: t.gradient?.subtle || 'transparent'
        }}>
          <span style={{ fontSize: '52px', marginBottom: '12px', display: 'block' }}>
            {experienceEmojis[experience] || 'âœ¨'}
          </span>
          <h2 style={{
            fontFamily: 'Georgia, serif',
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
            gap: '16px'
          }}>
            {experienceBooks.map(book => {
              const authors = (book.a || []).slice(0, 1);
              
              return (
                <div key={book.id} onClick={() => onBookClick(book)} style={{ cursor: 'pointer' }}>
                  <div style={{
                    aspectRatio: '2/3',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginBottom: '8px',
                    background: t.bg.tertiary
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
                    <p 
                      onClick={(e) => { e.stopPropagation(); onAuthorClick?.(authors[0]); }}
                      style={{ fontSize: '11px', color: t.text.tertiary, cursor: 'pointer' }}
                    >
                      {authors[0]}
                    </p>
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
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // NIVEL 1: La Puerta de Entrada
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  root: {
    key: 'root',
    question: 'Â¿Qué quieres que te dé este libro?',
    hint: 'La pregunta fundamental',
    options: [
      { id: 'feel', icon: '📚', label: 'Sentir', desc: 'Una experiencia emocional', next: 'feel_type' },
      { id: 'travel', icon: '📚', label: 'Viajar', desc: 'Transportarme a otro lugar o tiempo', next: 'travel_where' },
      { id: 'think', icon: '📚', label: 'Pensar', desc: 'Reflexionar profundamente', next: 'think_about' },
      { id: 'tension', icon: '⭐', label: 'Tensión', desc: 'Adrenalina, no poder soltarlo', next: 'tension_type' },
      { id: 'discover', icon: '⭐', label: 'Descubrir', desc: 'Algo que me sorprenda', next: 'discover_type' },
      { id: 'laugh', icon: '📚', label: 'Reír', desc: 'Pasarlo bien, divertirme', next: 'laugh_type' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: SENTIR ðŸ’”
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  feel_type: {
    key: 'feel_type',
    question: 'Â¿Qué tipo de impacto emocional buscas?',
    hint: 'Sé sincero contigo mismo',
    options: [
      { id: 'devastate', icon: '📚', label: 'Devastarme', desc: 'Que me destruya (de la mejor manera)', 
        experiences: ['devastador', 'desgarrador', 'brutal'], next: 'devastate_through' },
      { id: 'move', icon: '📚', label: 'Conmoverme', desc: 'Que toque mi corazón', 
        experiences: ['conmovedor', 'melancólico', 'íntimo'], next: 'move_how' },
      { id: 'disturb', icon: '📚', label: 'Inquietarme', desc: 'Que me perturbe y me haga pensar', 
        experiences: ['perturbador', 'inquietante', 'sombrío'], next: 'disturb_how' },
      { id: 'awe', icon: '⭐', label: 'Maravillarme', desc: 'Sentir asombro y admiración', 
        experiences: ['épico', 'onírico', 'monumental'], next: 'awe_how' }
    ]
  },

  devastate_through: {
    key: 'devastate_through',
    question: 'Â¿A través de qué quieres ser devastado?',
    hint: 'El vehículo del impacto',
    options: [
      { id: 'tragic_love', icon: '📚', label: 'Amor trágico', desc: 'Amor que destruye o se pierde',
        themes: ['amor', 'pérdida', 'traición'], experiences: ['desgarrador', 'devastador'], next: 'time_commitment' },
      { id: 'broken_family', icon: '📚', label: 'Familia rota', desc: 'Disfunción, trauma familiar',
        themes: ['familia', 'trauma', 'padre', 'madre', 'infancia'], experiences: ['devastador'], next: 'time_commitment' },
      { id: 'war_violence', icon: '⭐', label: 'Guerra y violencia', desc: 'La humanidad en su peor momento',
        themes: ['guerra', 'violencia', 'supervivencia'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'death_loss', icon: '📚', label: 'Muerte y pérdida', desc: 'El duelo, la ausencia',
        themes: ['muerte', 'duelo', 'pérdida', 'vejez'], experiences: ['devastador', 'elegíaco'], next: 'time_commitment' }
    ]
  },

  move_how: {
    key: 'move_how',
    question: 'Â¿Qué tipo de historia te conmueve?',
    hint: 'Lo que toca tu corazón',
    options: [
      { id: 'love_story', icon: '📚', label: 'Historias de amor', desc: 'Romance, conexión',
        themes: ['amor', 'matrimonio'], experiences: ['conmovedor', 'romántico'], moods: ['emotivo'], next: 'time_commitment' },
      { id: 'coming_of_age', icon: '📚', label: 'Crecer', desc: 'Juventud, descubrimiento',
        themes: ['juventud', 'infancia', 'identidad'], experiences: ['nostálgico', 'agridulce'], next: 'time_commitment' },
      { id: 'friendship', icon: '📚', label: 'Amistad', desc: 'Vínculos que perduran',
        themes: ['amistad', 'lealtad'], experiences: ['conmovedor', 'íntimo'], next: 'time_commitment' },
      { id: 'redemption', icon: '📚', label: 'Redención', desc: 'Segundas oportunidades',
        themes: ['redención', 'perdón', 'cambio'], experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' }
    ]
  },

  disturb_how: {
    key: 'disturb_how',
    question: 'Â¿Qué tipo de inquietud buscas?',
    hint: 'Lo que te quita el sueño',
    options: [
      { id: 'psychological', icon: '📚', label: 'Psicológica', desc: 'La mente bajo presión',
        themes: ['obsesión', 'locura', 'culpa'], vibes: ['psicológico'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'existential', icon: '📚', label: 'Existencial', desc: 'Preguntas sin respuesta',
        themes: ['identidad', 'vacío', 'alienación'], experiences: ['perturbador', 'sombrío'], next: 'time_commitment' },
      { id: 'social', icon: '📚', label: 'Social', desc: 'Lo que está mal en la sociedad',
        themes: ['poder', 'violencia', 'injusticia'], experiences: ['perturbador', 'brutal'], next: 'time_commitment' },
      { id: 'uncanny', icon: '📚', label: 'Lo extraño', desc: 'Algo no está bien aquí',
        experiences: ['inquietante', 'onírico'], moods: ['inquietante', 'oscuro'], next: 'time_commitment' }
    ]
  },

  awe_how: {
    key: 'awe_how',
    question: 'Â¿Qué te maravilla?',
    hint: 'Lo sublime',
    options: [
      { id: 'epic_scale', icon: '📚', label: 'Escala épica', desc: 'Historias monumentales',
        experiences: ['épico', 'monumental'], themes: ['historia', 'poder'], next: 'time_commitment' },
      { id: 'beautiful_prose', icon: '⭐', label: 'Prosa hermosa', desc: 'El lenguaje como arte',
        experiences: ['elegíaco', 'poético'], moods: ['reflexivo'], next: 'time_commitment' },
      { id: 'imagination', icon: '📚', label: 'La imaginación', desc: 'Mundos imposibles',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'human_spirit', icon: '📚', label: 'El espíritu humano', desc: 'Triunfo contra todo',
        themes: ['supervivencia', 'libertad', 'esperanza'], experiences: ['épico', 'luminoso'], next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: VIAJAR ðŸŒ
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  travel_where: {
    key: 'travel_where',
    question: 'Â¿A dónde quieres ir?',
    hint: 'Tu destino literario',
    options: [
      { id: 'past', icon: '📚', label: 'Al pasado', desc: 'Vivir otra época', 
        vibes: ['histórico'], next: 'past_when' },
      { id: 'impossible', icon: '📚', label: 'A lo imposible', desc: 'Mundos que no existen', 
        vibes: ['fantasía', 'ciencia ficción', 'especulativo'], next: 'impossible_type' },
      { id: 'dark_places', icon: '📚', label: 'A lo oscuro', desc: 'Callejones, crímenes, secretos', 
        vibes: ['noir', 'policial', 'intriga'], moods: ['tenso', 'oscuro'], next: 'dark_type' },
      { id: 'faraway', icon: '📚', label: 'A tierras lejanas', desc: 'Culturas, lugares exóticos', 
        themes: ['viaje', 'aventura'], next: 'faraway_where' }
    ]
  },

  past_when: {
    key: 'past_when',
    question: 'Â¿Qué época te atrae?',
    hint: 'El tiempo es relativo',
    options: [
      { id: 'ancient', icon: '📚', label: 'AntigÃ¼edad', desc: 'Grecia, Roma, antes del 500',
        keywords: ['griego', 'romano', 'antiguo', 'imperio', 'mitología'], next: 'historical_fiction' },
      { id: 'medieval', icon: '⭐', label: 'Medieval', desc: 'Reyes, caballeros, castillos',
        keywords: ['medieval', 'rey', 'castillo', 'caballero'], next: 'historical_fiction' },
      { id: 'century_19', icon: '📚', label: 'Siglo XIX', desc: 'Victoriano, revoluciones',
        keywords: ['victoriano', 'siglo xix', 'revolución', 'napoleón'], next: 'historical_fiction' },
      { id: 'world_wars', icon: '📚', label: 'Guerras Mundiales', desc: '1914-1945',
        keywords: ['guerra mundial', 'nazi', 'trinchera', 'holocaust'], themes: ['guerra'], next: 'war_focus' },
      { id: 'recent_past', icon: '📚', label: 'Siglo XX tardío', desc: 'Guerra Fría, 60s-90s',
        keywords: ['guerra fría', '60s', '70s', '80s'], next: 'historical_fiction' }
    ]
  },

  war_focus: {
    key: 'war_focus',
    question: 'Â¿Qué aspecto de la guerra?',
    hint: 'La guerra tiene muchas caras',
    options: [
      { id: 'soldiers', icon: '📚', label: 'Los soldados', desc: 'En el frente, las trincheras',
        themes: ['guerra', 'soldado', 'muerte'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'civilians', icon: '📚', label: 'Los civiles', desc: 'Vivir bajo la guerra',
        themes: ['guerra', 'familia', 'supervivencia'], experiences: ['devastador', 'conmovedor'], next: 'time_commitment' },
      { id: 'resistance', icon: '⭐', label: 'La resistencia', desc: 'Luchar desde las sombras',
        themes: ['guerra', 'resistencia', 'libertad'], experiences: ['tenso', 'épico'], next: 'time_commitment' },
      { id: 'aftermath', icon: '📚', label: 'Las secuelas', desc: 'Después de que todo termina',
        themes: ['guerra', 'trauma', 'memoria'], experiences: ['melancólico', 'devastador'], next: 'time_commitment' }
    ]
  },

  historical_fiction: {
    key: 'historical_fiction',
    question: 'Â¿Ficción o hechos reales?',
    hint: 'Historia y literatura',
    options: [
      { id: 'fiction', icon: '📚', label: 'Novela histórica', desc: 'Ficción ambientada en la época',
        vibes: ['ficción', 'histórico'], next: 'time_commitment' },
      { id: 'nonfiction', icon: '📚', label: 'Historia real', desc: 'Hechos documentados',
        vibes: ['historia', 'crónica', 'memorias'], next: 'time_commitment' }
    ]
  },

  impossible_type: {
    key: 'impossible_type',
    question: 'Â¿Qué tipo de imposible?',
    hint: 'Los límites de la realidad',
    options: [
      { id: 'epic_fantasy', icon: '⭐', label: 'Fantasía épica', desc: 'Guerras, reinos, magia',
        vibes: ['fantasía'], experiences: ['épico', 'monumental'], next: 'time_commitment' },
      { id: 'scifi', icon: '📚', label: 'Ciencia ficción', desc: 'Futuros, tecnología, espacio',
        vibes: ['ciencia ficción'], moods: ['especulativo'], next: 'time_commitment' },
      { id: 'magical_realism', icon: '📚', label: 'Realismo mágico', desc: 'Lo mágico en lo cotidiano',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'weird', icon: '📚', label: 'Lo extraño', desc: 'Inclasificable, perturbador',
        experiences: ['inquietante', 'onírico'], vibes: ['especulativo'], next: 'time_commitment' }
    ]
  },

  dark_type: {
    key: 'dark_type',
    question: 'Â¿Qué tipo de oscuridad?',
    hint: 'Las sombras tienen matices',
    options: [
      { id: 'noir_classic', icon: '📚', label: 'Noir clásico', desc: 'Detectives, femme fatales',
        vibes: ['noir', 'policial'], themes: ['detective', 'crimen'], next: 'time_commitment' },
      { id: 'psychological_thriller', icon: '📚', label: 'Thriller psicológico', desc: 'La mente es el campo de batalla',
        vibes: ['psicológico', 'intriga'], experiences: ['perturbador', 'tenso'], next: 'time_commitment' },
      { id: 'crime', icon: '📚', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'asesinato', 'misterio'], moods: ['tenso'], next: 'time_commitment' },
      { id: 'gothic', icon: '📚', label: 'Gótico', desc: 'Casas encantadas, secretos familiares',
        vibes: ['oscuro'], moods: ['inquietante'], themes: ['secreto', 'familia'], next: 'time_commitment' }
    ]
  },

  faraway_where: {
    key: 'faraway_where',
    question: 'Â¿Qué región del mundo?',
    hint: 'El mapa literario',
    options: [
      { id: 'americas', icon: '📚', label: 'Las Américas', desc: 'Del Norte al Sur',
        themes: ['América'], next: 'americas_where' },
      { id: 'europe', icon: '📚', label: 'Europa', desc: 'El viejo continente',
        next: 'europe_where' },
      { id: 'asia', icon: '📚', label: 'Asia', desc: 'Oriente',
        themes: ['Japón', 'China', 'India'], next: 'time_commitment' },
      { id: 'other', icon: '📚', label: 'Ãfrica y más', desc: 'Otros mundos',
        themes: ['Ãfrica', 'viaje'], next: 'time_commitment' }
    ]
  },

  americas_where: {
    key: 'americas_where',
    question: 'Â¿Qué parte de las Américas?',
    options: [
      { id: 'usa', icon: '📚', label: 'Estados Unidos', themes: ['América', 'Nueva York'], next: 'usa_where' },
      { id: 'latam', icon: '📚', label: 'Latinoamérica', themes: ['México', 'Argentina', 'Colombia'], next: 'time_commitment' },
      { id: 'caribbean', icon: '📚', label: 'Caribe', themes: ['Caribe', 'isla'], next: 'time_commitment' }
    ]
  },

  usa_where: {
    key: 'usa_where',
    question: 'Â¿Qué Estados Unidos?',
    options: [
      { id: 'deep_south', icon: '📚', label: 'El Sur profundo', desc: 'Mississippi, Alabama...',
        themes: ['América', 'sur'], keywords: ['sur', 'mississippi'], next: 'time_commitment' },
      { id: 'new_york', icon: '📚', label: 'Nueva York', desc: 'La gran ciudad',
        themes: ['Nueva York', 'ciudad'], next: 'time_commitment' },
      { id: 'west', icon: '📚', label: 'El Oeste', desc: 'Fronteras, desiertos',
        themes: ['oeste', 'frontera'], vibes: ['aventura'], next: 'time_commitment' },
      { id: 'small_town', icon: '📚', label: 'América profunda', desc: 'Pueblos, suburbios',
        themes: ['América', 'pueblo'], next: 'time_commitment' }
    ]
  },

  europe_where: {
    key: 'europe_where',
    question: 'Â¿Qué parte de Europa?',
    options: [
      { id: 'spain', icon: '📚', label: 'España', themes: ['España'], next: 'time_commitment' },
      { id: 'france', icon: '📚', label: 'Francia', themes: ['Francia', 'París'], next: 'time_commitment' },
      { id: 'uk', icon: '📚', label: 'Reino Unido', themes: ['Inglaterra', 'Londres'], next: 'time_commitment' },
      { id: 'russia', icon: '📚', label: 'Rusia', themes: ['Rusia'], next: 'time_commitment' },
      { id: 'italy', icon: '📚', label: 'Italia', themes: ['Italia', 'Roma'], next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: PENSAR ðŸ§ 
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  think_about: {
    key: 'think_about',
    question: 'Â¿Sobre qué quieres reflexionar?',
    hint: 'Las grandes preguntas',
    options: [
      { id: 'existence', icon: '📚', label: 'La existencia', desc: 'Vida, muerte, tiempo',
        themes: ['muerte', 'vida', 'tiempo', 'identidad', 'memoria', 'soledad'], next: 'existence_focus' },
      { id: 'relationships', icon: '📚', label: 'Las relaciones', desc: 'Amor, familia, amistad',
        themes: ['amor', 'familia', 'amistad'], next: 'relationship_focus' },
      { id: 'society', icon: '⭐', label: 'La sociedad', desc: 'Poder, justicia, violencia',
        themes: ['poder', 'política', 'libertad', 'violencia'], next: 'society_focus' },
      { id: 'art_creation', icon: '📚', label: 'El arte', desc: 'Creación, verdad, belleza',
        themes: ['arte', 'escritura', 'música', 'creación'], next: 'time_commitment' }
    ]
  },

  existence_focus: {
    key: 'existence_focus',
    question: 'Â¿Qué aspecto de la existencia?',
    options: [
      { id: 'identity', icon: '📚', label: 'Quién soy', desc: 'Identidad, autenticidad',
        themes: ['identidad', 'búsqueda'], next: 'time_commitment' },
      { id: 'mortality', icon: '⭐', label: 'La mortalidad', desc: 'Muerte, tiempo, finitud',
        themes: ['muerte', 'tiempo', 'vejez'], next: 'time_commitment' },
      { id: 'memory', icon: '📚', label: 'La memoria', desc: 'Pasado, recuerdos, olvido',
        themes: ['memoria', 'pasado', 'nostalgia'], experiences: ['nostálgico', 'melancólico'], next: 'time_commitment' },
      { id: 'loneliness', icon: '📚', label: 'La soledad', desc: 'Aislamiento, conexión',
        themes: ['soledad', 'alienación'], experiences: ['melancólico', 'íntimo'], next: 'time_commitment' }
    ]
  },

  relationship_focus: {
    key: 'relationship_focus',
    question: 'Â¿Qué tipo de relación?',
    options: [
      { id: 'romantic', icon: '📚', label: 'Amor romántico', themes: ['amor', 'matrimonio'], next: 'love_ending' },
      { id: 'family', icon: '📚', label: 'Familia', themes: ['familia', 'padre', 'madre', 'infancia'], next: 'time_commitment' },
      { id: 'friendship', icon: '📚', label: 'Amistad', themes: ['amistad'], next: 'time_commitment' },
      { id: 'marriage', icon: '📚', label: 'Matrimonio', desc: 'El día a día del amor',
        themes: ['matrimonio', 'pareja'], next: 'time_commitment' }
    ]
  },

  love_ending: {
    key: 'love_ending',
    question: 'Â¿Cómo prefieres que termine?',
    hint: 'Spoiler controlado',
    options: [
      { id: 'happy', icon: '📚', label: 'Bien', desc: 'Final feliz',
        experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' },
      { id: 'tragic', icon: '📚', label: 'Mal', desc: 'Tragedia, pérdida',
        themes: ['pérdida'], experiences: ['devastador', 'desgarrador'], next: 'time_commitment' },
      { id: 'ambiguous', icon: '⭐', label: 'Ambiguo', desc: 'Abierto a interpretación',
        next: 'time_commitment' }
    ]
  },

  society_focus: {
    key: 'society_focus',
    question: 'Â¿Qué aspecto de la sociedad?',
    options: [
      { id: 'power', icon: '📚', label: 'El poder', desc: 'Quién manda y por qué',
        themes: ['poder', 'política'], next: 'time_commitment' },
      { id: 'justice', icon: '⭐', label: 'La justicia', desc: 'Lo correcto, el sistema',
        themes: ['justicia', 'ley', 'crimen'], next: 'time_commitment' },
      { id: 'violence', icon: '📚', label: 'La violencia', desc: 'Por qué nos destruimos',
        themes: ['violencia', 'guerra'], experiences: ['brutal', 'perturbador'], next: 'time_commitment' },
      { id: 'freedom', icon: '📚', label: 'La libertad', desc: 'Opresión y liberación',
        themes: ['libertad', 'revolución', 'resistencia'], next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: TENSIÃ“N âš¡
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  tension_type: {
    key: 'tension_type',
    question: 'Â¿Qué tipo de tensión?',
    hint: 'Tu dosis de adrenalina',
    options: [
      { id: 'crime', icon: '📚', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'detective', 'misterio'], moods: ['tenso'], next: 'crime_focus' },
      { id: 'horror', icon: '📚', label: 'Terror', desc: 'Miedo genuino',
        experiences: ['aterrador', 'inquietante'], moods: ['oscuro', 'inquietante'], next: 'horror_type' },
      { id: 'psychological', icon: '📚', label: 'Psicológica', desc: 'La mente bajo presión',
        vibes: ['psicológico'], themes: ['obsesión', 'locura', 'culpa'], next: 'time_commitment' },
      { id: 'action', icon: '📚', label: 'Vertiginosa', desc: 'Ritmo imparable',
        experiences: ['vertiginoso', 'absorbente', 'tenso'], vibes: ['aventura'], next: 'time_commitment' }
    ]
  },

  crime_focus: {
    key: 'crime_focus',
    question: 'Â¿Qué te atrae del crimen?',
    options: [
      { id: 'detective', icon: '📚', label: 'El detective', desc: 'Seguir la investigación',
        themes: ['detective'], vibes: ['policial'], next: 'time_commitment' },
      { id: 'criminal_mind', icon: '📚', label: 'El criminal', desc: 'Entender la mente oscura',
        themes: ['psicópata', 'obsesión'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'noir', icon: '📚', label: 'Atmósfera noir', desc: 'La ciudad, las sombras',
        vibes: ['noir'], moods: ['oscuro', 'tenso'], next: 'time_commitment' },
      { id: 'procedural', icon: '📚', label: 'Procedimiento', desc: 'El sistema, la ley',
        themes: ['justicia', 'policía'], next: 'time_commitment' }
    ]
  },

  horror_type: {
    key: 'horror_type',
    question: 'Â¿Qué tipo de terror?',
    options: [
      { id: 'supernatural', icon: '📚', label: 'Sobrenatural', desc: 'Fantasmas, demonios',
        moods: ['oscuro', 'inquietante'], next: 'time_commitment' },
      { id: 'psychological_horror', icon: '📚', label: 'Psicológico', desc: 'El horror en la mente',
        vibes: ['psicológico'], experiences: ['perturbador', 'inquietante'], next: 'time_commitment' },
      { id: 'cosmic', icon: '📚', label: 'Cósmico', desc: 'Lo incomprensible, Lovecraft',
        experiences: ['aterrador', 'onírico'], next: 'time_commitment' },
      { id: 'human_horror', icon: '📚', label: 'El horror humano', desc: 'Lo que somos capaces de hacer',
        experiences: ['brutal', 'perturbador'], themes: ['violencia'], next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: DESCUBRIR âœ¨
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  discover_type: {
    key: 'discover_type',
    question: 'Â¿Qué tipo de descubrimiento?',
    hint: 'La aventura de lo nuevo',
    options: [
      { id: 'hidden_gems', icon: '📚', label: 'Joyas ocultas', desc: 'Libros que nadie conoce',
        filter: { noAwards: true, lowProfile: true }, next: 'hidden_gem_type' },
      { id: 'classics', icon: '📚', label: 'Clásicos pendientes', desc: 'Los que todos conocen menos yo',
        filter: { hasAwards: true, canonical: true }, next: 'classic_type' },
      { id: 'new_voices', icon: '📚', label: 'Voces nuevas', desc: 'Autores contemporáneos',
        filter: { contemporary: true }, next: 'time_commitment' },
      { id: 'total_random', icon: '📚', label: 'Sorpresa total', desc: 'No me des opciones, elige tú',
        algorithm: 'random_quality', direct: true }
    ]
  },

  hidden_gem_type: {
    key: 'hidden_gem_type',
    question: 'Â¿De qué tipo?',
    hint: 'Joyas por descubrir',
    options: [
      { id: 'emotional', icon: '📚', label: 'Emocionales', experiences: ['conmovedor', 'devastador', 'íntimo'], next: 'time_commitment' },
      { id: 'thrilling', icon: '⭐', label: 'Trepidantes', experiences: ['tenso', 'absorbente', 'vertiginoso'], next: 'time_commitment' },
      { id: 'thoughtful', icon: '📚', label: 'Reflexivas', experiences: ['contemplativo', 'filosófico'], next: 'time_commitment' },
      { id: 'any_gem', icon: '⭐', label: 'Lo que sea', next: 'time_commitment' }
    ]
  },

  classic_type: {
    key: 'classic_type',
    question: 'Â¿Qué tipo de clásico?',
    options: [
      { id: 'nobel', icon: '📚', label: 'Premios Nobel', filter: { award: 'Nobel de Literatura' }, next: 'time_commitment' },
      { id: 'spanish', icon: '📚', label: 'Clásicos en español', filter: { award: 'Premio hispano importante' }, next: 'time_commitment' },
      { id: 'american', icon: '📚', label: 'Clásicos americanos', filter: { award: 'Pulitzer' }, next: 'time_commitment' },
      { id: 'any_classic', icon: '📚', label: 'Cualquier clásico', next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RAMA: REÃR ðŸŽ
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  laugh_type: {
    key: 'laugh_type',
    question: 'Â¿Qué tipo de humor?',
    hint: 'Hay muchas formas de reír',
    options: [
      { id: 'sardonic', icon: '📚', label: 'Sardónico', desc: 'Ironía mordaz',
        experiences: ['sardónico', 'irónico'], vibes: ['satírico'], next: 'time_commitment' },
      { id: 'light', icon: '📚', label: 'Ligero', desc: 'Simple diversión',
        moods: ['ligero', 'entretenido'], vibes: ['humor'], next: 'time_commitment' },
      { id: 'absurd', icon: '📚', label: 'Absurdo', desc: 'Lo ridículo de la vida',
        experiences: ['sardónico', 'agridulce'], next: 'time_commitment' },
      { id: 'bittersweet', icon: '📚', label: 'Agridulce', desc: 'Ríe mientras llora',
        experiences: ['agridulce'], next: 'time_commitment' }
    ]
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PREGUNTAS UNIVERSALES (NIVEL FINAL)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  time_commitment: {
    key: 'time_commitment',
    question: 'Â¿Cuánto tiempo puedes dedicar?',
    hint: 'Para las próximas semanas',
    options: [
      { id: 'afternoon', icon: '⭐', label: 'Una tarde', desc: 'Menos de 150 páginas',
        pages: { max: 150 }, difficulty: ['ligero'], next: 'series_preference' },
      { id: 'weekend', icon: '📚', label: 'Un fin de semana', desc: '150-300 páginas',
        pages: { min: 100, max: 300 }, difficulty: ['ligero', 'medio'], next: 'series_preference' },
      { id: 'weeks', icon: '📚', label: 'Unas semanas', desc: '300-500 páginas',
        pages: { min: 250, max: 500 }, next: 'series_preference' },
      { id: 'project', icon: '📚', label: 'Un proyecto', desc: 'Más de 500 páginas',
        pages: { min: 450 }, next: 'series_preference' }
    ]
  },

  series_preference: {
    key: 'series_preference',
    question: 'Â¿Serie o libro único?',
    hint: 'Â¿Quieres compromiso a largo plazo?',
    options: [
      { id: 'standalone', icon: '📚', label: 'Libro único', desc: 'Empieza y termina',
        standalone: true, next: 'difficulty_preference' },
      { id: 'series', icon: '📚', label: 'Parte de una serie', desc: 'Me gusta cuando hay más',
        wantsSeries: true, next: 'difficulty_preference' },
      { id: 'either', icon: '📚', label: 'Me da igual', next: 'difficulty_preference' }
    ]
  },

  difficulty_preference: {
    key: 'difficulty_preference',
    question: 'Â¿Qué nivel de desafío?',
    hint: 'Tu zona de confort literaria',
    options: [
      { id: 'easy', icon: '📚', label: 'Lectura fluida', desc: 'Que fluya sin esfuerzo',
        difficulty: ['ligero'], moods: ['entretenido', 'ligero'], next: 'risk_preference' },
      { id: 'medium', icon: '⭐', label: 'Equilibrado', desc: 'Ni muy fácil ni muy difícil',
        difficulty: ['medio'], next: 'risk_preference' },
      { id: 'challenging', icon: '📚', label: 'Desafiante', desc: 'Quiero que me exija',
        difficulty: ['denso'], vibes: ['filosófico'], next: 'risk_preference' }
    ]
  },

  risk_preference: {
    key: 'risk_preference',
    question: 'Â¿Cuánto quieres arriesgarte?',
    hint: 'La última pregunta',
    options: [
      { id: 'safe', icon: '📚', label: 'Zona segura', desc: 'Algo que probablemente me guste',
        riskLevel: 'safe', boost: { awards: true, known: true } },
      { id: 'curious', icon: '📚', label: 'Curioso', desc: 'Abierto a sorpresas',
        riskLevel: 'balanced' },
      { id: 'adventurous', icon: '📚', label: 'Aventurero', desc: 'Territorio desconocido',
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
  
  // Pregunta actual basada en el path
  const currentQuestionKey = path[path.length - 1];
  const currentQuestion = WIZARD_QUESTIONS[currentQuestionKey];
  const isComplete = !currentQuestion || currentQuestion.key === 'risk_preference' && answers[currentQuestion.key];
  
  // Contar preguntas respondidas
  const questionsAnswered = Object.keys(answers).length;
  const estimatedTotal = Math.min(8, questionsAnswered + 3); // Estimación dinámica
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SISTEMA DE SCORING NUEVO
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // MATCH DIRECTO (0-120 puntos) - LO MÃS IMPORTANTE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
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
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FILTROS DUROS (Penalización o Descalificación)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
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
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CALIDAD (Reducido: 0-15 puntos máximo)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
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
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FACTOR DESCUBRIMIENTO (0-25 puntos)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
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
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ALEATORIEDAD CONTROLADA (0-20 puntos)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    score += Math.random() * 20;
    
    return { score: Math.max(0, score), matchDetails };
  }, [hooks, preferences]);
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // OBTENER RECOMENDACIONES CON POOL DIVERSIFICADO
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // GENERAR RAZÃ“N PERSONALIZADA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MANEJAR SELECCIÃ“N DE OPCIÃ“N
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSelect = (option) => {
    haptic.medium();
    
    // Guardar respuesta
    const newAnswers = { ...answers, [currentQuestion.key]: option.id };
    setAnswers(newAnswers);
    
    // Acumular preferencias de esta opción
    const newPrefs = { ...preferences };
    
    if (option.themes) {
      newPrefs.themes = [...(newPrefs.themes || []), ...option.themes];
    }
    if (option.experiences) {
      newPrefs.experiences = [...(newPrefs.experiences || []), ...option.experiences];
    }
    if (option.vibes) {
      newPrefs.vibes = [...(newPrefs.vibes || []), ...option.vibes];
    }
    if (option.moods) {
      newPrefs.moods = [...(newPrefs.moods || []), ...option.moods];
    }
    if (option.keywords) {
      newPrefs.keywords = [...(newPrefs.keywords || []), ...option.keywords];
    }
    if (option.pages) {
      newPrefs.pages = option.pages;
    }
    if (option.difficulty) {
      newPrefs.difficulty = option.difficulty;
    }
    if (option.standalone !== undefined) {
      newPrefs.standalone = option.standalone;
    }
    if (option.wantsSeries !== undefined) {
      newPrefs.wantsSeries = option.wantsSeries;
    }
    if (option.riskLevel) {
      newPrefs.riskLevel = option.riskLevel;
    }
    if (option.filter) {
      newPrefs.filter = option.filter;
    }
    if (option.boost) {
      newPrefs.boost = option.boost;
    }
    
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
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER: Resultado
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: t.overlay,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.25s ease'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '440px',
            borderRadius: '24px',
            background: t.glass?.bgStrong || t.bg.elevated,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: `1px solid ${t.glass?.border || t.border.subtle}`,
            boxShadow: t.glass?.shadowElevated || '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden'
          }}
        >
          {/* Header con gradiente */}
          <div style={{ 
            background: t.gradient?.subtle || `linear-gradient(180deg, ${t.accent}10, transparent)`,
            padding: '24px 24px 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: t.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tu próxima lectura
              </p>
              <button onClick={onClose} style={{ 
                background: t.glass?.bg || 'transparent', border: 'none', 
                color: t.text.tertiary, fontSize: '20px', cursor: 'pointer',
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>âœ•</button>
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
                  fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 600,
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
                        â˜… {award.replace('Premio hispano importante', 'Premio literario')}
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
                  POR QUÃ‰ ENCAJA CONTIGO:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {reason.whyMatches.map((match, i) => (
                    <span key={i} style={{
                      fontSize: '13px', padding: '6px 12px',
                      background: t.bg.secondary,
                      borderRadius: '20px', color: t.text.secondary
                    }}>
                      âœ“ {match}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Perfect for */}
            {reason.perfectFor && (
              <p style={{ fontSize: '13px', color: t.text.secondary, marginBottom: '16px' }}>
                <span style={{ color: t.accent }}>ðŸ‘¤</span> Perfecto para: {reason.perfectFor}
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
                ðŸ“– Lo leo ahora
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
                  Otro â†’
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
              â† Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER: Preguntas
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (!currentQuestion) return null;
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          borderRadius: '24px', padding: '28px',
          background: t.glass?.bgStrong || t.bg.elevated,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${t.glass?.border || t.border.subtle}`,
          boxShadow: t.glass?.shadowElevated || '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
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
              â† Atrás
            </button>
          ) : <div />}
          <button onClick={onClose} style={{ 
            background: t.glass?.bg || 'transparent', border: 'none', 
            color: t.text.tertiary, fontSize: '18px', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>âœ•</button>
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
          fontFamily: 'Georgia, serif',
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
                  <span style={{ color: t.accent, fontSize: '18px' }}>âœ“</span>
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
  const [activeTab, setActiveTab] = useState('library');
  const [sanctuaryMode, setSanctuaryMode] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    difficulty: null,
    hasAwards: false,
    mood: null,
    experience: null,
    moment: null,
    theme: null
  });
  
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const t = THEMES[theme];
  const isMobile = useIsMobile();
  
  // Contar libros guardados
  const savedCount = useMemo(() => Object.keys(lists).length, [lists]);
  
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
  
  // Reset visible count
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [debouncedSearch, filters.difficulty, filters.hasAwards, filters.mood]);
  
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
      // Filtro por colección
      if (selectedCollection && !selectedCollection.bookIds.includes(book.id)) return false;
      
      // Búsqueda por texto
      if (searchLower) {
        const title = (book.t || book.title || '').toLowerCase();
        const authors = (book.a || book.authors || []).join(' ').toLowerCase();
        if (!title.includes(searchLower) && !authors.includes(searchLower)) return false;
      }
      
      // Filtros clásicos
      if (filters.difficulty && (book.d || book.difficulty) !== filters.difficulty) return false;
      if (filters.hasAwards && (book.aw || book.awards || []).length === 0) return false;
      if (filters.mood && book.m !== filters.mood) return false;
      
      // FILTROS CON ALMA
      const bookMood = book.m;
      const bookVibes = book.v || [];
      const bookPages = book.pg || 300;
      
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
          if (!vibeMatch && !moodMatch) return false;
        }
      }
      
      return true;
    });
  }, [books, debouncedSearch, filters, selectedCollection]);
  
  const visibleBooks = useMemo(() => filteredBooks.slice(0, visibleCount), [filteredBooks, visibleCount]);
  
  // Estantes narrativos basados en hooks
  const narrativeShelves = useMemo(() => {
    if (viewMode !== 'curated' || selectedCollection) return null;
    
    // Solo trabajamos con libros que tienen hooks
    const booksWithHooks = books.filter(b => hooks[String(b.id)]);
    
    if (booksWithHooks.length === 0) return null;
    
    // Hero: libro aleatorio con hook (cambia cada render)
    const heroIndex = Math.floor(Math.random() * booksWithHooks.length);
    const heroBook = booksWithHooks[heroIndex];
    const heroHook = hooks[String(heroBook.id)];
    
    // "Libros que cambiaron todo" - con why_matters fuerte
    const changedEverything = booksWithHooks
      .filter(b => {
        const h = hooks[String(b.id)];
        return h?.why_matters && h.why_matters.length > 50;
      })
      .filter(b => b.id !== heroBook.id)
      .slice(0, 8);
    
    // "Para una tarde" - cortos (<300pp) con hook
    const forAnAfternoon = booksWithHooks
      .filter(b => (b.pg || 300) < 300)
      .filter(b => b.id !== heroBook.id)
      .slice(0, 8);
    
    // "No podrás soltarlo" - intensos, absorbentes
    const cantPutDown = booksWithHooks
      .filter(b => {
        const h = hooks[String(b.id)];
        return ['absorbente', 'perturbador', 'tenso', 'intrigante', 'vertiginoso', 'hipnótico'].includes(h?.experience);
      })
      .filter(b => b.id !== heroBook.id)
      .slice(0, 8);
    
    // "Viaje interior" - contemplativos, íntimos
    const innerJourney = booksWithHooks
      .filter(b => {
        const h = hooks[String(b.id)];
        return ['contemplativo', 'melancólico', 'íntimo', 'nostálgico', 'evocador', 'trascendente'].includes(h?.experience);
      })
      .filter(b => b.id !== heroBook.id)
      .slice(0, 8);
    
    return { 
      heroBook, 
      heroHook,
      changedEverything, 
      forAnAfternoon, 
      cantPutDown, 
      innerJourney 
    };
  }, [books, hooks, viewMode, selectedCollection]);
  
  const moods = useMemo(() => {
    const moodSet = new Set(books.map(b => b.m).filter(Boolean));
    return Array.from(moodSet).sort();
  }, [books]);
  
  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredBooks.length));
  }, [filteredBooks.length]);
  
  const hasFiltersActive = filters.difficulty || filters.mood || filters.hasAwards || 
    filters.experience || filters.moment || filters.theme || debouncedSearch;
  
  // CSS global para animaciones - Estilo Apple
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* ============================================
         MICROINTERACCIONES - Estilo Apple
         ============================================ */
      
      /* Animaciones base con curvas Apple */
      @keyframes fadeIn { 
        from { opacity: 0; } 
        to { opacity: 1; } 
      }
      
      @keyframes slideUp { 
        from { opacity: 0; transform: translateY(100%); } 
        to { opacity: 1; transform: translateY(0); } 
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes scaleIn { 
        from { opacity: 0; transform: scale(0.9); } 
        to { opacity: 1; transform: scale(1); } 
      }
      
      @keyframes scaleInBounce {
        0% { opacity: 0; transform: scale(0.8); }
        70% { transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes shimmer { 
        0% { background-position: -200% 0; } 
        100% { background-position: 200% 0; } 
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      @keyframes gentleBounce {
        0% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
        100% { transform: translateY(0); }
      }
      
      @keyframes ripple {
        0% { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(4); opacity: 0; }
      }
      
      /* Variables de timing Apple */
      :root {
        --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
        --ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
        --spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        --duration-fast: 150ms;
        --duration-normal: 250ms;
        --duration-slow: 400ms;
      }
      
      /* Reset y base */
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0;
        -webkit-tap-highlight-color: transparent;
      }
      
      html, body, #root { min-height: 100vh; }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        touch-action: manipulation;
      }
      
      /* Scrollbar elegante */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { 
        background: rgba(128,128,128,0.3); 
        border-radius: 3px;
        transition: background 0.2s ease;
      }
      ::-webkit-scrollbar-thumb:hover { 
        background: rgba(128,128,128,0.5); 
      }
      
      /* ============================================
         CLASES TÃCTILES REUTILIZABLES
         ============================================ */
      
      /* Touchable base - se encoge al presionar */
      .touchable {
        transition: transform var(--duration-fast) var(--ease-out-expo),
                    opacity var(--duration-fast) ease;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      }
      
      .touchable:active {
        transform: scale(0.97);
        opacity: 0.9;
      }
      
      /* Touchable suave - menos pronunciado */
      .touchable-soft:active {
        transform: scale(0.985);
        opacity: 0.95;
      }
      
      /* Touchable con bounce al soltar */
      .touchable-bounce {
        transition: transform var(--duration-normal) var(--spring);
      }
      
      .touchable-bounce:active {
        transform: scale(0.95);
      }
      
      /* Card con elevación al hover */
      .card-hover {
        transition: transform var(--duration-normal) var(--ease-out-expo),
                    box-shadow var(--duration-normal) ease;
      }
      
      .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      }
      
      .card-hover:active {
        transform: translateY(0) scale(0.98);
      }
      
      /* Botón con ripple */
      .btn-ripple {
        position: relative;
        overflow: hidden;
      }
      
      .btn-ripple::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        transform: scale(0);
        opacity: 0;
        pointer-events: none;
      }
      
      .btn-ripple:active::after {
        animation: ripple 0.4s ease-out;
      }
      
      /* Cover de libro con zoom suave */
      .book-cover {
        transition: transform var(--duration-normal) var(--ease-out-expo),
                    box-shadow var(--duration-normal) ease;
      }
      
      .book-cover:hover {
        transform: scale(1.03);
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      }
      
      .book-cover:active {
        transform: scale(0.98);
      }
      
      /* Chip/Tag interactivo */
      .chip-interactive {
        transition: all var(--duration-fast) var(--ease-out-expo);
      }
      
      .chip-interactive:hover {
        transform: translateY(-1px);
      }
      
      .chip-interactive:active {
        transform: scale(0.95);
      }
      
      /* Modal sheet con slide suave */
      .modal-sheet {
        animation: slideUp var(--duration-slow) var(--ease-out-expo);
      }
      
      .modal-overlay {
        animation: fadeIn var(--duration-normal) ease;
      }
      
      /* Stagger animation para listas */
      .stagger-item {
        opacity: 0;
        animation: fadeIn var(--duration-normal) var(--ease-out-expo) forwards;
      }
      
      .stagger-item:nth-child(1) { animation-delay: 0ms; }
      .stagger-item:nth-child(2) { animation-delay: 50ms; }
      .stagger-item:nth-child(3) { animation-delay: 100ms; }
      .stagger-item:nth-child(4) { animation-delay: 150ms; }
      .stagger-item:nth-child(5) { animation-delay: 200ms; }
      .stagger-item:nth-child(6) { animation-delay: 250ms; }
      .stagger-item:nth-child(7) { animation-delay: 300ms; }
      .stagger-item:nth-child(8) { animation-delay: 350ms; }
      
      /* Focus visible para accesibilidad */
      :focus-visible {
        outline: 2px solid rgba(100, 150, 255, 0.5);
        outline-offset: 2px;
      }
      
      /* Skeleton loading */
      .skeleton {
        background: linear-gradient(90deg, 
          rgba(128,128,128,0.1) 25%, 
          rgba(128,128,128,0.2) 50%, 
          rgba(128,128,128,0.1) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }
      
      /* Prevent text selection on interactive elements */
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>ðŸ“š</div>
        <p style={{ fontSize: '14px', color: t.text.secondary }}>{COPY.loading}</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: t.bg.primary, 
      transition: 'background 0.3s ease',
      paddingBottom: isMobile && !sanctuaryMode ? '80px' : '0'
    }}>
      {/* Header (oculto en modo santuario) */}
      {!sanctuaryMode && (
        <header style={{ 
          position: 'sticky', top: 0, zIndex: 50,
          background: t.bg.primary,
          borderBottom: `1px solid ${t.border.subtle}`,
          padding: '16px',
          transition: 'background 0.3s ease'
        }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              {/* Logo - Click para volver a Home */}
              <div 
                onClick={() => { 
                  setActiveTab('library'); 
                  setViewMode('curated');
                  setFilters({ search: '', difficulty: null, hasAwards: false, mood: null, experience: null, moment: null, theme: null });
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
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                title="Volver al inicio"
              >
                <span style={{ fontSize: '28px' }}>ðŸ“š</span>
                <div>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 600, color: t.text.primary }}>NextRead</h1>
                  <p style={{ fontSize: '12px', color: t.text.tertiary }}>{books.length} libros</p>
                </div>
              </div>
              
              {/* Búsqueda (solo si estamos en biblioteca) */}
              {activeTab === 'library' && (
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  style={{
                    flex: 1,
                    maxWidth: '300px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${t.border.default}`,
                    background: t.bg.secondary,
                    color: t.text.primary,
                    fontSize: '14px',
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
                    borderRadius: '10px',
                    border: 'none',
                    background: t.bg.tertiary,
                    color: t.text.secondary,
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={COPY.sanctuary.enter}
                >
                  â—¯
                </button>
                
                {/* Theme toggle */}
                <button 
                  onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    border: 'none',
                    background: t.bg.tertiary,
                    color: t.text.secondary,
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title={THEMES[theme === 'night' ? 'day' : 'night'].name}
                >
                  {THEMES[theme].icon}
                </button>
                
                {/* Stats (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => setShowStats(true)}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      background: t.bg.tertiary,
                      color: t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Estadísticas"
                  >
                    â—”
                  </button>
                )}
                
                {/* Autores (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => setActiveTab('authors')}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'authors' ? t.accentMuted : t.bg.tertiary,
                      color: activeTab === 'authors' ? t.accent : t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Autores"
                  >
                    ðŸ‘¤
                  </button>
                )}
                
                {/* Filtros (solo en biblioteca) */}
                {activeTab === 'library' && (
                  <button 
                    onClick={() => setShowFilters(true)}
                    style={{
                      width: '40px', height: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      background: hasFiltersActive ? t.accentMuted : t.bg.tertiary,
                      color: hasFiltersActive ? t.accent : t.text.secondary,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    âš™
                  </button>
                )}
                
                {/* Wizard (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => { setShowWizard(true); haptic.medium(); }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: t.gradient?.accent || t.accent,
                      color: t.bg.primary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: `0 4px 14px ${t.accent}40`,
                      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={e => { 
                      e.target.style.transform = 'translateY(-2px)'; 
                      e.target.style.boxShadow = `0 6px 20px ${t.accent}50`;
                    }}
                    onMouseLeave={e => { 
                      e.target.style.transform = 'translateY(0)'; 
                      e.target.style.boxShadow = `0 4px 14px ${t.accent}40`;
                    }}
                  >
                    Â¿Qué leo?
                  </button>
                )}
              </div>
            </div>
            
            {/* Búsqueda móvil */}
            {isMobile && activeTab === 'library' && (
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${t.border.default}`,
                  background: t.bg.secondary,
                  color: t.text.primary,
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            )}
            
            {/* Toggle Curado/Archivo (solo en biblioteca) */}
            {activeTab === 'library' && (
              <div style={{ 
                display: 'flex', gap: '4px', 
                marginTop: '16px', padding: '4px',
                borderRadius: '10px',
                background: t.bg.secondary
              }}>
                <button
                  onClick={() => setViewMode('curated')}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'curated' ? t.bg.elevated : 'transparent',
                    color: viewMode === 'curated' ? t.text.primary : t.text.tertiary,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: viewMode === 'curated' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {COPY.curated}
                </button>
                <button
                  onClick={() => setViewMode('archive')}
                  style={{
                    flex: 1, padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: viewMode === 'archive' ? t.bg.elevated : 'transparent',
                    color: viewMode === 'archive' ? t.text.primary : t.text.tertiary,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: viewMode === 'archive' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
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
        padding: sanctuaryMode ? '48px 16px' : '24px 16px 64px'
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
        
        {/* VISTA BIBLIOTECA */}
        {!sanctuaryMode && activeTab === 'library' && (
          <>
            {/* Colecciones */}
            {!hasFiltersActive && (
              <CollectionsSection 
                collections={collections}
                selectedCollection={selectedCollection}
                onSelectCollection={setSelectedCollection}
                theme={theme}
              />
            )}
            
            {/* Header de colección seleccionada */}
            {selectedCollection && (
              <CollectionHeader 
                collection={selectedCollection}
                onClear={() => setSelectedCollection(null)}
                theme={theme}
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
                
                {/* Estante: Libros que cambiaron todo */}
                {narrativeShelves.changedEverything.length > 0 && (
                  <NarrativeShelf 
                    title="Libros que cambiaron todo"
                    subtitle="Obras que revolucionaron la literatura"
                    books={narrativeShelves.changedEverything}
                    hooks={hooks}
                    onBookClick={setSelectedBook}
                    theme={theme}
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
                  />
                )}
                
                {/* Colecciones destacadas */}
                <FeaturedCollections 
                  collections={collections}
                  onSelect={setSelectedCollection}
                  theme={theme}
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
            onCollectionClick={setSelectedCollection}
            theme={theme}
          />
        )}
        
        {/* VISTA DETALLE DE COLECCIÃ“N */}
        {!sanctuaryMode && activeTab === 'collections' && selectedCollection && (
          <CollectionDetailView
            collection={selectedCollection}
            books={books}
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
          onClose={() => setShowFilters(false)}
          theme={theme}
        />
      )}
      
      {showStats && (
        <StatsModal books={books} onClose={() => setShowStats(false)} theme={theme} />
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
