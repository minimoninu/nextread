import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================
const BOOKS_URL = '/biblioteca_app.json';
const AUTHORS_URL = '/authors.json';
const COLLECTIONS_URL = '/collections.json';
const HOOKS_URL = '/hooks.json';
const INITIAL_LOAD = 42;
const LOAD_MORE_COUNT = 21;

// =============================================================================
// TEMAS - Quiet Material Library
// =============================================================================
const THEMES = {
  night: {
    name: 'Nocturno',
    icon: '☀',
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
    overlay: 'rgba(26, 25, 23, 0.92)',
    success: '#7d9a6d',
  },
  day: {
    name: 'Día',
    icon: '☾',
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
    overlay: 'rgba(248, 246, 241, 0.95)',
    success: '#5a7a5a',
  }
};

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
  
  const t = THEMES[theme];
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const hasAward = (book.aw || book.awards || []).length > 0;
  
  // Tamaño más grande en modo santuario
  const size = sanctuary ? { width: '140px', height: '210px' } : { width: '120px', height: '180px' };
  
  return (
    <div 
      ref={ref}
      onClick={() => onClick?.(book)}
      style={{
        ...size,
        flexShrink: 0,
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        background: t.bg.tertiary,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
    >
      {/* Skeleton */}
      {(!isVisible || (!imgLoaded && !imgError)) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, ${t.bg.secondary} 0%, ${t.bg.tertiary} 50%, ${t.bg.secondary} 100%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite'
        }} />
      )}
      
      {/* Imagen */}
      {isVisible && !imgError && (
        <img 
          src={coverUrl}
          alt={title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      
      {/* Fallback */}
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
      
      {/* Indicador (solo si no es santuario) */}
      {!sanctuary && (hasAward || listStatus) && (
        <div style={{
          position: 'absolute', bottom: '6px', right: '6px',
          width: '18px', height: '18px',
          borderRadius: '50%',
          background: listStatus === 'reading' ? t.accent : 
                     listStatus === 'read' ? t.success : 
                     listStatus === 'want' ? '#5a7a8a' : t.accent,
          color: t.bg.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {listStatus === 'reading' ? '◐' : listStatus === 'read' ? '✓' : listStatus === 'want' ? '○' : '★'}
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
          ✨ Tu libro de hoy
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
                ✨ {hook.experience}
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
    { id: 'collections', icon: '📑', label: COPY.tabs.collections },
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
      ✕
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
            ✕ Ver todo
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
          title={`✓ ${COPY.saved.read} (${savedBooks.read.length})`}
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
  
  // Contar libros por colección
  const getCollectionCount = (collection) => {
    const criteria = collection.criteria;
    return books.filter(book => {
      const authors = book.a || book.authors || [];
      const awards = book.aw || book.awards || [];
      const vibes = book.v || book.vibes || [];
      const series = book.s || book.series;
      const pages = book.pg || book.pages || 300;
      const difficulty = book.d || book.difficulty || 'medio';
      
      if (criteria.authors && criteria.authors.some(a => authors.includes(a))) return true;
      if (criteria.awards && criteria.awards.some(a => awards.some(aw => aw.includes(a)))) return true;
      if (criteria.vibes && criteria.vibes.some(v => vibes.includes(v))) return true;
      if (criteria.series && series === criteria.series) return true;
      if (criteria.difficulty && difficulty === criteria.difficulty) {
        if (criteria.maxPages && pages > criteria.maxPages) return false;
        return true;
      }
      if (criteria.maxPages && !criteria.difficulty && pages <= criteria.maxPages) return true;
      if (criteria.minPages && pages >= criteria.minPages) return true;
      
      return false;
    }).length;
  };
  
  // Agrupar colecciones por tipo
  const grouped = {
    regions: collections.filter(c => ['🇫🇷', '🇺🇸', '🇪🇸', '🇷🇺', '🇯🇵', '🇮🇹', '🇬🇧'].includes(c.emoji)),
    awards: collections.filter(c => ['🏆', '📚', '🎖️'].includes(c.emoji)),
    genres: collections.filter(c => ['🔍', '✨', '🏛️', '🚀', '📝', '😄'].includes(c.emoji)),
    series: collections.filter(c => ['🥸', '🕵️', '🦁'].includes(c.emoji)),
    difficulty: collections.filter(c => ['☀️', '🧠', '⚡', '📖'].includes(c.emoji))
  };
  
  const Section = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontFamily: 'Georgia, serif', 
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
const CollectionDetailView = ({ collection, books, onBookClick, onBack, theme, getListStatus }) => {
  const t = THEMES[theme];
  
  // Filtrar libros según criterios
  const filteredBooks = useMemo(() => {
    const criteria = collection.criteria;
    return books.filter(book => {
      const authors = book.a || book.authors || [];
      const awards = book.aw || book.awards || [];
      const vibes = book.v || book.vibes || [];
      const series = book.s || book.series;
      const pages = book.pg || book.pages || 300;
      const difficulty = book.d || book.difficulty || 'medio';
      
      if (criteria.authors && criteria.authors.some(a => authors.includes(a))) return true;
      if (criteria.awards && criteria.awards.some(a => awards.some(aw => aw.includes(a)))) return true;
      if (criteria.vibes && criteria.vibes.some(v => vibes.includes(v))) return true;
      if (criteria.series && series === criteria.series) return true;
      if (criteria.difficulty && difficulty === criteria.difficulty) {
        if (criteria.maxPages && pages > criteria.maxPages) return false;
        return true;
      }
      if (criteria.maxPages && !criteria.difficulty && pages <= criteria.maxPages) return true;
      if (criteria.minPages && pages >= criteria.minPages) return true;
      
      return false;
    });
  }, [collection, books]);
  
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
              fontFamily: 'Georgia, serif', 
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
                  {listStatus === 'want' ? '♡' : listStatus === 'reading' ? '📖' : '✓'}
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
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px 20px 0 0',
          background: t.bg.elevated,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: t.bg.tertiary,
              color: t.text.secondary,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{
              width: '100px', height: '150px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
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
                  👤 {bookHook.perfect_for}
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
                  ✨ {bookHook.experience}
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
                💡 {bookHook.why_matters}
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
                👤 <strong style={{ color: t.text.secondary }}>Ideal para:</strong> {idealFor}
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
                {synopsisExpanded ? '← Ver menos' : 'Ver más →'}
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
        
        {/* Acciones */}
        <div style={{ 
          padding: '20px 24px 32px', 
          borderTop: `1px solid ${t.border.subtle}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button 
            onClick={() => handleListClick('reading')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: t.accent,
              color: t.bg.primary,
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: currentList === 'reading' ? 1 : 0.9
            }}
          >
            {currentList === 'reading' ? '◐ Leyendo' : COPY.readNow}
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => handleListClick('want')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${t.border.default}`,
                background: currentList === 'want' ? '#5a7a8a' : t.bg.tertiary,
                color: currentList === 'want' ? t.bg.primary : t.text.secondary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {currentList === 'want' ? '○ En lista' : COPY.readLater}
            </button>
            <button 
              onClick={() => handleListClick('read')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${t.border.default}`,
                background: currentList === 'read' ? t.success : t.bg.tertiary,
                color: currentList === 'read' ? t.bg.primary : t.text.secondary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {currentList === 'read' ? '✓ Leído' : COPY.alreadyRead}
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
    if (filters.difficulty) parts.push(`⚡ ${filters.difficulty}`);
    if (filters.hasAwards) parts.push('🏆 premiados');
    return parts.join(' · ');
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
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '20px 20px 0 0',
          background: t.bg.elevated,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${t.border.subtle}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: t.text.primary }}>
              Encuentra tu libro
            </h3>
            <button onClick={onClose} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '20px', cursor: 'pointer' 
            }}>✕</button>
          </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: t.bg.tertiary, borderRadius: '24px', padding: '4px' }}>
            <SectionTab id="experience" label="Sentir" active={activeSection === 'experience'} />
            <SectionTab id="moment" label="Momento" active={activeSection === 'moment'} />
            <SectionTab id="theme" label="Tema" active={activeSection === 'theme'} />
            <SectionTab id="classic" label="Clásicos" active={activeSection === 'classic'} />
          </div>
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Resumen de filtros activos */}
          {hasAnyFilter && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}05)`,
              marginBottom: '20px',
              borderLeft: `3px solid ${t.accent}`
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
                  🏆 Solo premiados
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
          }}>✕</button>
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
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '20px',
          background: t.bg.elevated,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '24px 24px 0', 
          position: 'sticky', 
          top: 0, 
          background: t.bg.elevated,
          borderRadius: '20px 20px 0 0',
          zIndex: 1
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
                  {data.years} · {data.nationality}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ 
              background: t.bg.tertiary, border: 'none', 
              color: t.text.secondary, fontSize: '16px', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
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
                        ★ {award}
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
  
  const themeEmojis = {
    amor: '❤️', muerte: '💀', familia: '👨‍👩‍👧', memoria: '🧠', identidad: '🪞',
    guerra: '⚔️', poder: '👑', soledad: '🌙', viaje: '🧭', tiempo: '⏳',
    naturaleza: '🌿', arte: '🎨', música: '🎵', política: '🏛️', ciencia: '🔬',
    religión: '✝️', locura: '🌀', venganza: '🔥', infancia: '🧒', vejez: '👴',
    amistad: '🤝', traición: '🗡️', libertad: '🕊️', supervivencia: '🏕️', obsesión: '👁️',
    pérdida: '🥀', redención: '🌅', destino: '⭐', violencia: '💥', escritura: '✍️',
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: t.overlay,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          background: t.bg.primary,
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: t.border.strong }} />
        </div>
        
        {/* Header */}
        <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '40px', marginBottom: '8px', display: 'block' }}>
            {themeEmojis[themeName] || '📚'}
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
                  ✨ {experience}
                </span>
                <span style={{ fontSize: '11px', color: t.text.muted }}>({expBooks.length})</span>
                {experience !== 'otros' && <span style={{ fontSize: '14px', color: t.text.muted, marginLeft: 'auto' }}>›</span>}
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
  
  const experienceEmojis = {
    devastador: '💔', perturbador: '😰', melancólico: '🌧️', nostálgico: '🕰️',
    épico: '⚔️', monumental: '🏛️', absorbente: '🌀', hipnótico: '👁️',
    tenso: '😬', vertiginoso: '🎢', brutal: '💀', desgarrador: '😢',
    conmovedor: '🥺', íntimo: '💭', reflexivo: '🤔', filosófico: '🧠',
    sardónico: '😏', irónico: '🎭', divertido: '😄', luminoso: '☀️',
    onírico: '🌙', misterioso: '🔮', aterrador: '😱', inquietante: '👻',
    agridulce: '🍋', contemplativo: '🧘', sombrío: '🌑', visceral: '💥'
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
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '24px 24px 0 0',
          background: t.bg.primary,
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: t.border.strong }} />
        </div>
        
        {/* Header */}
        <div style={{ 
          padding: '0 24px 24px',
          textAlign: 'center',
          borderBottom: `1px solid ${t.border.subtle}`
        }}>
          <span style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }}>
            {experienceEmojis[experience] || '✨'}
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
// COMPONENTE: Wizard
// =============================================================================
const WIZARD_STEPS = [
  {
    key: 'intention',
    question: '¿Qué buscas en tu próxima lectura?',
    hint: 'Sé honesto, no hay respuesta correcta',
    options: [
      { id: 'escape', label: 'Escapar', icon: '🚀', desc: 'Perderme en otro mundo', vibes: ['imaginativo', 'especulativo', 'inmersivo'], experiences: ['épico', 'fabuloso', 'onírico'] },
      { id: 'feel', label: 'Sentir', icon: '💔', desc: 'Conectar emocionalmente', vibes: ['emotivo', 'íntimo', 'dramático'], experiences: ['devastador', 'catártico', 'desgarrador'] },
      { id: 'think', label: 'Pensar', icon: '🧠', desc: 'Reflexionar sobre la vida', vibes: ['reflexivo', 'filosófico'], experiences: ['contemplativo', 'denso', 'erudito'] },
      { id: 'thrill', label: 'Tensión', icon: '⚡', desc: 'Adrenalina y suspense', vibes: ['tenso', 'oscuro', 'noir'], experiences: ['perturbador', 'intrigante', 'absorbente'] },
      { id: 'learn', label: 'Aprender', icon: '📚', desc: 'Descubrir algo nuevo', vibes: ['histórico', 'realista'], experiences: ['revelador', 'erudito', 'monumental'] }
    ]
  },
  {
    key: 'experience',
    question: '¿Qué tipo de experiencia quieres?',
    hint: 'Cómo quieres sentirte al leer',
    options: [
      { id: 'intense', label: 'Intensa', icon: '🔥', desc: 'Que no pueda soltarlo', keywords: ['devastador', 'perturbador', 'visceral', 'absorbente'] },
      { id: 'peaceful', label: 'Serena', icon: '🌊', desc: 'Que me dé calma', keywords: ['contemplativo', 'melancólico', 'sereno', 'evocador'] },
      { id: 'challenging', label: 'Desafiante', icon: '🏔️', desc: 'Que me haga crecer', keywords: ['monumental', 'denso', 'erudito', 'trascendente'] },
      { id: 'fun', label: 'Ligera', icon: '✨', desc: 'Que me entretenga', keywords: ['delicioso', 'sardónico', 'agridulce', 'irónico'] }
    ]
  },
  {
    key: 'time',
    question: '¿Cuánto tiempo tienes para leer?',
    hint: 'Para las próximas semanas',
    options: [
      { id: 'quick', label: 'Poco', icon: '⏱️', maxPages: 250, desc: 'Menos de 250 páginas' },
      { id: 'normal', label: 'Normal', icon: '📖', maxPages: 400, desc: '250-400 páginas' },
      { id: 'plenty', label: 'Mucho', icon: '📚', maxPages: 600, desc: '400-600 páginas' },
      { id: 'unlimited', label: 'Ilimitado', icon: '🌌', maxPages: 9999, desc: 'Dame tu mejor épica' }
    ]
  },
  {
    key: 'mood',
    question: '¿Qué atmósfera prefieres?',
    hint: 'El tono general del libro',
    options: [
      { id: 'dark', label: 'Oscura', icon: '🌑', vibes: ['oscuro', 'noir', 'gótico', 'tenso'] },
      { id: 'warm', label: 'Cálida', icon: '🌅', vibes: ['emotivo', 'íntimo', 'nostálgico'] },
      { id: 'cerebral', label: 'Cerebral', icon: '🔮', vibes: ['reflexivo', 'filosófico', 'especulativo'] },
      { id: 'vivid', label: 'Vívida', icon: '🎨', vibes: ['imaginativo', 'inmersivo', 'sensorial'] }
    ]
  },
  {
    key: 'risk',
    question: '¿Cuánto riesgo quieres tomar?',
    hint: 'Zona de confort vs. territorio nuevo',
    options: [
      { id: 'safe', label: 'Seguro', icon: '🏠', desc: 'Algo accesible y reconfortante', difficulty: 'ligero' },
      { id: 'balanced', label: 'Equilibrado', icon: '⚖️', desc: 'Un poco de reto, pero disfrutable', difficulty: 'medio' },
      { id: 'adventurous', label: 'Aventurero', icon: '🗺️', desc: 'Lléname a territorio desconocido', difficulty: 'denso' }
    ]
  }
];

const Wizard = ({ books, hooks, onSelect, onClose, theme }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [resultIndex, setResultIndex] = useState(0);
  const [recommendation, setRecommendation] = useState(null);
  
  const t = THEMES[theme];
  const currentStep = WIZARD_STEPS[step];
  const isLastStep = step === WIZARD_STEPS.length - 1;
  
  // Generar razón personalizada de por qué se recomienda
  const generateReason = useCallback((book, score, matchDetails) => {
    const reasons = [];
    const bookHook = hooks[String(book.id)];
    
    if (matchDetails.hasHook && bookHook) {
      reasons.push(bookHook.hook);
    }
    
    if (matchDetails.intentionMatch) {
      const intentionLabels = {
        escape: 'te transportará a otro mundo',
        feel: 'te conectará emocionalmente',
        think: 'te hará reflexionar profundamente',
        thrill: 'te mantendrá en tensión',
        learn: 'te enseñará algo nuevo'
      };
      reasons.push(`Este libro ${intentionLabels[answers.intention] || 'es perfecto para ti'}.`);
    }
    
    if (matchDetails.experienceMatch && bookHook?.experience) {
      reasons.push(`La experiencia será ${bookHook.experience}.`);
    }
    
    if (matchDetails.awardBonus) {
      const awards = book.aw || [];
      if (awards.includes('Nobel de Literatura')) {
        reasons.push('Escrito por un Premio Nobel de Literatura.');
      } else if (awards.includes('Pulitzer')) {
        reasons.push('Ganador del Premio Pulitzer.');
      } else if (awards.includes('Booker Prize')) {
        reasons.push('Ganador del Booker Prize.');
      } else if (awards.length > 0) {
        reasons.push('Una obra reconocida con premios literarios.');
      }
    }
    
    if (bookHook?.why_matters) {
      reasons.push(bookHook.why_matters);
    }
    
    return {
      main: reasons[0] || 'Este libro encaja perfectamente con lo que buscas.',
      secondary: reasons.slice(1, 3),
      perfectFor: bookHook?.perfect_for || null,
      themes: bookHook?.themes || [],
      experience: bookHook?.experience || null
    };
  }, [answers, hooks]);
  
  const getRecommendations = useCallback(() => {
    const scored = books.map(book => {
      let score = Math.random() * 5; // Base aleatorio pequeño
      const matchDetails = {
        hasHook: false,
        intentionMatch: false,
        experienceMatch: false,
        moodMatch: false,
        timeMatch: false,
        riskMatch: false,
        awardBonus: false
      };
      
      const pages = book.pg || 300;
      const difficulty = book.d || 'medio';
      const bookMood = book.m;
      const vibes = book.v || [];
      const awards = book.aw || [];
      const bookHook = hooks[String(book.id)];
      
      // BONUS GRANDE: Tiene hook (priorizamos libros con contexto)
      if (bookHook) {
        score += 30;
        matchDetails.hasHook = true;
      }
      
      // Premios
      if (awards.length > 0) {
        score += 15;
        matchDetails.awardBonus = true;
        if (awards.includes('Nobel de Literatura')) score += 10;
        if (awards.includes('Pulitzer')) score += 8;
        if (awards.includes('Booker Prize')) score += 8;
      }
      
      // INTENCIÓN (qué busca el usuario)
      if (answers.intention) {
        const intentionStep = WIZARD_STEPS.find(s => s.key === 'intention');
        const selectedIntention = intentionStep?.options.find(o => o.id === answers.intention);
        
        if (selectedIntention) {
          // Match por vibes
          const matchingVibes = selectedIntention.vibes?.filter(v => vibes.includes(v) || bookMood === v) || [];
          if (matchingVibes.length > 0) {
            score += matchingVibes.length * 12;
            matchDetails.intentionMatch = true;
          }
          
          // Match por experience del hook
          if (bookHook?.experience && selectedIntention.experiences?.includes(bookHook.experience)) {
            score += 20;
            matchDetails.intentionMatch = true;
          }
        }
      }
      
      // EXPERIENCIA
      if (answers.experience) {
        const expStep = WIZARD_STEPS.find(s => s.key === 'experience');
        const selectedExp = expStep?.options.find(o => o.id === answers.experience);
        
        if (selectedExp && bookHook?.experience) {
          if (selectedExp.keywords?.includes(bookHook.experience)) {
            score += 25;
            matchDetails.experienceMatch = true;
          }
        }
      }
      
      // TIEMPO
      if (answers.time) {
        const timeStep = WIZARD_STEPS.find(s => s.key === 'time');
        const selectedTime = timeStep?.options.find(o => o.id === answers.time);
        if (selectedTime && pages <= selectedTime.maxPages) {
          score += 15;
          matchDetails.timeMatch = true;
        } else if (selectedTime && pages > selectedTime.maxPages) {
          score -= 10; // Penalización por exceder tiempo
        }
      }
      
      // MOOD/ATMÓSFERA
      if (answers.mood) {
        const moodStep = WIZARD_STEPS.find(s => s.key === 'mood');
        const selectedMood = moodStep?.options.find(o => o.id === answers.mood);
        
        if (selectedMood) {
          const matchingVibes = selectedMood.vibes?.filter(v => vibes.includes(v) || bookMood === v) || [];
          if (matchingVibes.length > 0) {
            score += matchingVibes.length * 10;
            matchDetails.moodMatch = true;
          }
        }
      }
      
      // RIESGO/DIFICULTAD
      if (answers.risk) {
        const riskStep = WIZARD_STEPS.find(s => s.key === 'risk');
        const selectedRisk = riskStep?.options.find(o => o.id === answers.risk);
        
        if (selectedRisk && selectedRisk.difficulty === difficulty) {
          score += 15;
          matchDetails.riskMatch = true;
        }
      }
      
      return { book, score, matchDetails };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  }, [books, hooks, answers]);
  
  const handleSelect = (optionId) => {
    setAnswers(prev => ({ ...prev, [currentStep.key]: prev[currentStep.key] === optionId ? null : optionId }));
  };
  
  const handleNext = () => {
    if (isLastStep) {
      const recs = getRecommendations();
      setResult(recs);
      setResultIndex(0);
      if (recs.length > 0) {
        const firstRec = recs[0];
        setRecommendation(generateReason(firstRec.book, firstRec.score, firstRec.matchDetails));
      }
    } else {
      setStep(s => s + 1);
    }
  };
  
  const handleTryAnother = () => {
    if (result && resultIndex < result.length - 1) {
      const newIndex = resultIndex + 1;
      setResultIndex(newIndex);
      const nextRec = result[newIndex];
      setRecommendation(generateReason(nextRec.book, nextRec.score, nextRec.matchDetails));
    }
  };
  
  const handleStartOver = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setResultIndex(0);
    setRecommendation(null);
  };
  
  // Resultado
  if (result && result.length > 0) {
    const { book } = result[resultIndex];
    const bookHook = hooks[String(book.id)];
    const coverUrl = `/portadas/${book.id}.jpg`;
    const title = book.t || 'Sin título';
    const authors = book.a || ['Desconocido'];
    const pages = book.pg || 300;
    const awards = book.aw || [];
    
    return (
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: t.overlay,
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '420px', maxHeight: '90vh',
            borderRadius: '20px', 
            background: t.bg.elevated,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            position: 'relative',
            animation: 'scaleIn 0.3s ease',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={handleStartOver} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '13px', cursor: 'pointer'
            }}>← Empezar de nuevo</button>
            
            <button onClick={onClose} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '20px', cursor: 'pointer'
            }}>✕</button>
          </div>
          
          {/* Etiqueta */}
          <div style={{ textAlign: 'center', padding: '16px 24px 0' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${t.accent}20, ${t.accent}10)`,
              color: t.accent,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              ✨ TU PRÓXIMA LECTURA
            </span>
          </div>
          
          {/* Portada */}
          <div style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{
              width: '160px', height: '240px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              background: t.bg.tertiary
            }}>
              <img src={coverUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          
          {/* Título y autor */}
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 600, color: t.text.primary, marginBottom: '6px' }}>
              {title}
            </h3>
            <p style={{ fontSize: '15px', color: t.text.secondary, marginBottom: '4px' }}>
              {authors.join(', ')}
            </p>
            <p style={{ fontSize: '13px', color: t.text.tertiary }}>
              {pages} páginas
              {awards.length > 0 && ` · ${awards[0]}`}
            </p>
          </div>
          
          {/* POR QUÉ ESTE LIBRO - La explicación */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${t.accent}12, ${t.accent}05)`,
              borderLeft: `3px solid ${t.accent}`
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: t.accent, 
                fontWeight: 600, 
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Por qué este libro
              </p>
              <p style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: t.text.primary,
                fontStyle: 'italic',
                margin: 0
              }}>
                "{recommendation?.main}"
              </p>
              
              {recommendation?.secondary?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {recommendation.secondary.map((reason, i) => (
                    <p key={i} style={{
                      fontSize: '13px',
                      color: t.text.secondary,
                      margin: '4px 0',
                      paddingLeft: '12px',
                      borderLeft: `2px solid ${t.border.subtle}`
                    }}>
                      {reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
            
            {/* Perfect for + Experience */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {recommendation?.perfectFor && (
                <span style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  background: t.bg.tertiary,
                  color: t.text.secondary
                }}>
                  👤 {recommendation.perfectFor}
                </span>
              )}
              {recommendation?.experience && (
                <span style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  background: t.accentMuted,
                  color: t.accent,
                  fontWeight: 500
                }}>
                  ✨ {recommendation.experience}
                </span>
              )}
            </div>
            
            {/* Temas */}
            {recommendation?.themes?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                {recommendation.themes.slice(0, 4).map(theme => (
                  <span key={theme} style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: `1px solid ${t.border.subtle}`,
                    color: t.text.tertiary
                  }}>
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Botones */}
          <div style={{ padding: '0 24px 24px' }}>
            <button 
              onClick={() => onSelect(book)}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '12px', border: 'none',
                background: t.accent, color: t.bg.primary,
                fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              🎯 Este es el libro
            </button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {resultIndex < result.length - 1 && (
                <button 
                  onClick={handleTryAnother}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${t.border.default}`,
                    background: t.bg.tertiary, color: t.text.secondary,
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  🔄 Otra opción ({result.length - resultIndex - 1} más)
                </button>
              )}
              <button 
                onClick={onClose}
                style={{
                  flex: resultIndex >= result.length - 1 ? 1 : 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${t.border.default}`,
                  background: t.bg.tertiary, color: t.text.secondary,
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Pasos del wizard
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: t.overlay,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          borderRadius: '20px', padding: '32px',
          background: t.bg.elevated,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'scaleIn 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '13px', cursor: 'pointer'
            }}>← Atrás</button>
          ) : <div />}
          <button onClick={onClose} style={{ 
            background: 'none', border: 'none', 
            color: t.text.tertiary, fontSize: '20px', cursor: 'pointer' 
          }}>✕</button>
        </div>
        
        {/* Progress bar mejorada */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
          {WIZARD_STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: '4px',
              borderRadius: '2px',
              background: i < step ? t.accent : i === step ? `${t.accent}80` : t.bg.tertiary,
              transition: 'all 0.3s ease'
            }}>
              {i === step && (
                <div style={{
                  width: '50%', height: '100%',
                  borderRadius: '2px',
                  background: t.accent,
                  animation: 'pulse 1.5s ease infinite'
                }} />
              )}
            </div>
          ))}
        </div>
        
        {/* Número de paso */}
        <p style={{ 
          fontSize: '12px', 
          color: t.text.tertiary, 
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Paso {step + 1} de {WIZARD_STEPS.length}
        </p>
        
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: t.text.primary, marginBottom: '8px' }}>
          {currentStep.question}
        </h2>
        <p style={{ fontSize: '14px', color: t.text.tertiary, marginBottom: '28px' }}>
          {currentStep.hint}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
          {currentStep.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '12px', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                border: `2px solid ${answers[currentStep.key] === opt.id ? t.accent : t.border.default}`,
                background: answers[currentStep.key] === opt.id ? t.accentMuted : t.bg.tertiary,
                color: answers[currentStep.key] === opt.id ? t.accent : t.text.primary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: answers[currentStep.key] === opt.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <span style={{ 
                fontSize: '24px', 
                width: '36px', 
                textAlign: 'center',
                filter: answers[currentStep.key] === opt.id ? 'none' : 'grayscale(30%)',
                transition: 'filter 0.15s ease'
              }}>
                {opt.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: '13px', marginTop: '2px', color: t.text.tertiary, opacity: answers[currentStep.key] === opt.id ? 1 : 0.8 }}>{opt.desc}</div>}
              </div>
              {answers[currentStep.key] === opt.id && (
                <span style={{ color: t.accent, fontSize: '18px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={!answers[currentStep.key]}
          style={{
            width: '100%', padding: '14px',
            borderRadius: '12px', border: 'none',
            background: answers[currentStep.key] ? t.accent : t.bg.tertiary,
            color: answers[currentStep.key] ? t.bg.primary : t.text.muted,
            fontSize: '15px', fontWeight: 600,
            cursor: answers[currentStep.key] ? 'pointer' : 'not-allowed',
            opacity: answers[currentStep.key] ? 1 : 0.6,
            transition: 'all 0.2s ease'
          }}
        >
          {isLastStep ? '✨ Ver mi recomendación' : 'Continuar →'}
        </button>
        
        {!answers[currentStep.key] && step < WIZARD_STEPS.length - 1 && (
          <button
            onClick={handleNext}
            style={{
              width: '100%', padding: '12px',
              background: 'none', border: 'none',
              color: t.text.tertiary, fontSize: '13px',
              cursor: 'pointer', marginTop: '8px'
            }}
          >
            Saltar esta pregunta
          </button>
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
  
  // CSS global para animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { min-height: 100vh; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }
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
                <span style={{ fontSize: '28px' }}>📚</span>
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
                  ◯
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
                    ◔
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
                    👤
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
                    ⚙
                  </button>
                )}
                
                {/* Wizard (solo desktop) */}
                {!isMobile && (
                  <button 
                    onClick={() => setShowWizard(true)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: t.accent,
                      color: t.bg.primary,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    ¿Qué leo?
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
        
        {/* VISTA DETALLE DE COLECCIÓN */}
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
