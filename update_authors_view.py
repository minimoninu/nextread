import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find AuthorsView block
pattern = r"// =============================================================================\n// COMPONENTE: AuthorsView \(explorar autores\)\n// =============================================================================\nconst AuthorsView = \(\{ books, authorsData, onAuthorClick, theme \}\) => \{.*?// =============================================================================\n// COMPONENTE: CollectionsView"

match = re.search(pattern, content, flags=re.DOTALL)

if match:
    old_block = match.group(0)

    new_components = """// =============================================================================
// COMPONENTES: AuthorsView (explorar autores) y subcomponentes
// =============================================================================

const AuthorCard = memo(({ author, data, onAuthorClick, t }) => {
  return (
    <div
      onClick={() => onAuthorClick(author.name)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{
          fontFamily: t.typography.display,
          fontSize: '16px',
          fontWeight: 600,
          color: t.text.primary,
          flex: 1
        }}>
          {author.name}
        </h3>
        <span style={{
          fontSize: '12px',
          color: t.accent,
          background: t.accentMuted,
          padding: '2px 8px',
          borderRadius: '10px',
          marginLeft: '8px'
        }}>
          {author.bookCount} {author.bookCount === 1 ? 'libro' : 'libros'}
        </span>
      </div>

      {data && (
        <>
          <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '8px' }}>
            {data.years} · {data.nationality}
          </p>
          <p style={{
            fontSize: '13px',
            color: t.text.secondary,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {data.bio}
          </p>
        </>
      )}

      {!data && (
        <p style={{ fontSize: '13px', color: t.text.muted, fontStyle: 'italic' }}>
          Toca para ver sus libros
        </p>
      )}
    </div>
  );
});

const AuthorsSearch = ({ searchQuery, setSearchQuery, t }) => (
  <div style={{ marginBottom: '24px' }}>
    <input
      type="text"
      placeholder="Buscar autor..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: `1px solid ${t.border.default}`,
        background: t.bg.secondary,
        color: t.text.primary,
        fontSize: '14px',
        outline: 'none'
      }}
    />
  </div>
);

const AuthorsStats = ({ totalAuthors, withBioCount, t }) => (
  <div style={{
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: t.bg.secondary,
    borderRadius: '12px'
  }}>
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 600, color: t.text.primary }}>{totalAuthors}</div>
      <div style={{ fontSize: '11px', color: t.text.tertiary }}>autores en biblioteca</div>
    </div>
    <div style={{ width: '1px', background: t.border.default }} />
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: '24px', fontWeight: 600, color: t.accent }}>{withBioCount}</div>
      <div style={{ fontSize: '11px', color: t.text.tertiary }}>con biografía</div>
    </div>
  </div>
);

const FeaturedAuthorsSection = ({ authorsWithBio, authorsData, onAuthorClick, t }) => {
  if (authorsWithBio.length === 0) return null;
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontFamily: t.typography.display,
        fontSize: '18px',
        color: t.text.primary,
        marginBottom: '16px'
      }}>
        Autores destacados
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {authorsWithBio.slice(0, 20).map(author => (
          <AuthorCard
            key={author.name}
            author={author}
            data={authorsData[author.name]}
            onAuthorClick={onAuthorClick}
            t={t}
          />
        ))}
      </div>
      {authorsWithBio.length > 20 && (
        <p style={{ fontSize: '13px', color: t.text.tertiary, textAlign: 'center', marginTop: '16px' }}>
          Y {authorsWithBio.length - 20} autores más...
        </p>
      )}
    </section>
  );
};

const OtherAuthorsSection = ({ authorsWithoutBio, onAuthorClick, t }) => {
  if (authorsWithoutBio.length === 0) return null;
  return (
    <section>
      <h2 style={{
        fontFamily: t.typography.display,
        fontSize: '18px',
        color: t.text.primary,
        marginBottom: '16px'
      }}>
        Otros autores ({authorsWithoutBio.length})
      </h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {authorsWithoutBio.slice(0, 50).map(author => (
          <button
            key={author.name}
            onClick={() => onAuthorClick(author.name)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.tertiary,
              color: t.text.secondary,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {author.name} ({author.bookCount})
          </button>
        ))}
      </div>
      {authorsWithoutBio.length > 50 && (
        <p style={{ fontSize: '13px', color: t.text.tertiary, textAlign: 'center', marginTop: '16px' }}>
          Y {authorsWithoutBio.length - 50} autores más...
        </p>
      )}
    </section>
  );
};

const AuthorsView = ({ books, authorsData, onAuthorClick, theme }) => {
  const t = THEMES[theme];
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener autores únicos de la biblioteca con conteo de libros
  const libraryAuthors = useMemo(() => {
    const authorMap = {};
    books.forEach(book => {
      const bookAuthors = book.a || book.authors || [];
      bookAuthors.forEach(author => {
        if (!authorMap[author]) {
          authorMap[author] = { name: author, bookCount: 0, hasData: !!authorsData[author] };
        }
        authorMap[author].bookCount++;
      });
    });
    return Object.values(authorMap).sort((a, b) => {
      // Primero los que tienen datos, luego por cantidad de libros
      if (a.hasData !== b.hasData) return b.hasData - a.hasData;
      return b.bookCount - a.bookCount;
    });
  }, [books, authorsData]);

  // Filtrar por búsqueda
  const filteredAuthors = useMemo(() => {
    if (!searchQuery) return libraryAuthors;
    const query = searchQuery.toLowerCase();
    return libraryAuthors.filter(a => a.name.toLowerCase().includes(query));
  }, [libraryAuthors, searchQuery]);

  // Separar autores con y sin biografía
  const authorsWithBio = filteredAuthors.filter(a => a.hasData);
  const authorsWithoutBio = filteredAuthors.filter(a => !a.hasData);

  return (
    <div>
      <AuthorsSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} t={t} />

      <AuthorsStats
        totalAuthors={libraryAuthors.length}
        withBioCount={authorsWithBio.length}
        t={t}
      />

      <FeaturedAuthorsSection
        authorsWithBio={authorsWithBio}
        authorsData={authorsData}
        onAuthorClick={onAuthorClick}
        t={t}
      />

      <OtherAuthorsSection
        authorsWithoutBio={authorsWithoutBio}
        onAuthorClick={onAuthorClick}
        t={t}
      />

      {filteredAuthors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: '16px', color: t.text.secondary }}>No se encontraron autores</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE: CollectionsView"""

    new_content = content.replace(old_block, new_components)

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Could not find the block to replace")
