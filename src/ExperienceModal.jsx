import React, { useRef, useMemo, useEffect } from 'react';

const useEscapeKey = (onClose) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);
};

const getModalCloseButtonStyle = (t) => ({
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

// COMPONENTE: ExperienceModal - Libros por experiencia
// =============================================================================
const ExperienceModal = ({ experience, books, hooks, onClose, onBookClick, onAuthorClick, t }) => {
  const contentRef = useRef(null);
  useEscapeKey(onClose);

  const experienceEmojis = {
    devastador: '💔', perturbador: '😰', melancólico: '🌧️', nostálgico: '🕰️',
    épico: '⚔️', monumental: '🏛️', absorbente: '🌀', hipnótico: '👁️',
    tenso: '😬', vertiginoso: '🎢', brutal: '💀', desgarrador: '😢',
    conmovedor: '🥺', íntimo: '💭', reflexivo: '🤔', filosófico: '🧠',
    sardónico: '😏', irónico: '🎭', divertido: '😄', luminoso: '☀️',
    onírico: '🌙', misterioso: '🔮', aterrador: '😱', inquietante: '💻',
    agridulce: '🏋', contemplativo: '🧘', sombrío: '🌑', visceral: '👥'
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
        aria-label={`Experiencia ${experience}`}
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
          borderBottom: `1px solid ${t.border.default}`,
          background: t.bg.primary,
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            aria-label="Cerrar experiencia"
            style={{
              ...getModalCloseButtonStyle(t),
              position: 'absolute',
              top: '-2px',
              right: '24px'
            }}
          >
            ✕
          </button>
          <span style={{ fontSize: '52px', marginBottom: '12px', display: 'block' }}>
            {experienceEmojis[experience] || '✨'}
          </span>
          <h2 style={{
            fontFamily: t.typography.display,
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
            gap: '14px'
          }}>
            {experienceBooks.map(book => {
              const authors = (book.a || []).slice(0, 1);

              return (
                <div key={book.id} onClick={() => onBookClick(book)} style={{ cursor: 'pointer' }}>
                  <div style={{
                    aspectRatio: '2/3',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${t.border.default}`,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                    marginBottom: '8px',
                    background: t.bg.elevated
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
                    <button
                      type="button"
                      aria-label={`Abrir autor ${authors[0]}`}
                      onClick={(e) => { e.stopPropagation(); onAuthorClick?.(authors[0]); }}
                      style={{
                        font: 'inherit',
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '11px',
                        color: t.text.tertiary,
                        cursor: 'pointer'
                      }}
                    >
                      {authors[0]}
                    </button>
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

export default ExperienceModal;
