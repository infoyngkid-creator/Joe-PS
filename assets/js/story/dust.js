/* Zerlegt eine Überschrift in Buchstaben und erzeugt pro Buchstabe Staubpartikel,
   die aus der echten Buchstabenform gesampelt werden (Canvas → Pixel → Partikel).
   Animiert wird später nur transform und opacity. */

export function splitToDust(el, { step = 6, max = 70 } = {}) {
  const chars = [];
  el.querySelectorAll('.st-line').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'st-char';
      span.textContent = ch;
      line.appendChild(span);
      chars.push(span);
    });
  });

  const layer = document.createElement('span');
  layer.className = 'st-dust';
  layer.setAttribute('aria-hidden', 'true');
  el.appendChild(layer);

  const cs = getComputedStyle(el);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const host = el.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const c = canvas.getContext('2d', { willReadFrequently: true });

  const groups = chars.map((span) => {
    const r = span.getBoundingClientRect();
    const w = Math.ceil(r.width);
    const h = Math.ceil(r.height);
    canvas.width = w;
    canvas.height = h;
    c.clearRect(0, 0, w, h);
    c.font = font;
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#000';
    /* Grundlinie ungefähr wie im Layout */
    const m = c.measureText(span.textContent);
    const asc = m.actualBoundingBoxAscent || h * 0.7;
    const desc = m.actualBoundingBoxDescent || 0;
    const y = (h - (asc + desc)) / 2 + asc;
    c.fillText(span.textContent, (w - m.width) / 2, y);
    const data = c.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let py = 0; py < h; py += step) {
      for (let px = 0; px < w; px += step) {
        if (data[(py * w + px) * 4 + 3] > 140) pts.push([px, py]);
      }
    }
    /* zufällig ausdünnen */
    for (let i = pts.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    const ox = r.left - host.left;
    const oy = r.top - host.top;
    const particles = pts.slice(0, max).map(([px, py]) => {
      const p = document.createElement('i');
      const size = step * (0.45 + Math.random() * 0.6);
      p.style.width = p.style.height = size.toFixed(1) + 'px';
      /* Staub im Morgenlicht: meist Bone, teils goldig, teils Khaki */
      const r = Math.random();
      if (r > 0.82) p.style.background = '#f3cf86';
      else if (r > 0.7) p.style.background = '#9a8863';
      p.style.transform = `translate(${(ox + px).toFixed(1)}px, ${(oy + py).toFixed(1)}px)`;
      p._x = ox + px;
      p._y = oy + py;
      layer.appendChild(p);
      return p;
    });
    return { span, particles };
  });

  return {
    groups,
    destroy() {
      layer.remove();
      el.querySelectorAll('.st-line').forEach((line) => {
        line.textContent = [...line.querySelectorAll('.st-char')].map((s) => s.textContent).join('');
      });
    }
  };
}
