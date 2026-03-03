#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    NEXTREAD - Pipeline de Sincronización                      ║
║                         Calibre → NextRead App                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Este script sincroniza tu biblioteca de Calibre con NextRead.

USO:
    python calibre_sync.py --calibre-path "/ruta/a/tu/Calibre Library"
    
    O si exportaste un JSON desde Calibre:
    python calibre_sync.py --json-export "/ruta/al/export.json"

REQUISITOS:
    pip install Pillow

AUTOR: Generado para NextRead
"""

import json
import os
import sys
import shutil
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
from collections import Counter
import re

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

# Rutas por defecto (ajustar según tu configuración)
DEFAULT_CALIBRE_PATH = "/Users/kemberly/Calibre Library"  # Cambiar a tu ruta
NEXTREAD_PUBLIC_PATH = "./public"  # Ruta relativa al proyecto NextRead
PORTADAS_PATH = "./public/portadas"

# Mapeo de géneros de Calibre a vibes de NextRead
GENRE_TO_VIBE = {
    'fiction': 'ficción',
    'ficción': 'ficción',
    'novel': 'ficción',
    'novela': 'ficción',
    'literary fiction': 'ficción',
    'ficción literaria': 'ficción',
    'historical fiction': 'histórico',
    'ficción histórica': 'histórico',
    'historical': 'histórico',
    'historia': 'historia',
    'history': 'historia',
    'mystery': 'intriga',
    'misterio': 'intriga',
    'thriller': 'intriga',
    'suspense': 'intriga',
    'crime': 'policial',
    'crimen': 'policial',
    'detective': 'policial',
    'noir': 'noir',
    'fantasy': 'fantasía',
    'fantasía': 'fantasía',
    'science fiction': 'ciencia ficción',
    'ciencia ficción': 'ciencia ficción',
    'sci-fi': 'ciencia ficción',
    'romance': 'romántico',
    'romántico': 'romántico',
    'humor': 'humor',
    'comedy': 'humor',
    'comedia': 'humor',
    'horror': 'oscuro',
    'terror': 'oscuro',
    'drama': 'dramático',
    'dramático': 'dramático',
    'biography': 'memorias',
    'biografía': 'memorias',
    'memoir': 'memorias',
    'memorias': 'memorias',
    'autobiography': 'memorias',
    'essay': 'ensayo',
    'ensayo': 'ensayo',
    'essays': 'ensayo',
    'philosophy': 'filosófico',
    'filosofía': 'filosófico',
    'psychology': 'psicológico',
    'psicología': 'psicológico',
    'short stories': 'relatos cortos',
    'relatos': 'relatos cortos',
    'cuentos': 'relatos cortos',
    'poetry': 'poesía',
    'poesía': 'poesía',
    'adventure': 'aventura',
    'aventura': 'aventura',
    'war': 'histórico',
    'guerra': 'histórico',
    'young adult': 'juvenil',
    'juvenil': 'juvenil',
    'children': 'infantil',
    'infantil': 'infantil',
    'classic': 'ficción',
    'clásico': 'ficción',
    'satire': 'satírico',
    'sátira': 'satírico',
    'gothic': 'oscuro',
    'gótico': 'oscuro',
    'erotic': 'erótico',
    'erótico': 'erótico',
    'chronicle': 'crónica',
    'crónica': 'crónica',
    'journalism': 'crónica',
    'periodismo': 'crónica',
    'art': 'arte',
    'arte': 'arte',
    'science': 'ciencias',
    'ciencia': 'ciencias',
    'social science': 'ciencias sociales',
    'ciencias sociales': 'ciencias sociales',
    'self-help': 'divulgación',
    'autoayuda': 'divulgación',
    'non-fiction': 'ensayo',
    'no ficción': 'ensayo',
}

# Autores conocidos por su dificultad
DENSE_AUTHORS = [
    'proust', 'joyce', 'pynchon', 'gaddis', 'delillo', 'wallace', 
    'faulkner', 'musil', 'bernhard', 'bolaño', 'mann', 'dostoievski',
    'dostoyevsky', 'tolstoy', 'tolstói', 'melville', 'cervantes',
    'james', 'woolf', 'nabokov', 'beckett', 'kafka'
]

LIGHT_AUTHORS = [
    'agatha christie', 'christie', 'king', 'stephen king', 'grisham',
    'coelho', 'paulo coelho', 'follett', 'ken follett', 'brown', 'dan brown',
    'rowling', 'pratchett', 'dahl', 'roald dahl'
]

# Premios a detectar en tags
AWARDS_KEYWORDS = {
    'Nobel de Literatura': ['nobel', 'premio nobel'],
    'Pulitzer': ['pulitzer'],
    'Booker Prize': ['booker', 'man booker'],
    'Premio hispano importante': ['premio planeta', 'premio nadal', 'premio alfaguara', 
                                   'premio cervantes', 'premio herralde', 'premio biblioteca breve'],
    'Prix Goncourt': ['goncourt'],
    'Hugo Award': ['hugo award', 'premio hugo'],
    'Nebula Award': ['nebula'],
}


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE EXTRACCIÓN DE CALIBRE
# ═══════════════════════════════════════════════════════════════════════════════

def get_calibre_books_via_cli(calibre_path):
    """Extrae libros usando calibredb (CLI de Calibre)"""
    print("📚 Extrayendo libros de Calibre via CLI...")
    
    try:
        # Usar calibredb para exportar todos los libros como JSON
        result = subprocess.run([
            'calibredb', 'list',
            '--library-path', calibre_path,
            '--fields', 'id,title,authors,tags,series,series_index,publisher,pubdate,comments,cover,formats',
            '--for-machine'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"⚠️ Error con calibredb: {result.stderr}")
            return None
            
        books = json.loads(result.stdout)
        print(f"✅ Encontrados {len(books)} libros en Calibre")
        return books
        
    except FileNotFoundError:
        print("⚠️ calibredb no encontrado. Asegúrate de que Calibre esté instalado y en el PATH")
        return None
    except Exception as e:
        print(f"⚠️ Error: {e}")
        return None


def get_calibre_books_from_metadata(calibre_path):
    """Lee directamente los archivos metadata.opf de Calibre"""
    print("📚 Leyendo metadata directamente de Calibre...")
    
    calibre_path = Path(calibre_path)
    if not calibre_path.exists():
        print(f"❌ No se encontró la biblioteca en: {calibre_path}")
        return None
    
    books = []
    
    # Calibre organiza por Autor/Título/
    for author_dir in calibre_path.iterdir():
        if not author_dir.is_dir() or author_dir.name.startswith('.'):
            continue
            
        for book_dir in author_dir.iterdir():
            if not book_dir.is_dir():
                continue
                
            metadata_file = book_dir / 'metadata.opf'
            if metadata_file.exists():
                book = parse_opf_metadata(metadata_file, book_dir)
                if book:
                    books.append(book)
    
    print(f"✅ Encontrados {len(books)} libros en Calibre")
    return books


def fetch_pages_from_api(title, authors):
    """Busca páginas en Open Library y Google Books"""
    import urllib.request
    import urllib.parse
    
    author = authors[0] if authors else ''
    
    # Intentar Open Library primero
    try:
        query = f'{title} {author}'.strip()
        encoded_query = urllib.parse.quote(query)
        url = f'https://openlibrary.org/search.json?q={encoded_query}&limit=1&fields=number_of_pages_median'
        
        req = urllib.request.Request(url, headers={'User-Agent': 'CalibreSync/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if data.get('docs') and data['docs'][0].get('number_of_pages_median'):
            return data['docs'][0]['number_of_pages_median']
    except:
        pass
    
    # Intentar Google Books
    try:
        query = f'intitle:"{title}"'
        if author:
            query += f'+inauthor:"{author}"'
        encoded_query = urllib.parse.quote(query, safe=':+"')
        url = f'https://www.googleapis.com/books/v1/volumes?q={encoded_query}&maxResults=1'
        
        req = urllib.request.Request(url, headers={'User-Agent': 'CalibreSync/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if data.get('items'):
            pages = data['items'][0].get('volumeInfo', {}).get('pageCount')
            if pages:
                return pages
    except:
        pass
    
    return 0


def parse_opf_metadata(opf_path, book_dir):
    """Parsea un archivo metadata.opf de Calibre"""
    try:
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(opf_path)
        root = tree.getroot()
        
        # Namespaces de OPF
        ns = {
            'opf': 'http://www.idpf.org/2007/opf',
            'dc': 'http://purl.org/dc/elements/1.1/',
            'calibre': 'http://calibre.kovidgoyal.net/2009/metadata'
        }
        
        # Extraer datos
        title = root.find('.//dc:title', ns)
        title = title.text if title is not None else 'Sin título'
        
        authors = [a.text for a in root.findall('.//dc:creator', ns) if a.text]
        
        # Tags/subjects
        tags = [s.text.lower() for s in root.findall('.//dc:subject', ns) if s.text]
        
        # Descripción/sinopsis
        description = root.find('.//dc:description', ns)
        description = description.text if description is not None else ''
        
        # Fecha de publicación
        date = root.find('.//dc:date', ns)
        year = ''
        if date is not None and date.text:
            year = date.text[:4]
        
        # Serie (metadata de Calibre)
        series = None
        series_index = None
        pages_from_calibre = 0
        
        for meta in root.findall('.//opf:meta', ns):
            if meta.get('name') == 'calibre:series':
                series = meta.get('content')
            if meta.get('name') == 'calibre:series_index':
                try:
                    series_index = float(meta.get('content'))
                except:
                    pass
            # Buscar páginas en custom columns de Calibre
            if 'pages' in meta.get('name', '').lower() or 'paginas' in meta.get('name', '').lower():
                try:
                    pages_from_calibre = int(meta.get('content', 0))
                except:
                    pass
        
        # Buscar portada
        cover_path = None
        for f in book_dir.iterdir():
            if f.name.lower() in ['cover.jpg', 'cover.jpeg', 'cover.png']:
                cover_path = str(f)
                break
        
        # Páginas: prioridad Calibre > API > Estimación
        pages = pages_from_calibre
        
        if not pages:
            # Intentar desde API (solo si no hay muchos libros para no saturar)
            print(f"    🔍 Buscando páginas para: {title[:40]}...")
            pages = fetch_pages_from_api(title, authors)
        
        if not pages:
            # Fallback: estimar desde archivo
            for f in book_dir.iterdir():
                if f.suffix.lower() == '.epub':
                    pages = estimate_pages_from_epub(f)
                    break
                elif f.suffix.lower() == '.pdf':
                    pages = estimate_pages_from_pdf(f)
                    break
        
        if not pages:
            pages = 250  # Default final
        
        return {
            'calibre_id': int(book_dir.name.split('(')[-1].rstrip(')')) if '(' in book_dir.name else 0,
            'title': title,
            'authors': authors if authors else ['Desconocido'],
            'tags': tags,
            'series': series,
            'series_index': series_index,
            'description': description,
            'year': year,
            'pages': pages,
            'cover_path': cover_path,
            'book_dir': str(book_dir)
        }
        
    except Exception as e:
        print(f"⚠️ Error parseando {opf_path}: {e}")
        return None


def estimate_pages_from_epub(epub_path):
    """Estima páginas de un EPUB basándose en el tamaño"""
    try:
        size_kb = epub_path.stat().st_size / 1024
        # Aproximación: ~2KB por página (muy rough)
        return max(50, int(size_kb / 2))
    except:
        return 0


def estimate_pages_from_pdf(pdf_path):
    """Intenta obtener páginas de un PDF"""
    try:
        # Intentar con PyPDF2 si está disponible
        from PyPDF2 import PdfReader
        reader = PdfReader(str(pdf_path))
        return len(reader.pages)
    except:
        # Fallback: estimar por tamaño
        try:
            size_kb = pdf_path.stat().st_size / 1024
            return max(50, int(size_kb / 5))
        except:
            return 0


def load_json_export(json_path):
    """Carga un export JSON de Calibre"""
    print(f"📚 Cargando export JSON: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Normalizar formato (Calibre puede exportar de varias formas)
    if isinstance(data, list):
        books = data
    elif isinstance(data, dict) and 'books' in data:
        books = data['books']
    else:
        books = list(data.values()) if isinstance(data, dict) else []
    
    print(f"✅ Encontrados {len(books)} libros en el export")
    return books


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE TRANSFORMACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

def transform_to_nextread(calibre_book, new_id):
    """Transforma un libro de Calibre al formato NextRead"""
    
    # Extraer datos básicos
    title = calibre_book.get('title', calibre_book.get('t', 'Sin título'))
    authors = calibre_book.get('authors', calibre_book.get('a', ['Desconocido']))
    if isinstance(authors, str):
        authors = [authors]
    
    tags = calibre_book.get('tags', [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(',')]
    
    pages = calibre_book.get('pages', calibre_book.get('pg', 0))
    if not pages:
        pages = 250  # Default
    
    synopsis = calibre_book.get('description', calibre_book.get('comments', calibre_book.get('syn', '')))
    if synopsis:
        # Limpiar HTML
        synopsis = re.sub(r'<[^>]+>', '', synopsis)
        synopsis = synopsis.strip()
    
    year = calibre_book.get('year', calibre_book.get('pubdate', calibre_book.get('y', '')))
    if year and len(str(year)) > 4:
        year = str(year)[:4]
    
    series = calibre_book.get('series', calibre_book.get('s'))
    series_index = calibre_book.get('series_index', calibre_book.get('si'))
    
    # Calcular vibes desde tags
    vibes = calculate_vibes(tags)
    
    # Calcular dificultad
    difficulty = calculate_difficulty(pages, authors, tags)
    
    # Calcular horas de lectura
    hours = calculate_hours(pages, difficulty)
    
    # Calcular mood
    mood = calculate_mood(vibes, tags, synopsis)
    
    # Detectar premios
    awards = detect_awards(tags, title, authors)
    
    # Calcular pacing
    pacing = calculate_pacing(pages, vibes)
    
    return {
        'id': new_id,
        't': title,
        'a': authors,
        'v': vibes,
        's': series,
        'si': series_index,
        'd': difficulty,
        'p': pacing,
        'm': mood,
        'pg': pages,
        'h': hours,
        'aw': awards,
        'ac': 0,  # Accent color (se puede calcular de la portada)
        'syn': synopsis,
        'y': str(year) if year else '',
        'pv': False,  # Previously read
        'rh': hours * 0.9,  # Reading hours estimate
        '_calibre_id': calibre_book.get('calibre_id', calibre_book.get('id')),
        '_cover_path': calibre_book.get('cover_path', calibre_book.get('cover'))
    }


def calculate_vibes(tags):
    """Convierte tags de Calibre a vibes de NextRead"""
    vibes = set()
    
    for tag in tags:
        tag_lower = tag.lower().strip()
        
        # Buscar en mapeo directo
        if tag_lower in GENRE_TO_VIBE:
            vibes.add(GENRE_TO_VIBE[tag_lower])
        else:
            # Buscar coincidencias parciales
            for key, vibe in GENRE_TO_VIBE.items():
                if key in tag_lower or tag_lower in key:
                    vibes.add(vibe)
                    break
    
    # Default si no hay vibes
    if not vibes:
        vibes.add('ficción')
    
    return list(vibes)


def calculate_difficulty(pages, authors, tags):
    """Calcula la dificultad del libro"""
    
    # Verificar autores densos
    for author in authors:
        author_lower = author.lower()
        if any(dense in author_lower for dense in DENSE_AUTHORS):
            return 'denso'
        if any(light in author_lower for light in LIGHT_AUTHORS):
            if pages < 400:
                return 'ligero'
    
    # Por páginas
    if pages < 150:
        return 'ligero'
    elif pages < 350:
        return 'ligero' if 'juvenil' in tags or 'infantil' in tags else 'medio'
    elif pages < 600:
        # Verificar géneros densos
        dense_genres = ['filosófico', 'filosofía', 'ensayo', 'history', 'historia']
        if any(g in str(tags).lower() for g in dense_genres):
            return 'denso'
        return 'medio'
    else:
        return 'denso'


def calculate_hours(pages, difficulty):
    """Calcula horas estimadas de lectura"""
    if difficulty == 'ligero':
        pages_per_hour = 45
    elif difficulty == 'denso':
        pages_per_hour = 30
    else:
        pages_per_hour = 40
    
    return round(pages / pages_per_hour, 1)


def calculate_mood(vibes, tags, synopsis):
    """Determina el mood del libro"""
    
    # Keywords para cada mood
    mood_keywords = {
        'tenso': ['thriller', 'suspense', 'misterio', 'crimen', 'asesino', 'muerte'],
        'emotivo': ['amor', 'familia', 'pérdida', 'drama', 'corazón', 'lágrimas'],
        'reflexivo': ['filosofía', 'ensayo', 'reflexión', 'vida', 'existencia'],
        'inmersivo': ['mundo', 'épico', 'saga', 'universo', 'aventura'],
        'ligero': ['humor', 'comedia', 'divertido', 'risa'],
        'oscuro': ['horror', 'terror', 'gótico', 'oscuro', 'siniestro'],
        'íntimo': ['memorias', 'autobiografía', 'personal', 'confesión'],
        'imaginativo': ['fantasía', 'magia', 'dragón', 'hechizo'],
        'especulativo': ['ciencia ficción', 'futuro', 'distopía', 'tecnología'],
        'inquietante': ['psicológico', 'perturbador', 'mente', 'locura'],
        'entretenido': ['aventura', 'acción', 'emocionante']
    }
    
    all_text = ' '.join(vibes + tags + [synopsis.lower()])
    
    mood_scores = {}
    for mood, keywords in mood_keywords.items():
        score = sum(1 for kw in keywords if kw in all_text)
        if score > 0:
            mood_scores[mood] = score
    
    if mood_scores:
        return max(mood_scores, key=mood_scores.get)
    
    return 'emotivo'  # Default


def calculate_pacing(pages, vibes):
    """Determina el ritmo del libro"""
    
    fast_vibes = ['intriga', 'aventura', 'policial', 'acción']
    slow_vibes = ['filosófico', 'ensayo', 'poesía', 'reflexivo']
    
    if any(v in fast_vibes for v in vibes):
        return 'rápido'
    elif any(v in slow_vibes for v in vibes):
        return 'lento'
    elif pages > 500:
        return 'lento'
    elif pages < 200:
        return 'rápido'
    
    return 'medio'


def detect_awards(tags, title, authors):
    """Detecta premios literarios"""
    awards = set()
    
    all_text = ' '.join(tags + [title] + authors).lower()
    
    for award, keywords in AWARDS_KEYWORDS.items():
        if any(kw in all_text for kw in keywords):
            awards.add(award)
    
    return list(awards)


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE MERGE Y ACTUALIZACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

def load_existing_library(path):
    """Carga la biblioteca existente de NextRead"""
    biblioteca_path = Path(path) / 'biblioteca_app.json'
    
    if biblioteca_path.exists():
        with open(biblioteca_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def find_duplicates(existing_books, new_book):
    """Busca si un libro ya existe en la biblioteca"""
    
    new_title = new_book['t'].lower().strip()
    new_authors = [a.lower() for a in new_book['a']]
    
    for existing in existing_books:
        existing_title = existing['t'].lower().strip()
        existing_authors = [a.lower() for a in existing.get('a', [])]
        
        # Match por título similar y mismo autor
        if similar_strings(new_title, existing_title) > 0.85:
            if any(a in existing_authors for a in new_authors):
                return existing
    
    return None


def similar_strings(s1, s2):
    """Calcula similitud entre dos strings (0-1)"""
    if not s1 or not s2:
        return 0
    
    # Normalizar
    s1 = s1.lower().strip()
    s2 = s2.lower().strip()
    
    if s1 == s2:
        return 1.0
    
    # Similitud por caracteres comunes
    set1 = set(s1.split())
    set2 = set(s2.split())
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0


def merge_libraries(existing, new_books):
    """Merge la biblioteca existente con los nuevos libros"""
    
    # Crear índice por ID
    existing_by_id = {b['id']: b for b in existing}
    max_id = max(b['id'] for b in existing) if existing else 0
    
    added = []
    updated = []
    skipped = []
    
    for new_book in new_books:
        duplicate = find_duplicates(existing, new_book)
        
        if duplicate:
            # Actualizar libro existente (mantener ID)
            new_book['id'] = duplicate['id']
            # Mantener datos que no queremos sobrescribir
            new_book['pv'] = duplicate.get('pv', False)
            if 'hook' in duplicate:
                new_book['hook'] = duplicate['hook']
                new_book['themes'] = duplicate.get('themes', [])
                new_book['experience'] = duplicate.get('experience', '')
            existing_by_id[duplicate['id']] = new_book
            updated.append(new_book['t'])
        else:
            # Nuevo libro
            max_id += 1
            new_book['id'] = max_id
            existing_by_id[max_id] = new_book
            added.append(new_book['t'])
    
    merged = list(existing_by_id.values())
    
    return merged, added, updated, skipped


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE PORTADAS
# ═══════════════════════════════════════════════════════════════════════════════

def copy_covers(books, output_path):
    """Copia las portadas de los libros al directorio de portadas"""
    
    # Validar que output_path esté dentro del directorio actual para prevenir path traversal
    portadas_dir = Path(output_path).resolve()
    base_dir = Path.cwd().resolve()

    if not portadas_dir.is_relative_to(base_dir):
        print(f"⚠️ Error de seguridad: El directorio de portadas '{output_path}' está fuera del límite permitido.")
        return 0, [b.get('t', 'Desconocido') for b in books]

    portadas_dir.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    missing = []
    
    for book in books:
        cover_src = book.get('_cover_path')
        if cover_src and Path(cover_src).exists():
            # Construir ruta de destino de forma segura
            safe_id = str(book['id']).replace('/', '').replace('\\', '').replace('..', '')
            cover_dst = portadas_dir / f"{safe_id}.jpg"

            # Verificación adicional de seguridad contra path traversal
            if not cover_dst.resolve().is_relative_to(portadas_dir.resolve()):
                print(f"⚠️ Alerta de seguridad: Intento de path traversal detectado para el libro {book.get('t', 'Desconocido')} (id: {book.get('id')})")
                missing.append(book['t'])
                continue
            
            try:
                # Copiar y redimensionar si es necesario
                shutil.copy2(cover_src, cover_dst)
                copied += 1
            except Exception as e:
                print(f"⚠️ Error copiando portada de {book['t']}: {e}")
                missing.append(book['t'])
        else:
            missing.append(book['t'])
    
    return copied, missing


# ═══════════════════════════════════════════════════════════════════════════════
# GENERACIÓN DE HOOKS (BÁSICO)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_basic_hook(book):
    """Genera un hook básico para un libro (se puede mejorar con IA)"""
    
    title = book['t']
    authors = book['a']
    synopsis = book.get('syn', '')
    vibes = book.get('v', [])
    
    # Hook básico basado en sinopsis
    if synopsis and len(synopsis) > 100:
        # Tomar primera oración significativa
        sentences = synopsis.split('.')
        for sent in sentences:
            if len(sent) > 50:
                return sent.strip() + '.'
    
    # Fallback por género
    genre_hooks = {
        'histórico': f"Una inmersión en el pasado que ilumina el presente.",
        'intriga': f"Un misterio que no podrás soltar hasta la última página.",
        'fantasía': f"Un mundo imaginario que cobra vida con cada página.",
        'ciencia ficción': f"Una visión del futuro que cuestiona el presente.",
        'romántico': f"Una historia de amor que toca el corazón.",
        'filosófico': f"Una reflexión profunda sobre la existencia.",
    }
    
    for vibe in vibes:
        if vibe in genre_hooks:
            return genre_hooks[vibe]
    
    return f"Una obra de {', '.join(authors)} que merece ser descubierta."


def generate_hooks_for_new_books(books, existing_hooks):
    """Genera hooks para libros que no tienen"""
    
    new_hooks = dict(existing_hooks)
    generated = 0
    
    for book in books:
        book_id = str(book['id'])
        if book_id not in new_hooks:
            # Generar hook básico
            hook = generate_basic_hook(book)
            new_hooks[book_id] = {
                'hook': hook,
                'themes': [],  # Se pueden añadir manualmente después
                'experience': book.get('m', 'emotivo'),
                'perfect_for': '',
                'why_matters': ''
            }
            generated += 1
    
    return new_hooks, generated


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Sincroniza tu biblioteca de Calibre con NextRead',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python calibre_sync.py --calibre-path "/Users/tu/Calibre Library"
  python calibre_sync.py --json-export "./calibre_export.json"
  python calibre_sync.py --calibre-path "/path" --generate-hooks
        """
    )
    
    parser.add_argument('--calibre-path', type=str, default=DEFAULT_CALIBRE_PATH,
                        help='Ruta a tu biblioteca de Calibre')
    parser.add_argument('--json-export', type=str,
                        help='Ruta a un export JSON de Calibre')
    parser.add_argument('--output', type=str, default=NEXTREAD_PUBLIC_PATH,
                        help='Directorio de salida (default: ./public)')
    parser.add_argument('--generate-hooks', action='store_true',
                        help='Generar hooks básicos para libros nuevos')
    parser.add_argument('--copy-covers', action='store_true',
                        help='Copiar portadas al directorio de portadas')
    parser.add_argument('--dry-run', action='store_true',
                        help='Solo mostrar qué se haría, sin modificar archivos')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("   NEXTREAD - Sincronización con Calibre")
    print("=" * 70)
    print()
    
    # 1. Cargar libros de Calibre
    if args.json_export:
        calibre_books = load_json_export(args.json_export)
    else:
        # Intentar primero con CLI, luego directo
        calibre_books = get_calibre_books_via_cli(args.calibre_path)
        if calibre_books is None:
            calibre_books = get_calibre_books_from_metadata(args.calibre_path)
    
    if not calibre_books:
        print("❌ No se pudieron cargar libros de Calibre")
        return 1
    
    # 2. Cargar biblioteca existente
    print("\n📖 Cargando biblioteca NextRead existente...")
    existing_books = load_existing_library(args.output)
    print(f"   Libros existentes: {len(existing_books)}")
    
    # 3. Transformar libros de Calibre
    print("\n🔄 Transformando libros al formato NextRead...")
    max_existing_id = max(b['id'] for b in existing_books) if existing_books else 0
    
    transformed_books = []
    for i, book in enumerate(calibre_books):
        transformed = transform_to_nextread(book, max_existing_id + i + 1)
        transformed_books.append(transformed)
    
    print(f"   Libros transformados: {len(transformed_books)}")
    
    # 4. Merge
    print("\n🔀 Haciendo merge de bibliotecas...")
    merged, added, updated, skipped = merge_libraries(existing_books, transformed_books)
    
    print(f"   📚 Total final: {len(merged)} libros")
    print(f"   ✅ Añadidos: {len(added)}")
    print(f"   🔄 Actualizados: {len(updated)}")
    
    if added:
        print("\n   Libros nuevos:")
        for title in added[:10]:
            print(f"      + {title}")
        if len(added) > 10:
            print(f"      ... y {len(added) - 10} más")
    
    # 5. Dry run o guardar
    if args.dry_run:
        print("\n🔍 DRY RUN - No se guardaron cambios")
        return 0
    
    # Guardar biblioteca
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)
    
    biblioteca_path = output_path / 'biblioteca_app.json'
    with open(biblioteca_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Biblioteca guardada en: {biblioteca_path}")
    
    # 6. Copiar portadas si se solicita
    if args.copy_covers:
        print("\n🖼️ Copiando portadas...")
        portadas_path = output_path / 'portadas'
        copied, missing = copy_covers(merged, portadas_path)
        print(f"   Copiadas: {copied}")
        print(f"   Sin portada: {len(missing)}")
    
    # 7. Generar hooks si se solicita
    if args.generate_hooks:
        print("\n✨ Generando hooks básicos...")
        
        # Cargar hooks existentes
        hooks_path = output_path / 'hooks.json'
        existing_hooks = {}
        if hooks_path.exists():
            with open(hooks_path, 'r', encoding='utf-8') as f:
                existing_hooks = json.load(f)
        
        new_hooks, generated = generate_hooks_for_new_books(merged, existing_hooks)
        
        with open(hooks_path, 'w', encoding='utf-8') as f:
            json.dump(new_hooks, f, ensure_ascii=False, indent=2)
        
        print(f"   Hooks generados: {generated}")
        print(f"   Total hooks: {len(new_hooks)}")
    
    print("\n" + "=" * 70)
    print("   ✅ Sincronización completada")
    print("=" * 70)
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
