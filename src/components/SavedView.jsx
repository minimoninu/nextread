import { useState, useMemo, useRef } from 'react';
import { Shelf } from './Shelf.jsx';
import { COPY } from '../lib/constants.js';
import { buildListsBackup, parseListsBackup } from '../listsBackup.js';
import { FONT_STACK_BODY, THEMES } from '../theme.js';

// =============================================================================
// COMPONENTE: ListsBackupBar - exportar / importar listas a un archivo JSON
// =============================================================================
export const ListsBackupBar = ({ lists, onImport, theme }) => {
  const t = THEMES[theme];
  const fileRef = useRef(null);
  const [message, setMessage] = useState(null);
  const savedTotal = Object.keys(lists).length;

  const handleExport = () => {
    const backup = buildListsBackup(lists);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nextread-listas-${backup.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: `Copia exportada (${Object.keys(backup.lists).length} libros).` });
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const { lists: imported, count } = parseListsBackup(await file.text());
      onImport(imported);
      setMessage({ ok: true, text: `Copia importada: ${count} libros combinados con tus listas.` });
    } catch (error) {
      setMessage({ ok: false, text: error.message || 'No se pudo importar la copia.' });
    }
  };

  const buttonStyle = {
    padding: '8px 14px',
    borderRadius: '999px',
    border: `1px solid ${t.border.default}`,
    background: 'transparent',
    color: t.text.secondary,
    fontSize: '13px',
    fontFamily: FONT_STACK_BODY,
    cursor: 'pointer'
  };

  return (
    <div style={{ margin: '32px 24px 0', paddingTop: '20px', borderTop: `1px solid ${t.border.subtle}`, textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: t.text.tertiary, marginBottom: '12px' }}>{COPY.saved.backupHint}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={savedTotal === 0}
          style={{ ...buttonStyle, opacity: savedTotal === 0 ? 0.45 : 1, cursor: savedTotal === 0 ? 'default' : 'pointer' }}
        >
          {COPY.saved.export}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} style={buttonStyle}>
          {COPY.saved.import}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {message && (
        <p role="status" style={{ fontSize: '13px', marginTop: '12px', color: message.ok ? t.success : t.accent }}>
          {message.text}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE: SavedView (vista de guardados)
// =============================================================================
export const SavedView = ({ books, lists, onBookClick, theme, getListStatus, onImportLists }) => {
  const t = THEMES[theme];
  
  const savedBooks = useMemo(() => {
    const reading = books.filter(b => lists[b.id] === 'reading');
    const want = books.filter(b => lists[b.id] === 'want');
    const read = books.filter(b => lists[b.id] === 'read');
    return { reading, want, read };
  }, [books, lists]);
  
  const totalSaved = savedBooks.reading.length + savedBooks.want.length + savedBooks.read.length;
  
  if (totalSaved === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>♡</div>
        <p style={{ fontSize: '18px', color: t.text.secondary, marginBottom: '8px' }}>{COPY.saved.empty}</p>
        <p style={{ fontSize: '14px', color: t.text.tertiary }}>{COPY.saved.emptyHint}</p>
        <ListsBackupBar lists={lists} onImport={onImportLists} theme={theme} />
      </div>
    );
  }
  
  return (
    <div>
      {savedBooks.reading.length > 0 && (
        <Shelf 
          title={`◐ ${COPY.saved.reading} (${savedBooks.reading.length})`}
          books={savedBooks.reading}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.want.length > 0 && (
        <Shelf 
          title={`○ ${COPY.saved.want} (${savedBooks.want.length})`}
          books={savedBooks.want}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      {savedBooks.read.length > 0 && (
        <Shelf 
          title={`✔ ${COPY.saved.read} (${savedBooks.read.length})`}
          books={savedBooks.read}
          onBookClick={onBookClick}
          theme={theme}
          getListStatus={getListStatus}
        />
      )}
      <ListsBackupBar lists={lists} onImport={onImportLists} theme={theme} />
    </div>
  );
};
