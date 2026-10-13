"""Stellt die Joe-Standbilder für die 3D-Bühne frei.

Aufruf (im Projektordner):
    pip install "rembg[cpu]" pillow
    python3 scripts/joe-billboards.py

assets/gen/joe/j3-ledge.png    → assets/img/joe/ledge.webp     (Szene 4, Felskante)
assets/gen/joe/j4-campfire.png → assets/img/joe/campfire.webp  (Szene 5, am Feuer, mit Baumstamm)
"""
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter
import onnxruntime as ort
from rembg import new_session, remove

OUT = Path('assets/img/joe')
OUT.mkdir(parents=True, exist_ok=True)
# Der Baumstamm in j4 gilt für das Modell als Hintergrund – er wird per Umriss
# (Punkte im 600 px breiten Vorschaubild, ×4 = Original) wieder dazugenommen.
LOG = [(2, 290), (20, 284), (300, 293), (545, 306), (568, 315), (575, 350), (570, 400),
       (555, 425), (300, 410), (130, 388), (20, 372), (4, 360)]
JOBS = [('j3-ledge.png', 'ledge.webp', 'birefnet-portrait', 900, None),
        ('j4-campfire.png', 'campfire.webp', 'birefnet-general', 900, LOG)]
only = sys.argv[1:]   # optional: nur bestimmte Ausgabedateien neu machen

opts = ort.SessionOptions()
opts.enable_cpu_mem_arena = False
for src, dst, model, max_h, extra in JOBS:
    if only and dst not in only:
        continue
    im = Image.open(Path('assets/gen/joe') / src).convert('RGB')
    cut = remove(im, session=new_session(model, sess_opts=opts))
    a = cut.getchannel('A').point(lambda v: 0 if v < 30 else v)
    if extra:
        k = im.width / 600
        m = Image.new('L', im.size, 0)
        ImageDraw.Draw(m).polygon([(x * k, y * k) for x, y in extra], fill=255)
        a = ImageChops.lighter(a, m.filter(ImageFilter.GaussianBlur(3)))
        cut = Image.merge('RGBA', (*im.split(), a))
    cut.putalpha(a)
    cut = cut.crop(a.getbbox())
    if cut.height > max_h:
        cut = cut.resize((round(cut.width * max_h / cut.height), max_h), Image.LANCZOS)
    cut.save(OUT / dst, 'WEBP', quality=86, method=6)
    print(dst, cut.size)
