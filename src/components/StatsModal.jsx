import { useMemo } from 'react';
import { getModalCloseButtonStyle } from './ui.jsx';
import { useEscapeKey } from '../hooks.js';
import { COPY } from '../lib/constants.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: StatsModal
// =============================================================================
export const StatsModal = ({ books, awardedBookIds, onClose, theme }) => {
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  const stats = useMemo(() => {
    const totalPages = books.reduce((sum, b) => sum + (b.pg || b.pages || 250), 0);
    const totalHours = Math.round(totalPages / 40);
    const awarded = awardedBookIds instanceof Set
      ? awardedBookIds.size
      : books.filter(b => (b.aw || b.awards || []).length > 0).length;
    return { total: books.length, pages: totalPages.toLocaleString(), hours: totalHours.toLocaleString(), awarded };
  }, [books, awardedBookIds]);
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
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
        aria-label="Estadísticas de biblioteca"
        style={{
          width: '100%',
          maxWidth: '360px',
          borderRadius: '14px',
          padding: '24px',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: t.typography.display, fontSize: '20px', color: t.text.primary }}>{COPY.stats.title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar estadísticas"
            style={getModalCloseButtonStyle(t)}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.books}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.pages}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.pages}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.text.primary }}>{stats.hours}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.hours}</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: t.bg.elevated, border: `1px solid ${t.border.default}` }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: t.accent }}>{stats.awarded}</div>
            <div style={{ fontSize: '12px', color: t.text.tertiary }}>{COPY.stats.awarded}</div>
          </div>
        </div>
        
        <p style={{ fontSize: '14px', textAlign: 'center', fontStyle: 'italic', color: t.text.secondary }}>
          {COPY.stats.message}
        </p>
      </div>
    </div>
  );
};
