import React, { useState } from 'react';
import { THEMES, LENGTH_FILTER_OPTIONS, DEFAULT_FILTERS, ACCLAIM_FILTER_OPTIONS, LANGUAGE_FILTER_OPTIONS, SECTION_TITLE_STYLE, getModalCloseButtonStyle } from './constants.js';

import { DEFAULT_FILTERS, ACCLAIM_FILTER_OPTIONS, LANGUAGE_FILTER_OPTIONS, SECTION_TITLE_STYLE, getModalCloseButtonStyle } from './App.jsx';
import { useEscapeKey } from './hooks.js';

const SOUL_FILTERS = {
  experience: {
    label: '¿Qué quieres sentir?',
    options: [
      { id: 'cry', icon: '💔', label: 'Me hará llorar', moods: ['emotivo', 'íntimo'], vibes: ['dramático'] },
      { id: 'grip', icon: '🔥', label: 'No podré soltarlo', moods: ['tenso', 'inquietante'], vibes: ['intriga', 'policial', 'psicológico'] },
      { id: 'think', icon: '🧠', label: 'Me hará pensar', moods: ['reflexivo'], vibes: ['ensayo', 'filosófico'] },
      { id: 'smile', icon: '😂', label: 'Me hará sonreír', moods: ['ligero', 'entretenido', 'irónico'], vibes: ['humor'] },
      { id: 'escape', icon: '🌌', label: 'Otro mundo', moods: ['inmersivo', 'imaginativo', 'especulativo'], vibes: ['fantasía', 'ciencia ficción'] }
    ]
  },
  moment: {
    label: '¿Cuándo lo leerás?',
    options: [
      { id: 'commute', icon: '🚇', label: 'En el metro', maxPages: 250, desc: 'Breve y ágil' },
      { id: 'weekend', icon: '☕', label: 'Fin de semana', minPages: 200, maxPages: 400, desc: 'Ideal para 2-3 días' },
      { id: 'vacation', icon: '🏖️', label: 'Vacaciones', moods: ['entretenido', 'inmersivo', 'ligero'], desc: 'Puro disfrute' },
      { id: 'nights', icon: '🌙', label: 'Noches largas', moods: ['tenso', 'inmersivo', 'inquietante'], desc: 'Que no te deje dormir' },
      { id: 'epic', icon: '📚', label: 'Proyecto épico', minPages: 500, desc: 'Más de 500 páginas' }
    ]
  },
  theme: {
    label: '¿Qué te interesa?',
    options: [
      { id: 'identity', icon: '🪞', label: 'Identidad', vibes: ['psicológico', 'memorias'], keywords: ['memoria', 'identidad'] },
      { id: 'love', icon: '❤️', label: 'Amor', vibes: ['romántico', 'erótico'], moods: ['emotivo', 'íntimo'] },
      { id: 'power', icon: '⚔️', label: 'Poder', vibes: ['histórico', 'político', 'historia'] },
      { id: 'crime', icon: '🔍', label: 'Crimen', vibes: ['policial', 'intriga', 'noir'] },
      { id: 'worlds', icon: '✨', label: 'Otros mundos', vibes: ['fantasía', 'ciencia ficción', 'aventura'] },
      { id: 'real', icon: '📰', label: 'Vida real', vibes: ['crónica', 'memorias', 'ensayo', 'divulgación'] }
    ]
  }
};

