/* Szene 2 – THE RIDE
   Joe läuft als dunkle Silhouette von links ins Bild, die Mesa-Ebenen ziehen
   parallax vorbei (nah = schnell, fern = langsam). Bei jedem Schritt wirbelt Staub
   am Boden auf. Ein kurzer Bio-Satz blendet ein. Am Ende rollt ein Tumbleweed
   quer durchs Bild. Nur transform/opacity. */

const SVGNS = 'http://www.w3.org/2000/svg';
const PAN = { far: -90, mid: -240, near: -620 };   // horizontale Verschiebung in SVG-Einheiten
let made = [];

/* Freigestelltes Foto verwenden, wenn im HTML eingetragen (data-photo) – sonst Platzhalter-Silhouette */
function usePhoto(rider, body) {
  const src = rider.dataset.photo;
  if (!src || body.querySelector('image')) return;
  const img = new Image();
  img.onload = () => {
    const h = 300;
    const w = h * (img.naturalWidth / img.naturalHeight);
    const el = document.createElementNS(SVGNS, 'image');
    el.setAttribute('href', src);
    el.setAttribute('x', (-w / 2).toFixed(1));
    el.setAttribute('y', (-h).toFixed(1));
    el.setAttribute('width', w.toFixed(1));
    el.setAttribute('height', h);
    body.querySelector('.rider-ph')?.remove();
    body.appendChild(el);
  };
  img.src = src;
}

