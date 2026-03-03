import React, { useState } from 'react';

// COMPONENTE: Wizard
// =============================================================================
const Wizard = ({ books, onSelect, onClose }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ energy: null, mood: null, time: null });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const STEPS = [
    {
      question: '¿Cómo está tu energía hoy?',
      hint: 'No hay respuesta correcta',
      key: 'energy',
      options: [
        { id: 'low', label: 'Baja', icon: '○', desc: 'Prefiero algo ligero' },
        { id: 'medium', label: 'Normal', icon: '◐', desc: 'Abierto a todo' },
        { id: 'high', label: 'Alta', icon: '●', desc: 'Listo para un reto' }
      ]
    },
    {
      question: '¿Qué atmósfera te atrae?',
      hint: 'Elige una o ninguna',
      key: 'mood',
      options: [
        { id: 'calm', label: 'Calma', icon: '〰', moods: ['reflexivo', 'íntimo', 'ligero'] },
        { id: 'intense', label: 'Intensidad', icon: '⚡', moods: ['tenso', 'oscuro', 'intenso'] },
        { id: 'wonder', label: 'Asombro', icon: '✧', moods: ['imaginativo', 'especulativo'] },
        { id: 'emotion', label: 'Emoción', icon: '◇', moods: ['emotivo', 'entretenido'] }
      ]
    },
    {
      question: '¿Cuánto tiempo tienes?',
      hint: 'Para las próximas semanas',
      key: 'time',
      options: [
        { id: 'short', label: 'Poco', icon: '·', maxPages: 250 },
        { id: 'medium', label: 'Normal', icon: '··', maxPages: 400 },
        { id: 'long', label: 'Mucho', icon: '···', maxPages: 9999 }
      ]
    }
  ];

  const currentStep = STEPS[step];

  const findBook = () => {
    setLoading(true);
    setTimeout(() => {
      const scored = books.map(book => {
        let score = Math.random() * 10;
        const diff = book.d || book.difficulty;
        const pages = book.pg || book.pages || 300;
        const mood = book.m;

        // Energía
        if (answers.energy === 'low' && diff === 'ligero') score += 20;
        if (answers.energy === 'high' && diff === 'denso') score += 15;
        if (answers.energy === 'medium' && diff === 'medio') score += 10;

        // Mood
        if (answers.mood) {
          const moodOpt = STEPS[1].options.find(o => o.id === answers.mood);
          if (moodOpt?.moods?.includes(mood)) score += 25;
        }

        // Tiempo
        if (answers.time) {
          const timeOpt = STEPS[2].options.find(o => o.id === answers.time);
          if (timeOpt && pages <= timeOpt.maxPages) score += 15;
        }

        return { book, score };
      });

      scored.sort((a, b) => b.score - a.score);
      setResult(scored[0].book);
      setLoading(false);
    }, 800);
  };

  const handleSelect = (optionId) => {
    setAnswers(prev => ({ ...prev, [currentStep.key]: prev[currentStep.key] === optionId ? null : optionId }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      findBook();
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else if (step > 0) {
      setStep(s => s - 1);
    }
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div
        className="modal-content animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {step > 0 || result ? (
              <button onClick={handleBack} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ← Atrás
              </button>
            ) : <div />}
            <button onClick={onClose} className="p-2 -m-2" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 animate-pulse">📚</div>
              <p style={{ color: 'var(--text-secondary)' }}>Buscando tu próxima lectura...</p>
            </div>
          ) : result ? (
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Creemos que este libro es para ti
              </p>
              <div
                className="w-32 h-48 mx-auto mb-4 rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-overlay)', boxShadow: 'var(--shadow)' }}
              >
                <img
                  src={`/portadas/${result.id}.jpg`}
                  alt={result.t}
                  className="w-full h-full object-cover"
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {result.t || result.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {(result.a || result.authors || [])[0]}
              </p>
              <button onClick={() => onSelect(result)} className="btn-primary w-full mb-2">
                Lo leo ahora
              </button>
              <button onClick={() => setResult(null)} className="btn-secondary w-full">
                Ver otra opción
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex gap-1 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: i <= step ? 'var(--accent)' : 'var(--bg-overlay)' }}
                  />
                ))}
              </div>

              {/* Question */}
              <h2 className="font-serif text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
                {currentStep.question}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {currentStep.hint}
              </p>

              {/* Options */}
              <div className="space-y-2 mb-6">
                {currentStep.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3"
                    style={{
                      background: answers[currentStep.key] === opt.id ? 'var(--accent-bg)' : 'var(--bg-overlay)',
                      border: `1px solid ${answers[currentStep.key] === opt.id ? 'var(--accent)' : 'var(--border-default)'}`,
                      color: answers[currentStep.key] === opt.id ? 'var(--accent)' : 'var(--text-primary)'
                    }}
                  >
                    <span className="text-xl w-8">{opt.icon}</span>
                    <div>
                      <div className="font-medium">{opt.label}</div>
                      {opt.desc && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Next */}
              <button
                onClick={handleNext}
                disabled={!answers[currentStep.key]}
                className="btn-primary w-full"
                style={{ opacity: answers[currentStep.key] ? 1 : 0.5 }}
              >
                {step < STEPS.length - 1 ? 'Continuar' : 'Ver recomendación'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wizard;
