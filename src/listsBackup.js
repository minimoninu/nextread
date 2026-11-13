// Copia de seguridad de las listas de lectura (localStorage -> archivo JSON y vuelta).

export const LIST_IDS = ['reading', 'want', 'read'];
const BACKUP_KIND = 'nextread-lists';
const BACKUP_VERSION = 1;

const sanitizeLists = (value) => {
  const clean = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  Object.entries(value).forEach(([bookId, listId]) => {
    if (!/^\d+$/.test(String(bookId))) return;
    if (!LIST_IDS.includes(listId)) return;
    clean[String(bookId)] = listId;
  });
  return clean;
};

export const buildListsBackup = (lists, now = new Date()) => ({
  kind: BACKUP_KIND,
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  lists: sanitizeLists(lists)
});

// Devuelve { lists, count } o lanza Error con un mensaje apto para mostrar.
export const parseListsBackup = (text) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!data || typeof data !== 'object' || data.kind !== BACKUP_KIND) {
    throw new Error('El archivo no es una copia de listas de NextRead.');
  }
  const lists = sanitizeLists(data.lists);
  const count = Object.keys(lists).length;
  if (count === 0) {
    throw new Error('La copia no contiene ningún libro guardado.');
  }
  return { lists, count };
};

// Las entradas importadas ganan sobre las actuales; el resto se conserva.
export const mergeLists = (current, imported) => ({
  ...sanitizeLists(current),
  ...sanitizeLists(imported)
});
