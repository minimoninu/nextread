#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║              CALIBRE ENRICHER - Enriquece tu biblioteca                       ║
║           Añade páginas, géneros y sinopsis desde APIs públicas               ║
╚══════════════════════════════════════════════════════════════════════════════╝

USO:
    python3 calibre_enricher.py --calibre-db "/ruta/a/Calibre/metadata.db"
    
    O para tu biblioteca:
    python3 calibre_enricher.py --calibre-db "/Users/kemberly/Documents/Calibre/metadata.db"

OPCIONES:
    --calibre-db    Ruta al archivo metadata.db de Calibre
    --limit N       Solo procesar los primeros N libros (para probar)
    --only-missing  Solo enriquecer libros que les falte metadata
    --dry-run       Solo mostrar qué se haría, sin modificar

APIS USADAS:
    - Open Library (openlibrary.org) - Gratis, sin límites
    - Google Books API - Gratis para uso básico

IMPORTANTE:
    Cierra Calibre antes de ejecutar este script.
"""

import sqlite3
import urllib.request
import urllib.parse
import json
import time
import argparse
import sys
from pathlib import Path
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════════════
# MAPEO DE GÉNEROS INGLÉS → ESPAÑOL
# ═══════════════════════════════════════════════════════════════════════════════

GENRE_MAPPING = {
    # Ficción
    'fiction': 'Ficción',
    'literary fiction': 'Ficción literaria',
    'novels': 'Novela',
    'novel': 'Novela',
    
    # Misterio/Thriller
    'mystery': 'Misterio',
    'thriller': 'Thriller',
    'suspense': 'Suspense',
    'crime': 'Crimen',
    'detective': 'Policial',
    'noir': 'Noir',
    'crime fiction': 'Policial',
    
    # Fantasía/Sci-Fi
    'science fiction': 'Ciencia ficción',
    'sci-fi': 'Ciencia ficción',
    'fantasy': 'Fantasía',
    'epic fantasy': 'Fantasía épica',
    'urban fantasy': 'Fantasía urbana',
    'horror': 'Terror',
    'gothic': 'Gótico',
    'supernatural': 'Sobrenatural',
    
    # Romance/Drama
    'romance': 'Romance',
    'romantic fiction': 'Romance',
    'drama': 'Drama',
    'family': 'Familia',
    
    # Histórico
    'historical fiction': 'Ficción histórica',
    'historical': 'Histórico',
    'history': 'Historia',
    'war': 'Guerra',
    'world war': 'Guerra Mundial',
    'military': 'Militar',
    
    # Biografía/Memorias
    'biography': 'Biografía',
    'autobiography': 'Autobiografía',
    'memoir': 'Memorias',
    'memoirs': 'Memorias',
    'biography & autobiography': 'Biografía',
    
    # No ficción
    'non-fiction': 'No ficción',
    'nonfiction': 'No ficción',
    'essays': 'Ensayo',
    'essay': 'Ensayo',
    'philosophy': 'Filosofía',
    'psychology': 'Psicología',
    'science': 'Ciencia',
    'social science': 'Ciencias sociales',
    'politics': 'Política',
    'economics': 'Economía',
    
    # Arte/Cultura
    'poetry': 'Poesía',
    'art': 'Arte',
    'music': 'Música',
    'literary criticism': 'Crítica literaria',
    'literature': 'Literatura',
    
    # Otros
    'short stories': 'Relatos cortos',
    'young adult': 'Juvenil',
    'children': 'Infantil',
    "children's": 'Infantil',
    'adventure': 'Aventura',
    'humor': 'Humor',
    'satire': 'Sátira',
    'comedy': 'Comedia',
    'classics': 'Clásico',
    'classic literature': 'Clásico',
    'travel': 'Viajes',
    'self-help': 'Autoayuda',
    'cooking': 'Cocina',
    'sports': 'Deportes',
    
    # Español directo
    'ficción': 'Ficción',
    'novela': 'Novela',
    'misterio': 'Misterio',
    'fantasía': 'Fantasía',
    'terror': 'Terror',
    'romance': 'Romance',
    'histórico': 'Histórico',
    'biografía': 'Biografía',
    'ensayo': 'Ensayo',
    'poesía': 'Poesía',
}

# Géneros a ignorar (muy genéricos)
IGNORE_GENRES = {
    'accessible book', 'protected daisy', 'in library', 'lending library',
    'overdrive', 'large type books', 'fiction, general', 'general',
    'literary collections', 'audiobook'
}


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE API
# ═══════════════════════════════════════════════════════════════════════════════

def search_open_library(title, authors):
    """Busca en Open Library API"""
    try:
        author = authors[0] if authors else ''
        query = f'{title} {author}'.strip()
        encoded_query = urllib.parse.quote(query)
        
        url = f'https://openlibrary.org/search.json?q={encoded_query}&limit=3&fields=key,title,author_name,number_of_pages_median,subject,first_publish_year'
        
        req = urllib.request.Request(url, headers={
            'User-Agent': 'CalibreEnricher/1.0 (https://github.com/nextread)'
        })
        
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if not data.get('docs'):
            return None
        
        # Buscar mejor match
        for doc in data['docs']:
            doc_title = doc.get('title', '').lower()
            if title.lower() in doc_title or doc_title in title.lower():
                subjects = doc.get('subject', [])
                # Filtrar y limpiar géneros
                genres = []
                for s in subjects[:15]:
                    s_lower = s.lower()
                    if s_lower not in IGNORE_GENRES and len(s) < 50:
                        genres.append(s)
                
                return {
                    'pages': doc.get('number_of_pages_median'),
                    'genres': genres[:8],
                    'year': doc.get('first_publish_year'),
                    'work_key': doc.get('key')
                }
        
        # Si no hay match exacto, usar el primero
        doc = data['docs'][0]
        subjects = doc.get('subject', [])
        genres = [s for s in subjects[:15] if s.lower() not in IGNORE_GENRES and len(s) < 50]
        
        return {
            'pages': doc.get('number_of_pages_median'),
            'genres': genres[:8],
            'year': doc.get('first_publish_year'),
            'work_key': doc.get('key')
        }
        
    except Exception as e:
        print(f'    ⚠️ Error Open Library: {e}')
        return None


def get_open_library_description(work_key):
    """Obtiene descripción de Open Library"""
    try:
        url = f'https://openlibrary.org{work_key}.json'
        req = urllib.request.Request(url, headers={
            'User-Agent': 'CalibreEnricher/1.0'
        })
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        desc = data.get('description')
        if isinstance(desc, dict):
            desc = desc.get('value', '')
        
        return desc if desc and len(desc) > 50 else None
        
    except:
        return None


def search_google_books(title, authors):
    """Busca en Google Books API"""
    try:
        author = authors[0] if authors else ''
        
        # Construir query
        query_parts = [f'intitle:"{title}"']
        if author:
            query_parts.append(f'inauthor:"{author}"')
        query = '+'.join(query_parts)
        
        encoded_query = urllib.parse.quote(query, safe=':+"')
        url = f'https://www.googleapis.com/books/v1/volumes?q={encoded_query}&maxResults=3&langRestrict=es'
        
        req = urllib.request.Request(url, headers={
            'User-Agent': 'CalibreEnricher/1.0'
        })
        
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        if not data.get('items'):
            # Intentar sin restricción de idioma
            url = f'https://www.googleapis.com/books/v1/volumes?q={encoded_query}&maxResults=3'
            req = urllib.request.Request(url, headers={'User-Agent': 'CalibreEnricher/1.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
        
        if not data.get('items'):
            return None
        
        # Tomar el mejor resultado
        for item in data['items']:
            info = item.get('volumeInfo', {})
            item_title = info.get('title', '').lower()
            
            if title.lower() in item_title or item_title in title.lower():
                return {
                    'pages': info.get('pageCount'),
                    'genres': info.get('categories', []),
                    'description': info.get('description'),
                    'year': info.get('publishedDate', '')[:4] if info.get('publishedDate') else None
                }
        
        # Usar el primero si no hay match exacto
        info = data['items'][0].get('volumeInfo', {})
        return {
            'pages': info.get('pageCount'),
            'genres': info.get('categories', []),
            'description': info.get('description'),
            'year': info.get('publishedDate', '')[:4] if info.get('publishedDate') else None
        }
        
    except Exception as e:
        print(f'    ⚠️ Error Google Books: {e}')
        return None


def translate_genre(genre):
    """Traduce un género al español"""
    genre_lower = genre.lower().strip()
    
    # Buscar match exacto
    if genre_lower in GENRE_MAPPING:
        return GENRE_MAPPING[genre_lower]
    
    # Buscar match parcial
    for key, value in GENRE_MAPPING.items():
        if key in genre_lower or genre_lower in key:
            return value
    
    # Si no hay traducción, capitalizar
    return genre.title()


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE BASE DE DATOS CALIBRE
# ═══════════════════════════════════════════════════════════════════════════════

def get_books_from_calibre(db_path, only_missing=False):
    """Lee libros de la base de datos de Calibre"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Query para obtener libros con sus autores y tags
    query = '''
        SELECT 
            b.id,
            b.title,
            b.pubdate,
            GROUP_CONCAT(DISTINCT a.name) as authors,
            GROUP_CONCAT(DISTINCT t.name) as tags,
            c.text as comments
        FROM books b
        LEFT JOIN books_authors_link bal ON b.id = bal.book
        LEFT JOIN authors a ON bal.author = a.id
        LEFT JOIN books_tags_link btl ON b.id = btl.book
        LEFT JOIN tags t ON btl.tag = t.id
        LEFT JOIN comments c ON b.id = c.book
        GROUP BY b.id
    '''
    
    cursor.execute(query)
    books = []
    
    for row in cursor.fetchall():
        book = {
            'id': row['id'],
            'title': row['title'],
            'authors': row['authors'].split(',') if row['authors'] else [],
            'tags': row['tags'].split(',') if row['tags'] else [],
            'comments': row['comments'] or '',
            'pubdate': row['pubdate']
        }
        
        # Filtrar si solo queremos los que faltan metadata
        if only_missing:
            has_tags = len(book['tags']) > 2
            has_comments = len(book['comments']) > 100
            if has_tags and has_comments:
                continue
        
        books.append(book)
    
    conn.close()
    return books


