# 📚 Guía: Añadir Nuevos Libros desde Calibre

## Resumen Rápido

Cuando añadas nuevos libros a tu biblioteca de Calibre, sigue estos pasos para sincronizarlos con NextRead:

```bash
# 1. Ve al directorio del proyecto
cd /Users/kemberly/Documents/nextread

# 2. Ejecuta el script de sincronización
python3 scripts/calibre_sync.py --calibre-path "/Users/kemberly/Documents/Calibre" --copy-covers --generate-hooks
# 3. Sube los cambios
git add .
git commit -m "Sync: nuevos libros desde Calibre"
git push
```

---

## Flujo Completo Explicado

### Paso 1: Añade libros a Calibre normalmente

Añade tus nuevos libros a Calibre como siempre. Asegúrate de:

- ✅ Añadir **título** correcto
- ✅ Añadir **autor(es)**
- ✅ Añadir **tags/géneros** (ayudan a clasificar)
- ✅ Añadir **portada** (cover)
- ✅ Añadir **descripción/sinopsis** si está disponible

### Paso 2: Ejecuta el script de sincronización

```bash
cd /Users/kemberly/Documents/nextread

python scripts/calibre_sync.py \
  --calibre-path "/Users/kemberly/Calibre Library" \
  --copy-covers \
  --generate-hooks
```

**Opciones disponibles:**

| Opción | Descripción |
|--------|-------------|
| `--calibre-path` | Ruta a tu biblioteca de Calibre |
| `--copy-covers` | Copia las portadas al proyecto |
| `--generate-hooks` | Genera hooks básicos para libros nuevos |
| `--dry-run` | Solo muestra qué haría, sin modificar nada |

### Paso 3: Verifica los cambios

El script te mostrará:
- Cuántos libros nuevos encontró
- Cuántos libros actualizó (si ya existían)
- Cuántas portadas copió

### Paso 4: Mejora los hooks (opcional pero recomendado)

Los hooks generados automáticamente son básicos. Para hooks de calidad:

**Opción A: Pídele a Claude que mejore los hooks**
```
Tengo estos libros nuevos sin hooks de calidad: [lista]
¿Puedes generar hooks atractivos para cada uno?
```

**Opción B: Edita manualmente `public/hooks.json`**
```json
{
  "1847": {
    "hook": "Tu hook personalizado aquí",
    "themes": ["tema1", "tema2"],
    "experience": "devastador",
    "perfect_for": "Lectores que buscan...",
    "why_matters": "Por qué este libro importa..."
  }
}
```

### Paso 5: Sube los cambios

```bash
git add .
git commit -m "Sync: añadidos X libros nuevos"
git push
```

Vercel desplegará automáticamente en ~1 minuto.

---

## Estructura de Datos

Cada libro en `biblioteca_app.json` tiene esta estructura:

```json
{
  "id": 1847,           // ID único
  "t": "Título",        // Título
  "a": ["Autor"],       // Autores (array)
  "v": ["ficción"],     // Vibes/géneros
  "s": "Serie",         // Serie (o null)
  "si": 1,              // Índice en serie
  "d": "medio",         // Dificultad: ligero/medio/denso
  "p": "medio",         // Pacing: lento/medio/rápido
  "m": "emotivo",       // Mood
  "pg": 320,            // Páginas
  "h": 8.0,             // Horas estimadas
  "aw": [],             // Premios
  "syn": "Sinopsis...", // Descripción
  "y": "2023"           // Año publicación
}
```

---

## Mapeo de Géneros

El script convierte automáticamente tags de Calibre a vibes de NextRead:

| Calibre Tag | NextRead Vibe |
|-------------|---------------|
| fiction, novel | ficción |
| historical | histórico |
| mystery, thriller | intriga |
| crime, detective | policial |
| fantasy | fantasía |
| science fiction | ciencia ficción |
| romance | romántico |
| humor, comedy | humor |
| horror | oscuro |
| biography, memoir | memorias |
| essay | ensayo |
| philosophy | filosófico |
| poetry | poesía |
| adventure | aventura |

---

## Troubleshooting

### "calibredb no encontrado"

El script intenta usar el CLI de Calibre. Si no está en el PATH:

1. Abre Calibre
2. Ve a Preferences → Miscellaneous
3. Activa "Install command line tools"

O usa la lectura directa de metadata:
```bash
python scripts/calibre_sync.py --calibre-path "/ruta/exacta/a/Calibre Library"
```

### "No se encontró la biblioteca"

Verifica la ruta. En Mac suele ser:
- `/Users/tu_usuario/Calibre Library`

En Windows:
- `C:\Users\tu_usuario\Calibre Library`

### Las portadas no se copian

Asegúrate de que los libros en Calibre tengan portada. 
El script busca archivos `cover.jpg` en cada carpeta de libro.

### Libros duplicados

El script detecta duplicados por título + autor. Si un libro ya existe:
- Se **actualiza** con los nuevos datos
- Se **mantiene** el ID existente
- Se **preservan** los hooks que ya tenía

---

## Automatización (Avanzado)

Puedes crear un script que se ejecute automáticamente:

```bash
#!/bin/bash
# sync_calibre.sh

cd /Users/kemberly/Documents/nextread

echo "🔄 Sincronizando Calibre..."
python scripts/calibre_sync.py \
  --calibre-path "/Users/kemberly/Calibre Library" \
  --copy-covers

echo "📤 Subiendo cambios..."
git add .
git commit -m "Auto-sync: $(date +%Y-%m-%d)"
git push

echo "✅ Listo!"
```

Hazlo ejecutable:
```bash
chmod +x sync_calibre.sh
```

Y ejecútalo cuando quieras:
```bash
./sync_calibre.sh
```

---

## Próximos Pasos Recomendados

Después de sincronizar:

1. **Revisa los hooks generados** - Mejora los que sean muy genéricos
2. **Verifica las dificultades** - Ajusta si algún libro está mal clasificado
3. **Añade premios manualmente** - Si el libro tiene premios que no se detectaron
4. **Prueba el Wizard** - Verifica que los nuevos libros aparecen en las recomendaciones
