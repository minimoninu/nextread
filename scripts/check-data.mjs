import fs from 'node:fs';
import path from 'node:path';

const strictMode = process.env.CHECK_DATA_STRICT === '1';
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

const REQUIRED_FILES = {
  books: 'biblioteca_app.json',
  hooks: 'hooks.json',
  collections: 'collections.json'
};

const errors = [];
const warnings = [];

function readJson(label, fileName) {
  const filePath = path.join(publicDir, fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    errors.push(`${label}: no se pudo leer/parsear ${filePath} (${error.message})`);
    return null;
  }
}

function sample(values, max = 10) {
  return values.slice(0, max).join(', ');
}

const books = readJson('books', REQUIRED_FILES.books);
const hooks = readJson('hooks', REQUIRED_FILES.hooks);
const collections = readJson('collections', REQUIRED_FILES.collections);

if (!Array.isArray(books)) {
  errors.push('books: se esperaba un array en biblioteca_app.json');
}

if (hooks && (typeof hooks !== 'object' || Array.isArray(hooks))) {
  errors.push('hooks: se esperaba un objeto clave-valor en hooks.json');
}

if (!Array.isArray(collections)) {
  errors.push('collections: se esperaba un array en collections.json');
}

if (errors.length === 0) {
  const bookIds = books.map((book) => String(book.id));
  const bookIdSet = new Set(bookIds);
  const duplicateBookIds = bookIds.filter((id, idx) => bookIds.indexOf(id) !== idx);

  if (duplicateBookIds.length > 0) {
    errors.push(`books: IDs duplicados detectados (${sample([...new Set(duplicateBookIds)])})`);
  }

  const hookIds = Object.keys(hooks);
  const hookIdSet = new Set(hookIds);

  const missingHooks = books
    .filter((book) => !hookIdSet.has(String(book.id)))
    .map((book) => `${book.id}:${book.t || book.title || 'sin titulo'}`);

  const orphanHooks = hookIds.filter((id) => !bookIdSet.has(String(id)));

  if (missingHooks.length > 0) {
    warnings.push(`hooks: ${missingHooks.length} libros sin hook (ej: ${sample(missingHooks, 5)})`);
  }

  if (orphanHooks.length > 0) {
    warnings.push(`hooks: ${orphanHooks.length} hooks sin libro (ids: ${sample(orphanHooks)})`);
  }

  const invalidCollectionRefs = [];
  for (const collection of collections) {
    const hasBookIds = Array.isArray(collection.bookIds);
    const hasCriteria = Boolean(collection.criteria);

    if (!hasBookIds && !hasCriteria) {
      warnings.push(
        `collections: ${collection.id || 'sin-id'} no tiene ni bookIds ni criteria (queda vacia en UI)`
      );
      continue;
    }

    if (!hasBookIds) {
      continue;
    }

    const invalidRefs = collection.bookIds.filter((id) => !bookIdSet.has(String(id)));
    if (invalidRefs.length > 0) {
      invalidCollectionRefs.push(
        `${collection.id || 'sin-id'} -> ${invalidRefs.length} ids invalidos (ej: ${sample(invalidRefs.map(String), 5)})`
      );
    }
  }

  if (invalidCollectionRefs.length > 0) {
    errors.push(`collections: referencias invalidas detectadas\n- ${invalidCollectionRefs.join('\n- ')}`);
  }
}

console.log('check:data resumen');
console.log(`- strict mode: ${strictMode ? 'on' : 'off'}`);
console.log(`- errores: ${errors.length}`);
console.log(`- avisos: ${warnings.length}`);

if (warnings.length > 0) {
  console.log('\nAvisos:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nErrores:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (strictMode && warnings.length > 0) {
  console.error('\nModo estricto activo: hay avisos, se marca como fallo.');
  process.exit(1);
}

console.log('\nOK: validacion de datos completada.');
