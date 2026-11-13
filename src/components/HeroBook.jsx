import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: HeroBook (libro destacado con hook)
// =============================================================================
export const HeroBook = ({ book, hook, onClick, theme }) => {
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
