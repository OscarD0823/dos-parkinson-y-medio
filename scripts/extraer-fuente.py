"""Inventaría los PDF y extrae una sola copia para trabajo editorial local."""
from pathlib import Path
from pypdf import PdfReader
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / '.local'
LOCAL.mkdir(exist_ok=True)
manifest_path = ROOT / 'dist/data/libro.json'
previous_book = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {'chapters': []}
previous_pages = {c['number']: c.get('pages', []) for c in previous_book['chapters']}
plan_path = LOCAL / 'plan.json'
previous_plan = json.loads(plan_path.read_text(encoding='utf-8')) if plan_path.exists() else {'jobs': []}
previous_status = {j['id']: j.get('status') for j in previous_plan['jobs']}
sources = sorted(ROOT.parent.glob('cap*.pdf'))
hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}
if len(set(hashes.values())) != 1:
    raise SystemExit('Las fuentes difieren: revisar antes de elegir un manuscrito.')
reader = PdfReader(sources[0])
pages = [p.extract_text() or '' for p in reader.pages]
starts = []
for i, text in enumerate(pages):
    for match in re.finditer(r'(?m)^Chapter (\d+): (.+)', text):
        starts.append((int(match[1]), match[2].strip(), i))
chapters = []
jobs = []
for index, (number, title, start) in enumerate(starts):
    end = starts[index + 1][2] if index + 1 < len(starts) else len(pages)
    text = '\n\n'.join(pages[start:end])
    text = re.sub(r'^Chapter \d+: .+\n', '', text, count=1)
    paragraphs = [re.sub(r'\s*\n\s*', ' ', p).strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    paragraphs = [p for p in paragraphs if not re.fullmatch(r'[HP\s•]+', p)]
    clean = '\n\n'.join(paragraphs)
    (LOCAL / f'capitulo-{number:02d}.txt').write_text(clean, encoding='utf-8')
    chunks, current = [], []
    for paragraph in paragraphs:
        if current and len(' '.join(current).split()) + len(paragraph.split()) > 420:
            chunks.append('\n\n'.join(current))
            current = []
        current.append(paragraph)
    if current:
        chunks.append('\n\n'.join(current))
    if len(chunks) > 1 and len(chunks[-1].split()) < 120:
        chunks[-2] += '\n\n' + chunks.pop()
    chapters.append({'number': number, 'title': title, 'sourcePages': [start + 1, end], 'words': len(clean.split()), 'plannedPages': len(chunks), 'pages': previous_pages.get(number, [])})
    for page, chunk in enumerate(chunks, 1):
        job_id = f'c{number:02d}-p{page:03d}'
        jobs.append({'id': job_id, 'chapter': number, 'page': page, 'source': chunk, 'status': previous_status.get(job_id) or 'pending-editorial-review'})
manifest = {'title': 'Dos Parkinson y Medio', 'author': 'Nicole_Winkel', 'originalUrl': 'https://archiveofourown.org/works/54184711', 'adaptation': 'Adaptación ilustrada no oficial. Escenas íntimas con elipsis.', 'chapters': chapters}
(ROOT / 'dist/data/libro.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
(LOCAL / 'plan.json').write_text(json.dumps({'sourceHashes': hashes, 'sourcePages': len(pages), 'jobs': jobs}, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'docs/FUENTE.md').write_text('# Fuente y alcance\n\nObra: **Dos Parkinson y Medio**, de **Nicole_Winkel**.\n\nOriginal: https://archiveofourown.org/works/54184711\n\nLos trece PDF locales tienen el mismo SHA-256 y contienen el mismo libro de 744 páginas. Se usa una sola copia; los originales se conservan. El manuscrito de trabajo permanece en `.local/`, excluido de Git.\n\nEl lector muestra únicamente páginas ilustradas generadas y revisadas. La preparación del guion no significa que un capítulo esté dibujado.\n', encoding='utf-8')
print(json.dumps({'chapters': len(chapters), 'words': sum(c['words'] for c in chapters), 'plannedPages': len(jobs), 'chapter1': chapters[0]}, ensure_ascii=True))
