#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Rutas que normalmente cambian en este proyecto
paths=(
  src
  public
  scripts
  package.json
  package-lock.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  index.html
  README.md
  CALIBRE_SYNC.md
  .gitignore
  publicar.command
)

existing=()
for p in "${paths[@]}"; do
  if [ -e "$p" ]; then
    existing+=("$p")
  fi
 done

if [ ${#existing[@]} -eq 0 ]; then
  echo "No encontré archivos para publicar."
  exit 1
fi

# Añadir cambios de las rutas relevantes
GIT_ADD_OUTPUT=$(git add -A -- "${existing[@]}" 2>&1) || {
  echo "Error al preparar cambios:"
  echo "$GIT_ADD_OUTPUT"
  exit 1
}

# Evitar subir archivos basura de macOS si quedaron en stage
{ git reset -- .DS_Store public/.DS_Store node_modules/.DS_Store node_modules/esbuild/.DS_Store dist/.DS_Store; } >/dev/null 2>&1 || true

if git diff --cached --quiet; then
  echo "No hay cambios para publicar."
  exit 0
fi

echo "Validando datos (books/hooks/collections) en modo estricto..."
npm run check:data:strict

echo "Compilando app antes de publicar..."
npm run build

TS=$(date '+%Y-%m-%d %H:%M')

git commit -m "auto: ${TS}"

git push origin main

echo "Listo: cambios publicados. Vercel hará el deploy automáticamente."
