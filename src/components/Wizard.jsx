import { useState, useCallback } from 'react';
import { haptic, Touchable, getModalCloseButtonStyle } from './ui.jsx';
import { useEscapeKey } from '../hooks.js';
import { WIZARD_QUESTIONS } from '../lib/wizardQuestions.js';
import { THEMES } from '../theme.js';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from '../wizardPreferences.js';

export const Wizard = ({ books, hooks, onSelect, onClose, theme }) => {
  // Estado del wizard
  const [path, setPath] = useState(['root']); // Camino de preguntas
  const [answers, setAnswers] = useState({}); // Respuestas por pregunta
  const [preferences, setPreferences] = useState({}); // Preferencias acumuladas
  const [result, setResult] = useState(null);
  const [resultIndex, setResultIndex] = useState(0);
  
  const t = THEMES[theme];
  useEscapeKey(onClose);
  
  // Pregunta actual basada en el path
  const currentQuestionKey = path[path.length - 1];
  const currentQuestion = WIZARD_QUESTIONS[currentQuestionKey];
  
  // Contar preguntas respondidas
  const questionsAnswered = Object.keys(answers).length;
  const estimatedTotal = Math.min(8, questionsAnswered + 3); // Estimación dinámica
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE SCORING NUEVO
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateScore = useCallback((book) => {
    let score = 0;
    const bookHook = hooks[String(book.id)];
    const bookVibes = book.v || [];
    const bookMood = book.m || '';
    const bookThemes = bookHook?.themes || [];
    const bookExperience = bookHook?.experience || '';
    const pages = book.pg || 300;
    const difficulty = book.d || 'medio';
    const hasSeries = !!book.s;
    const awards = book.aw || [];
    
    const matchDetails = {
      themes: [],
      experiences: false,
      vibes: [],
      moods: false,
      pages: false,
      difficulty: false,
      series: false,
      awards: false,
      hook: !!bookHook
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // MATCH DIRECTO (0-120 puntos) - LO MÁS IMPORTANTE
    // ═══════════════════════════════════════════════════════════════════════
    
    // Themes que eligió el usuario (hasta 75 pts)
    const userThemes = preferences.themes || [];
    const themeMatches = bookThemes.filter(t => userThemes.includes(t));
    if (themeMatches.length > 0) {
      score += themeMatches.length * 25;
      matchDetails.themes = themeMatches;
    }
    
    // Experience (hasta 40 pts)
    const userExperiences = preferences.experiences || [];
    if (bookExperience && userExperiences.includes(bookExperience)) {
      score += 40;
      matchDetails.experiences = true;
    }
    
    // Vibes/género (hasta 45 pts)
    const userVibes = preferences.vibes || [];
    const vibeMatches = bookVibes.filter(v => userVibes.includes(v));
    if (vibeMatches.length > 0) {
      score += vibeMatches.length * 15;
      matchDetails.vibes = vibeMatches;
    }
    
    // Mood del libro (20 pts)
    const userMoods = preferences.moods || [];
    if (bookMood && userMoods.includes(bookMood)) {
      score += 20;
      matchDetails.moods = true;
    }
    
    // Keywords en synopsis (bonus de 15 pts)
    const keywords = preferences.keywords || [];
    if (keywords.length > 0 && book.syn) {
      const synLower = book.syn.toLowerCase();
      const keywordMatch = keywords.some(kw => synLower.includes(kw.toLowerCase()));
      if (keywordMatch) score += 15;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FILTROS DUROS (Penalización o Descalificación)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Páginas
    const pagePrefs = preferences.pages;
    if (pagePrefs) {
      const maxPages = pagePrefs.max || 9999;
      const minPages = pagePrefs.min || 0;
      
      if (pages > maxPages) {
        score -= 60; // Penalización fuerte por exceder
      } else if (pages < minPages) {
        score -= 40; // Penalización por ser muy corto
      } else {
        score += 15; // Bonus por encajar
        matchDetails.pages = true;
      }
    }
    
    // Dificultad
    const diffPrefs = preferences.difficulty;
    if (diffPrefs && diffPrefs.length > 0) {
      if (diffPrefs.includes(difficulty)) {
        score += 15;
        matchDetails.difficulty = true;
      } else {
        score -= 35;
      }
    }
    
    // Serie vs Standalone
    if (preferences.standalone === true && hasSeries) {
      score -= 100; // Descalificar si quiere standalone y es serie
    }
    if (preferences.wantsSeries === true && !hasSeries) {
      score -= 25; // Penalizar si quiere serie y no es
    }
    if (preferences.wantsSeries === true && hasSeries) {
      score += 10;
      matchDetails.series = true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CALIDAD (Reducido: 0-15 puntos máximo)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Hook disponible (ahora vale menos)
    if (bookHook) {
      score += 5;
    }
    
    // Premios (valen menos, pero bonus si el usuario eligió "zona segura")
    if (awards.length > 0) {
      matchDetails.awards = true;
      if (preferences.riskLevel === 'safe') {
        score += 15; // Bonus si quiere zona segura
      } else {
        score += 3; // Mínimo
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FACTOR DESCUBRIMIENTO (0-25 puntos)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (preferences.riskLevel === 'adventurous') {
      // Boost a libros sin premio
      if (awards.length === 0) score += 15;
      // Boost a libros sin hook (menos conocidos)
      if (!bookHook) score += 10;
    }
    
    // Filtros especiales para descubrimiento
    if (preferences.filter) {
      if (preferences.filter.noAwards && awards.length === 0) score += 20;
      if (preferences.filter.hasAwards && awards.length > 0) score += 20;
      if (preferences.filter.award && awards.includes(preferences.filter.award)) score += 25;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ALEATORIEDAD CONTROLADA (0-20 puntos)
    // ═══════════════════════════════════════════════════════════════════════
    
    score += Math.random() * 20;
    
    return { score: Math.max(0, score), matchDetails };
  }, [hooks, preferences]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OBTENER RECOMENDACIONES CON POOL DIVERSIFICADO
  // ═══════════════════════════════════════════════════════════════════════════
  const getRecommendations = useCallback(() => {
    // Calcular score para todos los libros
    const scored = books.map(book => {
      const { score, matchDetails } = calculateScore(book);
      return { book, score, matchDetails };
    });
    
    // Ordenar por score
    scored.sort((a, b) => b.score - a.score);
    
    // Filtrar los que tienen score muy negativo
    const valid = scored.filter(s => s.score > 0);
    
    if (valid.length === 0) {
      // Si no hay válidos, tomar los mejores de todos modos
      return scored.slice(0, 8);
    }
    
    // Pool diversificado
    const pickRandom = (arr, count) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };
    
    // Tier 1: Top 3 matches (de los 10 mejores)
    const tier1Pool = valid.slice(0, 10);
    const tier1 = pickRandom(tier1Pool, 3);
    
    // Tier 2: Buenos matches con sorpresa (posiciones 10-40)
    const tier2Pool = valid.slice(10, 40);
    const tier2 = tier2Pool.length > 0 ? pickRandom(tier2Pool, 3) : [];
    
    // Tier 3: Joyas ocultas (score > 40 pero fuera del top 40)
    const tier3Pool = valid.slice(40).filter(s => s.score > 40);
    const tier3 = tier3Pool.length > 0 ? pickRandom(tier3Pool, 2) : [];
    
    // Combinar y mezclar
    let result = [...tier1, ...tier2, ...tier3];
    result = result.sort(() => Math.random() - 0.5);
    
    // Asegurar que tenemos al menos 8
    while (result.length < 8 && valid.length > result.length) {
      const remaining = valid.filter(v => !result.some(r => r.book.id === v.book.id));
      if (remaining.length > 0) {
        result.push(remaining[0]);
      } else break;
    }
    
    return result.slice(0, 8);
  }, [books, calculateScore]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAR RAZÓN PERSONALIZADA
  // ═══════════════════════════════════════════════════════════════════════════
  const generateReason = useCallback((book, matchDetails) => {
    const bookHook = hooks[String(book.id)];
    const reasons = [];
    const whyMatches = [];
    
    // Razón principal: el hook
    if (bookHook?.hook) {
      reasons.push(bookHook.hook);
    }
    
    // Por qué encaja
    if (matchDetails.themes?.length > 0) {
      whyMatches.push(`Explora ${matchDetails.themes.slice(0, 2).join(' y ')}`);
    }
    if (matchDetails.experiences) {
      const expLabels = {
        devastador: 'te devastará',
        conmovedor: 'te conmoverá',
        perturbador: 'te inquietará',
        épico: 'es épico',
        monumental: 'es monumental',
        melancólico: 'tiene melancolía hermosa',
        sardónico: 'tiene ironía mordaz',
        tenso: 'te mantendrá en tensión'
      };
      const exp = bookHook?.experience;
      if (exp && expLabels[exp]) {
        whyMatches.push(expLabels[exp]);
      }
    }
    if (matchDetails.pages) {
      whyMatches.push('encaja con tu tiempo disponible');
    }
    
    return {
      main: reasons[0] || 'Este libro encaja con lo que buscas.',
      whyMatches: whyMatches.slice(0, 3),
      perfectFor: bookHook?.perfect_for,
      experience: bookHook?.experience,
      themes: bookHook?.themes?.slice(0, 4) || [],
      whyMatters: bookHook?.why_matters
    };
  }, [hooks]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MANEJAR SELECCIÓN DE OPCIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSelect = (option) => {
    haptic.medium();
    
    // Guardar respuesta
    const newAnswers = { ...answers, [currentQuestion.key]: option.id };
    setAnswers(newAnswers);
    
    // Acumular preferencias de esta opción
    const newPrefs = applyOptionToPreferences(preferences, option);
    setPreferences(newPrefs);
    
    // Si es sorpresa total, generar resultado inmediato
    if (option.direct || option.algorithm === 'random_quality') {
      const recs = getRecommendations();
      setResult(recs);
      setResultIndex(0);
      return;
    }
    
    // Determinar siguiente pregunta
    if (option.next) {
      setPath([...path, option.next]);
    } else {
      // Fin del wizard - generar resultados
      const recs = getRecommendations();
      setResult(recs);
      setResultIndex(0);
    }
  };
  
  // Volver atrás
  const handleBack = () => {
    if (path.length > 1) {
      const newPath = path.slice(0, -1);
      const lastKey = path[path.length - 1];
      
      // Remover respuesta y preferencias de la última pregunta
      const newAnswers = { ...answers };
      delete newAnswers[lastKey];
      setAnswers(newAnswers);
      
      const rebuiltPreferences = buildPreferencesFromAnswers(newAnswers, newPath, WIZARD_QUESTIONS);
      setPreferences(rebuiltPreferences);
      
      setPath(newPath);
    }
  };
  
  // Reiniciar
  const handleStartOver = () => {
    setPath(['root']);
    setAnswers({});
    setPreferences({});
    setResult(null);
    setResultIndex(0);
  };
  
  // Probar otro libro
  const handleTryAnother = () => {
    haptic.light();
    if (result && resultIndex < result.length - 1) {
      setResultIndex(resultIndex + 1);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Resultado
  // ═══════════════════════════════════════════════════════════════════════════
  if (result && result.length > 0) {
    const { book, matchDetails } = result[resultIndex];
    const reason = generateReason(book, matchDetails);
    const coverUrl = `/portadas/${book.id}.jpg`;
    const pages = book.pg || 300;
    const hours = book.h || Math.round(pages / 40);
    const awards = book.aw || [];
    
    return (
      <div 
        onClick={onClose}
        role="presentation"
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
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
          aria-label="Resultado del wizard"
          style={{
            width: '100%', maxWidth: '440px',
            borderRadius: '14px',
            background: t.bg.primary,
            border: `1px solid ${t.border.default}`,
            boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
            animation: 'scaleIn 0.2s ease',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            background: t.bg.primary,
            borderBottom: `1px solid ${t.border.default}`,
            padding: '24px 24px 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: t.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Tu próxima lectura
              </p>
              <button onClick={onClose} aria-label="Cerrar wizard" style={getModalCloseButtonStyle(t)}>✕</button>
            </div>
            
            {/* Portada y título */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ 
                width: '110px', height: '165px', flexShrink: 0,
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(0,0,0,0.25)'
              }}>
                <img src={coverUrl} alt={book.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ 
                  fontFamily: t.typography.display, fontSize: '22px', fontWeight: 600,
                  color: t.text.primary, marginBottom: '8px', lineHeight: 1.2
                }}>
                  {book.t}
                </h2>
                <p style={{ fontSize: '15px', color: t.accent, marginBottom: '12px' }}>
                  {(book.a || ['Desconocido']).join(', ')}
                </p>
                
                {/* Badges de premios */}
                {awards.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {awards.slice(0, 2).map((award, i) => (
                      <span key={i} style={{
                        fontSize: '11px', padding: '4px 8px',
                        background: `${t.accent}20`, color: t.accent,
                        borderRadius: '6px', fontWeight: 500
                      }}>
                        ★ {award.replace('Premio hispano importante', 'Premio literario')}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: t.text.secondary }}>
                  <span>{pages} pág</span>
                  <span>~{hours}h</span>
                  <span style={{ textTransform: 'capitalize' }}>{book.d || 'medio'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Por qué este libro */}
          <div style={{ padding: '0 24px 24px' }}>
            {/* Hook principal */}
            <div style={{ 
              background: t.bg.tertiary, 
              borderRadius: '14px', 
              padding: '16px',
              marginBottom: '16px',
              borderLeft: `3px solid ${t.accent}`
            }}>
              <p style={{ 
                fontSize: '15px', color: t.text.primary, 
                lineHeight: 1.5, fontStyle: 'italic'
              }}>
                "{reason.main}"
              </p>
            </div>
            
            {/* Por qué encaja */}
            {reason.whyMatches.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: t.text.tertiary, marginBottom: '8px', fontWeight: 600 }}>
                  POR QUÉ ENCAJA CONTIGO:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {reason.whyMatches.map((match, i) => (
                    <span key={i} style={{
                      fontSize: '13px', padding: '6px 12px',
                      background: t.bg.secondary,
                      borderRadius: '20px', color: t.text.secondary
                    }}>
                      ✔ {match}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Perfect for */}
            {reason.perfectFor && (
              <p style={{ fontSize: '13px', color: t.text.secondary, marginBottom: '16px' }}>
                <span style={{ color: t.accent }}>👤</span> Perfecto para: {reason.perfectFor}
              </p>
            )}
            
            {/* Temas */}
            {reason.themes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {reason.themes.map((theme, i) => (
                  <span key={i} style={{
                    fontSize: '12px', padding: '4px 10px',
                    background: t.border.subtle,
                    borderRadius: '12px', color: t.text.tertiary
                  }}>
                    {theme}
                  </span>
                ))}
              </div>
            )}
            
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { onSelect(book); haptic.success(); }}
                style={{
                  flex: 1, padding: '14px',
                  borderRadius: '14px', border: 'none',
                  background: t.gradient?.accent || t.accent,
                  color: t.bg.primary,
                  fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${t.accent}40`
                }}
              >
                📖 Lo leo ahora
              </button>
              {resultIndex < result.length - 1 && (
                <button
                  onClick={handleTryAnother}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    border: `1px solid ${t.border.default}`,
                    background: 'transparent',
                    color: t.text.secondary,
                    fontSize: '15px', fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Otro →
                </button>
              )}
            </div>
            
            {/* Indicador de posición */}
            <div style={{ 
              display: 'flex', justifyContent: 'center', gap: '6px', 
              marginTop: '16px'
            }}>
              {result.slice(0, 8).map((_, i) => (
                <div key={i} style={{
                  width: i === resultIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === resultIndex ? t.accent : t.border.default,
                  transition: 'all 200ms ease'
                }} />
              ))}
            </div>
            
            {/* Empezar de nuevo */}
            <button
              onClick={handleStartOver}
              style={{
                width: '100%', marginTop: '16px',
                padding: '12px', background: 'none',
                border: 'none', color: t.text.tertiary,
                fontSize: '13px', cursor: 'pointer'
              }}
            >
              ← Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Preguntas
  // ═══════════════════════════════════════════════════════════════════════════
  if (!currentQuestion) return null;
  
  return (
    <div 
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
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
        aria-label="Preguntas del wizard"
        style={{
          width: '100%', maxWidth: '440px',
          borderRadius: '14px', padding: '24px',
          background: t.bg.primary,
          border: `1px solid ${t.border.default}`,
          boxShadow: '0 14px 32px rgba(0,0,0,0.18)',
          animation: 'scaleIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {path.length > 1 ? (
            <button onClick={handleBack} style={{ 
              background: 'none', border: 'none', 
              color: t.text.tertiary, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              ← Atrás
            </button>
          ) : <div />}
          <button onClick={onClose} aria-label="Cerrar wizard" style={getModalCloseButtonStyle(t)}>✕</button>
        </div>
        
        {/* Progress visual (camino recorrido) */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px' }}>
          {path.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '3px',
              borderRadius: '2px',
              background: i < path.length - 1 ? t.accent : `${t.accent}40`,
              transition: 'all 300ms ease'
            }} />
          ))}
          {/* Espacios para preguntas futuras estimadas */}
          {[...Array(Math.max(0, estimatedTotal - path.length))].map((_, i) => (
            <div key={`future-${i}`} style={{
              flex: 1, height: '3px',
              borderRadius: '2px',
              background: t.border.subtle
            }} />
          ))}
        </div>
        
        {/* Número de pregunta */}
        <p style={{ 
          fontSize: '12px', color: t.text.tertiary, 
          marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'
        }}>
          Pregunta {path.length}
        </p>
        
        {/* Pregunta */}
        <h2 style={{ 
          fontFamily: t.typography.display,
          fontSize: '24px', fontWeight: 600,
          color: t.text.primary,
          marginBottom: '8px',
          lineHeight: 1.3
        }}>
          {currentQuestion.question}
        </h2>
        
        {currentQuestion.hint && (
          <p style={{ 
            fontSize: '14px', color: t.text.tertiary, 
            marginBottom: '28px'
          }}>
            {currentQuestion.hint}
          </p>
        )}
        
        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQuestion.options.map(option => (
            <Touchable
              key={option.id}
              onClick={() => handleSelect(option)}
              scale={0.98}
              hapticType="light"
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: answers[currentQuestion.key] === option.id 
                  ? `${t.accent}15` 
                  : t.bg.secondary,
                border: `1.5px solid ${answers[currentQuestion.key] === option.id ? t.accent : t.border.subtle}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '26px' }}>{option.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '16px', fontWeight: 600, 
                    color: t.text.primary, marginBottom: '2px'
                  }}>
                    {option.label}
                  </p>
                  {option.desc && (
                    <p style={{ fontSize: '13px', color: t.text.tertiary }}>
                      {option.desc}
                    </p>
                  )}
                </div>
                {answers[currentQuestion.key] === option.id && (
                  <span style={{ color: t.accent, fontSize: '18px' }}>✔</span>
                )}
              </div>
            </Touchable>
          ))}
        </div>
        
        {/* Nota al pie para la primera pregunta */}
        {path.length === 1 && (
          <p style={{ 
            fontSize: '12px', color: t.text.muted, 
            textAlign: 'center', marginTop: '24px'
          }}>
            Tus respuestas nos ayudan a encontrar el libro perfecto para ti
          </p>
        )}
      </div>
    </div>
  );
};
