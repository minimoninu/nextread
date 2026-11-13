# NextRead 📚

App visual de recomendación de libros con interfaz inspirada en Netflix/Tinder.

## Características
- 🎯 1857 hooks narrativos para libros
- 📖 1857 libros con metadatos completos
- 🎨 Interfaz visual con covers
- 🧙 Wizard de recomendaciones inteligente
- 🔍 Filtros por mood, dificultad, premios

## Instalación local

```bash
npm install
npm run dev
```

## Deploy en Vercel
1. Sube este proyecto a GitHub
2. Conecta con Vercel
3. ¡Listo!

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- Lucide Icons

## Scripts
- `npm run dev` / `npm run build`: generan antes los datos derivados (`build:data`)
- `npm run verify`: lint + validación de datos + tests + build (lo mismo que ejecuta CI)
- `npm run build:thumbs`: miniaturas WebP de portadas nuevas (`publicar.command` lo hace solo)
- `npm run build:data`: separa `biblioteca_app.json` en `public/data/books-core.json` y `synopses.json` (no se versionan)
