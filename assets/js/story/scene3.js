/* Szene 3 – HIGH NOON
   Der Himmel wird hell, Licht in Camel Gold. Die Kamera zoomt auf Joe (farbig,
   freigestellt, harter Schatten). Ein Steckbrief (Bone-Papier, Oxblood-Stempel,
   leicht zerknittert) dreht sich ins Bild – mit Facts aus den geparkten Inhalten.
   Nur transform/opacity. */

/* Beleuchtete Mesas für den Mittag (Sandstein), werden über die dunklen Silhouetten geblendet */
const LIT = { far: '#c98c5a', mid: '#9c5132', near: '#6b3f26' };
let lit = [];

export default {
  name: 'High Noon',

  build(tl, t0, ctx) {
    const stage = ctx.stage;
    const svg = stage.querySelector('.land');
    const scene = stage.querySelector('.scene-3');
    const light = scene.querySelector('.noon-light');
    const joe = scene.querySelector('.noon-joe');
    const shadow = scene.querySelector('.noon-shadow');
    const poster = scene.querySelector('.wanted');

    /* Mittagshimmel und Sonne im Zenit */
    tl.fromTo(svg.querySelector('.sky-noon'), { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.inOut' }, t0);
    tl.to(svg.querySelector('.sun'), { y: -760, duration: 0.4, ease: 'power1.inOut' }, t0);
    tl.to(svg.querySelector('.sun-glow'), { scale: 1.6, duration: 0.4 }, t0);
    tl.fromTo(light, { opacity: 0 }, { opacity: 1, duration: 0.35 }, t0 + 0.05);

    /* Mesas im Mittagslicht: Sandstein statt Silhouette (Kopie der Form, nur Deckkraft animiert) */
    lit.forEach((p) => p.remove());
    lit = Object.entries(LIT).map(([name, color]) => {
      const g = svg.querySelector('.mesa-' + name);
      const src = g.querySelector('path');
      const copy = src.cloneNode(false);
      copy.removeAttribute('id');
      copy.setAttribute('fill', color);
      copy.setAttribute('class', 'lit');
      copy.style.opacity = 0;
      const twin = copy.cloneNode(false);
      twin.setAttribute('transform', 'translate(1600 0)');
      g.insertBefore(twin, g.querySelector('.puff'));
      g.insertBefore(copy, twin);
      tl.fromTo([copy, twin], { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.inOut' }, t0 + 0.02);
      return [copy, twin];
    }).flat();

    /* Kamera-Zoom in die Landschaft, die Silhouette aus Szene 2 tritt zurück */
    tl.fromTo(svg, { scale: 1 }, { scale: 1.35, duration: 0.5, ease: 'power2.inOut' }, t0 + 0.05);
    tl.to(svg.querySelector('.rider'), { opacity: 0, duration: 0.12 }, t0 + 0.18);

    /* Joe kommt groß von unten ins Bild, Schatten schiebt sich hart nach rechts */
    tl.fromTo(joe, { opacity: 0, y: '30%', scale: 0.86 }, { opacity: 1, y: '0%', scale: 1, duration: 0.3, ease: 'power3.out' }, t0 + 0.16);
    tl.fromTo(shadow, { x: '0%', y: '0%', opacity: 0 }, { x: '5.5%', y: '3%', opacity: 0.55, duration: 0.25, ease: 'power2.out' }, t0 + 0.22);

    /* Steckbrief dreht sich ins Bild (wie ein Blatt, das an die Wand geschlagen wird) */
    tl.fromTo(poster,
      { opacity: 0, rotationY: -100, rotationZ: 14, x: ctx.small ? 0 : '40%', y: -40 },
      { opacity: 1, rotationY: 0, rotationZ: -4, x: 0, y: 0, duration: 0.28, ease: 'back.out(1.4)' }, t0 + 0.4);
    /* leichtes Nachschwingen */
    tl.to(poster, { rotationZ: -2.5, duration: 0.12, ease: 'sine.inOut' }, t0 + 0.68);
    tl.to(poster, { rotationZ: -3.6, duration: 0.12, ease: 'sine.inOut' }, t0 + 0.8);
  },

  destroy() {
    lit.forEach((p) => p.remove());
    lit = [];
  }
};
