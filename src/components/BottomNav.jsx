import { COPY } from '../lib/constants.js';
import { THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: BottomNav (solo móvil)
// =============================================================================
export const BottomNav = ({ activeTab, onTabChange, theme, savedCount }) => {
  const t = THEMES[theme];
  
  const tabs = [
    { id: 'library', icon: '📚', label: COPY.tabs.library },
    { id: 'collections', icon: '📒', label: COPY.tabs.collections },
    { id: 'recommend', icon: '✨', label: COPY.tabs.recommend },
    { id: 'saved', icon: '♡', label: COPY.tabs.saved, badge: savedCount },
    { id: 'authors', icon: '👤', label: COPY.tabs.authors },
  ];
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      background: t.bg.primary,
      borderTop: `1px solid ${t.border.default}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '66px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            color: activeTab === tab.id ? t.text.primary : t.text.tertiary,
            transition: 'color 120ms ease'
          }}
        >
          {activeTab === tab.id && (
            <span style={{
              position: 'absolute',
              top: '-1px',
              width: '18px',
              height: '2px',
              borderRadius: '999px',
              background: t.accent
            }} />
          )}
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 500 }}>{tab.label}</span>
          
          {/* Badge */}
          {tab.badge > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: 'calc(50% - 16px)',
              minWidth: '16px',
              height: '16px',
              borderRadius: '6px',
              background: t.accent,
              color: t.bg.primary,
              fontSize: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
