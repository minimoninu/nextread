import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * HOOK: useReadingLists
 * =====================
 * Maneja las listas de lectura personales:
 * - "want" = Quiero leer
 * - "reading" = Leyendo
 * - "read" = Leídos
 * 
 * Persiste en localStorage automáticamente.
 */

const STORAGE_KEY = 'nextread_lists';

// Configuración de las listas
export const LIST_CONFIG = {
  want: {
    id: 'want',
    label: 'Quiero leer',
    emoji: '📚',
    color: 'blue',
    colorClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/40'
  },
  reading: {
    id: 'reading',
    label: 'Leyendo',
    emoji: '📖',
    color: 'amber',
    colorClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/40'
  },
  read: {
    id: 'read',
    label: 'Leídos',
    emoji: '✅',
    color: 'green',
    colorClass: 'bg-green-500',
    textClass: 'text-green-400',
    bgClass: 'bg-green-500/20',
    borderClass: 'border-green-500/40'
  }
};

export const useReadingLists = () => {
  // Estado: { bookId: 'want' | 'reading' | 'read' }
  const [lists, setLists] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persistir en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (e) {
      console.warn('Error saving lists to localStorage:', e);
    }
  }, [lists]);

  // Obtener la lista de un libro
  const getBookList = useCallback((bookId) => {
    return lists[bookId] || null;
  }, [lists]);

  // Agregar/mover libro a una lista
  const addToList = useCallback((bookId, listId) => {
    setLists(prev => ({
      ...prev,
      [bookId]: listId
    }));
  }, []);

  // Quitar libro de todas las listas
  const removeFromLists = useCallback((bookId) => {
    setLists(prev => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
  }, []);

  // Toggle: si está en la lista, quitar; si no, agregar
  const toggleList = useCallback((bookId, listId) => {
    setLists(prev => {
      if (prev[bookId] === listId) {
        const next = { ...prev };
        delete next[bookId];
        return next;
      }
      return { ...prev, [bookId]: listId };
    });
  }, []);

  // Obtener todos los libros de una lista específica
  const getBooksInList = useCallback((listId) => {
    return Object.entries(lists)
      .filter(([_, list]) => list === listId)
      .map(([bookId]) => bookId);
  }, [lists]);

  // Estadísticas
  const stats = useMemo(() => {
    const counts = { want: 0, reading: 0, read: 0, total: 0 };
    Object.values(lists).forEach(listId => {
      if (counts[listId] !== undefined) {
        counts[listId]++;
        counts.total++;
      }
    });
    return counts;
  }, [lists]);

  // Verificar si un libro está en alguna lista
  const isInAnyList = useCallback((bookId) => {
    return bookId in lists;
  }, [lists]);

  // Limpiar todas las listas
  const clearAllLists = useCallback(() => {
    setLists({});
  }, []);

  // Exportar datos
  const exportData = useCallback(() => {
    return JSON.stringify(lists, null, 2);
  }, [lists]);

  // Importar datos
  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      setLists(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    lists,
    getBookList,
    addToList,
    removeFromLists,
    toggleList,
    getBooksInList,
    stats,
    isInAnyList,
    clearAllLists,
    exportData,
    importData,
    LIST_CONFIG
  };
};

export default useReadingLists;
