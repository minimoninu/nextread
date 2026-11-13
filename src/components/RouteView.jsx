import { useState, useMemo } from 'react';
import { coverThumbUrl } from '../lib/bookUtils.js';
import { ROUTE_STAGES, ACCESS_LABELS, isRouteItemDone, summarizeRoute } from '../readingRoute.js';
import { THEMES } from '../theme.js';

const ROUTE_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'owned', label: 'En mi biblioteca' }
];

const ProgressBar = ({ value, total, t, height = 6 }) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={value}
    style={{ height, borderRadius: 999, background: t.bg.tertiary, overflow: 'hidden' }}
  >
    <div
      style={{
        width: `${total ? (value / total) * 100 : 0}%`,
        height: '100%',
        background: t.accent,
        transition: 'width 240ms ease'
      }}
    />
  </div>
);

const AccessDots = ({ level, t }) => (
  <span
    title={`Dificultad ${level}/5 · ${ACCESS_LABELS[level]}`}
    aria-label={`Dificultad ${level} de 5: ${ACCESS_LABELS[level]}`}
    style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}
  >
    {[1, 2, 3, 4, 5].map((dot) => (
      <span
        key={dot}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dot <= level ? t.accent : t.border.strong
        }}
      />
    ))}
  </span>
);

const RouteItem = ({ item, done, book, containerBook, onToggle, onBookClick, t }) => {
  const linkedBook = book || containerBook;
  return (
    <li
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 0',
        borderTop: `1px solid ${t.border.subtle}`,
        opacity: done ? 0.62 : 1
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-pressed={done}
        aria-label={done ? `Marcar «${item.t}» como pendiente` : `Marcar «${item.t}» como leída`}
        title={done ? 'Leída' : 'Marcar como leída'}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          marginTop: 2,
          borderRadius: '50%',
          border: `1.5px solid ${done ? t.success : t.border.strong}`,
          background: done ? t.success : 'transparent',
          color: '#fff',
          fontSize: 14,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {done ? '✓' : ''}
      </button>

      {book ? (
        <button
          type="button"
          onClick={() => onBookClick(book)}
          aria-label={`Abrir «${book.t}»`}
          style={{
            flexShrink: 0,
            width: 46,
            height: 69,
            padding: 0,
            border: 'none',
            borderRadius: 4,
            overflow: 'hidden',
            background: t.bg.tertiary,
            cursor: 'pointer'
          }}
        >
          <img
            src={coverThumbUrl(book.id)}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        </button>
      ) : (
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 46,
            height: 69,
            borderRadius: 4,
            border: `1px dashed ${t.border.default}`,
            color: t.text.muted,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {item.n}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px' }}>
          <span style={{ fontSize: 12, color: t.text.muted, fontVariantNumeric: 'tabular-nums' }}>#{item.n}</span>
          <h4
            style={{
              margin: 0,
              fontFamily: t.typography.display,
              fontSize: 18,
              fontWeight: 400,
              color: t.text.primary,
              textDecoration: done ? 'line-through' : 'none'
            }}
          >
            {item.t}
          </h4>
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: t.text.secondary }}>
          {item.a} · {item.y} · {item.c}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: t.text.tertiary }}>{item.why}</p>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px 12px',
            fontSize: 12,
            color: t.text.muted
          }}
        >
          <AccessDots level={item.acc} t={t} />
          <span>{item.pg} págs.</span>
          <span>{item.g}</span>
          {linkedBook && (
            <button
              type="button"
              onClick={() => onBookClick(linkedBook)}
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                border: `1px solid ${t.accent}`,
                background: t.accentMuted,
                color: t.accent,
                fontSize: 12,
                fontFamily: t.typography.body,
                cursor: 'pointer'
              }}
            >
              {book ? 'En tu biblioteca' : `Incluida en «${containerBook.t}»`}
            </button>
          )}
        </div>
      </div>
    </li>
  );
};

