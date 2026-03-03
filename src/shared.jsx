import React, { useState, useEffect, memo } from 'react';

export const FONT_STACK_BODY = "'Sora', 'Avenir Next', 'Segoe UI', sans-serif";
export const FONT_STACK_DISPLAY = "'DM Serif Display', 'Iowan Old Style', 'Baskerville', serif";

// =============================================================================
// TEMAS - Editorial Contrast
// =============================================================================
export const THEMES = {
  night: {
    name: 'Nocturno',
    icon: '☀',
    bg: {
      primary: '#101214',
      secondary: '#181b20',
      tertiary: '#21252b',
      elevated: '#2b3038',
    },
    text: {
      primary: '#f6f2ec',
      secondary: '#d7d0c6',
      tertiary: '#ada599',
      muted: '#7e776c',
    },
    accent: '#e34c36',
    accentHover: '#ef6a57',
    accentMuted: 'rgba(227, 76, 54, 0.18)',
    border: {
      subtle: 'rgba(246, 242, 236, 0.08)',
      default: 'rgba(246, 242, 236, 0.16)',
      strong: 'rgba(246, 242, 236, 0.24)',
    },
    overlay: 'rgba(8, 10, 12, 0.84)',
    success: '#5e9270',
    glass: {
      bg: 'rgba(24, 27, 32, 0.84)',
      bgStrong: 'rgba(24, 27, 32, 0.94)',
      border: 'rgba(246, 242, 236, 0.12)',
      shadow: '0 10px 24px rgba(0, 0, 0, 0.42)',
      shadowElevated: '0 22px 42px -12px rgba(0, 0, 0, 0.52)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #e34c36 0%, #f07c69 100%)',
      subtle: 'linear-gradient(180deg, rgba(227, 76, 54, 0.12) 0%, transparent 100%)',
      card: 'linear-gradient(170deg, rgba(43, 48, 56, 0.96) 0%, rgba(33, 37, 43, 0.98) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
    },
    typography: {
      body: FONT_STACK_BODY,
      display: FONT_STACK_DISPLAY,
    },
  },
  day: {
    name: 'Día',
    icon: '☾',
    bg: {
      primary: '#fbfaf7',
      secondary: '#f2eee8',
      tertiary: '#e8e2d9',
      elevated: '#ffffff',
    },
    text: {
      primary: '#1f1b18',
      secondary: '#4b433c',
      tertiary: '#787067',
      muted: '#a39a90',
    },
    accent: '#d9412b',
    accentHover: '#b93220',
    accentMuted: 'rgba(217, 65, 43, 0.12)',
    border: {
      subtle: 'rgba(31, 27, 24, 0.08)',
      default: 'rgba(31, 27, 24, 0.16)',
      strong: 'rgba(31, 27, 24, 0.24)',
    },
    overlay: 'rgba(251, 250, 247, 0.9)',
    success: '#4f835f',
    glass: {
      bg: 'rgba(255, 255, 255, 0.84)',
      bgStrong: 'rgba(255, 255, 255, 0.94)',
      border: 'rgba(255, 255, 255, 0.8)',
      shadow: '0 8px 22px rgba(24, 20, 18, 0.1)',
      shadowElevated: '0 18px 36px -14px rgba(24, 20, 18, 0.14)',
    },
    gradient: {
      accent: 'linear-gradient(135deg, #d9412b 0%, #ea6956 100%)',
      subtle: 'linear-gradient(180deg, rgba(217, 65, 43, 0.1) 0%, transparent 100%)',
      card: 'linear-gradient(170deg, rgba(255, 255, 255, 1) 0%, rgba(251, 250, 247, 1) 100%)',
      shimmer: 'linear-gradient(90deg, transparent 0%, rgba(31,27,24,0.03) 50%, transparent 100%)',
    },
    typography: {
      body: FONT_STACK_BODY,
      display: FONT_STACK_DISPLAY,
    },
  }
};
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

export const useEscapeKey = (onClose) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);
};

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
