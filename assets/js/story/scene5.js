/* Szene 5 – CAMPFIRE
   Nacht. Die Felskante sinkt weg, MUSIC und Player gehen, der Himmel wird schwarzblau,
   die Sterne funkeln (CSS). Unten brennt ein kleines Lagerfeuer (Flackern, Funken: CSS),
   Joe steht daneben. Dazu Booking-Button, Social Links und „Zurück zum Start“. Ende der Story.
   Nur transform/opacity (autoAlpha setzt zusätzlich visibility, damit unsichtbare Links nicht klickbar sind). */

export default {
  name: 'Campfire',

  build(tl, t0, ctx) {
    const stage = ctx.stage;
    const svg = stage.querySelector('.land');
    const v = ctx.view;
    const s4 = stage.querySelector('.scene-4');
    const fire = svg.querySelector('.campfire');
    const end = stage.querySelector('.campfire-end');
    const endParts = end.children;

    /* Szene 4 räumt auf */
    tl.to(s4.querySelectorAll('.music-title span'), { yPercent: -110, opacity: 0, duration: 0.12, stagger: 0.015, ease: 'power2.in' }, t0);
    tl.to(s4.querySelector('.player'), { autoAlpha: 0, y: -30, duration: 0.12, ease: 'power2.in' }, t0);
    tl.to(svg.querySelector('.ledge'), { y: 360, opacity: 0, duration: 0.3, ease: 'power2.in' }, t0 + 0.04);

    /* Nacht: letzter Himmel drüber, Sterne voll, Sonne ganz weg */
    tl.fromTo(svg.querySelector('.sky-midnight'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, t0 + 0.05);
    tl.to(svg.querySelector('.stars'), { opacity: 1, duration: 0.3 }, t0 + 0.2);
    tl.to(svg.querySelector('.sun'), { y: 260, duration: 0.3 }, t0);
    tl.to(svg, { scale: 1, duration: 0.4, ease: 'power2.inOut' }, t0);

    /* Lagerfeuer: am sichtbaren Ausschnitt ausrichten (Handy: Mitte, Desktop: rechts) */
    const fx = v.left + v.width * (ctx.small ? 0.58 : 0.68);
    const fy = ctx.small ? 868 : 846;
    const fs = ctx.small ? 1 : 1.15;
    tl.set(fire, { attr: { transform: `translate(${fx.toFixed(1)} ${fy}) scale(${fs})` } }, 0);
    tl.fromTo(fire, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }, t0 + 0.3);
    tl.fromTo(svg.querySelector('.flames'), { scale: 0.2 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' }, t0 + 0.34);
    tl.fromTo(svg.querySelector('.fire-joe'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.2, ease: 'power2.out' }, t0 + 0.42);

    /* Abschluss-Block */
    tl.set(end, { autoAlpha: 1 }, t0 + 0.5);
    tl.fromTo(endParts, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.04, ease: 'power2.out' }, t0 + 0.5);
  },

  destroy() {}
};
