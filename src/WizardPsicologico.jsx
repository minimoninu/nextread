import React, { useState } from 'react';

/**
 * WIZARD DE RECOMENDACIÓN PSICOLÓGICA
 * ====================================
 * Basado en investigación sobre motivaciones lectoras:
 * 
 * - "La lectura abarca dimensiones lúdicas, creativas y sociales"
 * - Factores de preferencia: "Trepidante", "Cerebral", "Oscuro"
 * - "Leer ficción se asocia con mayores niveles de empatía"
 * - "La lectura puede regular el estado de ánimo del lector"
 * 
 * 5 pasos condensados de las 10 preguntas de investigación:
 * 1. Motivación principal (¿para qué lees?)
 * 2. Estado emocional (¿qué necesitas ahora?)
 * 3. Tipo de experiencia (espejo vs ventana)
 * 4. Factor de estilo (Trepidante/Cerebral/Oscuro/Emotivo)
 * 5. Formato (extensión y compromiso)
 */

const WizardPsicologico = ({ books, onSelect, onClose }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // =========================================================================
  // HELPERS PARA ACCEDER A DATOS DEL LIBRO
  // =========================================================================
  
  const get = (book, ...fields) => {
    for (const f of fields) {
      if (book[f] !== undefined && book[f] !== null) return book[f];
    }
    return null;
  };
  
  const getPages = (b) => get(b, 'pg', 'pages') || 300;
  const getDiff = (b) => get(b, 'd', 'difficulty') || 'medio';
  const getMood = (b) => get(b, 'm', 'mood');
  const getVibes = (b) => get(b, 'v', 'vibes') || [];
  const getAwards = (b) => get(b, 'aw', 'awards') || [];
  const getAcclaim = (b) => get(b, 'ac', 'acclaim_score') || 5;
  const getSeries = (b) => get(b, 's', 'series');
  const getTitle = (b) => get(b, 't', 'title') || '';
  const getAuthors = (b) => get(b, 'a', 'authors') || ['Desconocido'];
  
  // =========================================================================
  // DEFINICIÓN DE PASOS
  // =========================================================================
  
  const steps = [
    // -----------------------------------------------------------------------
    // PASO 1: MOTIVACIÓN PRINCIPAL
    // "La literatura puede cumplir diversas funciones: entretener, enseñar o inspirar"
    // "Leer constituye un espacio de construcción personal y social"
    // -----------------------------------------------------------------------
    {
      id: 'motivacion',
      pregunta: '¿Qué te trae hoy a buscar un libro?',
      contexto: 'Tu motivación guiará el tipo de lectura ideal',
      opciones: [
        {
          value: 'placer',
          emoji: '🎭',
          titulo: 'Placer y entretenimiento',
          desc: 'Disfrutar una buena historia, dejarme llevar',
          boost: {
            vibes: ['ficción', 'dramático', 'aventura', 'romántico', 'humor'],
            moods: ['entretenido', 'ligero', 'emotivo', 'inmersivo'],
          },
        },
        {
          value: 'escapar',
          emoji: '🚀',
          titulo: 'Escapar de la realidad',
          desc: 'Transportarme a otros mundos, otras vidas',
          boost: {
            vibes: ['fantasía', 'ciencia ficción', 'aventura', 'histórico', 'épico'],
            moods: ['inmersivo', 'imaginativo', 'especulativo'],
          },
        },
        {
          value: 'crecer',
          emoji: '🌱',
          titulo: 'Crecimiento personal',
          desc: 'Entenderme mejor, ver el mundo diferente',
          boost: {
            vibes: ['filosófico', 'psicológico', 'memorias', 'dramático', 'realista'],
            moods: ['reflexivo', 'íntimo', 'emotivo'],
          },
        },
        {
          value: 'aprender',
          emoji: '📚',
          titulo: 'Aprender algo nuevo',
          desc: 'Conocimiento, ideas, perspectivas',
          boost: {
            vibes: ['ensayo', 'divulgación', 'historia', 'ciencias sociales', 'política'],
            moods: ['reflexivo'],
          },
          diffBias: 'denso',
        },
        {
          value: 'estimular',
          emoji: '🧩',
          titulo: 'Estimular mi mente',
          desc: 'Resolver misterios, desafiar mi pensamiento',
          boost: {
            vibes: ['intriga', 'policial', 'filosófico', 'ciencia ficción', 'thriller'],
            moods: ['tenso', 'inquietante', 'especulativo'],
          },
        },
      ],
    },
    
    // -----------------------------------------------------------------------
    // PASO 2: ESTADO EMOCIONAL
    // "La lectura puede regular el estado de ánimo del lector"
    // "Leer desarrolla competencias socioemocionales"
    // -----------------------------------------------------------------------
    {
      id: 'estado',
      pregunta: '¿Cómo te sientes ahora mismo?',
      contexto: 'Tu estado emocional nos ayuda a elegir el tono adecuado',
      opciones: [
        {
          value: 'cansado',
          emoji: '😮‍💨',
          titulo: 'Agotado/a',
          desc: 'Necesito algo que no me exija mucho',
          boost: { moods: ['ligero', 'entretenido'] },
          penalty: { moods: ['denso', 'intenso', 'oscuro', 'reflexivo'] },
          diffBias: 'ligero',
          pagesBias: 'corto',
        },
        {
          value: 'ansioso',
          emoji: '😰',
          titulo: 'Ansioso/a o estresado/a',
          desc: 'Busco calma, consuelo o distracción',
          boost: { moods: ['ligero', 'íntimo', 'entretenido', 'emotivo'] },
          penalty: { moods: ['tenso', 'oscuro', 'intenso', 'inquietante'] },
          diffBias: 'ligero',
        },
        {
          value: 'triste',
          emoji: '🌧️',
          titulo: 'Triste o melancólico/a',
          desc: 'Necesito compañía emocional',
          boost: { moods: ['emotivo', 'íntimo', 'reflexivo'] },
          // No penalizamos oscuro - a veces la tristeza busca catarsis
        },
        {
          value: 'aburrido',
          emoji: '😐',
          titulo: 'Aburrido/a',
          desc: 'Necesito algo que me atrape ya',
          boost: { 
            moods: ['tenso', 'inmersivo', 'entretenido', 'intenso'],
            vibes: ['intriga', 'policial', 'aventura', 'thriller'],
          },
        },
        {
          value: 'curioso',
          emoji: '🤔',
          titulo: 'Curioso/a',
          desc: 'Abierto/a a descubrir',
          boost: { moods: ['reflexivo', 'especulativo', 'inmersivo', 'imaginativo'] },
          // Sin penalizaciones - abierto a todo
        },
        {
          value: 'energico',
          emoji: '⚡',
          titulo: 'Con energía',
          desc: 'Listo/a para un reto',
          boost: { moods: ['reflexivo', 'intenso', 'inquietante', 'tenso'] },
          diffBias: 'denso',
          pagesBias: 'largo',
        },
      ],
    },
    
    // -----------------------------------------------------------------------
    // PASO 3: TIPO DE EXPERIENCIA
    // "Tendencia introspectiva vs exploratoria"
    // "Las ficciones mejoran la Teoría de la Mente del lector"
    // -----------------------------------------------------------------------
    {
      id: 'experiencia',
      pregunta: '¿Qué tipo de experiencia buscas?',
      contexto: 'Identificación personal vs exploración de lo desconocido',
      opciones: [
        {
          value: 'espejo',
          emoji: '🪞',
          titulo: 'Un espejo',
          desc: 'Personajes y situaciones que reflejen mi vida',
          boost: {
            vibes: ['realista', 'contemporáneo', 'psicológico', 'dramático', 'memorias'],
          },
        },
        {
          value: 'ventana',
          emoji: '🪟',
          titulo: 'Una ventana',
          desc: 'Mundos y vidas diferentes a la mía',
          boost: {
            vibes: ['fantasía', 'ciencia ficción', 'histórico', 'aventura', 'épico'],
            moods: ['inmersivo', 'imaginativo', 'especulativo'],
          },
        },
        {
          value: 'puerta',
          emoji: '🚪',
          titulo: 'Una puerta',
          desc: 'Algo que me transforme o me haga cuestionar',
          boost: {
            vibes: ['filosófico', 'distopía', 'psicológico', 'ensayo'],
            moods: ['reflexivo', 'inquietante'],
          },
          awardBonus: true,
        },
        {
          value: 'montanarusa',
          emoji: '🎢',
          titulo: 'Una montaña rusa',
          desc: 'Emociones intensas, giros, adrenalina',
          boost: {
            vibes: ['intriga', 'policial', 'thriller', 'oscuro', 'terror'],
            moods: ['tenso', 'intenso', 'oscuro'],
          },
        },
      ],
    },
    
    // -----------------------------------------------------------------------
    // PASO 4: FACTOR DE PREFERENCIA
    // Basado en los factores psicológicos: "Trepidante", "Cerebral", "Oscuro"
    // -----------------------------------------------------------------------
    {
      id: 'factor',
      pregunta: '¿Qué estilo te atrae más?',
      contexto: 'Basado en factores psicológicos de preferencia lectora',
      opciones: [
        {
          value: 'trepidante',
          emoji: '💥',
          titulo: 'Trepidante',
          desc: 'Acción, aventura, ritmo rápido',
          boost: {
            vibes: ['aventura', 'ciencia ficción', 'thriller', 'acción', 'bélico'],
            moods: ['tenso', 'inmersivo', 'entretenido'],
          },
          diffBias: 'ligero',
        },
        {
          value: 'cerebral',
          emoji: '🎓',
          titulo: 'Cerebral',
          desc: 'Ideas, reflexión, análisis profundo',
          boost: {
            vibes: ['ensayo', 'filosófico', 'ciencias sociales', 'divulgación', 'historia'],
            moods: ['reflexivo'],
          },
          diffBias: 'denso',
        },
        {
          value: 'oscuro',
          emoji: '🌑',
          titulo: 'Oscuro',
          desc: 'Terror, misterio, lo prohibido',
          boost: {
            vibes: ['oscuro', 'terror', 'gótico', 'erótico', 'policial'],
            moods: ['oscuro', 'tenso', 'inquietante', 'intenso'],
          },
        },
        {
          value: 'emotivo',
          emoji: '💝',
          titulo: 'Emotivo',
          desc: 'Relaciones humanas, sentimientos',
          boost: {
            vibes: ['romántico', 'dramático', 'psicológico', 'memorias'],
            moods: ['emotivo', 'íntimo'],
          },
        },
        {
          value: 'imaginativo',
          emoji: '✨',
          titulo: 'Imaginativo',
          desc: 'Fantasía, mundos inventados, magia',
          boost: {
            vibes: ['fantasía', 'ciencia ficción', 'realismo mágico'],
            moods: ['imaginativo', 'especulativo', 'inmersivo'],
          },
        },
      ],
    },
    
    // -----------------------------------------------------------------------
    // PASO 5: FORMATO Y COMPROMISO
    // "Lecturas autoconclusivas o sagas"
    // "Ritmo de lectura y longitud sugerida"
    // -----------------------------------------------------------------------
    {
      id: 'formato',
      pregunta: '¿Cuánto tiempo quieres invertir?',
      contexto: 'Extensión y tipo de compromiso',
      opciones: [
        {
          value: 'rapido',
          emoji: '⚡',
          titulo: 'Lectura rápida',
          desc: 'Menos de 250 páginas, terminar pronto',
          pageFilter: { max: 280 },
        },
        {
          value: 'normal',
          emoji: '📖',
          titulo: 'Una novela estándar',
          desc: '250-450 páginas, una semana o dos',
          pageFilter: { min: 200, max: 500 },
        },
        {
          value: 'largo',
          emoji: '📚',
          titulo: 'Quiero sumergirme',
          desc: 'Libros extensos o sagas para seguir',
          pageFilter: { min: 400 },
          preferSeries: true,
        },
        {
          value: 'relatos',
          emoji: '📑',
          titulo: 'Relatos cortos',
          desc: 'Historias independientes que pueda picotear',
          boost: { vibes: ['relatos cortos', 'cuentos'] },
        },
        {
          value: 'cualquiera',
          emoji: '🎲',
          titulo: 'No me importa',
          desc: 'Lo que sea, mientras sea bueno',
          // Sin filtros
        },
      ],
    },
  ];
  
  // =========================================================================
  // ALGORITMO DE RECOMENDACIÓN
  // =========================================================================
  
  const calcularRecomendaciones = (respuestas) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const scores = new Map();
      
      // Inicializar scores
      books.forEach(book => {
        scores.set(book.id, {
          base: getAcclaim(book) * 8,
          vibes: 0,
          mood: 0,
          difficulty: 0,
          format: 0,
          awards: 0,
          penalties: 0,
        });
      });
      
      // Procesar cada respuesta
      Object.entries(respuestas).forEach(([stepId, value]) => {
        const stepDef = steps.find(s => s.id === stepId);
        if (!stepDef) return;
        
        const opcion = stepDef.opciones.find(o => o.value === value);
        if (!opcion) return;
        
        books.forEach(book => {
          const score = scores.get(book.id);
          const bookVibes = getVibes(book).map(v => v.toLowerCase());
          const bookMood = getMood(book);
          const bookDiff = getDiff(book);
          const bookPages = getPages(book);
          const bookSeries = getSeries(book);
          const bookAwards = getAwards(book);
          
          // BOOST por vibes
          if (opcion.boost?.vibes) {
            const matches = opcion.boost.vibes.filter(vibe => 
              bookVibes.some(bv => bv.includes(vibe.toLowerCase()))
            ).length;
            score.vibes += matches * 12;
          }
          
          // BOOST por mood
          if (opcion.boost?.moods && bookMood) {
            if (opcion.boost.moods.includes(bookMood)) {
              score.mood += 18;
            }
          }
          
          // PENALTY por mood
          if (opcion.penalty?.moods && bookMood) {
            if (opcion.penalty.moods.includes(bookMood)) {
              score.penalties -= 20;
            }
          }
          
          // Bias por dificultad
          if (opcion.diffBias) {
            if (bookDiff === opcion.diffBias) {
              score.difficulty += 15;
            } else if (opcion.diffBias === 'ligero' && bookDiff === 'denso') {
              score.difficulty -= 12;
            } else if (opcion.diffBias === 'denso' && bookDiff === 'ligero') {
              score.difficulty -= 8;
            }
          }
          
          // Filtro por páginas
          if (opcion.pageFilter) {
            const { min, max } = opcion.pageFilter;
            const inRange = (!min || bookPages >= min) && (!max || bookPages <= max);
            if (inRange) {
              score.format += 15;
            } else {
              score.format -= 12;
            }
          }
          
          // Bias por páginas (sin ser filtro estricto)
          if (opcion.pagesBias === 'corto' && bookPages > 350) {
            score.format -= 6;
          }
          if (opcion.pagesBias === 'largo' && bookPages < 300) {
            score.format -= 4;
          }
          
          // Preferencia por series
          if (opcion.preferSeries && bookSeries) {
            score.format += 10;
          }
          
          // Bonus por premios (si está marcado)
          if (opcion.awardBonus && bookAwards.length > 0) {
            score.awards += 15;
          }
        });
      });
      
      // Bonus general por premios
      books.forEach(book => {
        const score = scores.get(book.id);
        if (getAwards(book).length > 0) {
          score.awards += 8;
        }
      });
      
      // Calcular totales
      const scoredBooks = books.map(book => {
        const s = scores.get(book.id);
        const total = s.base + s.vibes + s.mood + s.difficulty + s.format + s.awards + s.penalties;
        return { book, score: total, breakdown: s };
      });
      
      scoredBooks.sort((a, b) => b.score - a.score);
      
      // Seleccionar top 10 con variedad de autores
      const selected = [];
      const usedAuthors = new Map();
      
      for (const item of scoredBooks) {
        if (selected.length >= 10) break;
        
        const author = getAuthors(item.book)[0];
        const authorCount = usedAuthors.get(author) || 0;
        
        // Máximo 2 libros del mismo autor
        if (authorCount >= 2) continue;
        
        selected.push(item);
        usedAuthors.set(author, authorCount + 1);
      }
      
      // Rellenar si hay pocos
      if (selected.length < 5) {
        const selectedSet = new Set(selected);
        for (const item of scoredBooks) {
          if (!selectedSet.has(item)) {
            selected.push(item);
            if (selected.length >= 5) break;
          }
        }
      }
      
      setResults(selected.slice(0, 10));
      setStep(steps.length);
      setIsCalculating(false);
    }, 800);
  };
  
  // =========================================================================
  // HANDLERS
  // =========================================================================
  
  const handleSelect = (value) => {
    const newAnswers = { ...answers, [steps[step].id]: value };
    setAnswers(newAnswers);
    
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      calcularRecomendaciones(newAnswers);
    }
  };
  
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  
  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResults([]);
  };
  
  // =========================================================================
  // GENERAR RESUMEN DEL PERFIL
  // =========================================================================
  
  const getPerfilResumen = () => {
    const partes = [];
    
    Object.entries(answers).forEach(([stepId, value]) => {
      const stepDef = steps.find(s => s.id === stepId);
      const opcion = stepDef?.opciones.find(o => o.value === value);
      if (opcion) {
        partes.push(`${opcion.emoji} ${opcion.titulo}`);
      }
    });
    
    return partes;
  };
  
  // =========================================================================
  // RENDER
  // =========================================================================
  
  const currentStep = steps[step];
  const isResults = step >= steps.length;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl border border-zinc-800 relative flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* ============ HEADER ============ */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5 pb-4 border-b border-zinc-800/50">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            ×
          </button>
          
          {/* Progress bar */}
          {!isResults && !isCalculating && (
            <div className="flex items-center gap-2 mb-4">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < step 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : i === step 
                        ? 'bg-amber-500/60' 
                        : 'bg-zinc-700/50'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Título */}
          <h2 className="font-serif text-xl font-bold text-white leading-tight pr-8">
            {isCalculating 
              ? '✨ Analizando tu perfil...' 
              : isResults 
                ? '📚 Tus libros ideales' 
                : currentStep?.pregunta
            }
          </h2>
          
          {!isResults && !isCalculating && currentStep && (
            <p className="text-zinc-500 text-sm mt-1">
              {currentStep.contexto}
            </p>
          )}
          
          {isResults && (
            <p className="text-zinc-500 text-sm mt-1">
              Seleccionados de {books.length} libros según tu perfil
            </p>
          )}
        </div>
        
        {/* ============ CONTENT ============ */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* LOADING */}
          {isCalculating && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/20 rounded-full" />
                <div className="w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full animate-spin absolute inset-0" />
              </div>
              <p className="text-zinc-400 mt-6">Buscando entre {books.length} libros...</p>
              <p className="text-zinc-600 text-sm mt-2">Aplicando tus preferencias psicológicas</p>
            </div>
          )}
          
          {/* PREGUNTAS */}
          {!isResults && !isCalculating && (
            <>
              <div className="space-y-3">
                {currentStep.opciones.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="w-full bg-zinc-800/30 hover:bg-zinc-800/60 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.01] border border-zinc-700/30 hover:border-amber-500/30 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                        {opt.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium group-hover:text-amber-400 transition-colors">
                          {opt.titulo}
                        </div>
                        <div className="text-zinc-500 text-sm leading-snug">
                          {opt.desc}
                        </div>
                      </div>
                      <div className="text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Botón volver */}
              {step > 0 && (
                <button 
                  onClick={handleBack}
                  className="mt-5 text-zinc-500 hover:text-white w-full text-center text-sm transition-colors flex items-center justify-center gap-2"
                >
                  ← Volver
                </button>
              )}
            </>
          )}
          
          {/* RESULTADOS */}
          {isResults && !isCalculating && (
            <>
              <div className="space-y-3">
                {results.map((item, i) => {
                  const book = item.book;
                  const isTop3 = i < 3;
                  
                  return (
                    <div
                      key={book.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border group ${
                        isTop3 
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40' 
                          : 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600'
                      }`}
                      onClick={() => onSelect(book)}
                    >
                      {/* Medalla/Número */}
                      <div className="w-8 text-center flex-shrink-0">
                        {isTop3 ? (
                          <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>
                        ) : (
                          <span className="text-lg font-bold text-zinc-600">{i + 1}</span>
                        )}
                      </div>
                      
                      {/* Portada */}
                      <div className="w-11 h-16 rounded-lg flex-shrink-0 shadow-lg overflow-hidden bg-zinc-800 ring-1 ring-white/5">
                        <img 
                          src={`/portadas/${book.id}.jpg`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={e => e.target.style.display = 'none'}
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate text-sm transition-colors ${
                          isTop3 ? 'text-amber-400' : 'text-white group-hover:text-amber-400'
                        }`}>
                          {getTitle(book)}
                        </h4>
                        <p className="text-zinc-500 text-xs truncate">
                          {getAuthors(book)[0]}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-600">
                          <span>{getPages(book)}p</span>
                          <span>·</span>
                          <span>{getDiff(book)}</span>
                          {getMood(book) && (
                            <>
                              <span>·</span>
                              <span className="text-zinc-500">{getMood(book)}</span>
                            </>
                          )}
                          {getAwards(book).length > 0 && (
                            <span className="text-amber-500">🏆</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0 text-sm">
                        →
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Resumen del perfil */}
              <div className="mt-5 p-4 bg-zinc-800/20 rounded-xl border border-zinc-700/20">
                <p className="text-xs text-zinc-500 text-center mb-2">Tu perfil lector:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {getPerfilResumen().map((item, i) => (
                    <span 
                      key={i}
                      className="text-xs bg-zinc-800/50 text-zinc-400 px-2 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Reset */}
              <button 
                onClick={handleReset}
                className="mt-4 text-zinc-500 hover:text-white w-full text-center text-sm transition-colors flex items-center justify-center gap-2"
              >
                ↺ Empezar de nuevo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardPsicologico;
