import { useState, useMemo, useEffect, memo } from 'react';
import { getBookAwardLabels } from '../bookAwards.js';
import { haptic, ActionButton, getModalCloseButtonStyle, SECTION_TITLE_STYLE } from './ui.jsx';
import { useLocalStorage, useEscapeKey } from '../hooks.js';
import { coverThumbUrl, buildSynopsisPreview } from '../lib/bookUtils.js';
import { COPY, SPOILER_LEVELS, SPOILER_RANK } from '../lib/constants.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: RelatedBooksSection - Libros relacionados inline
// =============================================================================
export const RelatedBooksSection = memo(({ currentBook, books, hooks, onBookClick, t }) => {
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
                src={coverThumbUrl(book.id)}
                loading="lazy"
                decoding="async"
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
export const BookModal = memo(({ book, onClose, theme, currentList, onListChange, onAuthorClick, onThemeClick, onExperienceClick, onBookClick, bookHook, books, hooks }) => {
  const [imgError, setImgError] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [spoilerLevel, setSpoilerLevel] = useLocalStorage('nextread_spoiler_level', 'vibes');
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  const coverUrl = `/portadas/${book.id}.jpg`;
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const awards = useMemo(() => getBookAwardLabels(book, bookHook || {}), [book, bookHook]);
  const vibes = useMemo(() => book.v || book.vibes || [], [book]);
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