const FilterSheet = ({ filters, setFilters, moods, genres, onClose, theme }) => {
  const t = THEMES[theme];
  const [activeSection, setActiveSection] = useState('experience');
  useEscapeKey(onClose);

  const ChipButton = ({ active, onClick, children, large }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: large ? '44px' : '36px',
        padding: large ? '12px 14px' : '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${active ? t.accent : t.border.default}`,
        background: active ? t.accentMuted : t.bg.elevated,
        color: active ? t.accent : t.text.secondary,
        fontSize: large ? '14px' : '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 120ms ease',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {children}
    </button>
  );

  const SectionTab = ({ id, label, active }) => (
    <button
      onClick={() => setActiveSection(id)}
      aria-pressed={active}
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        border: `1px solid ${active ? t.accent : 'transparent'}`,
        background: active ? t.accentMuted : 'transparent',
        color: active ? t.accent : t.text.tertiary,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 120ms ease'
      }}
    >
      {label}
    </button>
  );

  const hasAnyFilter = filters.experience || filters.moment || filters.theme ||
    filters.difficulty || filters.hasAwards || filters.mood ||
    filters.length || filters.language || filters.minAcclaim ||
    (filters.genres && filters.genres.length > 0);

  const getActiveFiltersSummary = () => {
    const parts = [];
    if (filters.experience) {
      const exp = SOUL_FILTERS.experience.options.find(o => o.id === filters.experience);
      if (exp) parts.push(`${exp.icon} ${exp.label}`);
    }
    if (filters.moment) {
      const mom = SOUL_FILTERS.moment.options.find(o => o.id === filters.moment);
      if (mom) parts.push(`${mom.icon} ${mom.label}`);
    }
    if (filters.theme) {
      const th = SOUL_FILTERS.theme.options.find(o => o.id === filters.theme);
      if (th) parts.push(`${th.icon} ${th.label}`);
    }
    if (filters.difficulty) parts.push(`⚡ ${filters.difficulty}`);
    if (filters.hasAwards) parts.push('🏆 premiados');
    if (filters.genres.length > 0) parts.push(`🏷 ${filters.genres.length} generos`);
    if (filters.minAcclaim) parts.push(`⭐ ${filters.minAcclaim}+ critica`);
    if (filters.length) {
      const lengthLabel = LENGTH_FILTER_OPTIONS.find(o => o.id === filters.length)?.label;
      if (lengthLabel) parts.push(`📏 ${lengthLabel}`);
    }
    if (filters.language) {
      const languageLabel = LANGUAGE_FILTER_OPTIONS.find(o => o.id === filters.language)?.label;
      if (languageLabel) parts.push(`🌍 ${languageLabel}`);
    }
    return parts.join(' · ');
  };

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
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
        aria-label="Filtros de búsqueda"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          borderRadius: '16px 16px 0 0',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          borderBottom: 'none',
          boxShadow: '0 -16px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.24s cubic-bezier(0.2, 0, 0, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Handle de arrastre */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '12px',
          paddingBottom: '4px'
        }}>
          <div style={{
            width: '36px',
            height: '5px',
            borderRadius: '3px',
            background: t.border.strong,
            opacity: 0.6
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 24px 16px', borderBottom: `1px solid ${t.border.default}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: t.typography.display, fontSize: '22px', color: t.text.primary }}>
              Encuentra tu libro
            </h3>
            <button
              onClick={onClose}
              aria-label="Cerrar filtros"
              style={getModalCloseButtonStyle(t)}
            >
              ✕
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            background: t.bg.secondary,
            borderRadius: '8px',
            border: `1px solid ${t.border.default}`,
            padding: '4px'
          }}>
            <SectionTab id="experience" label="Sentir" active={activeSection === 'experience'} />
            <SectionTab id="moment" label="Momento" active={activeSection === 'moment'} />
            <SectionTab id="theme" label="Tema" active={activeSection === 'theme'} />
            <SectionTab id="classic" label="Clásicos" active={activeSection === 'classic'} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Resumen de filtros activos con gradiente */}
          {hasAnyFilter && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: t.accentMuted,
              marginBottom: '20px',
              border: `1px solid ${t.accent}`
            }}>
              <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '4px' }}>Buscando:</p>
              <p style={{ fontSize: '14px', color: t.text.primary, fontWeight: 500 }}>
                {getActiveFiltersSummary()}
              </p>
            </div>
          )}

          {/* Sección: Experiencia */}
          {activeSection === 'experience' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.experience.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SOUL_FILTERS.experience.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.experience === opt.id}
                    onClick={() => setFilters(f => ({
                      ...f,
                      experience: f.experience === opt.id ? null : opt.id
                    }))}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Momento */}
          {activeSection === 'moment' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.moment.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SOUL_FILTERS.moment.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.moment === opt.id}
                    onClick={() => setFilters(f => ({
                      ...f,
                      moment: f.moment === opt.id ? null : opt.id
                    }))}
                  >
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <div>
                      <div>{opt.label}</div>
                      {opt.desc && <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>}
                    </div>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Tema */}
          {activeSection === 'theme' && (
            <div>
              <p style={{ ...SECTION_TITLE_STYLE(t), fontSize: '12px', marginBottom: '12px' }}>
                {SOUL_FILTERS.theme.label}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {SOUL_FILTERS.theme.options.map(opt => (
                  <ChipButton
                    key={opt.id}
                    large
                    active={filters.theme === opt.id}
                    onClick={() => setFilters(f => ({
                      ...f,
                      theme: f.theme === opt.id ? null : opt.id
                    }))}
                  >
                    <span style={{ fontSize: '18px' }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </ChipButton>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Filtros clásicos */}
          {activeSection === 'classic' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Genero
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {genres.slice(0, 24).map(g => (
                    <ChipButton
                      key={g}
                      active={filters.genres.includes(g)}
                      onClick={() => setFilters(f => ({
                        ...f,
                        genres: f.genres.includes(g)
                          ? f.genres.filter(item => item !== g)
                          : [...f.genres, g]
                      }))}
                    >
                      {g}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Dificultad
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'ligero', icon: '○', label: 'Ligero' },
                    { id: 'medio', icon: '◐', label: 'Medio' },
                    { id: 'denso', icon: '●', label: 'Denso' }
                  ].map(d => (
                    <ChipButton
                      key={d.id}
                      active={filters.difficulty === d.id}
                      onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === d.id ? null : d.id }))}
                    >
                      {d.icon} {d.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Aclamacion critica
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ACCLAIM_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.minAcclaim === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        minAcclaim: f.minAcclaim === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Longitud
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LENGTH_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.length === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        length: f.length === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Idioma original (estimado)
                </p>
                <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '10px' }}>
                  Basado en nacionalidad del autor si no hay metadato explicito.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LANGUAGE_FILTER_OPTIONS.map(opt => (
                    <ChipButton
                      key={opt.id}
                      active={filters.language === opt.id}
                      onClick={() => setFilters(f => ({
                        ...f,
                        language: f.language === opt.id ? null : opt.id
                      }))}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Atmósfera
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {moods.slice(0, 10).map(m => (
                    <ChipButton
                      key={m}
                      active={filters.mood === m}
                      onClick={() => setFilters(f => ({ ...f, mood: f.mood === m ? null : m }))}
                    >
                      {m}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ ...SECTION_TITLE_STYLE(t), marginBottom: '12px' }}>
                  Especial
                </p>
                <ChipButton
                  active={filters.hasAwards}
                  onClick={() => setFilters(f => ({ ...f, hasAwards: !f.hasAwards }))}
                >
                  🏆 Solo premiados
                </ChipButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px',
          borderTop: `1px solid ${t.border.default}`,
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => setFilters({
              ...DEFAULT_FILTERS,
              search: filters.search
            })}
            style={{
              flex: 1, padding: '14px',
              minHeight: '44px',
              borderRadius: '8px',
              border: `1px solid ${t.border.default}`,
              background: t.bg.elevated,
              color: t.text.secondary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
          >
            Limpiar filtros
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '14px',
              minHeight: '44px',
              borderRadius: '8px',
              border: `1px solid ${t.accent}`,
              background: t.accent,
              color: t.bg.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'filter 120ms ease'
            }}
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
};


export default FilterSheet;
