import React, { useMemo, useState } from 'react';

/**
 * BOOK MOODBOARD
 * ==============
 * Genera una experiencia visual atmosférica basada en:
 * - Mood del libro (colores, gradientes)
 * - Vibes/tags (patrones SVG, keywords flotantes)
 * - Título y autor (tipografía atmosférica)
 * 
 * Todo generado con CSS puro, sin imágenes externas.
 */

// =============================================================================
// CONFIGURACIÓN DE ATMÓSFERAS
// =============================================================================

const ATMOSPHERE_CONFIG = {
  // Moods -> Configuración visual
  oscuro: {
    gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 40%, #16213e 100%)',
    accent: '#e94560',
    pattern: 'cracks',
    particles: 'dust',
    vibe: 'Sombras y secretos'
  },
  tenso: {
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#e94560',
    pattern: 'lines',
    particles: 'rain',
    vibe: 'Tensión latente'
  },
  inquietante: {
    gradient: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #2d1f3d 100%)',
    accent: '#9b59b6',
    pattern: 'fog',
    particles: 'mist',
    vibe: 'Lo desconocido acecha'
  },
  intenso: {
    gradient: 'linear-gradient(135deg, #2c1810 0%, #4a1c1c 50%, #1a0a0a 100%)',
    accent: '#ff6b35',
    pattern: 'fire',
    particles: 'embers',
    vibe: 'Pasión desbordante'
  },
  emotivo: {
    gradient: 'linear-gradient(135deg, #1a3a3a 0%, #2d4a4a 50%, #1a2f2f 100%)',
    accent: '#48c9b0',
    pattern: 'waves',
    particles: 'drops',
    vibe: 'Sentimientos profundos'
  },
  íntimo: {
    gradient: 'linear-gradient(135deg, #2d2a4a 0%, #3d3a5a 50%, #1d1a3a 100%)',
    accent: '#a29bfe',
    pattern: 'soft',
    particles: 'glow',
    vibe: 'Cercanía y conexión'
  },
  reflexivo: {
    gradient: 'linear-gradient(135deg, #1e272e 0%, #2d3436 50%, #1e272e 100%)',
    accent: '#74b9ff',
    pattern: 'circles',
    particles: 'stars',
    vibe: 'Contemplación serena'
  },
  ligero: {
    gradient: 'linear-gradient(135deg, #2d3436 0%, #3d4446 50%, #2d3436 100%)',
    accent: '#ffeaa7',
    pattern: 'dots',
    particles: 'bubbles',
    vibe: 'Ligereza y frescura'
  },
  irónico: {
    gradient: 'linear-gradient(135deg, #2d3436 0%, #4a3f35 50%, #2d3436 100%)',
    accent: '#fab1a0',
    pattern: 'zigzag',
    particles: 'confetti',
    vibe: 'Humor afilado'
  },
  imaginativo: {
    gradient: 'linear-gradient(135deg, #2d2a4a 0%, #4a2a6a 50%, #2d2a4a 100%)',
    accent: '#a29bfe',
    pattern: 'spirals',
    particles: 'sparkles',
    vibe: 'Mundos por descubrir'
  },
  especulativo: {
    gradient: 'linear-gradient(135deg, #1e3a3a 0%, #2a4a4a 50%, #1e3a3a 100%)',
    accent: '#55efc4',
    pattern: 'grid',
    particles: 'data',
    vibe: '¿Y si...?'
  },
  inmersivo: {
    gradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a3a4a 50%, #1a2a3a 100%)',
    accent: '#dfe6e9',
    pattern: 'depth',
    particles: 'float',
    vibe: 'Sumérgete'
  },
  entretenido: {
    gradient: 'linear-gradient(135deg, #2d2a4a 0%, #4a3a5a 50%, #2d2a4a 100%)',
    accent: '#fd79a8',
    pattern: 'playful',
    particles: 'pop',
    vibe: 'Puro disfrute'
  },
  default: {
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #3c4e60 50%, #2c3e50 100%)',
    accent: '#3498db',
    pattern: 'subtle',
    particles: 'dust',
    vibe: 'Una historia por contar'
  }
};

