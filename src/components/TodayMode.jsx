import { useMemo } from 'react';
import { BookCover } from './BookCover.jsx';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: TodayMode (seleccion diaria guiada)
// =============================================================================
export const TodayMode = ({ picks, onBookClick, onExit, theme, getListStatus }) => {
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
