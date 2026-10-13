/* Scroll-Story „Ride Into Town“
   Eine gepinnte Sektion, Scroll = Zeit. Jede Szene belegt 1 Zeiteinheit auf der Master-Timeline.
   Szenen liegen je in einer eigenen Datei und bekommen (timeline, start) übergeben. */

import landscape from './landscape.js';
import scene1 from './scene1-sunrise.js';
import scene2 from './scene2.js';
import scene3 from './scene3.js';
import scene4 from './scene4.js';
import scene5 from './scene5.js';

const SCENES = [scene1, scene2, scene3, scene4, scene5];

const root = document.querySelector('.story');
const { gsap, ScrollTrigger } = window;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root && gsap && ScrollTrigger && !reduce) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  start();
}

let master = null;

async function start() {
  /* Schrift muss geladen sein, damit der Staub die echte Buchstabenform bekommt */
  try {
    await document.fonts.load('900 100px "Basement Grotesque"');
  } catch (e) { /* weiter mit Ersatzschrift */ }
  build();

  /* Bei Breitenänderung neu aufbauen (Höhenänderung durch Handy-Adressleiste ignorieren) */
  let w = window.innerWidth;
  let t;
  window.addEventListener('resize', () => {
    if (window.innerWidth === w) return;
    w = window.innerWidth;
    clearTimeout(t);
    t = setTimeout(rebuild, 250);
  });
}

function build() {
  root.classList.add('is-live');
  const stage = root.querySelector('.story-stage');
  const ctx = { root, stage, small: window.innerWidth < 700, view: visibleRange(stage) };

  master = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => '+=' + window.innerHeight * SCENES.length,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true
    }
  });

  SCENES.forEach((scene, i) => {
    master.addLabel('scene' + (i + 1), i);
    scene.build(master, i, ctx);
    master.to({}, { duration: 1 }, i); /* jede Szene ist genau 1 Einheit lang */
  });

  landscape.build(master, SCENES.length, ctx);
}

/* Sichtbarer Ausschnitt der SVG-Landschaft (viewBox 1600×900, „slice“, unten mittig).
   Am Handy ist nur die Mitte sichtbar – Figuren sollen trotzdem am Bildrand starten. */
function visibleRange(stage) {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  const scale = Math.max(w / 1600, h / 900);
  const vw = w / scale;
  const vh = h / scale;
  return { left: 800 - vw / 2, right: 800 + vw / 2, width: vw, top: 900 - vh };
}

function rebuild() {
  if (master) {
    const progress = master.scrollTrigger ? master.scrollTrigger.progress : 0;
    master.scrollTrigger && master.scrollTrigger.kill(true);
    master.kill();
    SCENES.forEach((s) => s.destroy && s.destroy());
    build();
    ScrollTrigger.refresh();
    if (master.scrollTrigger) master.progress(progress);
  }
}
