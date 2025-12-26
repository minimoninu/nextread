# 📚 Guía Completa: Calibre → NextRead

## Flujo de Trabajo Recomendado

```
┌─────────────────────────────────────────────────────────────────┐
│  1. AÑADIR LIBROS A CALIBRE                                     │
│     (título, autor, portada)                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. ENRIQUECER METADATA (opcional pero recomendado)             │
│     python3 calibre_enricher.py                                  │
│     → Añade: páginas, géneros, sinopsis desde APIs              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. SINCRONIZAR CON NEXTREAD                                    │
│     python3 calibre_sync.py                                      │
│     → Convierte a formato NextRead                              │
│     → Copia portadas                                            │
│     → Genera hooks básicos                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. SUBIR A GITHUB                                              │
│     git add . && git commit -m "Sync" && git push               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Paso 1: Enriquecer Calibre (Recomendado)

Este script añade **páginas, géneros y sinopsis** directamente a tu biblioteca de Calibre usando APIs públicas.

```bash
# Cierra Calibre primero!

cd /Users/kemberly/Documents/nextread

# Enriquecer toda la biblioteca
python3 scripts/calibre_enricher.py \
  --calibre-db "/Users/kemberly/Documents/Calibre/metadata.db"

# O solo los libros que les falta metadata
python3 scripts/calibre_enricher.py \
  --calibre-db "/Users/kemberly/Documents/Calibre/metadata.db" \
  --only-missing

# Probar con 5 libros primero
python3 scripts/calibre_enricher.py \
  --calibre-db "/Users/kemberly/Documents/Calibre/metadata.db" \
  --limit 5
```

**Qué hace:**
- Busca en **Open Library** y **Google Books**
- Añade **géneros** traducidos al español
- Añade **sinopsis** si falta
- Muestra progreso libro por libro

---

## Paso 2: Sincronizar con NextRead

```bash
cd /Users/kemberly/Documents/nextread

python3 scripts/calibre_sync.py \
  --calibre-path "/Users/kemberly/Documents/Calibre" \
  --copy-covers \
  --generate-hooks
```

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| `--calibre-path` | Carpeta de tu biblioteca Calibre |
| `--copy-covers` | Copia las portadas |
| `--generate-hooks` | Genera hooks básicos |
| `--dry-run` | Ver qué haría sin modificar |

---

## Paso 3: Subir cambios

```bash
git add .
git commit -m "Añadidos X libros nuevos"
git push
```

---

## Mapeo de Géneros

El script traduce automáticamente:

| Inglés | Español |
|--------|---------|
| Fiction | Ficción |
| Mystery, Thriller | Misterio, Thriller |
| Science Fiction | Ciencia ficción |
| Fantasy | Fantasía |
| Horror | Terror |
| Romance | Romance |
| Historical | Histórico |
| Biography, Memoir | Biografía, Memorias |
| Philosophy | Filosofía |
| Poetry | Poesía |
| ... | (50+ traducciones) |

---

## Páginas

El sistema busca páginas en este orden:

1. **Custom column de Calibre** (si tienes una columna "pages")
2. **Open Library API** (base de datos pública de libros)
3. **Google Books API** (muy completa)
4. **Estimación** por tamaño de archivo (fallback)

---

## Tips

### Para mejores resultados en Calibre:
- Añade títulos exactos (ayuda a buscar en APIs)
- Añade autor correcto
- Añade portada (Calibre puede buscarla automáticamente)

### Para mejores hooks en NextRead:
- Los hooks generados son básicos
- Pídele a Claude que mejore los hooks después
- O edita `public/hooks.json` manualmente

---

## Troubleshooting

### "No se encontró la biblioteca"
Verifica la ruta exacta a tu carpeta de Calibre.

### "Error al enriquecer"
- Cierra Calibre antes de ejecutar los scripts
- Algunos libros muy raros no están en las APIs

### Las páginas no son correctas
Crea una columna personalizada en Calibre:
1. Preferencias → Añadir tus propias columnas
2. Nombre: "pages", Tipo: "Integers"
3. Llénala manualmente para libros importantes