// Mapeo de vibes a iconos/símbolos visuales
const VIBE_ICONS = {
  // Géneros
  'fantasía': '✧',
  'ciencia ficción': '◈',
  'terror': '☽',
  'romance': '♡',
  'misterio': '◎',
  'thriller': '⚡',
  'histórico': '⌛',
  'aventura': '⚔',
  'drama': '◇',
  'humor': '☆',
  'policial': '◉',
  'distopía': '△',
  'realismo mágico': '❋',
  'gótico': '⚜',
  'épico': '⛊',
  
  // Temas
  'filosófico': '∞',
  'psicológico': '◐',
  'político': '⚖',
  'social': '◈',
  'existencial': '○',
  'familiar': '⌂',
  'amor': '♥',
  'guerra': '⚔',
  'muerte': '✝',
  'naturaleza': '❀',
  'tecnología': '⬡',
  'magia': '✦',
  'viaje': '→',
  'memoria': '◎',
  'identidad': '◑',
  
  // Default
  'default': '•'
};

// =============================================================================
// PATRONES SVG GENERATIVOS
// =============================================================================

const SVGPatterns = {
  cracks: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="cracks" patternUnits="userSpaceOnUse" width="100" height="100">
          <path d="M10,10 L30,40 L20,70 L40,90" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.3"/>
          <path d="M60,5 L70,30 L90,50 L80,80" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.3"/>
          <path d="M40,20 L50,50 L30,80" stroke="${color}" stroke-width="0.3" fill="none" opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cracks)"/>
    </svg>
  `,
  
  lines: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="lines" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="20" stroke="${color}" stroke-width="0.5" opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lines)"/>
    </svg>
  `,
  
  fog: (color) => `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="fog">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#fog)" opacity="0.15"/>
    </svg>
  `,
  
  waves: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="waves" patternUnits="userSpaceOnUse" width="100" height="20">
          <path d="M0,10 Q25,0 50,10 T100,10" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#waves)"/>
    </svg>
  `,
  
  circles: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="circles" patternUnits="userSpaceOnUse" width="40" height="40">
          <circle cx="20" cy="20" r="15" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.2"/>
          <circle cx="20" cy="20" r="8" stroke="${color}" stroke-width="0.3" fill="none" opacity="0.15"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circles)"/>
    </svg>
  `,
  
  dots: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="1.5" fill="${color}" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)"/>
    </svg>
  `,
  
  grid: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20">
          <path d="M20,0 L0,0 L0,20" stroke="${color}" stroke-width="0.3" fill="none" opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)"/>
    </svg>
  `,
  
  spirals: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="spirals" patternUnits="userSpaceOnUse" width="50" height="50">
          <path d="M25,25 m0,-20 a20,20 0 1,1 -0.1,0 m5,5 a15,15 0 1,0 0.1,0" stroke="${color}" stroke-width="0.5" fill="none" opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#spirals)"/>
    </svg>
  `,
  
  subtle: (color) => `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.05"/>
    </svg>
  `
};

// =============================================================================
// COMPONENTE: FloatingKeyword
// =============================================================================

const FloatingKeyword = ({ word, index, accent, total }) => {
  // Posición pseudo-aleatoria basada en el índice
  const angle = (index / total) * 360 + (index * 37);
  const radius = 30 + (index % 3) * 15;
  const x = 50 + Math.cos(angle * Math.PI / 180) * radius;
  const y = 50 + Math.sin(angle * Math.PI / 180) * radius;
  
  // Tamaño basado en posición
  const size = index < 3 ? 'text-sm' : index < 6 ? 'text-xs' : 'text-[10px]';
  const opacity = index < 3 ? 'opacity-90' : index < 6 ? 'opacity-70' : 'opacity-50';
  
  // Obtener icono
  const icon = VIBE_ICONS[word.toLowerCase()] || VIBE_ICONS['default'];
  
  return (
    <div 
      className={`absolute ${size} ${opacity} transition-all duration-500 hover:opacity-100 hover:scale-110 cursor-default`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        color: accent,
        animationDelay: `${index * 100}ms`
      }}
    >
      <span className="mr-1 opacity-60">{icon}</span>
      <span className="font-medium">{word}</span>
    </div>
  );
};

// =============================================================================
// COMPONENTE: AtmosphereLayer
// =============================================================================

const AtmosphereLayer = ({ config, mood }) => {
  const patternSVG = SVGPatterns[config.pattern] 
    ? SVGPatterns[config.pattern](config.accent)
    : SVGPatterns.subtle(config.accent);
  
  const encodedSVG = encodeURIComponent(patternSVG);
  
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      {/* Gradiente base */}
      <div 
        className="absolute inset-0 transition-all duration-700"
        style={{ background: config.gradient }}
      />
      
      {/* Patrón SVG */}
      <div 
        className="absolute inset-0 opacity-50 mix-blend-overlay"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,${encodedSVG}")`,
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }}
      />
      
      {/* Glow del accent */}
      <div 
        className="absolute top-1/4 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: config.accent }}
      />
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL: BookMoodboard
// =============================================================================

