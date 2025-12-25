import React, { useMemo, useState } from 'react';

/**
 * ESTADÍSTICAS DE BIBLIOTECA
 * ==========================
 * Visualización de la colección completa con:
 * - Stats generales (libros, páginas, horas)
 * - Distribución por dificultad
 * - Distribución por mood
 * - Top autores
 * - Top géneros/vibes
 * - Premios
 */

const BibliotecaStats = ({ books, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  
  // =========================================================================
  // HELPERS
  // =========================================================================
  
  const get = (book, ...fields) => {
    for (const f of fields) {
      if (book[f] !== undefined && book[f] !== null) return book[f];
    }
    return null;
  };
  
  const getPages = (b) => get(b, 'pg', 'pages') || 300;
  const getHours = (b) => get(b, 'h', 'reading_time_hours') || Math.round(getPages(b) / 40 * 10) / 10;
  const getDiff = (b) => get(b, 'd', 'difficulty') || 'medio';
  const getMood = (b) => get(b, 'm', 'mood') || 'sin clasificar';
  const getVibes = (b) => get(b, 'v', 'vibes') || [];
  const getAwards = (b) => get(b, 'aw', 'awards') || [];
  const getAuthors = (b) => get(b, 'a', 'authors') || ['Desconocido'];
  const getSeries = (b) => get(b, 's', 'series');
  
  // =========================================================================
  // CÁLCULOS DE ESTADÍSTICAS
  // =========================================================================
  
  const stats = useMemo(() => {
    // Generales
    const totalBooks = books.length;
    const totalPages = books.reduce((sum, b) => sum + getPages(b), 0);
    const totalHours = books.reduce((sum, b) => sum + getHours(b), 0);
    const avgPages = Math.round(totalPages / totalBooks);
    const avgHours = Math.round(totalHours / totalBooks * 10) / 10;
    
    // Por dificultad
    const byDifficulty = { ligero: 0, medio: 0, denso: 0 };
    books.forEach(b => {
      const d = getDiff(b);
      if (byDifficulty[d] !== undefined) byDifficulty[d]++;
    });
    
    // Por mood
    const byMood = {};
    books.forEach(b => {
      const m = getMood(b);
      byMood[m] = (byMood[m] || 0) + 1;
    });
    const moodsSorted = Object.entries(byMood)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    
    // Por autor
    const byAuthor = {};
    books.forEach(b => {
      const authors = getAuthors(b);
      authors.forEach(a => {
        byAuthor[a] = (byAuthor[a] || 0) + 1;
      });
    });
    const topAuthors = Object.entries(byAuthor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    const uniqueAuthors = Object.keys(byAuthor).length;
    
    // Por género/vibe
    const byVibe = {};
    books.forEach(b => {
      const vibes = getVibes(b);
      vibes.forEach(v => {
        byVibe[v] = (byVibe[v] || 0) + 1;
      });
    });
    const topVibes = Object.entries(byVibe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    // Premios
    const withAwards = books.filter(b => getAwards(b).length > 0).length;
    const byAward = {};
    books.forEach(b => {
      const awards = getAwards(b);
      awards.forEach(a => {
        byAward[a] = (byAward[a] || 0) + 1;
      });
    });
    const awardsSorted = Object.entries(byAward)
      .sort((a, b) => b[1] - a[1]);
    
    // Series
    const seriesMap = {};
    books.forEach(b => {
      const s = getSeries(b);
      if (s) seriesMap[s] = (seriesMap[s] || 0) + 1;
    });
    const totalSeries = Object.keys(seriesMap).length;
    const booksInSeries = Object.values(seriesMap).reduce((a, b) => a + b, 0);
    const topSeries = Object.entries(seriesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Por extensión
    const byLength = {
      'Corto (<200p)': 0,
      'Normal (200-400p)': 0,
      'Largo (400-600p)': 0,
      'Muy largo (>600p)': 0,
    };
    books.forEach(b => {
      const p = getPages(b);
      if (p < 200) byLength['Corto (<200p)']++;
      else if (p < 400) byLength['Normal (200-400p)']++;
      else if (p < 600) byLength['Largo (400-600p)']++;
      else byLength['Muy largo (>600p)']++;
    });
    
    return {
      totalBooks,
      totalPages,
      totalHours,
      avgPages,
      avgHours,
      byDifficulty,
      byMood: moodsSorted,
      topAuthors,
      uniqueAuthors,
      topVibes,
      withAwards,
      awardsSorted,
      totalSeries,
      booksInSeries,
      topSeries,
      byLength,
    };
  }, [books]);
  
  // =========================================================================
  // COMPONENTES DE VISUALIZACIÓN
  // =========================================================================
  
  // Barra horizontal simple
  const HorizontalBar = ({ label, value, max, color = 'amber' }) => {
    const percentage = (value / max) * 100;
    const colors = {
      amber: 'from-amber-500 to-orange-500',
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-pink-500',
      red: 'from-red-500 to-orange-500',
    };
    
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-300 truncate pr-2">{label}</span>
          <span className="text-zinc-500 flex-shrink-0">{value}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors[color]} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };
  
  // Stat card grande
  const StatCard = ({ emoji, value, label, sublabel }) => (
    <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-zinc-700/30">
      <div className="text-3xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-zinc-400 text-sm">{label}</div>
      {sublabel && <div className="text-zinc-600 text-xs mt-1">{sublabel}</div>}
    </div>
  );
  
  // Mini donut chart (CSS puro)
  const DonutChart = ({ data, colors }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    let cumulative = 0;
    
    const segments = Object.entries(data).map(([key, value], i) => {
      const percentage = (value / total) * 100;
      const rotation = (cumulative / total) * 360;
      cumulative += value;
      return { key, value, percentage, rotation, color: colors[i] };
    });
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {segments.map((seg, i) => {
            const offset = segments.slice(0, i).reduce((a, s) => a + s.percentage, 0);
            return (
              <circle
                key={seg.key}
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke={seg.color}
                strokeWidth="3"
                strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
        </div>
      </div>
    );
  };
  
  // =========================================================================
  // TABS
  // =========================================================================
  
  const tabs = [
    { id: 'general', label: '📊 General', emoji: '📊' },
    { id: 'autores', label: '✍️ Autores', emoji: '✍️' },
    { id: 'generos', label: '🏷️ Géneros', emoji: '🏷️' },
    { id: 'premios', label: '🏆 Premios', emoji: '🏆' },
  ];
  
  // =========================================================================
  // RENDER
  // =========================================================================
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-800 relative flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent p-5 border-b border-zinc-800/50">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            ×
          </button>
          
          <h2 className="font-serif text-xl font-bold text-white">
            📊 Estadísticas de tu Biblioteca
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {stats.totalBooks} libros • {stats.uniqueAuthors} autores • {stats.totalSeries} series
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-zinc-900/50 border-b border-zinc-800/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Stats principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard 
                  emoji="📚" 
                  value={stats.totalBooks.toLocaleString()} 
                  label="Libros"
                />
                <StatCard 
                  emoji="📄" 
                  value={stats.totalPages.toLocaleString()} 
                  label="Páginas"
                  sublabel={`~${stats.avgPages} promedio`}
                />
                <StatCard 
                  emoji="⏱️" 
                  value={Math.round(stats.totalHours).toLocaleString()} 
                  label="Horas"
                  sublabel={`${Math.round(stats.totalHours / 24)} días`}
                />
                <StatCard 
                  emoji="🏆" 
                  value={stats.withAwards} 
                  label="Premiados"
                  sublabel={`${Math.round(stats.withAwards / stats.totalBooks * 100)}%`}
                />
              </div>
              
              {/* Dificultad */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span>📈</span> Por dificultad
                </h3>
                <div className="flex items-center gap-6">
                  <DonutChart 
                    data={stats.byDifficulty}
                    colors={['#fbbf24', '#60a5fa', '#a78bfa']}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-zinc-300">Ligero</span>
                      <span className="text-zinc-500 ml-auto">{stats.byDifficulty.ligero}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                      <span className="text-zinc-300">Medio</span>
                      <span className="text-zinc-500 ml-auto">{stats.byDifficulty.medio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400" />
                      <span className="text-zinc-300">Denso</span>
                      <span className="text-zinc-500 ml-auto">{stats.byDifficulty.denso}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Extensión */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span>📏</span> Por extensión
                </h3>
                {Object.entries(stats.byLength).map(([label, value]) => (
                  <HorizontalBar 
                    key={label}
                    label={label}
                    value={value}
                    max={Math.max(...Object.values(stats.byLength))}
                    color="blue"
                  />
                ))}
              </div>
              
              {/* Moods */}
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span>🎭</span> Por mood
                </h3>
                {stats.byMood.slice(0, 8).map(([mood, count]) => (
                  <HorizontalBar 
                    key={mood}
                    label={mood}
                    value={count}
                    max={stats.byMood[0][1]}
                    color="purple"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* TAB: Autores */}
          {activeTab === 'autores' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  emoji="✍️" 
                  value={stats.uniqueAuthors} 
                  label="Autores únicos"
                />
                <StatCard 
                  emoji="📊" 
                  value={(stats.totalBooks / stats.uniqueAuthors).toFixed(1)} 
                  label="Libros/autor promedio"
                />
              </div>
              
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4">🏅 Top 15 autores</h3>
                {stats.topAuthors.map(([author, count], i) => (
                  <HorizontalBar 
                    key={author}
                    label={`${i + 1}. ${author}`}
                    value={count}
                    max={stats.topAuthors[0][1]}
                    color={i < 3 ? 'amber' : 'blue'}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* TAB: Géneros */}
          {activeTab === 'generos' && (
            <div className="space-y-6">
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4">🏷️ Top géneros y vibes</h3>
                {stats.topVibes.map(([vibe, count], i) => (
                  <HorizontalBar 
                    key={vibe}
                    label={vibe}
                    value={count}
                    max={stats.topVibes[0][1]}
                    color={i < 3 ? 'green' : 'blue'}
                  />
                ))}
              </div>
              
              {stats.topSeries.length > 0 && (
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                  <h3 className="text-white font-medium mb-4">📚 Series más grandes</h3>
                  <p className="text-zinc-500 text-sm mb-4">
                    {stats.booksInSeries} libros en {stats.totalSeries} series
                  </p>
                  {stats.topSeries.map(([series, count]) => (
                    <HorizontalBar 
                      key={series}
                      label={series}
                      value={count}
                      max={stats.topSeries[0][1]}
                      color="purple"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* TAB: Premios */}
          {activeTab === 'premios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  emoji="🏆" 
                  value={stats.withAwards} 
                  label="Libros premiados"
                  sublabel={`${Math.round(stats.withAwards / stats.totalBooks * 100)}% del total`}
                />
                <StatCard 
                  emoji="🎖️" 
                  value={stats.awardsSorted.length} 
                  label="Tipos de premios"
                />
              </div>
              
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <h3 className="text-white font-medium mb-4">🏅 Premios en tu biblioteca</h3>
                {stats.awardsSorted.map(([award, count]) => (
                  <HorizontalBar 
                    key={award}
                    label={award}
                    value={count}
                    max={stats.awardsSorted[0][1]}
                    color="amber"
                  />
                ))}
              </div>
              
              {/* Fun fact */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-xl p-4 border border-amber-500/20">
                <p className="text-amber-400 text-sm">
                  💡 Si leyeras solo los libros premiados a razón de uno por semana, 
                  tardarías <strong>{Math.round(stats.withAwards / 4)} meses</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer con fun fact */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50">
          <p className="text-zinc-600 text-xs text-center">
            📖 Si leyeras 1 hora al día, terminarías toda tu biblioteca en{' '}
            <span className="text-zinc-400">{Math.round(stats.totalHours / 365)} años</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BibliotecaStats;
