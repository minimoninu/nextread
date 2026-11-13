import { useMemo } from 'react';
import { isAwardCollection } from '../bookAwards.js';
import { coverThumbUrl, resolveCollectionBooks } from '../lib/bookUtils.js';
import { THEMES } from '../theme.js';

export const CollectionsView = ({ collections, books, awardedBookIds, onCollectionClick, theme }) => {
  const t = THEMES[theme];
  
  // Contar libros por coleccion
  const getCollectionCount = (collection) => {
    return resolveCollectionBooks(collection, books, awardedBookIds).length;
  };
  
  // Agrupar colecciones por tipo
  const grouped = {
    regions: collections.filter(c => ['🇫🇷', '🇺🇸', '🇪🇸', '🇷🇺', '🇯🇵', '🇮🇹', '🇬🇧'].includes(c.emoji)),
    awards: collections.filter(c => isAwardCollection(c)),
    genres: collections.filter(c => ['🔍', '✨', '🏛️', '🚀', '📝', '😄'].includes(c.emoji)),
    series: collections.filter(c => ['🥸', '🕵️', '🦁'].includes(c.emoji)),
    difficulty: collections.filter(c => ['☀️', '🧠', '⚡', '📖'].includes(c.emoji))
  };
  
  const Section = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontFamily: t.typography.display, 
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
                      fontFamily: t.typography.display, 
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
export const CollectionDetailView = ({ collection, books, awardedBookIds, onBookClick, onBack, theme, getListStatus }) => {
  const t = THEMES[theme];
  
  // Filtrar libros según criterios
  const filteredBooks = useMemo(() => {
    return resolveCollectionBooks(collection, books, awardedBookIds);
  }, [collection, books, awardedBookIds]);
  
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
              fontFamily: t.typography.display, 
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
                src={coverThumbUrl(book.id)}
                loading="lazy"
                decoding="async"
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
                  {listStatus === 'want' ? '♡' : listStatus === 'reading' ? '📖' : '✔'}
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
