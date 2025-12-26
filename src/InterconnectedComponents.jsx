import React, { useState, useMemo, memo } from 'react';

// =============================================================================
// SISTEMA DE INTERCONEXIÓN - Toque Apple
// Todo es clickeable, todo lleva a algún lugar
// =============================================================================

// =============================================================================
// COMPONENTE: ClickableChip - Chip táctil con animación
// =============================================================================
export const ClickableChip = memo(({ 
  children, 
  onClick, 
  variant = 'default', // 'default' | 'accent' | 'subtle'
  icon,
  theme,
  style = {}
}) => {
  const [pressed, setPressed] = useState(false);
  
  const baseStyles = {
    default: {
      background: theme.bg.tertiary,
      color: theme.text.secondary,
      border: `1px solid ${theme.border.subtle}`
    },
    accent: {
      background: theme.accentMuted,
      color: theme.accent,
      border: 'none'
    },
    subtle: {
      background: 'transparent',
      color: theme.text.tertiary,
      border: `1px solid ${theme.border.subtle}`
    }
  };
  
  const variantStyle = baseStyles[variant] || baseStyles.default;
  
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        padding: '5px 10px',
        borderRadius: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        ...variantStyle,
        ...style
      }}
    >
      {icon && <span style={{ fontSize: '11px' }}>{icon}</span>}
      {children}
    </button>
  );
});

ClickableChip.displayName = 'ClickableChip';

