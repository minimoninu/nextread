import React, { useState, useCallback } from 'react';
import { applyOptionToPreferences, buildPreferencesFromAnswers } from './wizardPreferences.js';
import { THEMES, haptic, useEscapeKey, Touchable, getModalCloseButtonStyle } from './shared.jsx';

// COMPONENTE: Wizard - Sistema de Recomendación Inteligente
// =============================================================================

// Estructura de preguntas ramificadas
const WIZARD_QUESTIONS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // NIVEL 1: La Puerta de Entrada
  // ═══════════════════════════════════════════════════════════════════════════
  root: {
    key: 'root',
    question: '¿Qué quieres que te dé este libro?',
    hint: 'La pregunta fundamental',
    options: [
      { id: 'feel', icon: '💔', label: 'Sentir', desc: 'Una experiencia emocional', next: 'feel_type' },
      { id: 'travel', icon: '🌍', label: 'Viajar', desc: 'Transportarme a otro lugar o tiempo', next: 'travel_where' },
      { id: 'think', icon: '🧠', label: 'Pensar', desc: 'Reflexionar profundamente', next: 'think_about' },
      { id: 'tension', icon: '⚡', label: 'Tensión', desc: 'Adrenalina, no poder soltarlo', next: 'tension_type' },
      { id: 'discover', icon: '✨', label: 'Descubrir', desc: 'Algo que me sorprenda', next: 'discover_type' },
      { id: 'laugh', icon: '🎭', label: 'Reír', desc: 'Pasarlo bien, divertirme', next: 'laugh_type' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: SENTIR 💔
  // ═══════════════════════════════════════════════════════════════════════════
  feel_type: {
    key: 'feel_type',
    question: '¿Qué tipo de impacto emocional buscas?',
    hint: 'Sé sincero contigo mismo',
    options: [
      { id: 'devastate', icon: '💀', label: 'Devastarme', desc: 'Que me destruya (de la mejor manera)',
        experiences: ['devastador', 'desgarrador', 'brutal'], next: 'devastate_through' },
      { id: 'move', icon: '🥺', label: 'Conmoverme', desc: 'Que toque mi corazón',
        experiences: ['conmovedor', 'melancólico', 'íntimo'], next: 'move_how' },
      { id: 'disturb', icon: '😰', label: 'Inquietarme', desc: 'Que me perturbe y me haga pensar',
        experiences: ['perturbador', 'inquietante', 'sombrío'], next: 'disturb_how' },
      { id: 'awe', icon: '✨', label: 'Maravillarme', desc: 'Sentir asombro y admiración',
        experiences: ['épico', 'onírico', 'monumental'], next: 'awe_how' }
    ]
  },

  devastate_through: {
    key: 'devastate_through',
    question: '¿A través de qué quieres ser devastado?',
    hint: 'El vehículo del impacto',
    options: [
      { id: 'tragic_love', icon: '💔', label: 'Amor trágico', desc: 'Amor que destruye o se pierde',
        themes: ['amor', 'pérdida', 'traición'], experiences: ['desgarrador', 'devastador'], next: 'time_commitment' },
      { id: 'broken_family', icon: '👨‍👩‍👧', label: 'Familia rota', desc: 'Disfunción, trauma familiar',
        themes: ['familia', 'trauma', 'padre', 'madre', 'infancia'], experiences: ['devastador'], next: 'time_commitment' },
      { id: 'war_violence', icon: '⚔️', label: 'Guerra y violencia', desc: 'La humanidad en su peor momento',
        themes: ['guerra', 'violencia', 'supervivencia'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'death_loss', icon: '💀', label: 'Muerte y pérdida', desc: 'El duelo, la ausencia',
        themes: ['muerte', 'duelo', 'pérdida', 'vejez'], experiences: ['devastador', 'elegíaco'], next: 'time_commitment' }
    ]
  },

  move_how: {
    key: 'move_how',
    question: '¿Qué tipo de historia te conmueve?',
    hint: 'Lo que toca tu corazón',
    options: [
      { id: 'love_story', icon: '💕', label: 'Historias de amor', desc: 'Romance, conexión',
        themes: ['amor', 'matrimonio'], experiences: ['conmovedor', 'romántico'], moods: ['emotivo'], next: 'time_commitment' },
      { id: 'coming_of_age', icon: '🌱', label: 'Crecer', desc: 'Juventud, descubrimiento',
        themes: ['juventud', 'infancia', 'identidad'], experiences: ['nostálgico', 'agridulce'], next: 'time_commitment' },
      { id: 'friendship', icon: '🤝', label: 'Amistad', desc: 'Vínculos que perduran',
        themes: ['amistad', 'lealtad'], experiences: ['conmovedor', 'íntimo'], next: 'time_commitment' },
      { id: 'redemption', icon: '🌅', label: 'Redención', desc: 'Segundas oportunidades',
        themes: ['redención', 'perdón', 'cambio'], experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' }
    ]
  },

  disturb_how: {
    key: 'disturb_how',
    question: '¿Qué tipo de inquietud buscas?',
    hint: 'Lo que te quita el sueño',
    options: [
      { id: 'psychological', icon: '🧠', label: 'Psicológica', desc: 'La mente bajo presión',
        themes: ['obsesión', 'locura', 'culpa'], vibes: ['psicológico'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'existential', icon: '🕳️', label: 'Existencial', desc: 'Preguntas sin respuesta',
        themes: ['identidad', 'vacío', 'alienación'], experiences: ['perturbador', 'sombrío'], next: 'time_commitment' },
      { id: 'social', icon: '👁️', label: 'Social', desc: 'Lo que está mal en la sociedad',
        themes: ['poder', 'violencia', 'injusticia'], experiences: ['perturbador', 'brutal'], next: 'time_commitment' },
      { id: 'uncanny', icon: '💻', label: 'Lo extraño', desc: 'Algo no está bien aquí',
        experiences: ['inquietante', 'onírico'], moods: ['inquietante', 'oscuro'], next: 'time_commitment' }
    ]
  },

  awe_how: {
    key: 'awe_how',
    question: '¿Qué te maravilla?',
    hint: 'Lo sublime',
    options: [
      { id: 'epic_scale', icon: '🏔️', label: 'Escala épica', desc: 'Historias monumentales',
        experiences: ['épico', 'monumental'], themes: ['historia', 'poder'], next: 'time_commitment' },
      { id: 'beautiful_prose', icon: '✍️', label: 'Prosa hermosa', desc: 'El lenguaje como arte',
        experiences: ['elegíaco', 'poético'], moods: ['reflexivo'], next: 'time_commitment' },
      { id: 'imagination', icon: '🌙', label: 'La imaginación', desc: 'Mundos imposibles',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'human_spirit', icon: '🔥', label: 'El espíritu humano', desc: 'Triunfo contra todo',
        themes: ['supervivencia', 'libertad', 'esperanza'], experiences: ['épico', 'luminoso'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: VIAJAR 🌍
  // ═══════════════════════════════════════════════════════════════════════════
  travel_where: {
    key: 'travel_where',
    question: '¿A dónde quieres ir?',
    hint: 'Tu destino literario',
    options: [
      { id: 'past', icon: '🏛️', label: 'Al pasado', desc: 'Vivir otra época',
        vibes: ['histórico'], next: 'past_when' },
      { id: 'impossible', icon: '🚀', label: 'A lo imposible', desc: 'Mundos que no existen',
        vibes: ['fantasía', 'ciencia ficción', 'especulativo'], next: 'impossible_type' },
      { id: 'dark_places', icon: '🌑', label: 'A lo oscuro', desc: 'Callejones, crímenes, secretos',
        vibes: ['noir', 'policial', 'intriga'], moods: ['tenso', 'oscuro'], next: 'dark_type' },
      { id: 'faraway', icon: '🗺️', label: 'A tierras lejanas', desc: 'Culturas, lugares exóticos',
        themes: ['viaje', 'aventura'], next: 'faraway_where' }
    ]
  },

  past_when: {
    key: 'past_when',
    question: '¿Qué época te atrae?',
    hint: 'El tiempo es relativo',
    options: [
      { id: 'ancient', icon: '🏛️', label: 'Antigüedad', desc: 'Grecia, Roma, antes del 500',
        keywords: ['griego', 'romano', 'antiguo', 'imperio', 'mitología'], next: 'historical_fiction' },
      { id: 'medieval', icon: '⚔️', label: 'Medieval', desc: 'Reyes, caballeros, castillos',
        keywords: ['medieval', 'rey', 'castillo', 'caballero'], next: 'historical_fiction' },
      { id: 'century_19', icon: '🎩', label: 'Siglo XIX', desc: 'Victoriano, revoluciones',
        keywords: ['victoriano', 'siglo xix', 'revolución', 'napoleón'], next: 'historical_fiction' },
      { id: 'world_wars', icon: '💣', label: 'Guerras Mundiales', desc: '1914-1945',
        keywords: ['guerra mundial', 'nazi', 'trinchera', 'holocaust'], themes: ['guerra'], next: 'war_focus' },
      { id: 'recent_past', icon: '📺', label: 'Siglo XX tardío', desc: 'Guerra Fría, 60s-90s',
        keywords: ['guerra fría', '60s', '70s', '80s'], next: 'historical_fiction' }
    ]
  },

  war_focus: {
    key: 'war_focus',
    question: '¿Qué aspecto de la guerra?',
    hint: 'La guerra tiene muchas caras',
    options: [
      { id: 'soldiers', icon: '🪖', label: 'Los soldados', desc: 'En el frente, las trincheras',
        themes: ['guerra', 'soldado', 'muerte'], experiences: ['brutal', 'devastador'], next: 'time_commitment' },
      { id: 'civilians', icon: '👨‍👩‍👧', label: 'Los civiles', desc: 'Vivir bajo la guerra',
        themes: ['guerra', 'familia', 'supervivencia'], experiences: ['devastador', 'conmovedor'], next: 'time_commitment' },
      { id: 'resistance', icon: '✊', label: 'La resistencia', desc: 'Luchar desde las sombras',
        themes: ['guerra', 'resistencia', 'libertad'], experiences: ['tenso', 'épico'], next: 'time_commitment' },
      { id: 'aftermath', icon: '🕊️', label: 'Las secuelas', desc: 'Después de que todo termina',
        themes: ['guerra', 'trauma', 'memoria'], experiences: ['melancólico', 'devastador'], next: 'time_commitment' }
    ]
  },

  historical_fiction: {
    key: 'historical_fiction',
    question: '¿Ficción o hechos reales?',
    hint: 'Historia y literatura',
    options: [
      { id: 'fiction', icon: '📖', label: 'Novela histórica', desc: 'Ficción ambientada en la época',
        vibes: ['ficción', 'histórico'], next: 'time_commitment' },
      { id: 'nonfiction', icon: '📚', label: 'Historia real', desc: 'Hechos documentados',
        vibes: ['historia', 'crónica', 'memorias'], next: 'time_commitment' }
    ]
  },

  impossible_type: {
    key: 'impossible_type',
    question: '¿Qué tipo de imposible?',
    hint: 'Los límites de la realidad',
    options: [
      { id: 'epic_fantasy', icon: '⚔️', label: 'Fantasía épica', desc: 'Guerras, reinos, magia',
        vibes: ['fantasía'], experiences: ['épico', 'monumental'], next: 'time_commitment' },
      { id: 'scifi', icon: '🚀', label: 'Ciencia ficción', desc: 'Futuros, tecnología, espacio',
        vibes: ['ciencia ficción'], moods: ['especulativo'], next: 'time_commitment' },
      { id: 'magical_realism', icon: '🌙', label: 'Realismo mágico', desc: 'Lo mágico en lo cotidiano',
        experiences: ['onírico', 'fabuloso'], moods: ['imaginativo'], next: 'time_commitment' },
      { id: 'weird', icon: '👁️', label: 'Lo extraño', desc: 'Inclasificable, perturbador',
        experiences: ['inquietante', 'onírico'], vibes: ['especulativo'], next: 'time_commitment' }
    ]
  },

  dark_type: {
    key: 'dark_type',
    question: '¿Qué tipo de oscuridad?',
    hint: 'Las sombras tienen matices',
    options: [
      { id: 'noir_classic', icon: '🕵️', label: 'Noir clásico', desc: 'Detectives, femme fatales',
        vibes: ['noir', 'policial'], themes: ['detective', 'crimen'], next: 'time_commitment' },
      { id: 'psychological_thriller', icon: '🧠', label: 'Thriller psicológico', desc: 'La mente es el campo de batalla',
        vibes: ['psicológico', 'intriga'], experiences: ['perturbador', 'tenso'], next: 'time_commitment' },
      { id: 'crime', icon: '🔪', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'asesinato', 'misterio'], moods: ['tenso'], next: 'time_commitment' },
      { id: 'gothic', icon: '🏚️', label: 'Gótico', desc: 'Casas encantadas, secretos familiares',
        vibes: ['oscuro'], moods: ['inquietante'], themes: ['secreto', 'familia'], next: 'time_commitment' }
    ]
  },

  faraway_where: {
    key: 'faraway_where',
    question: '¿Qué región del mundo?',
    hint: 'El mapa literario',
    options: [
      { id: 'americas', icon: '🌎', label: 'Las Américas', desc: 'Del Norte al Sur',
        themes: ['América'], next: 'americas_where' },
      { id: 'europe', icon: '🇪🇺', label: 'Europa', desc: 'El viejo continente',
        next: 'europe_where' },
      { id: 'asia', icon: '🌏', label: 'Asia', desc: 'Oriente',
        themes: ['Japón', 'China', 'India'], next: 'time_commitment' },
      { id: 'other', icon: '🌍', label: 'África y más', desc: 'Otros mundos',
        themes: ['África', 'viaje'], next: 'time_commitment' }
    ]
  },

  americas_where: {
    key: 'americas_where',
    question: '¿Qué parte de las Américas?',
    options: [
      { id: 'usa', icon: '🇺🇸', label: 'Estados Unidos', themes: ['América', 'Nueva York'], next: 'usa_where' },
      { id: 'latam', icon: '🌴', label: 'Latinoamérica', themes: ['México', 'Argentina', 'Colombia'], next: 'time_commitment' },
      { id: 'caribbean', icon: '🏝️', label: 'Caribe', themes: ['Caribe', 'isla'], next: 'time_commitment' }
    ]
  },

  usa_where: {
    key: 'usa_where',
    question: '¿Qué Estados Unidos?',
    options: [
      { id: 'deep_south', icon: '🏚️', label: 'El Sur profundo', desc: 'Mississippi, Alabama...',
        themes: ['América', 'sur'], keywords: ['sur', 'mississippi'], next: 'time_commitment' },
      { id: 'new_york', icon: '🗽', label: 'Nueva York', desc: 'La gran ciudad',
        themes: ['Nueva York', 'ciudad'], next: 'time_commitment' },
      { id: 'west', icon: '🤠', label: 'El Oeste', desc: 'Fronteras, desiertos',
        themes: ['oeste', 'frontera'], vibes: ['aventura'], next: 'time_commitment' },
      { id: 'small_town', icon: '🏘️', label: 'América profunda', desc: 'Pueblos, suburbios',
        themes: ['América', 'pueblo'], next: 'time_commitment' }
    ]
  },

  europe_where: {
    key: 'europe_where',
    question: '¿Qué parte de Europa?',
    options: [
      { id: 'spain', icon: '🇪🇸', label: 'España', themes: ['España'], next: 'time_commitment' },
      { id: 'france', icon: '🇫🇷', label: 'Francia', themes: ['Francia', 'París'], next: 'time_commitment' },
      { id: 'uk', icon: '🇬🇧', label: 'Reino Unido', themes: ['Inglaterra', 'Londres'], next: 'time_commitment' },
      { id: 'russia', icon: '🇷🇺', label: 'Rusia', themes: ['Rusia'], next: 'time_commitment' },
      { id: 'italy', icon: '🇮🇹', label: 'Italia', themes: ['Italia', 'Roma'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: PENSAR 🧠
  // ═══════════════════════════════════════════════════════════════════════════
  think_about: {
    key: 'think_about',
    question: '¿Sobre qué quieres reflexionar?',
    hint: 'Las grandes preguntas',
    options: [
      { id: 'existence', icon: '🌌', label: 'La existencia', desc: 'Vida, muerte, tiempo',
        themes: ['muerte', 'vida', 'tiempo', 'identidad', 'memoria', 'soledad'], next: 'existence_focus' },
      { id: 'relationships', icon: '👥', label: 'Las relaciones', desc: 'Amor, familia, amistad',
        themes: ['amor', 'familia', 'amistad'], next: 'relationship_focus' },
      { id: 'society', icon: '⚖️', label: 'La sociedad', desc: 'Poder, justicia, violencia',
        themes: ['poder', 'política', 'libertad', 'violencia'], next: 'society_focus' },
      { id: 'art_creation', icon: '🎨', label: 'El arte', desc: 'Creación, verdad, belleza',
        themes: ['arte', 'escritura', 'música', 'creación'], next: 'time_commitment' }
    ]
  },

  existence_focus: {
    key: 'existence_focus',
    question: '¿Qué aspecto de la existencia?',
    options: [
      { id: 'identity', icon: '🪞', label: 'Quién soy', desc: 'Identidad, autenticidad',
        themes: ['identidad', 'búsqueda'], next: 'time_commitment' },
      { id: 'mortality', icon: '⏳', label: 'La mortalidad', desc: 'Muerte, tiempo, finitud',
        themes: ['muerte', 'tiempo', 'vejez'], next: 'time_commitment' },
      { id: 'memory', icon: '🧠', label: 'La memoria', desc: 'Pasado, recuerdos, olvido',
        themes: ['memoria', 'pasado', 'nostalgia'], experiences: ['nostálgico', 'melancólico'], next: 'time_commitment' },
      { id: 'loneliness', icon: '🌙', label: 'La soledad', desc: 'Aislamiento, conexión',
        themes: ['soledad', 'alienación'], experiences: ['melancólico', 'íntimo'], next: 'time_commitment' }
    ]
  },

  relationship_focus: {
    key: 'relationship_focus',
    question: '¿Qué tipo de relación?',
    options: [
      { id: 'romantic', icon: '💕', label: 'Amor romántico', themes: ['amor', 'matrimonio'], next: 'love_ending' },
      { id: 'family', icon: '👨‍👩‍👧', label: 'Familia', themes: ['familia', 'padre', 'madre', 'infancia'], next: 'time_commitment' },
      { id: 'friendship', icon: '🤝', label: 'Amistad', themes: ['amistad'], next: 'time_commitment' },
      { id: 'marriage', icon: '👍', label: 'Matrimonio', desc: 'El día a día del amor',
        themes: ['matrimonio', 'pareja'], next: 'time_commitment' }
    ]
  },

  love_ending: {
    key: 'love_ending',
    question: '¿Cómo prefieres que termine?',
    hint: 'Spoiler controlado',
    options: [
      { id: 'happy', icon: '💕', label: 'Bien', desc: 'Final feliz',
        experiences: ['conmovedor', 'luminoso'], next: 'time_commitment' },
      { id: 'tragic', icon: '💔', label: 'Mal', desc: 'Tragedia, pérdida',
        themes: ['pérdida'], experiences: ['devastador', 'desgarrador'], next: 'time_commitment' },
      { id: 'ambiguous', icon: '❓', label: 'Ambiguo', desc: 'Abierto a interpretación',
        next: 'time_commitment' }
    ]
  },

  society_focus: {
    key: 'society_focus',
    question: '¿Qué aspecto de la sociedad?',
    options: [
      { id: 'power', icon: '👑', label: 'El poder', desc: 'Quién manda y por qué',
        themes: ['poder', 'política'], next: 'time_commitment' },
      { id: 'justice', icon: '⚖️', label: 'La justicia', desc: 'Lo correcto, el sistema',
        themes: ['justicia', 'ley', 'crimen'], next: 'time_commitment' },
      { id: 'violence', icon: '👥', label: 'La violencia', desc: 'Por qué nos destruimos',
        themes: ['violencia', 'guerra'], experiences: ['brutal', 'perturbador'], next: 'time_commitment' },
      { id: 'freedom', icon: '🕊️', label: 'La libertad', desc: 'Opresión y liberación',
        themes: ['libertad', 'revolución', 'resistencia'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: TENSIÓN ⚡
  // ═══════════════════════════════════════════════════════════════════════════
  tension_type: {
    key: 'tension_type',
    question: '¿Qué tipo de tensión?',
    hint: 'Tu dosis de adrenalina',
    options: [
      { id: 'crime', icon: '🔪', label: 'Crimen', desc: 'Asesinatos, investigaciones',
        themes: ['crimen', 'detective', 'misterio'], moods: ['tenso'], next: 'crime_focus' },
      { id: 'horror', icon: '😱', label: 'Terror', desc: 'Miedo genuino',
        experiences: ['aterrador', 'inquietante'], moods: ['oscuro', 'inquietante'], next: 'horror_type' },
      { id: 'psychological', icon: '🧠', label: 'Psicológica', desc: 'La mente bajo presión',
        vibes: ['psicológico'], themes: ['obsesión', 'locura', 'culpa'], next: 'time_commitment' },
      { id: 'action', icon: '🎢', label: 'Vertiginosa', desc: 'Ritmo imparable',
        experiences: ['vertiginoso', 'absorbente', 'tenso'], vibes: ['aventura'], next: 'time_commitment' }
    ]
  },

  crime_focus: {
    key: 'crime_focus',
    question: '¿Qué te atrae del crimen?',
    options: [
      { id: 'detective', icon: '🔍', label: 'El detective', desc: 'Seguir la investigación',
        themes: ['detective'], vibes: ['policial'], next: 'time_commitment' },
      { id: 'criminal_mind', icon: '🎭', label: 'El criminal', desc: 'Entender la mente oscura',
        themes: ['psicópata', 'obsesión'], experiences: ['perturbador'], next: 'time_commitment' },
      { id: 'noir', icon: '🌃', label: 'Atmósfera noir', desc: 'La ciudad, las sombras',
        vibes: ['noir'], moods: ['oscuro', 'tenso'], next: 'time_commitment' },
      { id: 'procedural', icon: '📋', label: 'Procedimiento', desc: 'El sistema, la ley',
        themes: ['justicia', 'policía'], next: 'time_commitment' }
    ]
  },

  horror_type: {
    key: 'horror_type',
    question: '¿Qué tipo de terror?',
    options: [
      { id: 'supernatural', icon: '💻', label: 'Sobrenatural', desc: 'Fantasmas, demonios',
        moods: ['oscuro', 'inquietante'], next: 'time_commitment' },
      { id: 'psychological_horror', icon: '🧠', label: 'Psicológico', desc: 'El horror en la mente',
        vibes: ['psicológico'], experiences: ['perturbador', 'inquietante'], next: 'time_commitment' },
      { id: 'cosmic', icon: '🌌', label: 'Cósmico', desc: 'Lo incomprensible, Lovecraft',
        experiences: ['aterrador', 'onírico'], next: 'time_commitment' },
      { id: 'human_horror', icon: '🔪', label: 'El horror humano', desc: 'Lo que somos capaces de hacer',
        experiences: ['brutal', 'perturbador'], themes: ['violencia'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: DESCUBRIR ✨
  // ═══════════════════════════════════════════════════════════════════════════
  discover_type: {
    key: 'discover_type',
    question: '¿Qué tipo de descubrimiento?',
    hint: 'La aventura de lo nuevo',
    options: [
      { id: 'hidden_gems', icon: '💎', label: 'Joyas ocultas', desc: 'Libros que nadie conoce',
        filter: { noAwards: true, lowProfile: true }, next: 'hidden_gem_type' },
      { id: 'classics', icon: '🏆', label: 'Clásicos pendientes', desc: 'Los que todos conocen menos yo',
        filter: { hasAwards: true, canonical: true }, next: 'classic_type' },
      { id: 'new_voices', icon: '🌱', label: 'Voces nuevas', desc: 'Autores contemporáneos',
        filter: { contemporary: true }, next: 'time_commitment' },
      { id: 'total_random', icon: '🎲', label: 'Sorpresa total', desc: 'No me des opciones, elige tú',
        algorithm: 'random_quality', direct: true }
    ]
  },

  hidden_gem_type: {
    key: 'hidden_gem_type',
    question: '¿De qué tipo?',
    hint: 'Joyas por descubrir',
    options: [
      { id: 'emotional', icon: '💔', label: 'Emocionales', experiences: ['conmovedor', 'devastador', 'íntimo'], next: 'time_commitment' },
      { id: 'thrilling', icon: '⚡', label: 'Trepidantes', experiences: ['tenso', 'absorbente', 'vertiginoso'], next: 'time_commitment' },
      { id: 'thoughtful', icon: '🧠', label: 'Reflexivas', experiences: ['contemplativo', 'filosófico'], next: 'time_commitment' },
      { id: 'any_gem', icon: '✨', label: 'Lo que sea', next: 'time_commitment' }
    ]
  },

  classic_type: {
    key: 'classic_type',
    question: '¿Qué tipo de clásico?',
    options: [
      { id: 'nobel', icon: '🏅', label: 'Premios Nobel', filter: { award: 'Nobel de Literatura' }, next: 'time_commitment' },
      { id: 'spanish', icon: '🇪🇸', label: 'Clásicos en español', filter: { award: 'Premio hispano importante' }, next: 'time_commitment' },
      { id: 'american', icon: '🇺🇸', label: 'Clásicos americanos', filter: { award: 'Pulitzer' }, next: 'time_commitment' },
      { id: 'any_classic', icon: '📚', label: 'Cualquier clásico', next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAMA: REÍR 🎭
  // ═══════════════════════════════════════════════════════════════════════════
  laugh_type: {
    key: 'laugh_type',
    question: '¿Qué tipo de humor?',
    hint: 'Hay muchas formas de reír',
    options: [
      { id: 'sardonic', icon: '😏', label: 'Sardónico', desc: 'Ironía mordaz',
        experiences: ['sardónico', 'irónico'], vibes: ['satírico'], next: 'time_commitment' },
      { id: 'light', icon: '😄', label: 'Ligero', desc: 'Simple diversión',
        moods: ['ligero', 'entretenido'], vibes: ['humor'], next: 'time_commitment' },
      { id: 'absurd', icon: '🤪', label: 'Absurdo', desc: 'Lo ridículo de la vida',
        experiences: ['sardónico', 'agridulce'], next: 'time_commitment' },
      { id: 'bittersweet', icon: '🏋', label: 'Agridulce', desc: 'Ríe mientras llora',
        experiences: ['agridulce'], next: 'time_commitment' }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREGUNTAS UNIVERSALES (NIVEL FINAL)
  // ═══════════════════════════════════════════════════════════════════════════
  time_commitment: {
    key: 'time_commitment',
    question: '¿Cuánto tiempo puedes dedicar?',
    hint: 'Para las próximas semanas',
    options: [
      { id: 'afternoon', icon: '☕', label: 'Una tarde', desc: 'Menos de 150 páginas',
        pages: { max: 150 }, difficulty: ['ligero'], next: 'series_preference' },
      { id: 'weekend', icon: '🌙', label: 'Un fin de semana', desc: '150-300 páginas',
        pages: { min: 100, max: 300 }, difficulty: ['ligero', 'medio'], next: 'series_preference' },
      { id: 'weeks', icon: '📅', label: 'Unas semanas', desc: '300-500 páginas',
        pages: { min: 250, max: 500 }, next: 'series_preference' },
      { id: 'project', icon: '🏔️', label: 'Un proyecto', desc: 'Más de 500 páginas',
        pages: { min: 450 }, next: 'series_preference' }
    ]
  },

  series_preference: {
    key: 'series_preference',
    question: '¿Serie o libro único?',
    hint: '¿Quieres compromiso a largo plazo?',
    options: [
      { id: 'standalone', icon: '📖', label: 'Libro único', desc: 'Empieza y termina',
        standalone: true, next: 'difficulty_preference' },
      { id: 'series', icon: '📚', label: 'Parte de una serie', desc: 'Me gusta cuando hay más',
        wantsSeries: true, next: 'difficulty_preference' },
      { id: 'either', icon: '🎲', label: 'Me da igual', next: 'difficulty_preference' }
    ]
  },

  difficulty_preference: {
    key: 'difficulty_preference',
    question: '¿Qué nivel de desafío?',
    hint: 'Tu zona de confort literaria',
    options: [
      { id: 'easy', icon: '🌿', label: 'Lectura fluida', desc: 'Que fluya sin esfuerzo',
        difficulty: ['ligero'], moods: ['entretenido', 'ligero'], next: 'risk_preference' },
      { id: 'medium', icon: '⚖️', label: 'Equilibrado', desc: 'Ni muy fácil ni muy difícil',
        difficulty: ['medio'], next: 'risk_preference' },
      { id: 'challenging', icon: '🧗', label: 'Desafiante', desc: 'Quiero que me exija',
        difficulty: ['denso'], vibes: ['filosófico'], next: 'risk_preference' }
    ]
  },

  risk_preference: {
    key: 'risk_preference',
    question: '¿Cuánto quieres arriesgarte?',
    hint: 'La última pregunta',
    options: [
      { id: 'safe', icon: '🏠', label: 'Zona segura', desc: 'Algo que probablemente me guste',
        riskLevel: 'safe', boost: { awards: true, known: true } },
      { id: 'curious', icon: '🔍', label: 'Curioso', desc: 'Abierto a sorpresas',
        riskLevel: 'balanced' },
      { id: 'adventurous', icon: '🎲', label: 'Aventurero', desc: 'Territorio desconocido',
        riskLevel: 'adventurous', boost: { unknown: true, noAwards: true } }
    ]
  }
};

const Wizard = ({ books, hooks, onSelect, onClose, theme }) => {
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
  const isComplete = !currentQuestion || currentQuestion.key === 'risk_preference' && answers[currentQuestion.key];

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
    const bookHook = hooks[String(book.id)];
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

export default Wizard;
