import { COPY } from '../lib/constants.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: SanctuaryButton (botón flotante para salir)
// =============================================================================
export const SanctuaryButton = ({ onExit, theme }) => {
  const t = THEMES[theme];
  
  return (
    <button
      onClick={onExit}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 70,
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        border: `1px solid ${t.border.default}`,
        background: t.bg.primary,
        color: t.text.secondary,
        boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'transform 120ms ease, opacity 120ms ease',
        opacity: 0.8
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '0.8'; }}
      title={COPY.sanctuary.exit}
    >
      ✕
    </button>
  );
};
