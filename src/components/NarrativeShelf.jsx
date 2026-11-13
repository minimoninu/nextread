import { coverThumbUrl } from '../lib/bookUtils.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: NarrativeShelf (estante con hooks visibles)
// =============================================================================
export const NarrativeShelf = ({ title, subtitle, books, hooks, onBookClick, theme, getBookAwardLabel, getBookReason }) => {
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
          const coverUrl = coverThumbUrl(book.id);
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
                  loading="lazy"
                  decoding="async"
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
