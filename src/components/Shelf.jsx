import { BookCover } from './BookCover.jsx';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: Shelf (estante horizontal)
// =============================================================================
export const Shelf = ({ title, books, onBookClick, theme, getListStatus, sanctuary }) => {
  const t = THEMES[theme];
  if (!books || books.length === 0) return null;
  
  return (
    <section style={{ marginBottom: sanctuary ? '48px' : '40px' }}>
      {!sanctuary && (
        <h2 style={{
          fontFamily: t.typography.display,
          fontSize: '22px',
          fontWeight: 400,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: t.text.primary,
          marginBottom: '18px',
          paddingLeft: '2px'
        }}>
          {title}
        </h2>
      )}
      <div style={{
        display: 'flex',
        gap: sanctuary ? '18px' : '12px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginLeft: '-16px',
        marginRight: '-16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {books.map(book => (
          <BookCover 
            key={book.id} 
            book={book} 
            onClick={onBookClick}
            theme={theme}
            listStatus={getListStatus?.(book.id)}
            sanctuary={sanctuary}
          />
        ))}
      </div>
    </section>
  );
};
