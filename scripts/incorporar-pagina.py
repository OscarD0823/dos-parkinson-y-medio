"""Incorpora una imagen revisada sin alterar las demás páginas publicadas."""
from pathlib import Path
from PIL import Image
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('chapter', type=int)
parser.add_argument('page', type=int)
parser.add_argument('image', type=Path)
parser.add_argument('--transcript', type=Path)
args = parser.parse_args()
manifest_path = ROOT / 'dist/data/libro.json'
book = json.loads(manifest_path.read_text(encoding='utf-8'))
chapter = next(c for c in book['chapters'] if c['number'] == args.chapter)
if not 1 <= args.page <= chapter['plannedPages']:
    raise SystemExit('Número de página fuera del capítulo')
if args.page > len(chapter['pages']) + 1:
    raise SystemExit('Hay un hueco en la secuencia. No publicar fuera de orden.')
image = Image.open(args.image)
image.load()
if image.width < 1024 or image.height < 1024:
    raise SystemExit('Resolución insuficiente')
filename = f'c{args.chapter:02d}-p{args.page:03d}.webp'
target = ROOT / 'dist/paginas' / filename
image.save(target, format='WEBP', quality=92, method=6)
entry = {'number': args.page, 'image': 'paginas/' + filename, 'width': image.width, 'height': image.height, 'alt': f'Capítulo {args.chapter}: {chapter["title"]}. Página {args.page} del cómic.'}
if args.transcript:
    entry['transcript'] = args.transcript.read_text(encoding='utf-8').strip()
chapter['pages'] = sorted([p for p in chapter['pages'] if p['number'] != args.page] + [entry], key=lambda p: p['number'])
manifest_path.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
plan_path = ROOT / '.local/plan.json'
if plan_path.exists():
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    for job in plan['jobs']:
        if job['chapter'] == args.chapter and job['page'] == args.page:
            job['status'] = 'illustrated-reviewed'
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'chapter': args.chapter, 'page': args.page, 'publishedPages': len(chapter['pages']), 'bytes': target.stat().st_size}))