// =============================================================================
// COMPONENTE: RouteView - ruta cronológica de 200 obras
// =============================================================================
export const RouteView = ({ items, books, lists, routeDone, onToggleDone, onBookClick, theme }) => {
  const t = THEMES[theme];
  const [filter, setFilter] = useState('all');
  const [openStages, setOpenStages] = useState(null);

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const summary = useMemo(() => summarizeRoute(items, routeDone, lists), [items, routeDone, lists]);
  const ownedCount = useMemo(() => items.filter((item) => item.bookId != null).length, [items]);

  // Por defecto solo se despliega el tramo de la siguiente lectura.
  const defaultOpen = summary.next ? summary.next.stage : ROUTE_STAGES[0].id;
  const isOpen = (stageId) => (openStages ? openStages.has(stageId) : stageId === defaultOpen);
  const toggleStage = (stageId) => {
    setOpenStages((prev) => {
      const next = new Set(prev || [defaultOpen]);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const visible = (item) => {
    if (filter === 'pending') return !isRouteItemDone(item, routeDone, lists);
    if (filter === 'owned') return item.bookId != null || item.inBookId != null;
    return true;
  };

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', padding: '80px 24px', color: t.text.secondary }}>Cargando la ruta…</p>
    );
  }

  const next = summary.next;
  const nextBook = next ? booksById.get(next.bookId) || booksById.get(next.inBookId) : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 20px 40px' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.accent }}>
          Ruta de lectura
        </p>
        <h2
          style={{
            margin: '6px 0 8px',
            fontFamily: t.typography.display,
            fontWeight: 400,
            fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
            lineHeight: 1.15,
            color: t.text.primary
          }}
        >
          200 libros para formarse como lector literario
        </h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: t.text.secondary }}>
          Un recorrido cronológico de 1811 a 2024 con dificultad escalonada. Respeta los tramos, pero dentro de cada
          uno puedes alterar el orden para no encadenar lecturas difíciles.
        </p>
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: t.text.secondary,
              marginBottom: 6
            }}
          >
            <span>
              <strong style={{ color: t.text.primary }}>{summary.done}</strong> de {summary.total} leídas
            </span>
            <span>{ownedCount} en tu biblioteca</span>
          </div>
          <ProgressBar value={summary.done} total={summary.total} t={t} height={8} />
        </div>
      </header>

      {next && (
        <section
          aria-label="Siguiente lectura"
          style={{
            marginBottom: 24,
            padding: 18,
            borderRadius: 12,
            border: `1px solid ${t.border.default}`,
            background: t.bg.secondary
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.text.muted }}>
            Siguiente lectura · #{next.n}
          </p>
          <h3
            style={{
              margin: '6px 0 2px',
              fontFamily: t.typography.display,
              fontWeight: 400,
              fontSize: 24,
              color: t.text.primary
            }}
          >
            {next.t}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: t.text.secondary }}>
            {next.a} · {next.y} · {next.pg} págs. · {ACCESS_LABELS[next.acc].toLowerCase()}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: t.text.tertiary }}>{next.why}</p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nextBook && (
              <button
                type="button"
                onClick={() => onBookClick(nextBook)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: t.accent,
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: t.typography.body,
                  cursor: 'pointer'
                }}
              >
                Abrir libro
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleDone(next)}
              style={{
                padding: '9px 16px',
                borderRadius: 999,
                border: `1px solid ${t.border.strong}`,
                background: 'transparent',
                color: t.text.primary,
                fontSize: 14,
                fontFamily: t.typography.body,
                cursor: 'pointer'
              }}
            >
              Marcar como leída
            </button>
          </div>
        </section>
      )}

      <div role="group" aria-label="Filtrar obras" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {ROUTE_FILTERS.map((option) => {
          const active = filter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: `1px solid ${active ? t.accent : t.border.default}`,
                background: active ? t.accentMuted : 'transparent',
                color: active ? t.accent : t.text.secondary,
                fontSize: 13,
                fontFamily: t.typography.body,
                cursor: 'pointer'
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {ROUTE_STAGES.map((stage) => {
        const stageItems = items.filter((item) => item.stage === stage.id && visible(item));
        const stats = summary.byStage[stage.id] || { total: 0, done: 0 };
        const open = isOpen(stage.id);
        return (
          <section key={stage.id} style={{ borderTop: `1px solid ${t.border.default}` }}>
            <button
              type="button"
              onClick={() => toggleStage(stage.id)}
              aria-expanded={open}
              style={{
                width: '100%',
                padding: '16px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: t.text.primary,
                fontFamily: t.typography.body
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: t.typography.display, fontSize: 20 }}>
                  {stage.label} · {stage.title}
                </span>
                <span style={{ flexShrink: 0, fontSize: 13, color: t.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                  {stats.done}/{stats.total} {open ? '▴' : '▾'}
                </span>
              </div>
              <p style={{ margin: '4px 0 10px', fontSize: 13, lineHeight: 1.5, color: t.text.tertiary }}>{stage.goal}</p>
              <ProgressBar value={stats.done} total={stats.total} t={t} height={4} />
            </button>
            {open && (
              stageItems.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 8px' }}>
                  {stageItems.map((item) => (
                    <RouteItem
                      key={item.n}
                      item={item}
                      done={isRouteItemDone(item, routeDone, lists)}
                      book={booksById.get(item.bookId)}
                      containerBook={booksById.get(item.inBookId)}
                      onToggle={onToggleDone}
                      onBookClick={onBookClick}
                      t={t}
                    />
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, padding: '0 0 18px', fontSize: 13, color: t.text.muted }}>
                  Ninguna obra de este tramo coincide con el filtro.
                </p>
              )
            )}
          </section>
        );
      })}
    </div>
  );
};
