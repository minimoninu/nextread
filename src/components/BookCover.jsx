import { useState, memo } from 'react';
import { haptic } from './ui.jsx';
import { useIntersectionObserver } from '../hooks.js';
import { coverThumbUrl } from '../lib/bookUtils.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: BookCover
// =============================================================================
export const BookCover = memo(({ book, onClick, theme, listStatus, sanctuary, hasAwardOverride }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const t = THEMES[theme];
  const coverUrl = coverThumbUrl(book.id);
  const title = book.t || book.title || 'Sin título';
  const authors = book.a || book.authors || ['Desconocido'];
  const hasAward = typeof hasAwardOverride === 'boolean'
    ? hasAwardOverride
    : (book.aw || book.awards || []).length > 0;
  const statusColor = listStatus === 'reading'
    ? t.accent
    : listStatus === 'read'
    ? t.success
    : listStatus === 'want'
    ? '#8e7a69'
    : t.accent;
  
  const size = sanctuary ? { width: '148px', height: '222px' } : { width: '122px', height: '186px' };
  
  const handlePress = () => {
    setIsPressed(true);
    haptic.light();
  };
  
  const handleRelease = () => setIsPressed(false);
  
  return (
    <div 
      ref={ref}
      onClick={() => onClick?.(book)}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      className="book-cover"
      style={{
        ...size,
        flexShrink: 0,
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${t.border.default}`,
        boxShadow: isPressed 
          ? '0 2px 8px rgba(0,0,0,0.22)' 
          : '0 8px 14px rgba(0,0,0,0.14)',
        background: t.bg.secondary,
        transform: isPressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {(!isVisible || (!imgLoaded && !imgError)) && (
        <div 
          className="skeleton"
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, ${t.bg.secondary} 0%, ${t.bg.elevated} 50%, ${t.bg.secondary} 100%)`,
            backgroundSize: '200% 100%',
          }} 
        />
      )}
      
      {isVisible && !imgError && (
        <img 
          src={coverUrl}
          alt={title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 220ms ease'
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      
      {imgError && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '10px',
          background: t.bg.secondary
        }}>
          <div style={{ fontFamily: t.typography.display, fontSize: '11px', fontWeight: 600, color: t.text.primary, lineHeight: 1.3 }}>
            {title.slice(0, 50)}
          </div>
          <div style={{ fontSize: '10px', color: t.text.tertiary, marginTop: '4px' }}>
            {authors[0]}
          </div>
        </div>
      )}
      
      {!sanctuary && (hasAward || listStatus) && (
        <div style={{
          position: 'absolute', bottom: '7px', right: '7px',
          minWidth: '20px', height: '20px',
          padding: '0 6px',
          borderRadius: '6px',
          border: `1px solid ${t.bg.primary}`,
          background: statusColor,
          color: t.bg.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          lineHeight: 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.22)'
        }}>
          {listStatus === 'reading' ? '◐' : listStatus === 'read' ? '✔' : listStatus === 'want' ? '○' : '★'}
        </div>
      )}
    </div>
  );
});

BookCover.displayName = 'BookCover';