def update_book_tags(db_path, book_id, new_tags):
    """Añade tags a un libro en Calibre"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for tag_name in new_tags:
        tag_name = tag_name.strip()
        if not tag_name:
            continue
            
        # Buscar o crear tag
        cursor.execute('SELECT id FROM tags WHERE name = ?', (tag_name,))
        result = cursor.fetchone()
        
        if result:
            tag_id = result[0]
        else:
            cursor.execute('INSERT INTO tags (name) VALUES (?)', (tag_name,))
            tag_id = cursor.lastrowid
        
        # Verificar si ya está asociado
        cursor.execute(
            'SELECT 1 FROM books_tags_link WHERE book = ? AND tag = ?',
            (book_id, tag_id)
        )
        
        if not cursor.fetchone():
            cursor.execute(
                'INSERT INTO books_tags_link (book, tag) VALUES (?, ?)',
                (book_id, tag_id)
            )
    
    conn.commit()
    conn.close()


def update_book_comments(db_path, book_id, comments):
    """Actualiza la sinopsis de un libro"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Verificar si ya existe
    cursor.execute('SELECT id FROM comments WHERE book = ?', (book_id,))
    result = cursor.fetchone()
    
    if result:
        cursor.execute('UPDATE comments SET text = ? WHERE book = ?', (comments, book_id))
    else:
        cursor.execute('INSERT INTO comments (book, text) VALUES (?, ?)', (book_id, comments))
    
    conn.commit()
    conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# FUNCIÓN PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Enriquece la metadata de tu biblioteca de Calibre',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Ejemplos:
  python3 calibre_enricher.py --calibre-db "/Users/kemberly/Documents/Calibre/metadata.db"
  python3 calibre_enricher.py --calibre-db "metadata.db" --only-missing
  python3 calibre_enricher.py --calibre-db "metadata.db" --limit 10 --dry-run
        '''
    )
    
    parser.add_argument('--calibre-db', required=True,
                        help='Ruta al archivo metadata.db de Calibre')
    parser.add_argument('--limit', type=int, default=0,
                        help='Limitar a N libros (0 = todos)')
    parser.add_argument('--only-missing', action='store_true',
                        help='Solo procesar libros con metadata incompleta')
    parser.add_argument('--dry-run', action='store_true',
                        help='Solo mostrar qué se haría, sin modificar')
    
    args = parser.parse_args()
    
    db_path = Path(args.calibre_db)
    if not db_path.exists():
        print(f'❌ No se encontró: {db_path}')
        return 1
    
    print('=' * 70)
    print('   CALIBRE ENRICHER - Enriqueciendo tu biblioteca')
    print('=' * 70)
    print(f'\n📂 Base de datos: {db_path}')
    
    if args.dry_run:
        print('🔍 MODO DRY-RUN - No se modificará nada')
    
    print('\n⚠️  IMPORTANTE: Asegúrate de que Calibre esté cerrado\n')
    
    # Cargar libros
    print('📚 Cargando libros...')
    books = get_books_from_calibre(db_path, args.only_missing)
    
    if args.limit > 0:
        books = books[:args.limit]
    
    print(f'   Libros a procesar: {len(books)}')
    
    # Procesar cada libro
    enriched = 0
    errors = 0
    
    for i, book in enumerate(books, 1):
        title = book['title']
        authors = book['authors']
        current_tags = set(book['tags'])
        has_comments = len(book['comments']) > 100
        
        print(f'\n[{i}/{len(books)}] 📖 {title}')
        print(f'         Autor: {", ".join(authors) if authors else "Desconocido"}')
        print(f'         Tags actuales: {len(current_tags)}')
        
        # Buscar en APIs
        print('         🔍 Buscando en Open Library...')
        ol_data = search_open_library(title, authors)
        
        time.sleep(0.3)  # Pausa entre requests
        
        print('         🔍 Buscando en Google Books...')
        gb_data = search_google_books(title, authors)
        
        # Combinar resultados
        pages = ol_data.get('pages') if ol_data else None
        pages = pages or (gb_data.get('pages') if gb_data else None)
        
        genres = []
        if ol_data and ol_data.get('genres'):
            genres.extend(ol_data['genres'])
        if gb_data and gb_data.get('genres'):
            genres.extend(gb_data['genres'])
        
        description = None
        if not has_comments:
            if gb_data and gb_data.get('description'):
                description = gb_data['description']
            elif ol_data and ol_data.get('work_key'):
                print('         🔍 Buscando descripción...')
                description = get_open_library_description(ol_data['work_key'])
        
        # Traducir y filtrar géneros
        new_tags = set()
        for genre in genres:
            translated = translate_genre(genre)
            if translated and translated not in current_tags:
                new_tags.add(translated)
        
        # Mostrar resultados
        if pages:
            print(f'         📄 Páginas: {pages}')
        if new_tags:
            print(f'         🏷️  Nuevos tags: {", ".join(list(new_tags)[:5])}{"..." if len(new_tags) > 5 else ""}')
        if description:
            print(f'         📝 Sinopsis: {description[:80]}...')
        
        # Aplicar cambios
        if not args.dry_run:
            try:
                if new_tags:
                    update_book_tags(db_path, book['id'], new_tags)
                
                if description:
                    update_book_comments(db_path, book['id'], description)
                
                if new_tags or description:
                    enriched += 1
                    print('         ✅ Actualizado')
                else:
                    print('         ⏭️  Sin cambios necesarios')
                    
            except Exception as e:
                print(f'         ❌ Error: {e}')
                errors += 1
        else:
            if new_tags or description:
                print('         🔍 [dry-run] Se actualizaría')
        
        # Pausa para no saturar APIs
        time.sleep(0.5)
    
    # Resumen
    print('\n' + '=' * 70)
    print('   RESUMEN')
    print('=' * 70)
    print(f'   📚 Procesados: {len(books)}')
    print(f'   ✅ Enriquecidos: {enriched}')
    print(f'   ❌ Errores: {errors}')
    
    if not args.dry_run and enriched > 0:
        print('\n   💡 Abre Calibre para ver los cambios.')
        print('   💡 Luego ejecuta calibre_sync.py para sincronizar con NextRead.')
    
    print('=' * 70)
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
