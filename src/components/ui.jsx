import { useState, memo } from 'react';

// =============================================================================
// HAPTIC FEEDBACK - Vibraciones sutiles estilo iOS
// =============================================================================
export const haptic = {
  // Feedback ligero - para tocar elementos
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  // Feedback medio - para selecciones
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  // Feedback fuerte - para acciones importantes
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  // Feedback de éxito - para confirmaciones
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20]);
    }
  },
  // Feedback de error
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }
};

// =============================================================================
// COMPONENTE: Touchable - Wrapper con animación táctil
// =============================================================================
export const Touchable = memo(({ 
  children, 
  onClick, 
  style = {}, 
  scale = 0.97,
  className = '',
  hapticType = 'light',
  disabled = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => {
    if (disabled) return;
    setIsPressed(true);
    if (hapticType && haptic[hapticType]) {
      haptic[hapticType]();
    }
  };
  
  const handleRelease = () => setIsPressed(false);
  
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };
  
  return (
    <div
      onClick={handleClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      className={className}
      style={{
        ...style,
        transform: isPressed ? `scale(${scale})` : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Touchable.displayName = 'Touchable';

// =============================================================================
// COMPONENTE: ActionButton - Botón con microinteracciones Apple
// =============================================================================
export const ActionButton = memo(({ 
  children, 
  onClick, 
  variant = 'primary', // 'primary' | 'secondary'
  isActive = false,
  activeColor,
  theme,
  style = {},
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const t = theme;
  
  const handlePress = () => {
    if (disabled) return;
    setIsPressed(true);
  };
  
  const handleRelease = () => setIsPressed(false);
  
  const isPrimary = variant === 'primary';
  
  const baseStyles = isPrimary ? {
    background: isActive ? t.accent : t.accent,
    color: t.bg.primary,
    border: 'none',
    padding: '15px',
    fontSize: '15px',
  } : {
    background: isActive ? (activeColor || t.accent) : t.bg.tertiary,
    color: isActive ? t.bg.primary : t.text.secondary,
    border: `1px solid ${isActive ? 'transparent' : t.border.default}`,
    padding: '13px',
    fontSize: '14px',
  };
  
  return (
    <button
      onClick={onClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      disabled={disabled}
      style={{
        ...baseStyles,
        width: '100%',
        borderRadius: '14px',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Ripple effect layer */}
      <span style={{
        position: 'absolute',
        inset: 0,
        background: isPressed ? 'rgba(255,255,255,0.1)' : 'transparent',
        transition: 'background 150ms ease',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

export const getModalCloseButtonStyle = (t) => ({
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

export const SECTION_TITLE_STYLE = (t) => ({
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: t.text.tertiary,
  marginBottom: '8px',
});
