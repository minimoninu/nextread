import { useEffect } from 'react';

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
