"""Rendert die Mesa-Ebenen der Scroll-Story als gemalte Bitmaps (WebP mit Transparenz).

Form = die Pfade aus scripts/mesa-formen.svg (mesa-far-p / mesa-mid-p / mesa-near-p).
Je Ebene zwei Varianten:  <name>.webp (Gegenlicht/Silhouette)  und  <name>-lit.webp (Mittagslicht, Sandstein).
Horizontal nahtlos kachelbar (die Story setzt jedes Bild zweimal nebeneinander).

  python3 scripts/landschaft.py
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/img/land'
HTML = (ROOT / 'scripts/mesa-formen.svg').read_text()

LAYERS = {
    #       px/Einheit, Oberkante, Gegenlicht-Farbe, Mittag-Farbe, Kontrast, Büsche
    'far':  dict(s=1.0, top=530, dark=(42, 48, 67), lit=(201, 140, 90), con=0.45, bush=0),
    'mid':  dict(s=1.25, top=440, dark=(30, 28, 31), lit=(160, 84, 52), con=0.7, bush=0),
    'near': dict(s=1.5, top=725, dark=(20, 18, 16), lit=(110, 64, 38), con=1.0, bush=34),
}
rng = np.random.default_rng(7)


def polys(name):
    d = re.search(r'id="mesa-%s-p"[^>]*d="([^"]+)"' % name, HTML).group(1)
    out = []
    for sub in re.findall(r'M([^MZ]+)Z', d):
        pts = [tuple(map(float, p)) for p in re.findall(r'(-?[\d.]+) (-?[\d.]+)', sub)]
        out.append(pts)
    return out


def noise(h, w, sigma, aspect=1.0):
    """kachelbare Rauschfläche (horizontal periodisch), Werte ca. -1..1"""
    n = rng.standard_normal((h, w))
    n = nd.gaussian_filter(n, (sigma * aspect, sigma), mode=('nearest', 'wrap'))
    return n / (np.abs(n).max() + 1e-9)


def fbm(h, w, base, octaves=4, aspect=1.0):
    acc, amp, tot = np.zeros((h, w)), 1.0, 0.0
    for i in range(octaves):
        acc += amp * noise(h, w, max(base / 2 ** i, 0.6), aspect)
        tot += amp
        amp *= 0.55
    return acc / tot


def render(name, cfg):
    s, top = cfg['s'], cfg['top']
    W, H = int(1600 * s), int((900 - top) * s)
    ss = 2  # Supersampling für weiche Kanten
    img = Image.new('L', (W * ss, H * ss), 0)
    dr = ImageDraw.Draw(img)
    for pts in polys(name):
        for off in (-1600, 0, 1600):
            dr.polygon([((x + off) * s * ss, (y - top) * s * ss) for x, y in pts], fill=255)
    mask = np.asarray(img.resize((W, H), Image.LANCZOS), dtype=np.float32) / 255

    # Büsche / Gestrüpp auf der Oberkante
    if cfg['bush']:
        b = Image.fromarray((mask * 255).astype(np.uint8))
        dr = ImageDraw.Draw(b)
        col = mask > 0.5
        for _ in range(cfg['bush']):
            x = int(rng.uniform(0, W))
            ys = np.nonzero(col[:, x])[0]
            if not len(ys):
                continue
            y = ys[0]
            size = rng.uniform(4, 10) * s * (1.3 if name == 'near' else 0.8)
            # Gestrüpp: feine, leicht gebogene Halme, fächerförmig
            for _ in range(int(rng.uniform(10, 22))):
                ang = rng.normal(0, 0.55)
                h = rng.uniform(0.5, 1.0) * size * 1.8
                bx = x + rng.normal(0, size * 0.25)
                mx, my = bx + np.sin(ang) * h * 0.5, y - np.cos(ang) * h * 0.5
                ex, ey = bx + np.sin(ang * 1.3) * h, y - np.cos(ang * 1.3) * h
                for ox in (-W, 0, W):
                    dr.line([(bx + ox, y + 1), (mx + ox, my), (ex + ox, ey)], fill=255, width=max(1, round(s * 0.8)))
            r = size * 0.35
            for ox in (-W, 0, W):
                dr.ellipse([x + ox - r * 1.6, y - r, x + ox + r * 1.6, y + r], fill=255)
        mask = np.asarray(b, dtype=np.float32) / 255

    # Kanten aufrauen (keine Polygon-Kanten mehr)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    amp = 2.6 * s
    dx = fbm(H, W, 3 * s, 3) * amp
    dy = fbm(H, W, 3 * s, 3) * amp
    mask = nd.map_coordinates(mask, [np.clip(yy + dy, 0, H - 1), (xx + dx) % W], order=1, mode='grid-wrap')
    mask = np.clip(mask, 0, 1)

    # Volumen: weich geblurrte Maske als „Höhe“, daraus Flächen-Neigung
    hgt = nd.gaussian_filter(mask, 5 * s, mode=('nearest', 'wrap'))
    gx = nd.sobel(hgt, axis=1, mode='wrap')
    gy = nd.sobel(hgt, axis=0, mode='nearest')
    gx /= (np.abs(gx).max() + 1e-9)
    gy /= (np.abs(gy).max() + 1e-9)

    # Seiten: rechte Felswände im Licht, linke im Schatten (waagerecht stark geblurrte Maske)
    hx = nd.gaussian_filter(mask, (1.5 * s, 16 * s), mode=('nearest', 'wrap'))
    sx = nd.sobel(hx, axis=1, mode='wrap')
    sx /= (np.abs(sx).max() + 1e-9)

    # Oberkanten-Licht (Himmelslicht von hinten oben)
    t = max(2, int(2.2 * s))
    above = np.roll(mask, t, axis=0)
    above[:t] = 0
    rim = nd.gaussian_filter(np.clip(mask - above, 0, 1), 0.7 * s)

    # Gesteinsstruktur
    y_units = yy / s + top
    warp = fbm(H, W, 40 * s, 3)
    band = fbm(H, W, 30 * s, 2)
    strata = (np.sin(y_units / 9.0 + warp * 4.0) * (0.35 + 0.35 * band)
              + np.sin(y_units / 3.1 + warp * 7) * 0.15
              + fbm(H, W, 6 * s, 2, aspect=0.15) * 0.5)          # waagerecht verschmierte Flecken
    streak = fbm(H, W, 2.5 * s, 3, aspect=6)           # senkrechte Erosionsrinnen
    grain = fbm(H, W, 0.9 * s, 2)
    blotch = fbm(H, W, 18 * s, 3)
    depth = (yy / H)                                     # 0 oben … 1 unten

    con = cfg['con']

    # ---- Variante 1: Gegenlicht (Silhouette mit Struktur) ----
    L = 1.0 + con * (0.06 * strata + 0.08 * streak + 0.07 * grain + 0.10 * blotch) - 0.28 * depth * con
    L += 0.12 * con * np.clip(-sx, 0, 1)
    base = np.array(cfg['dark'], np.float32) / 255
    rgb = base[None, None, :] * L[..., None]
    rimcol = np.array([0.91, 0.86, 0.78])
    rgb += rim[..., None] * rimcol * (0.16 + 0.08 * con)
    save(rgb, mask, OUT / f'{name}.webp')

    # ---- Variante 2: Mittagslicht (Sandstein, Licht von rechts oben) ----
    light = np.clip(0.6 - 1.1 * sx - 0.35 * gy, 0, 1.4)
    L = 0.6 + 0.5 * light + 0.07 * strata + 0.10 * streak + 0.08 * grain + 0.10 * blotch - 0.25 * depth
    base = np.array(cfg['lit'], np.float32) / 255
    # Schichten leicht farbig (rötlich / ocker im Wechsel)
    tint = np.stack([1 + 0.05 * strata, 1 - 0.01 * strata, 1 - 0.06 * strata], -1)
    rgb = base[None, None, :] * L[..., None] * tint
    rgb += rim[..., None] * np.array([1.0, 0.86, 0.6]) * 0.35
    # Schatten unter Überhängen / am Fuß
    occl = nd.gaussian_filter(mask, 14 * s, mode=('nearest', 'wrap'))
    rgb *= (0.75 + 0.25 * np.clip(1.6 - occl, 0, 1))[..., None]
    save(rgb, mask, OUT / f'{name}-lit.webp')
    print(name, W, H)


def save(rgb, mask, path):
    a = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
    c = (np.clip(rgb, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(np.dstack([c, a]), 'RGBA').save(path, 'WEBP', quality=82, method=6)
    print(' ', path.name, path.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for n, c in LAYERS.items():
        render(n, c)
