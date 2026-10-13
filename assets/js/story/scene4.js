/* Szene 4 – SUNDOWN
   Der Himmel wandert von Oxblood zu Dusk Blue, die Sonne geht hinter den Mesas unter,
   erste Sterne kommen zurück. Joe steht als Silhouette auf einer Felskante.
   „MUSIC“ erscheint, darunter der Musik-Player (Status + Streaming-Links aus
   content/musik.json). Nur transform/opacity. */

export default {
  name: 'Sundown',

  build(tl, t0, ctx) {
    const stage = ctx.stage;
    const svg = stage.querySelector('.land');
    const v = ctx.view;
    const s3 = stage.querySelector('.scene-3');
    const scene = stage.querySelector('.scene-4');
    const ledge = svg.querySelector('.ledge');
    const joe = svg.querySelector('.ledge-joe');
    const letters = scene.querySelectorAll('.music-title span');
    const player = scene.querySelector('.player');
    const tape = scene.querySelector('.mini-tape');

    /* Szene 3 räumt auf: Foto sinkt weg, Steckbrief dreht sich raus, Mittagslicht geht */
    tl.to(s3.querySelector('.noon-joe'), { y: '35%', opacity: 0, duration: 0.16, ease: 'power2.in' }, t0);
    tl.to(s3.querySelector('.wanted'), { rotationY: 95, x: '30%', opacity: 0, duration: 0.16, ease: 'power2.in' }, t0);
    tl.to(s3.querySelector('.noon-light'), { opacity: 0, duration: 0.2 }, t0);
    tl.to(svg.querySelectorAll('.lit'), { opacity: 0, duration: 0.35 }, t0 + 0.05);
    tl.to(svg, { scale: 1.06, duration: 0.35, ease: 'power2.inOut' }, t0);

    /* Himmel: erst Oxblood, dann Dusk Blue (zwei Verläufe, nur Deckkraft) */
    tl.fromTo(svg.querySelector('.sky-oxblood'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.inOut' }, t0 + 0.02);
    tl.fromTo(svg.querySelector('.sky-dusk'), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.inOut' }, t0 + 0.38);

    /* Sonne geht unter, Glanz wird kleiner, Sterne kommen zurück */
    tl.to(svg.querySelector('.sun'), { y: 80, duration: 0.6, ease: 'power1.in' }, t0 + 0.02);
    tl.to(svg.querySelector('.sun-glow'), { scale: 0.9, duration: 0.6 }, t0 + 0.02);
    tl.to(svg.querySelector('.stars'), { opacity: 0.6, y: 0, duration: 0.3 }, t0 + 0.62);

    /* Felskante mit Joe: am sichtbaren Ausschnitt ausrichten (Handy zeigt nur die Mitte) */
    const ledgeX = v.left + v.width * (ctx.small ? 0.5 : 0.6);
    const ledgeY = ctx.small ? 90 : 0; /* am Handy etwas tiefer, damit der Player den Kopf nicht verdeckt */
    tl.fromTo(ledge, { x: ledgeX, y: 320 }, { x: ledgeX, y: ledgeY, duration: 0.3, ease: 'power3.out' }, t0 + 0.14);
    tl.fromTo(joe, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, t0 + 0.3);

    /* „MUSIC“ – Buchstaben steigen nacheinander auf */
    tl.fromTo(letters, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.14, stagger: 0.03, ease: 'power3.out' }, t0 + 0.42);

    /* Player blendet ein, die Spulen der Kassette laufen beim Scrollen */
    tl.fromTo(player, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, t0 + 0.58);
    tl.fromTo(tape, { '--spin': '0deg' }, { '--spin': '900deg', duration: 0.42, ease: 'none' }, t0 + 0.58);
  },

  destroy() {}
};
