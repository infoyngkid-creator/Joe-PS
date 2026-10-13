"""Bereitet die Higgsfield-Landschaften für die 3D-Bühne vor.

Aufruf (im Projektordner):
    pip install pillow transformers torch
    python3 scripts/plates.py

Liest  assets/gen/joe/l1-dawn.webp … l4-night.webp (6336×2688, deckungsgleich)
Schreibt assets/img/plates/{dawn,noon,sunset,night}-{3k,2k}.webp
         assets/img/plates/depth-{3k,2k}.webp  (Tiefenkarte, hell = nah)

Die Tiefenkarte kommt von Depth Anything V2 (lokal, einmalig ~100 MB Modell-Download)
und wird aus dem Mittagsbild berechnet, weil dort alle Formen am klarsten sind.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

SRC = Path('assets/gen/joe')
OUT = Path('assets/img/plates')
OUT.mkdir(parents=True, exist_ok=True)
NAMES = {'dawn': 'l1-dawn', 'noon': 'l2-noon', 'sunset': 'l3-sunset', 'night': 'l4-night'}
SIZES = {'3k': 3072, '2k': 2048}

for name, file in NAMES.items():
    im = Image.open(SRC / f'{file}.webp').convert('RGB')
    for tag, w in SIZES.items():
        h = round(w * im.height / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f'{name}-{tag}.webp', 'WEBP', quality=82, method=6)
    print('Plate', name)

# Tiefenkarte
from transformers import pipeline
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Base-hf')
noon = Image.open(SRC / 'l2-noon.webp').convert('RGB')
small = noon.resize((2048, round(2048 * noon.height / noon.width)), Image.LANCZOS)
d = np.array(pipe(small)['predicted_depth'].squeeze().float().numpy(), dtype=np.float32)
d = (d - d.min()) / (d.max() - d.min() + 1e-6)
dep = Image.fromarray((d * 255).astype(np.uint8)).resize(small.size, Image.BICUBIC)
# leicht weichzeichnen: weniger Risse an Kanten beim Verschieben
dep = dep.filter(ImageFilter.GaussianBlur(2.5))
for tag, w in SIZES.items():
    h = round(w * noon.height / noon.width)
    dep.resize((w // 2, h // 2), Image.LANCZOS).save(OUT / f'depth-{tag}.webp', 'WEBP', quality=90)
print('Tiefe fertig')
