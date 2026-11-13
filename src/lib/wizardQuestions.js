// =============================================================================
// COMPONENTE: Wizard - Sistema de Recomendación Inteligente
// =============================================================================

// Estructura de preguntas ramificadas
export const WIZARD_QUESTIONS = {
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
