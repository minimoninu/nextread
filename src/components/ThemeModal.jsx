import { useMemo, useRef } from 'react';
import { getModalCloseButtonStyle } from './ui.jsx';
import { useEscapeKey } from '../hooks.js';
import { coverThumbUrl } from '../lib/bookUtils.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: ThemeModal - Libros por tema
// =============================================================================
export const ThemeModal = ({ themeName, books, hooks, onClose, onBookClick, onExperienceClick, theme }) => {
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
                        src={coverThumbUrl(book.id)}
                        loading="lazy"
                        decoding="async"
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
