import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: CollectionsSection (colecciones curadas)
// =============================================================================
export const CollectionsSection = ({ collections, selectedCollection, onSelectCollection, theme, getCollectionCount }) => {
  const t = THEMES[theme];
  
  if (!collections || collections.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '34px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '14px' 
      }}>
        <h2 style={{ 
          fontFamily: t.typography.display, 
          fontSize: '24px',
          fontWeight: 400,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: t.text.primary 
        }}>
          Colecciones
        </h2>
        {selectedCollection && (
          <button
            onClick={() => onSelectCollection(null)}
            style={{
              background: t.accentMuted,
              border: `1px solid ${t.accent}`,
              color: t.accent,
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            → Ver todo
          </button>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {collections.map(coll => {
          const isSelected = selectedCollection?.id === coll.id;
          const totalBooks = typeof getCollectionCount === 'function' ? getCollectionCount(coll) : coll.count;
          return (
            <div
              key={coll.id}
              onClick={() => onSelectCollection(isSelected ? null : coll)}
              style={{
                minWidth: '220px',
                padding: '16px',
                borderRadius: '12px',
                background: t.bg.elevated,
                border: `1px solid ${isSelected ? t.accent : t.border.default}`,
                cursor: 'pointer',
                transition: 'all 120ms ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ 
                fontSize: '24px', 
                marginBottom: '6px', 
                display: 'block' 
              }}>
                {coll.emoji}
              </span>
              
              <h3 style={{ 
                fontFamily: t.typography.display,
                fontSize: '20px',
                fontWeight: 400,
                color: t.text.primary,
                marginBottom: '6px',
                lineHeight: 1.05
              }}>
                {coll.title}
              </h3>
              
              <p style={{ 
                fontSize: '12px', 
                color: t.text.tertiary,
                marginBottom: '10px',
                lineHeight: 1.4
              }}>
                {coll.subtitle}
              </p>
              
              <span style={{ 
                fontSize: '11px', 
                color: isSelected ? t.accent : t.text.muted,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                {totalBooks} libros
              </span>
              
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isSelected ? t.accent : (coll.color || t.border.default),
                opacity: isSelected ? 1 : 0.75
              }} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

// =============================================================================
// COMPONENTE: CollectionHeader (header cuando hay colección seleccionada)
// =============================================================================
export const CollectionHeader = ({ collection, onClear, theme, countOverride }) => {
  const t = THEMES[theme];
  
  if (!collection) return null;

  const totalBooks = Number.isFinite(countOverride) ? countOverride : collection.count;
  
  return (
    <div style={{
      padding: '22px',
      borderRadius: '12px',
      background: t.bg.elevated,
      border: `1px solid ${t.border.default}`,
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <span style={{ fontSize: '40px' }}>{collection.emoji}</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            fontFamily: t.typography.display, 
            fontSize: '32px', 
            fontWeight: 400, 
            color: t.text.primary,
            marginBottom: '6px',
            lineHeight: 1
          }}>
            {collection.title}
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: t.text.secondary,
            marginBottom: '12px',
            lineHeight: 1.6
          }}>
            {collection.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '13px', 
              color: collection.color,
              fontWeight: 600
            }}>
              {totalBooks} libros
            </span>
            <button
              onClick={onClear}
              style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.default}`,
                color: t.text.secondary,
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ← Volver a biblioteca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
