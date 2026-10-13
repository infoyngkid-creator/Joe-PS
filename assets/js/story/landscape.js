/* Landschaft: Parallax der drei Mesa-Ebenen über die ganze Story.
   Je näher die Ebene, desto stärker die Bewegung (nur transform). */

export default {
  build(tl, total, ctx) {
    const svg = ctx.stage.querySelector('.land');
    if (!svg) return;
    const k = ctx.small ? 0.7 : 1;
    /* leichte „Kamerafahrt“ nach oben über die gesamte Story */
    tl.fromTo(svg.querySelector('.mesa-far'), { y: 0 }, { y: -18 * k, duration: total }, 0);
    tl.fromTo(svg.querySelector('.mesa-mid'), { y: 0 }, { y: -44 * k, duration: total }, 0);
    tl.fromTo(svg.querySelector('.mesa-near'), { y: 0, scale: 1 }, { y: -90 * k, scale: 1.04, transformOrigin: '50% 100%', duration: total }, 0);
  }
};
