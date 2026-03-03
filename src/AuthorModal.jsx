import React, { useState, useRef, useEffect, useMemo } from 'react';
import { THEMES, getModalCloseButtonStyle, SECTION_TITLE_STYLE, useEscapeKey } from './App.jsx';

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

export default AuthorModal;
