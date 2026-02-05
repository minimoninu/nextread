import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

const booksPath = path.join(publicDir, 'biblioteca_app.json');
const hooksPath = path.join(publicDir, 'hooks.json');

const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

const bookIdSet = new Set(books.map((book) => String(book.id)));
const currentHookEntries = Object.entries(hooks);

const sanitizedHooks = {};
let removedOrphans = 0;

for (const [id, hook] of currentHookEntries) {
  if (!bookIdSet.has(String(id))) {
    removedOrphans += 1;
    continue;
  }
  sanitizedHooks[String(id)] = hook;
}

const moodToExperience = {
  emotivo: 'conmovedor',
  reflexivo: 'reflexivo',
  tenso: 'tenso',
  inmersivo: 'inmersivo',
  inquietante: 'inquietante',
  oscuro: 'oscuro',
  ligero: 'tierno',
  intimo: 'intimo',
  'íntimo': 'íntimo',
  especulativo: 'revelador',
  entretenido: 'adictivo',
  imaginativo: 'onírico'
};

const difficultyToExperience = {
  denso: 'intenso',
  medio: 'revelador',
  ligero: 'tierno'
};

function cleanTitle(input) {
  if (!input) return 'Lectura sin titulo';
  let value = String(input).trim();
  if (value.includes('\\') || value.includes('/')) {
    const chunks = value.split(/[\\/]/);
    value = chunks[chunks.length - 1] || value;
  }
  value = value.replace(/\.(epub|pdf|mobi|docx?|txt)$/i, '');
  value = value.replace(/[_]+/g, ' ');
  value = value.replace(/\s+/g, ' ').trim();
  return value || 'Lectura sin titulo';
}

function cleanAuthor(input) {
  if (!input) return null;
  const value = String(input).replace(/[|]/g, ', ').replace(/\s+/g, ' ').trim();
  if (!value) return null;
  if (/^(desconocido|unknown)$/i.test(value)) return null;
  return value;
}

function normalizeThemes(vibes, mood) {
  const themes = [...new Set([...(Array.isArray(vibes) ? vibes : []), mood].filter(Boolean))];
  return themes.slice(0, 4);
}

function buildGeneratedHook(book) {
  const title = cleanTitle(book.t || book.title || 'Lectura sin titulo');
  const firstAuthor = cleanAuthor(Array.isArray(book.a) ? book.a[0] : null);
  const firstVibe = Array.isArray(book.v) && book.v.length > 0 ? String(book.v[0]) : null;
  const mood = book.m ? String(book.m) : null;
  const difficulty = book.d ? String(book.d) : 'medio';
  const pages = Number(book.pg) || 250;
  const awards = Array.isArray(book.aw) ? book.aw : [];

  const experience =
    moodToExperience[mood] ||
    difficultyToExperience[difficulty] ||
    'revelador';

  const hook = `${title}${firstAuthor ? `, de ${firstAuthor},` : ''} ofrece una experiencia ${experience}${
    firstVibe ? ` en clave ${firstVibe}` : ''
  }${mood ? ` y una atmosfera ${mood}` : ''}.`;

  const lengthLabel = pages <= 180 ? 'corta' : pages <= 420 ? 'de ritmo medio' : 'extensa';
  const effortLabel =
    difficulty === 'denso'
      ? 'con foco y profundidad'
      : difficulty === 'ligero'
      ? 'fluida y accesible'
      : 'equilibrada';

  const perfectFor = `Lectores que buscan una lectura ${lengthLabel}, ${effortLabel}${
    firstVibe ? ` y con tono ${firstVibe}` : ''
  }.`;

  let whyMatters = 'Amplia tu biblioteca personal con una opcion solida para este momento.';
  if (awards.length > 0) {
    whyMatters = `Incluye reconocimientos: ${awards.slice(0, 2).join(', ')}.`;
  } else if (pages > 500) {
    whyMatters = 'Aporta profundidad y recorrido para una lectura de largo aliento.';
  } else if (difficulty === 'ligero') {
    whyMatters = 'Ideal para retomar ritmo de lectura sin friccion.';
  }

  const generated = {
    hook,
    perfect_for: perfectFor,
    experience,
    why_matters: whyMatters
  };

  const themes = normalizeThemes(book.v, mood);
  if (themes.length > 0) {
    generated.themes = themes;
  }

  return generated;
}

let addedHooks = 0;
for (const book of books) {
  const id = String(book.id);
  if (sanitizedHooks[id]) continue;
  sanitizedHooks[id] = buildGeneratedHook(book);
  addedHooks += 1;
}

const sortedEntries = Object.entries(sanitizedHooks).sort((a, b) => Number(a[0]) - Number(b[0]));
const sortedHooks = Object.fromEntries(sortedEntries);

fs.writeFileSync(hooksPath, `${JSON.stringify(sortedHooks, null, 2)}\n`, 'utf8');

console.log(`sync:hooks completado`);
console.log(`- hooks eliminados por huerfanos: ${removedOrphans}`);
console.log(`- hooks generados: ${addedHooks}`);
console.log(`- total hooks final: ${Object.keys(sortedHooks).length}`);
