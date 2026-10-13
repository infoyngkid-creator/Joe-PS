"""Macht aus dem Lauf-Video (assets/gen/joe/j2-walk.mp4) eine nahtlose, freigestellte
Schrittschleife als Sprite-Atlas für die 3D-Bühne.

Aufruf (im Projektordner):
    pip install "rembg[cpu]" pillow numpy   # ffmpeg muss installiert sein
    python3 scripts/lauf-frames.py

Ergebnis: assets/img/joe/walk-atlas.webp (COLS × ROWS Kacheln, Reihenfolge zeilenweise)
          assets/img/joe/walk-atlas.json (Kachelgröße, Anzahl, Fußpunkt)

Die Schleife (START, LEN) wurde per Bildvergleich gesucht: Frame START und START+LEN
sehen fast gleich aus, also läuft die Schleife ohne Sprung.
"""
import json, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image
import onnxruntime as ort
from rembg import new_session, remove

VIDEO = 'assets/gen/joe/j2-walk.mp4'
START, LEN = 73, 46          # 1-basiert wie ffmpeg-Dateinamen
CELL_H = 480
COLS = 8
OUT = Path('assets/img/joe')
OUT.mkdir(parents=True, exist_ok=True)

tmp = Path(tempfile.mkdtemp())
subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, str(tmp / 'f%03d.png')], check=True)
opts = ort.SessionOptions()
opts.enable_cpu_mem_arena = False   # sonst wächst der Speicher pro Frame, bis der Prozess abstürzt
opts.enable_mem_pattern = False
session = new_session('birefnet-portrait', sess_opts=opts)

cuts = []
for k in range(LEN + 1):  # +1: erster Frame der nächsten Runde, nur für den Drift-Abgleich
    im = Image.open(tmp / f'f{START + k:03d}.png').convert('RGB')
    cut = remove(im, session=session)
    a = np.asarray(cut.getchannel('A'), dtype=np.float32)
    a[a < 30] = 0
    cut.putalpha(Image.fromarray(a.astype(np.uint8)))
    # Schwerpunkt des Oberkörpers (obere Hälfte) – bleibt beim Gehen ruhig
    top = a[: a.shape[0] // 2]
    cx = (top.sum(0) * np.arange(top.shape[1])).sum() / max(top.sum(), 1)
    cuts.append((cut, cx))
    print('Frame', k + 1, '/', LEN + 1, flush=True)

# Linearer Drift (Figur wandert im Video langsam nach rechts) herausrechnen
c0, c1 = cuts[0][1], cuts[LEN][1]
H = cuts[0][0].height
W = round(H * 0.62)  # Kachel breit genug für den weitesten Schritt
frames = []
for k in range(LEN):
    cut, _ = cuts[k]
    cx = c0 + (c1 - c0) * k / LEN
    x0 = round(cx - W * 0.5)
    frames.append(cut.crop((x0, 0, x0 + W, H)))

cw = round(CELL_H * W / H)
rows = -(-LEN // COLS)
atlas = Image.new('RGBA', (cw * COLS, CELL_H * rows), (0, 0, 0, 0))
for k, f in enumerate(frames):
    atlas.paste(f.resize((cw, CELL_H), Image.LANCZOS), ((k % COLS) * cw, (k // COLS) * CELL_H))
atlas.save(OUT / 'walk-atlas.webp', 'WEBP', quality=84, method=6)

# Fußpunkt: unterste deckende Zeile über alle Frames (für die Bodenlinie)
a = np.asarray(atlas.getchannel('A'))
foot = max(np.nonzero(a[r * CELL_H:(r + 1) * CELL_H].max(1) > 60)[0].max() for r in range(rows))
meta = {'cols': COLS, 'rows': rows, 'count': LEN, 'cellW': cw, 'cellH': CELL_H, 'foot': round(float(foot) / CELL_H, 4)}
(OUT / 'walk-atlas.json').write_text(json.dumps(meta))
print(meta)
