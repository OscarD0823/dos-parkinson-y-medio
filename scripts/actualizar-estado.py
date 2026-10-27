"""Actualiza la tabla pública de páginas realmente incorporadas."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
book = json.loads((ROOT / 'dist/data/libro.json').read_text(encoding='utf-8'))
lines = [
    '# Estado de la adaptación', '',
    'La obra tiene 13 capítulos originales. Las páginas previstas son una estimación que se ajusta tras la revisión editorial. Solo se cuentan como ilustradas las imágenes revisadas e incorporadas al lector.', '',
    '| Capítulo | Título | Páginas previstas | Ilustradas |',
    '| --- | --- | ---: | ---: |',
]
for c in book['chapters']:
    lines.append(f'| {c["number"]} | {c["title"]} | {c["plannedPages"]} | {len(c["pages"])} |')
lines += ['', 'Herramienta: ImageGen integrada. Las imágenes publicadas se revisan antes de incorporarlas. La portada no cuenta como página de capítulo.', '']
(ROOT / 'docs/ESTADO.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({'chapters': len(book['chapters']), 'planned': sum(c['plannedPages'] for c in book['chapters']), 'illustrated': sum(len(c['pages']) for c in book['chapters'])}))
