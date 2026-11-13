// Deriva de public/biblioteca_app.json los archivos que carga la app:
//   public/data/books-core.json  -> libros sin sinopsis ni campos internos (carga inicial)
//   public/data/synopses.json    -> { id: sinopsis } (se carga en segundo plano)
//   public/data/reading-route.json -> ruta de 200 obras cruzada con la biblioteca
// biblioteca_app.json sigue siendo la fuente de verdad; public/data/ no se versiona.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public', 'biblioteca_app.json');
const OUT_DIR = path.join(ROOT, 'public', 'data');

const books = JSON.parse(await readFile(SOURCE, 'utf8'));
const core = [];
const synopses = {};
for (const book of books) {
  const { syn, ...rest } = book;
  for (const key of Object.keys(rest)) {
    if (key.startsWith('_')) delete rest[key];
  }
  core.push(rest);
  if (syn) synopses[book.id] = syn;
}

await mkdir(OUT_DIR, { recursive: true });
const coreJson = JSON.stringify(core);
const synJson = JSON.stringify(synopses);
await writeFile(path.join(OUT_DIR, 'books-core.json'), coreJson);
await writeFile(path.join(OUT_DIR, 'synopses.json'), synJson);

// Ruta de lectura: TSV fuente + cruce con la biblioteca actual.
const { matchRouteItem, stageIdForYear } = await import('../src/readingRoute.js');
const routeTsv = await readFile(path.join(ROOT, 'scripts', 'data', 'reading-route.tsv'), 'utf8');
const aliases = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'data', 'reading-route-aliases.json'), 'utf8'));
const routeItems = routeTsv
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => {
    const [n, y, t, a, c, l, g, pg, acc, why] = line.split('\t');
    const item = { n: Number(n), y: Number(y), t, a, c, l, g, pg: Number(pg), acc: Number(acc), why };
    return { ...item, stage: stageIdForYear(item.y), ...matchRouteItem(item, books, aliases) };
  });
const routeJson = JSON.stringify(routeItems);
await writeFile(path.join(OUT_DIR, 'reading-route.json'), routeJson);
const owned = routeItems.filter((item) => item.bookId != null).length;

const kb = (text) => `${Math.round(Buffer.byteLength(text) / 1024)} KB`;
console.log(`build:data — ${core.length} libros: books-core.json ${kb(coreJson)}, synopses.json ${kb(synJson)}`);
console.log(`build:data — ruta de lectura: ${routeItems.length} obras, ${owned} en la biblioteca`);
