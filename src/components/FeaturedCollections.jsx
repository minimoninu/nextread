import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: FeaturedCollections (colecciones destacadas)
// =============================================================================
export const FeaturedCollections = ({ collections, onSelect, theme, getCollectionCount }) => {
  const t = THEMES[theme];
  
  // Seleccionar 4 colecciones destacadas
  const featured = collections.filter(c => 
    ['pulitzer', 'noir-nordico', 'literatura-japonesa', 'espanola-contemporanea'].includes(c.id)
  ).slice(0, 4);
  
  if (featured.length === 0) return null;
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontFamily: t.typography.display,
        fontSize: '20px',
        fontWeight: 400,
        color: t.text.primary,
        marginBottom: '16px'
      }}>
        Explora por colección
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {featured.map(collection => (
          <button
            key={collection.id}
            onClick={() => onSelect(collection)}
            style={{
              padding: '16px',
              borderRadius: '16px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.elevated,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Barra de color */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: collection.color
            }} />
            
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {collection.emoji}
            </div>
            <h3 style={{
              fontFamily: t.typography.display,
              fontSize: '15px',
              fontWeight: 600,
              color: t.text.primary,
              marginBottom: '4px'
            }}>
              {collection.title}
            </h3>
            <p style={{ fontSize: '11px', color: t.text.tertiary }}>
              {(typeof getCollectionCount === 'function' ? getCollectionCount(collection) : collection.count)} libros
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