// =============================================================================
// COMPONENTE: AuthorPanel - Panel completo del autor
// =============================================================================
export const AuthorPanel = memo(({ 
  author, 
  authorData,
  books, 
  hooks,
  onBookClick, 
  onClose,
  onThemeClick,
  theme 
}) => {
  const t = theme;
  
  // Obtener libros del autor
  const authorBooks = useMemo(() => {
    return books.filter(b => (b.a || []).includes(author)).sort((a, b) => {
      // Ordenar por premiados primero, luego por año
      const aAwarded = (a.aw || []).length;
      const bAwarded = (b.aw || []).length;
      if (aAwarded !== bAwarded) return bAwarded - aAwarded;
      return (b.y || 0) - (a.y || 0);
    });
  }, [books, author]);
  
  // Calcular estadísticas del autor
  const stats = useMemo(() => {
    const totalPages = authorBooks.reduce((sum, b) => sum + (b.pg || 0), 0);
    const totalHours = authorBooks.reduce((sum, b) => sum + (b.rh || 0), 0);
    const awards = authorBooks.reduce((sum, b) => sum + (b.aw || []).length, 0);
    const themes = {};
    
    authorBooks.forEach(book => {
      const bookHook = hooks[String(book.id)];
      if (bookHook?.themes) {
        bookHook.themes.forEach(th => {
          themes[th] = (themes[th] || 0) + 1;
        });
      }
    });
    
    const topThemes = Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    
    return { totalPages, totalHours, awards, topThemes };
  }, [authorBooks, hooks]);
  
  // Bio del autor
  const bio = authorData?.bio || null;
  const birthYear = authorData?.birth;
  const deathYear = authorData?.death;
  const nationality = authorData?.nationality;
  
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
          maxHeight: '90vh',
          borderRadius: '24px 24px 0 0',
          background: t.bg.primary,
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '12px',
          cursor: 'grab'
        }}>
          <div style={{ 
            width: '36px', 
            height: '4px', 
            borderRadius: '2px', 
            background: t.border.strong 
          }} />
        </div>
        
        {/* Header */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            {/* Avatar con inicial */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}88)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 600,
              color: t.bg.primary,
              fontFamily: 'Georgia, serif'
            }}>
              {author.charAt(0)}
            </div>
            
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                fontWeight: 600,
                color: t.text.primary,
                marginBottom: '4px'
              }}>
                {author}
              </h2>
              <p style={{ fontSize: '13px', color: t.text.tertiary }}>
                {nationality && `${nationality}`}
                {birthYear && ` · ${birthYear}`}
                {deathYear && `–${deathYear}`}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '24px', 
            padding: '16px',
            background: t.bg.secondary,
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 600, color: t.text.primary }}>
                {authorBooks.length}
              </span>
              <p style={{ fontSize: '11px', color: t.text.tertiary }}>libros</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 600, color: t.text.primary }}>
                {Math.round(stats.totalHours)}h
              </span>
              <p style={{ fontSize: '11px', color: t.text.tertiary }}>lectura</p>
            </div>
            {stats.awards > 0 && (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 600, color: t.accent }}>
                  {stats.awards}
                </span>
                <p style={{ fontSize: '11px', color: t.text.tertiary }}>premios</p>
              </div>
            )}
          </div>
          
          {/* Bio */}
          {bio && (
            <p style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: t.text.secondary,
              marginBottom: '16px'
            }}>
              {bio}
            </p>
          )}
          
          {/* Temas del autor */}
          {stats.topThemes.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', color: t.text.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Temas que explora
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {stats.topThemes.map(th => (
                  <ClickableChip 
                    key={th}
                    onClick={() => onThemeClick(th)}
                    variant="subtle"
                    theme={t}
                  >
                    {th}
                  </ClickableChip>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Lista de libros */}
        <div style={{ 
          padding: '0 24px 32px',
          maxHeight: '40vh',
          overflowY: 'auto'
        }}>
          <p style={{ 
            fontSize: '11px', 
            color: t.text.muted, 
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Libros en tu biblioteca
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {authorBooks.map(book => {
              const bookHook = hooks[String(book.id)];
              const coverUrl = `/portadas/${book.id}.jpg`;
              
              return (
                <div
                  key={book.id}
                  onClick={() => onBookClick(book)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: t.bg.secondary,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {/* Mini cover */}
                  <div style={{
                    flexShrink: 0,
                    width: '48px',
                    height: '72px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <img 
                      src={coverUrl} 
                      alt={book.t}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: t.text.primary,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {book.t}
                    </h4>
                    
                    <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '6px' }}>
                      {book.y && `${book.y} · `}{book.pg}pp · {book.rh}h
                    </p>
                    
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(book.aw || []).slice(0, 1).map((award, i) => (
                        <span key={i} style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: t.accentMuted,
                          color: t.accent
                        }}>
                          ★ {award}
                        </span>
                      ))}
                      {bookHook?.experience && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: t.bg.tertiary,
                          color: t.text.secondary
                        }}>
                          ✨ {bookHook.experience}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Flecha */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: t.text.muted,
                    fontSize: '18px'
                  }}>
                    ›
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

AuthorPanel.displayName = 'AuthorPanel';

// =============================================================================
// COMPONENTE: ThemeResults - Resultados filtrados por tema
// =============================================================================
export const ThemeResults = memo(({ 
  themeName, 
  books, 
  hooks,
  onBookClick, 
  onClose,
  onExperienceClick,
  theme 
}) => {
  const t = theme;
  
  // Encontrar libros con este tema
  const themeBooks = useMemo(() => {
    return books.filter(book => {
      const bookHook = hooks[String(book.id)];
      return bookHook?.themes?.includes(themeName);
    }).slice(0, 30);
  }, [books, hooks, themeName]);
  
  // Agrupar experiencias
  const experienceGroups = useMemo(() => {
    const groups = {};
    themeBooks.forEach(book => {
      const bookHook = hooks[String(book.id)];
      if (bookHook?.experience) {
        if (!groups[bookHook.experience]) {
          groups[bookHook.experience] = [];
        }
        groups[bookHook.experience].push(book);
      }
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [themeBooks, hooks]);
  
  const themeEmojis = {
    amor: '❤️', muerte: '💀', familia: '👨‍👩‍👧', memoria: '🧠', identidad: '🪞',
    guerra: '⚔️', poder: '👑', soledad: '🌙', viaje: '🧭', tiempo: '⏳',
    naturaleza: '🌿', arte: '🎨', música: '🎵', política: '🏛️', ciencia: '🔬',
    religión: '✝️', locura: '🌀', venganza: '🔥', infancia: '🧒', vejez: '👴'
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
          borderRadius: '24px 24px 0 0',
          background: t.bg.primary,
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '12px' 
        }}>
          <div style={{ 
            width: '36px', 
            height: '4px', 
            borderRadius: '2px', 
            background: t.border.strong 
          }} />
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
        
        {/* Lista de libros agrupados por experiencia */}
        <div style={{ 
          padding: '0 24px 32px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {experienceGroups.map(([experience, expBooks]) => (
            <div key={experience} style={{ marginBottom: '24px' }}>
              <div 
                onClick={() => onExperienceClick(experience)}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ 
                  fontSize: '12px', 
                  color: t.accent,
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  ✨ {experience}
                </span>
                <span style={{ fontSize: '11px', color: t.text.muted }}>
                  ({expBooks.length})
                </span>
                <span style={{ fontSize: '14px', color: t.text.muted, marginLeft: 'auto' }}>›</span>
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
                paddingRight: '24px'
              }}>
                {expBooks.slice(0, 8).map(book => (
                  <div
                    key={book.id}
                    onClick={() => onBookClick(book)}
                    style={{
                      flexShrink: 0,
                      width: '80px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '120px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      marginBottom: '6px'
                    }}>
                      <img 
                        src={`/portadas/${book.id}.jpg`}
                        alt={book.t}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { 
                          e.target.parentElement.style.background = t.bg.tertiary;
                        }}
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
});

ThemeResults.displayName = 'ThemeResults';

// =============================================================================
// COMPONENTE: ExperienceResults - Libros con la misma experiencia
// =============================================================================
export const ExperienceResults = memo(({ 
  experience, 
  books, 
  hooks,
  onBookClick, 
  onClose,
  onAuthorClick,
  theme 
}) => {
  const t = theme;
  
  const experienceEmojis = {
    devastador: '💔', perturbador: '😰', melancólico: '🌧️', nostálgico: '🕰️',
    épico: '⚔️', monumental: '🏛️', absorbente: '🌀', hipnótico: '👁️',
    tenso: '😬', vertiginoso: '🎢', brutal: '💀', desgarrador: '😢',
    conmovedor: '🥺', íntimo: '💭', reflexivo: '🤔', filosófico: '🧠',
    sardónico: '😏', irónico: '🎭', divertido: '😄', luminoso: '☀️',
    onírico: '🌙', misterioso: '🔮', aterrador: '😱', inquietante: '👻'
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
  };
  
  // Encontrar libros con esta experiencia
  const experienceBooks = useMemo(() => {
    return books.filter(book => {
      const bookHook = hooks[String(book.id)];
      return bookHook?.experience === experience;
    }).slice(0, 30);
  }, [books, hooks, experience]);
  
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
          borderRadius: '24px 24px 0 0',
          background: t.bg.primary,
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '12px' 
        }}>
          <div style={{ 
            width: '36px', 
            height: '4px', 
            borderRadius: '2px', 
            background: t.border.strong 
          }} />
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
        <div style={{ 
          padding: '24px',
          maxHeight: '55vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {experienceBooks.map(book => {
              const authors = (book.a || []).slice(0, 1);
              
              return (
                <div
                  key={book.id}
                  onClick={() => onBookClick(book)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    aspectRatio: '2/3',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginBottom: '8px'
                  }}>
                    <img 
                      src={`/portadas/${book.id}.jpg`}
                      alt={book.t}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { 
                        e.target.parentElement.style.background = t.bg.tertiary;
                      }}
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
                      onClick={(e) => { e.stopPropagation(); onAuthorClick(authors[0]); }}
                      style={{
                        fontSize: '11px',
                        color: t.text.tertiary,
                        cursor: 'pointer'
                      }}
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
});

ExperienceResults.displayName = 'ExperienceResults';

// =============================================================================
// COMPONENTE: RelatedBooks - Libros relacionados
// =============================================================================
export const RelatedBooks = memo(({ 
  currentBook, 
  books, 
  hooks,
  onBookClick, 
  theme 
}) => {
  const t = theme;
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
        bookHook.themes.forEach(theme => {
          if (currentThemes.has(theme)) score += 3;
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
    <div style={{ padding: '0 24px 24px' }}>
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
        paddingRight: '24px'
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
              transition: 'transform 0.15s ease'
            }}>
              <img 
                src={`/portadas/${book.id}.jpg`}
                alt={book.t}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { 
                  e.target.parentElement.style.background = t.bg.tertiary;
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

RelatedBooks.displayName = 'RelatedBooks';

// =============================================================================
// COMPONENTE: AwardBadge - Badge de premio clickeable
// =============================================================================
export const AwardBadge = memo(({ award, onClick, theme }) => {
  const t = theme;
  
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '12px',
        background: t.accentMuted,
        color: t.accent,
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      ★ {award}
    </button>
  );
});

AwardBadge.displayName = 'AwardBadge';

// =============================================================================
// ESTILOS GLOBALES (añadir al CSS)
// =============================================================================
export const interconnectedStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(100px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  /* Haptic-like feedback */
  .clickable:active {
    transform: scale(0.97);
  }
`;
