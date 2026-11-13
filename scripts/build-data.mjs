// Deriva de public/biblioteca_app.json los archivos que carga la app:
//   public/data/books-core.json  -> libros sin sinopsis ni campos internos (carga inicial)
//   public/data/synopses.json    -> { id: sinopsis } (se carga en segundo plano)
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

const kb = (text) => `${Math.round(Buffer.byteLength(text) / 1024)} KB`;
console.log(`build:data — ${core.length} libros: books-core.json ${kb(coreJson)}, synopses.json ${kb(synJson)}`);
