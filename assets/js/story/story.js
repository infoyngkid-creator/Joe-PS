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
let trigger = null;

/* Tempolimit: Die Story folgt dem Scrollen weich und höchstens so schnell –
   egal wie schnell gescrollt wird (Einheiten = Szenen pro Sekunde). */
const MAX_SPEED = 0.38;
const SMOOTH = 5;           /* wie schnell sie aufholt (größer = direkter) */
let target = 0;
let current = 0;
let jump = true;            /* erster Wert (z. B. Neuladen mitten in der Seite) ohne Fahrt */

function follow(time, deltaTime) {
  if (!master) return;
  const dt = Math.min(deltaTime, 100) / 1000;
  const total = master.duration();
  let step = (target - current) * Math.min(1, dt * SMOOTH);
  const max = (MAX_SPEED * dt) / total;
  step = Math.max(-max, Math.min(max, step));
  if (Math.abs(target - current) < 0.00005) return;
  current += step;
  master.progress(current);
}

async function start() {
  /* Schrift muss geladen sein, damit der Staub die echte Buchstabenform bekommt */
  try {
    await document.fonts.load('900 100px "Basement Grotesque"');
  } catch (e) { /* weiter mit Ersatzschrift */ }
  build();
  gsap.ticker.add(follow);

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

  master = gsap.timeline({ defaults: { ease: 'none' }, paused: true });

  SCENES.forEach((scene, i) => {
    master.addLabel('scene' + (i + 1), i);
    scene.build(master, i, ctx);
    master.to({}, { duration: 1 }, i); /* jede Szene ist genau 1 Einheit lang */
  });

  landscape.build(master, SCENES.length, ctx);

  trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => '+=' + window.innerHeight * SCENES.length,
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      target = self.progress;
      if (jump) { current = target; master.progress(current); jump = false; }
    }
  });
  target = trigger.progress;
  master.progress(current);
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
    master.progress(0);
    trigger && trigger.kill(true);
    master.kill();
    SCENES.forEach((s) => s.destroy && s.destroy());
    build();
    ScrollTrigger.refresh();
    current = target = trigger.progress;
    master.progress(current);
  }
}