const BookMoodboard = ({ book, expanded = false, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Obtener datos del libro
  const mood = book.m || 'default';
  const vibes = book.v || book.vibes || [];
  const title = book.t || book.title || '';
  const authors = book.a || book.authors || [];
  
  // Configuración de atmósfera
  const config = useMemo(() => {
    return ATMOSPHERE_CONFIG[mood] || ATMOSPHERE_CONFIG.default;
  }, [mood]);
  
  // Keywords a mostrar (vibes + mood)
  const keywords = useMemo(() => {
    const all = [...vibes];
    if (mood && mood !== 'default') all.push(mood);
    return all.slice(0, 8);
  }, [vibes, mood]);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.(!isExpanded);
  };
  
  return (
    <div className="mt-4">
      {/* Header clickeable */}
      <button 
        onClick={handleToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <span className="text-zinc-300 font-medium text-sm">Atmósfera visual</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs italic">{config.vibe}</span>
          <span className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>
      
      {/* Contenido expandible */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        {/* Moodboard visual */}
        <div className="relative h-48 rounded-xl overflow-hidden">
          {/* Capa de atmósfera */}
          <AtmosphereLayer config={config} mood={mood} />
          
          {/* Keywords flotantes */}
          <div className="absolute inset-0">
            {keywords.map((word, i) => (
              <FloatingKeyword 
                key={word} 
                word={word} 
                index={i} 
                accent={config.accent}
                total={keywords.length}
              />
            ))}
          </div>
          
          {/* Título atmosférico */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <p 
              className="font-serif text-lg font-bold truncate"
              style={{ color: config.accent }}
            >
              {title}
            </p>
            <p className="text-white/60 text-xs truncate">
              {authors[0]}
            </p>
          </div>
          
          {/* Indicador de mood */}
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm"
            style={{ 
              backgroundColor: `${config.accent}30`,
              color: config.accent,
              border: `1px solid ${config.accent}40`
            }}
          >
            {mood}
          </div>
        </div>
        
        {/* Keywords como tags debajo */}
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((word, i) => {
            const icon = VIBE_ICONS[word.toLowerCase()] || VIBE_ICONS['default'];
            return (
              <span 
                key={word}
                className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-default"
                style={{ 
                  backgroundColor: `${config.accent}15`,
                  color: config.accent,
                  animationDelay: `${i * 50}ms`
                }}
              >
                <span className="mr-1 opacity-70">{icon}</span>
                {word}
              </span>
            );
          })}
        </div>
        
        {/* Frase atmosférica */}
        <p className="mt-3 text-center text-zinc-500 text-xs italic">
          "{config.vibe}"
        </p>
      </div>
    </div>
  );
};

export default BookMoodboard;