/* Schrittzyklus für die Platzhalter-Figur. p = Anzahl Doppelschritte (1 = links + rechts). */
function walker(body) {
  const fig = body.querySelector('.walker');
  if (!fig) return null;
  const q = (c) => fig.querySelector(c);
  const parts = {
    la: q('.leg-a'), lb: q('.leg-b'), sa: q('.leg-a .shin'), sb: q('.leg-b .shin'),
    aa: q('.arm-a'), ab: q('.arm-b'), fa: q('.arm-a .fore'), fb: q('.arm-b .fore')
  };
  const set = (el, x, y, r) => el.setAttribute('transform', `translate(${x} ${y}) rotate(${r.toFixed(2)})`);
  const leg = (th) => {
    const c = Math.cos(th);
    return { hip: -26 * Math.sin(th), knee: 6 + 58 * Math.pow(Math.max(0, c), 1.6) };
  };
  return (p) => {
    const th = p * Math.PI * 2;
    const A = leg(th);
    const B = leg(th + Math.PI);
    const bob = -3.5 * Math.cos(2 * th);
    set(parts.la, 0, -127 + bob, A.hip); set(parts.sa, 0, 61, A.knee);
    set(parts.lb, 0, -127 + bob, B.hip); set(parts.sb, 0, 61, B.knee);
    set(parts.aa, 2, -200 + bob, 22 * Math.sin(th)); set(parts.fa, 0, 44, -14 - 12 * Math.max(0, -Math.sin(th)));
    set(parts.ab, 2, -200 + bob, -22 * Math.sin(th)); set(parts.fb, 0, 44, -14 - 12 * Math.max(0, Math.sin(th)));
    fig.querySelector('.torso').setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(3 0 -120)`);
  };
}

export default {
  name: 'The Ride',

  build(tl, t0, ctx) {
    const svg = ctx.stage.querySelector('.land');
    const rider = svg.querySelector('.rider');
    const body = rider.querySelector('.rider-body');
    const near = svg.querySelector('.mesa-near');
    const weed = svg.querySelector('.tumbleweed');
    const spin = weed.querySelector('.tw-spin');
    const bio = ctx.stage.querySelector('.scene-2 .bio-line');
    const v = ctx.view;

    usePhoto(rider, body);

    /* Laufweg: vom linken Bildrand bis ca. 38 % der Breite, dann fast auf der Stelle
       (die Landschaft zieht vorbei – wie eine Kamera, die mitfährt) */
    const startX = v.left - 120;
    const stopX = v.left + v.width * 0.38;
    const enter = 0.45;
    const riderX = (t) => (t < enter
      ? startX + (stopX - startX) * (t / enter)
      : stopX + (t - enter) * v.width * 0.08);
    const nearX = (t) => PAN.near * t;

    /* Parallax: Ebenen ziehen nach links vorbei */
    tl.fromTo(svg.querySelector('.mesa-far'), { x: 0 }, { x: PAN.far, duration: 1 }, t0);
    tl.fromTo(svg.querySelector('.mesa-mid'), { x: 0 }, { x: PAN.mid, duration: 1 }, t0);
    tl.fromTo(near, { x: 0 }, { x: PAN.near, duration: 1 }, t0);

    /* Läufer: rein, dann mitlaufen */
    tl.fromTo(rider, { x: startX, y: 864 }, { x: stopX, y: 864, duration: enter, ease: 'none' }, t0);
    tl.to(rider, { x: riderX(1), duration: 1 - enter, ease: 'none' }, t0 + enter);
    /* Gang: echter Schrittzyklus (Hüfte, Knie, Schulter, Ellbogen) – nur transform */
    const steps = 12;
    const walk = walker(body);
    if (walk) {
      const ph = { p: 0 };
      tl.fromTo(ph, { p: 0 }, { p: steps / 2, duration: 1, ease: 'none', onUpdate: () => walk(ph.p) }, t0);
    }

    /* Staub am Boden: bei jedem Schritt eine kleine Wolke an den Füßen,
       sie bleibt dann am Boden liegen und zieht mit der Landschaft nach links weg */
    const puffs = [];
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'puff');
      for (let k = 0; k < 4; k++) {
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', ((Math.random() - 0.5) * 30).toFixed(1));
        c.setAttribute('cy', (-4 - Math.random() * 10).toFixed(1));
        c.setAttribute('r', (10 + Math.random() * 14).toFixed(1));
        c.setAttribute('fill', 'url(#puff-g)');
        g.appendChild(c);
      }
      /* Position im Koordinatensystem der nahen Ebene (die sich selbst bewegt) */
      const gx = riderX(t) - nearX(t) - 10;
      g.setAttribute('transform', `translate(${gx.toFixed(1)} 864)`);
      g.style.opacity = 0;
      near.appendChild(g);
      puffs.push(g);
      tl.fromTo(g, { opacity: 0, scale: 0.3, transformOrigin: '50% 100%' }, { opacity: 0.55, scale: 1, duration: 0.03, ease: 'power2.out' }, t0 + t);
      tl.to(g, { opacity: 0, scale: 1.9, y: 864 - 16, duration: 0.14, ease: 'power1.out' }, t0 + t + 0.03);
    }
    made = puffs;

    /* Bio-Satz */
    tl.fromTo(bio, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, t0 + 0.32);
    tl.to(bio, { opacity: 0, y: -16, duration: 0.1, ease: 'power1.in' }, t0 + 0.88);

    /* Tumbleweed: rollt am Ende von links nach rechts durchs Bild, mit kleinen Hüpfern */
    const wStart = v.left - 120;
    const wEnd = v.right + 160;
    const GY = 836; /* Bodenhöhe des Tumbleweed */
    tl.fromTo(weed, { x: wStart, y: GY }, { x: wEnd, duration: 0.3, ease: 'none' }, t0 + 0.68);
    tl.fromTo(spin, { rotation: 0, transformOrigin: '50% 50%' }, { rotation: 900, duration: 0.3, ease: 'none' }, t0 + 0.68);
    tl.to(weed, {
      keyframes: [
        { y: GY - 38, duration: 0.04, ease: 'power1.out' }, { y: GY, duration: 0.04, ease: 'power1.in' },
        { y: GY - 22, duration: 0.035, ease: 'power1.out' }, { y: GY, duration: 0.035, ease: 'power1.in' },
        { y: GY - 30, duration: 0.04, ease: 'power1.out' }, { y: GY, duration: 0.04, ease: 'power1.in' },
        { y: GY - 12, duration: 0.03, ease: 'power1.out' }, { y: GY, duration: 0.03, ease: 'power1.in' }
      ]
    }, t0 + 0.69);
  },

  destroy() {
    made.forEach((g) => g.remove());
    made = [];
  }
};
