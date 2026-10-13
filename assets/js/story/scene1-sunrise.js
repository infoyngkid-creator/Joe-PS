/* Szene 1 – SUNRISE
   Dunkler Himmel, die Sonne steigt hinter den Mesas auf, der Himmel wird heller,
   Sterne verblassen. „JOE LAREDO“ zerfällt beim Scrollen zu Staub, der vom Wind
   nach rechts getragen wird. Unten „scroll ↓“. Nur transform/opacity. */

import { splitToDust } from './dust.js';

let dust = null;

export default {
  name: 'Sunrise',

  build(tl, t0, ctx) {
    const svg = ctx.stage.querySelector('.land');
    const scene = ctx.stage.querySelector('.scene-1');
    const title = scene.querySelector('[data-dust]');
    const hint = scene.querySelector('.scroll-hint');

    /* Sonne und Himmel */
    tl.fromTo(svg.querySelector('.sun'), { y: 0 }, { y: -470, duration: 0.95, ease: 'power1.out' }, t0);
    tl.fromTo(svg.querySelector('.sun-glow'), { scale: 0.7, transformOrigin: '50% 50%' }, { scale: 1.25, duration: 0.95 }, t0);
    tl.fromTo(svg.querySelector('.sky-dawn'), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.in' }, t0 + 0.05);
    tl.fromTo(svg.querySelector('.stars'), { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: 0.6 }, t0);

    /* Hinweis verschwindet sofort beim ersten Scrollen */
    tl.fromTo(hint, { opacity: 0.8 }, { opacity: 0, duration: 0.08 }, t0);

    /* Titel steigt leicht auf … */
    tl.fromTo(title, { y: 0 }, { y: -30, duration: 0.5 }, t0);

    /* … und zerfällt Buchstabe für Buchstabe zu Staub */
    if (dust) dust.destroy();
    dust = splitToDust(title, { step: ctx.small ? 3.5 : 4, max: ctx.small ? 55 : 120 });
    const n = dust.groups.length;
    dust.groups.forEach((g, i) => {
      const at = t0 + 0.32 + (i / n) * 0.42;
      tl.to(g.span, { opacity: 0, duration: 0.03 }, at);
      tl.set(g.particles, { opacity: 1 }, at);
      tl.to(g.particles, {
        x: (k, p) => p._x + 60 + Math.pow(Math.random(), 0.7) * (ctx.small ? 180 : 360),
        y: (k, p) => p._y - 10 - Math.random() * 140 + Math.random() * 30,
        scale: () => 0.2 + Math.random() * 0.6,
        opacity: 0,
        duration: 0.32,
        ease: 'power2.out',
        stagger: { each: 0.0025, from: 'random' }
      }, at);
    });
  },

  destroy() {
    if (dust) dust.destroy();
    dust = null;
  }
};
