"""Stellt eine Person frei (transparentes WebP) und trägt das Ergebnis in die Story ein.

Aufruf (im Projektordner):
    pip install "rembg[cpu]" pillow
    python3 scripts/freistellen.py assets/img/joe1.jpg   # Szene 2: dunkle Silhouette
    python3 scripts/freistellen.py assets/img/joe2.jpg   # Szene 3: farbig, warm

Ergebnis:
    assets/img/NAME-cutout.webp      freigestellt, Farbe (transparent)
    assets/img/NAME-silhouette.webp  dunkle Silhouette mit warmer Lichtkante
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageOps
from rembg import new_session, remove

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'assets/img/joe1.jpg')
im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
im.thumbnail((1600, 2400))

cut = remove(im, session=new_session('birefnet-portrait'))   # sauberste Kanten, auch bei Haaren
alpha = cut.getchannel('A').filter(ImageFilter.MedianFilter(5))   # kleine Reste glätten
alpha = alpha.point(lambda v: 0 if v < 40 else v)
cut.putalpha(alpha)
box = alpha.getbbox()
cut = cut.crop(box)
alpha = cut.getchannel('A')

# Höhe begrenzen (reicht für Vollbild, spart Ladezeit)
if cut.height > 1400:
    w = round(cut.width * 1400 / cut.height)
    cut = cut.resize((w, 1400), Image.LANCZOS)
    alpha = cut.getchannel('A')

stem = src.with_suffix('')
cut.save(f'{stem}-cutout.webp', 'WEBP', quality=86)

# Silhouette: fast schwarz (Asphalt), dazu eine schmale goldene Kante oben rechts (Gegenlicht der Sonne)
shifted = ImageChops.offset(alpha, -4, 4)
rim = ImageChops.subtract(alpha, shifted).filter(ImageFilter.GaussianBlur(1.2))
sil = Image.new('RGBA', cut.size, (13, 11, 10, 0))
sil.putalpha(alpha)
gold = Image.new('RGBA', cut.size, (230, 169, 43, 0))
gold.putalpha(rim.point(lambda v: min(255, int(v * 0.9))))
sil = Image.alpha_composite(sil, gold)
sil.save(f'{stem}-silhouette.webp', 'WEBP', quality=88)
print('fertig:', f'{stem}-cutout.webp', f'{stem}-silhouette.webp', cut.size)

# In der Story eintragen, damit Szene 2 das Foto statt des Platzhalters nimmt
page = Path('joe-laredo/index.html')
if page.exists() and src.name in ('joe1.jpg', 'joe2.jpg'):
    import re
    html = page.read_text(encoding='utf-8')
    if src.name == 'joe1.jpg':
        html = html.replace('data-photo=""', 'data-photo="../assets/img/joe1-silhouette.webp"', 1)
    else:
        html = html.replace('../assets/img/joe-portrait-cutout.webp', '../assets/img/joe2-cutout.webp')
    page.write_text(html, encoding='utf-8')
    print('eingetragen in', page)
