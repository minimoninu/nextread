export const FONT_STACK_BODY = "'Sora', 'Avenir Next', 'Segoe UI', sans-serif";
export const FONT_STACK_DISPLAY = "'DM Serif Display', 'Iowan Old Style', 'Baskerville', serif";
export const THEMES = {
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
export const LENGTH_FILTER_OPTIONS = [
  { id: 'short', label: 'Corto', max: 250 },
  { id: 'medium', label: 'Medio', min: 251, max: 450 },
  { id: 'long', label: 'Largo', min: 451, max: 700 },
  { id: 'epic', label: 'Epico', min: 701 }
];

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

export const LANGUAGE_FILTER_OPTIONS = [
  { id: 'es', label: 'Espanol' },
  { id: 'en', label: 'Ingles' },
  { id: 'fr', label: 'Frances' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Portugues' },
  { id: 'de', label: 'Aleman' },
  { id: 'unknown', label: 'Sin detectar' }
];

export const SECTION_TITLE_STYLE = (t) => ({
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

export const getModalCloseButtonStyle = (t) => ({
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
