// Genera miniaturas WebP de las portadas en public/portadas/thumbs/.
// Incremental: solo procesa portadas nuevas o modificadas, y borra miniaturas huérfanas.
import { readdir, mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'public', 'portadas');
const OUT_DIR = path.join(SRC_DIR, 'thumbs');
const WIDTH = 320;
const QUALITY = 72;
const CONCURRENCY = 8;

const mtime = async (file) => {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
};

await mkdir(OUT_DIR, { recursive: true });
const sources = (await readdir(SRC_DIR)).filter((name) => /^\d+\.jpg$/.test(name));
const wanted = new Set(sources.map((name) => name.replace(/\.jpg$/, '.webp')));

let built = 0;
let failed = 0;
const queue = [...sources];
const worker = async () => {
  while (queue.length > 0) {
    const name = queue.pop();
    const src = path.join(SRC_DIR, name);
    const out = path.join(OUT_DIR, name.replace(/\.jpg$/, '.webp'));
    if ((await mtime(out)) >= (await mtime(src))) continue;
    try {
      await sharp(src).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
      built += 1;
    } catch (error) {
      failed += 1;
      console.error(`No se pudo procesar ${name}: ${error.message}`);
    }
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

let removed = 0;
for (const name of await readdir(OUT_DIR)) {
  if (name.endsWith('.webp') && !wanted.has(name)) {
    await unlink(path.join(OUT_DIR, name));
    removed += 1;
  }
}

console.log(`build:thumbs — ${sources.length} portadas, ${built} generadas, ${removed} huérfanas borradas, ${failed} fallidas`);
if (failed > 0) process.exit(1);
