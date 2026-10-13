/* 3D-Bühne der Scroll-Story (three.js, lokal).
   - Hintergrund: vier deckungsgleiche KI-Landschaften (Nacht, Morgengrauen, Mittag, Sonnenuntergang)
     werden per Shader überblendet. Eine Tiefenkarte (Depth Anything V2, scripts/plates.py) verschiebt
     nahe Teile stärker als ferne → die Kamera fährt räumlich.
   - Joe: freigestellte Billboards. Szene 2 spielt eine echte Lauf-Schleife aus dem KI-Video ab
     (Sprite-Atlas, scripts/lauf-frames.py), Szene 4 auf der Felskante, Szene 5 am Feuer.
   - Effekte: Sonnenglühen, Staub, Bodenstaub bei jedem Schritt, Partikel-Feuer mit Funken und
     flackerndem Licht, Filmkorn, Vignette.
   - Alles wird aus der Story-Zeit t (0–5, eine Einheit pro Szene) berechnet – rückwärts scrollen
     funktioniert ohne hängende Reste. Nur Feuer und schwebender Staub laufen zusätzlich in Echtzeit. */

const BASE = new URL('../../../', import.meta.url).href;
const A = 6336 / 2688;   /* Seitenverhältnis der Landschaften; Welt: x 0…A, y 0…1 (unten → oben) */

/* --- kleine Helfer ---------------------------------------------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
/* 0…1 zwischen den Zeiten a und b, weich */
const seg = (t, a, b) => smooth(clamp((t - a) / (b - a)));
/* Wert über Stützstellen [[t, v], …] weich interpolieren */
function keys(t, list) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    if (t <= list[i][0]) {
      const [t0, v0] = list[i - 1];
      const [t1, v1] = list[i];
      return lerp(v0, v1, smooth((t - t0) / (t1 - t0)));
    }
  }
  return list[list.length - 1][1];
}

/* --- Shader ----------------------------------------------------------- */
const VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const PLATE_FRAG = /* glsl */`
  uniform sampler2D tNight, tDawn, tNoon, tSunset, tDepth;
  uniform vec4 w;            /* Gewichte Nacht, Morgen, Mittag, Abend */
  uniform vec2 par;          /* Parallax-Verschiebung (uv) für Tiefe 1 */
  uniform vec3 dolly;        /* xy = Zoom-Zentrum (uv), z = Stärke */
  uniform vec3 sun;          /* xy = Position (uv), z = Stärke */
  uniform vec3 sunCol;
  uniform vec3 fire;         /* xy = Position (uv), z = Stärke (inkl. Flackern) */
  uniform float aspect;
  varying vec2 vUv;

  vec2 shift(vec2 uv, float d) {
    float k = d - 0.28;      /* Mesas (≈0.28) bleiben stehen, Vordergrund wandert */
    uv += par * k;
    uv = dolly.xy + (uv - dolly.xy) * (1.0 - dolly.z * k);
    return uv;
  }

  void main() {
    float d = texture2D(tDepth, vUv).r;
    vec2 uv = shift(vUv, d);
    d = texture2D(tDepth, clamp(uv, 0.001, 0.999)).r;   /* zweiter Schritt: genauer an Kanten */
    uv = clamp(shift(vUv, d), 0.001, 0.999);

    vec3 c = w.x * texture2D(tNight, uv).rgb + w.y * texture2D(tDawn, uv).rgb
           + w.z * texture2D(tNoon, uv).rgb + w.w * texture2D(tSunset, uv).rgb;

    /* Sonnenglühen: wirkt auf Himmel und ferne Mesas, nicht auf den Vordergrund */
    vec2 q = (uv - sun.xy) * vec2(aspect, 1.0);
    float r = length(q);
    float g = sun.z * (0.55 * exp(-r * 5.0) + 0.8 * exp(-r * 26.0) + 1.2 * exp(-r * 90.0));
    c += sunCol * g * (1.0 - smoothstep(0.35, 0.75, d));

    /* Lagerfeuer: warmes Licht auf Boden und Büsche in der Nähe */
    vec2 f = (uv - fire.xy) * vec2(aspect, 1.0);
    float fl = fire.z * exp(-length(f * vec2(1.0, 1.8)) * 7.0) * smoothstep(0.35, 0.7, d);
    c = c * (1.0 + vec3(2.6, 1.3, 0.5) * fl) + vec3(0.25, 0.09, 0.02) * fl;

    gl_FragColor = vec4(c, 1.0);
  }
`;

/* Billboard (Joe): Farbe an die Tageszeit anpassen, Gegenlicht-Kante aus der Alpha-Form */
const SPRITE_FRAG = /* glsl */`
  uniform sampler2D map;
  uniform vec4 cell;         /* uv-Ausschnitt: x, y, Breite, Höhe */
  uniform vec3 shade;        /* Multiplikator (Tageslicht) */
  uniform vec3 rimCol;
  uniform vec2 rimDir;       /* Richtung, aus der das Licht kommt (uv-Schritt) */
  uniform float opacity;
  uniform float lift;        /* Schwarzwert anheben (Dunst) */
  uniform vec3 liftCol;
  varying vec2 vUv;
  void main() {
    vec2 uv = cell.xy + vUv * cell.zw;
    vec4 t = texture2D(map, uv);
    if (t.a < 0.02) discard;
    float edge = t.a * (1.0 - texture2D(map, uv + rimDir).a);
    vec3 c = t.rgb * shade + rimCol * edge;
    c = mix(c, liftCol, lift);
    gl_FragColor = vec4(c, t.a * opacity);
  }
`;

/* weicher Schatten unter den Füßen */
const SHADOW_FRAG = /* glsl */`
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float a = exp(-dot(p, p) * 3.0) * opacity;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
  }
`;

/* Partikel: Position wird im Vertex-Shader aus Startwerten + Zeit berechnet */
const POINTS_VERT = /* glsl */`
  attribute vec4 seed;       /* vier Zufallswerte 0…1 */
  uniform float time, scale, mode, life;
  uniform vec2 origin, spread;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec3 p = vec3(origin, 0.0);
    float size = 1.0;
    vA = 1.0;
    vC = vec3(1.0);
    if (mode < 0.5) {
      /* schwebender Staub im Licht: driftet langsam nach rechts oben, endlos */
      float k = fract(seed.w + time * (0.012 + seed.z * 0.02));
      p.x += (seed.x - 0.5) * spread.x + k * 0.25;
      p.y += seed.y * spread.y + sin(time * 0.6 + seed.z * 20.0) * 0.012 + k * 0.05;
      size = 0.004 + seed.z * 0.006;
      vA = sin(k * 3.14159) * (0.35 + 0.65 * seed.w);
      vC = vec3(1.0, 0.86, 0.62);
    } else if (mode < 1.5) {
      /* Flammen: steigen auf, werden kleiner, Farbe weißgelb → orange → rot */
      float k = fract(seed.w + time * (0.9 + seed.z * 0.7));
      float side = (seed.x - 0.5) * spread.x * (1.0 - k * 0.8);
      p.x += side + sin(time * 7.0 + seed.y * 30.0) * 0.004 * k;
      p.y += k * spread.y * (0.6 + seed.y * 0.6);
      size = spread.x * (0.55 - k * 0.42) * (0.7 + seed.z * 0.6);
      vA = smoothstep(0.0, 0.08, k) * (1.0 - k);
      vC = mix(vec3(1.0, 0.86, 0.5), vec3(0.95, 0.35, 0.08), smoothstep(0.1, 0.55, k));
      vC = mix(vC, vec3(0.5, 0.08, 0.03), smoothstep(0.55, 1.0, k));
    } else {
      /* Funken: fliegen hoch und zur Seite, verglühen */
      float k = fract(seed.w + time * (0.25 + seed.z * 0.25));
      p.x += (seed.x - 0.5) * spread.x * 0.4 + sin(k * 6.0 + seed.y * 12.0) * 0.03 * k + (seed.x - 0.5) * k * 0.08;
      p.y += k * spread.y * (1.0 + seed.y);
      size = 0.0035 + seed.z * 0.003;
      vA = (1.0 - k) * step(0.35, fract(time * 8.0 + seed.y * 7.0)) ;
      vA = max(vA, (1.0 - k) * 0.5);
      vC = vec3(1.0, 0.75, 0.35);
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size * scale;
  }
`;
const POINTS_FRAG = /* glsl */`
  uniform float opacity;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float a = exp(-dot(p, p) * 3.2) * vA * opacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vC, a);
  }
`;

/* Bodenstaub bei jedem Schritt: Startzeit und Ort liegen fest, Alter = t − Start */
const PUFF_VERT = /* glsl */`
  attribute vec4 seed;       /* x = Startzeit (Story), y = Welt-x, z, w = Zufall */
  uniform float t, scale, footY;
  varying float vA;
  void main() {
    float age = (t - seed.x) / 0.16;
    vec3 p = vec3(seed.y + (seed.z - 0.5) * 0.04 - age * 0.03, footY + age * 0.025 + seed.w * 0.01, 0.0);
    float alive = step(0.0, age) * step(age, 1.0);
    vA = alive * (1.0 - age) * smoothstep(0.0, 0.08, age) * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (0.03 + age * 0.06) * (0.7 + seed.w * 0.6) * scale * alive;
  }
`;
const PUFF_FRAG = /* glsl */`
  uniform vec3 color;
  varying float vA;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float a = exp(-dot(p, p) * 2.6) * vA;
    if (a < 0.003) discard;
    gl_FragColor = vec4(color, a);
  }
`;

/* Nachbearbeitung: Vignette, Filmkorn, leichte Farbkurve */
const POST_FRAG = /* glsl */`
  uniform sampler2D tScene;
  uniform float time, grain, vig;
  uniform vec2 res;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 c = texture2D(tScene, vUv).rgb;
    /* weiche Filmkurve: Lichter abrunden, Schatten minimal anheben */
    c = c / (1.0 + c * 0.12) * 1.1;
    c = mix(vec3(0.02, 0.018, 0.016), vec3(1.0), c);
    vec2 p = vUv - 0.5;
    p.x *= res.x / res.y;
    float v = smoothstep(1.15, 0.25, length(p * vec2(0.8, 1.0)));
    c *= mix(1.0 - vig, 1.0, v);
    float n = hash(floor(vUv * res / 1.5) + fract(time * 13.7) * 91.0) - 0.5;
    c += n * grain;
    gl_FragColor = vec4(c, 1.0);
  }
`;

/* --- Bühne ------------------------------------------------------------ */
export async function createStage(stage, { small, getTime }) {
  const THREE = await import('../../../vendor/three/three.module.min.js');

  const canvas = document.createElement('canvas');
  canvas.className = 'stage3d';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x06070b, 1);
  const lowEnd = small || (navigator.hardwareConcurrency || 4) <= 4;
  const dpr = Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  /* Texturen laden (Handy: 2k, sonst 3k) */
  const size = small ? '2k' : '3k';
  const loader = new THREE.TextureLoader();
  /* Farben werden bewusst ohne Farbraum-Umrechnung verarbeitet (Bildwerte = Ausgabewerte) */
  const load = (path) => new Promise((ok, fail) => loader.load(BASE + path, (t) => {
    t.colorSpace = THREE.NoColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.anisotropy = 1;
    ok(t);
  }, undefined, fail));

  const meta = await (await fetch(BASE + 'assets/img/joe/walk-atlas.json')).json();
  const [night, dawn, noon, sunset, depth, walkTex, ledgeTex, fireTex] = await Promise.all([
    load(`assets/img/plates/night-${size}.webp`),
    load(`assets/img/plates/dawn-${size}.webp`),
    load(`assets/img/plates/noon-${size}.webp`),
    load(`assets/img/plates/sunset-${size}.webp`),
    load(`assets/img/plates/depth-${size}.webp`),
    load('assets/img/joe/walk-atlas.webp'),
    load('assets/img/joe/ledge.webp'),
    load('assets/img/joe/campfire.webp')
  ]);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);

  /* Landschaft */
  const plateU = {
    tNight: { value: night }, tDawn: { value: dawn }, tNoon: { value: noon }, tSunset: { value: sunset }, tDepth: { value: depth },
    w: { value: new THREE.Vector4(1, 0, 0, 0) },
    par: { value: new THREE.Vector2() },
    dolly: { value: new THREE.Vector3(0.5, 0.5, 0) },
    sun: { value: new THREE.Vector3(0.38, 0.5, 0) },
    sunCol: { value: new THREE.Color(1.0, 0.62, 0.3) },
    fire: { value: new THREE.Vector3(0, 0, 0) },
    aspect: { value: A }
  };
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(A, 1), new THREE.ShaderMaterial({ uniforms: plateU, vertexShader: VERT, fragmentShader: PLATE_FRAG, depthTest: false, depthWrite: false }));
  plate.position.set(A / 2, 0.5, 0);
  scene.add(plate);

  /* Billboards: Fußpunkt unten in der Mitte */
  function billboard(tex, w, h, foot = 1) {
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5 - (1 - foot), 0);
    const u = {
      map: { value: tex }, cell: { value: new THREE.Vector4(0, 0, 1, 1) },
      shade: { value: new THREE.Color(1, 1, 1) }, rimCol: { value: new THREE.Color(0, 0, 0) },
      rimDir: { value: new THREE.Vector2(-0.004, 0) }, opacity: { value: 0 },
      lift: { value: 0 }, liftCol: { value: new THREE.Color(0.5, 0.4, 0.3) }
    };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: SPRITE_FRAG, transparent: true, depthTest: false, depthWrite: false }));
    m.userData.aspect = w / h;
    m.visible = false;
    return m;
  }
  function shadow() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { opacity: { value: 0 } }, vertexShader: VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthTest: false, depthWrite: false }));
    m.visible = false;
    return m;
  }

  const walkShadow = shadow();
  const walk = billboard(walkTex, meta.cellW, meta.cellH, meta.foot);
  const ledge = billboard(ledgeTex, ledgeTex.image.width, ledgeTex.image.height);
  const fireJoe = billboard(fireTex, fireTex.image.width, fireTex.image.height);
  const fireShadow = shadow();

  /* Partikel */
  function points(count, mode, opts = {}) {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    g.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const u = {
      time: { value: 0 }, scale: { value: 1 }, mode: { value: mode }, life: { value: 1 },
      origin: { value: new THREE.Vector2() }, spread: { value: new THREE.Vector2(1, 1) }, opacity: { value: 0 }
    };
    const m = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: u, vertexShader: POINTS_VERT, fragmentShader: POINTS_FRAG, transparent: true,
      depthTest: false, depthWrite: false, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    }));
    m.frustumCulled = false;
    return m;
  }
  const motes = points(lowEnd ? 70 : 160, 0, { additive: true });
  const flames = points(lowEnd ? 90 : 160, 1, { additive: true });
  const sparks = points(lowEnd ? 24 : 50, 2, { additive: true });

  /* Bodenstaub: 4 Wölkchen pro Schritt, Startzeiten fest auf der Story-Zeit */
  const STEPS = 20;
  const PER = 4;
  const puffSeeds = new Float32Array(STEPS * PER * 4);
  const puffGeo = new THREE.BufferGeometry();
  puffGeo.setAttribute('seed', new THREE.BufferAttribute(puffSeeds, 4));
  puffGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STEPS * PER * 3), 3));
  const puffU = { t: { value: 0 }, scale: { value: 1 }, footY: { value: 0 }, color: { value: new THREE.Color(0.85, 0.66, 0.45) } };
  const puffs = new THREE.Points(puffGeo, new THREE.ShaderMaterial({ uniforms: puffU, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthTest: false, depthWrite: false }));
  puffs.frustumCulled = false;

  /* Reihenfolge = Zeichenreihenfolge */
  [motes, walkShadow, puffs, walk, ledge, fireShadow, fireJoe, flames, sparks].forEach((o, i) => { o.renderOrder = i + 1; scene.add(o); });

  /* Nachbearbeitung */
  const rt = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false });
  const postU = { tScene: { value: rt.texture }, time: { value: 0 }, grain: { value: 0.045 }, vig: { value: 0.55 }, res: { value: new THREE.Vector2(1, 1) } };
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: postU, vertexShader: VERT, fragmentShader: POST_FRAG, depthTest: false, depthWrite: false })));

  let W = 1;
  let H = 1;
  function resize() {
    W = stage.clientWidth || window.innerWidth;
    H = stage.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    rt.setSize(Math.round(W * dpr), Math.round(H * dpr));
    postU.res.value.set(W * dpr, H * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  stage.prepend(canvas);

  /* --- Kamera: Mitte (Welt-x), Höhe des sichtbaren Ausschnitts ------------------------- */
  function view(cx, cy, zoom) {
    const v = W / H;
    let h = 1 / zoom;
    if (h * v > A - 0.04) h = (A - 0.04) / v;   /* sehr breite Fenster: Breite begrenzen */
    h = Math.min(h, 0.98);
    const w = h * v;
    const x = clamp(cx, w / 2 + 0.02, A - w / 2 - 0.02);
    const y = clamp(cy, h / 2 + 0.01, 1 - h / 2 - 0.01);
    return { x, y, w, h, l: x - w / 2, r: x + w / 2, b: y - h / 2, t: y + h / 2 };
  }

  /* Kamerafahrt über die ganze Story. Werte: [Zeit, Welt-x] usw. */
  const narrow = () => W / H < 0.9;
  function cam(t) {
    const n = narrow();
    const x = keys(t, n
      ? [[0, 0.9], [0.9, 0.95], [1.05, 0.95], [1.95, 1.55], [2.3, 1.35], [2.9, 1.35], [3.35, 2.0], [3.9, 2.0], [4.35, 1.45], [5, 1.45]]
      : [[0, 0.95], [0.9, 1.0], [1.05, 1.0], [1.95, 1.4], [2.3, 1.25], [2.9, 1.25], [3.35, 1.5], [3.9, 1.5], [4.35, 1.2], [5, 1.2]]);
    const zoom = keys(t, [[0, 1.18], [0.95, 1.02], [1.95, 1.0], [2.35, 1.22], [2.9, 1.22], [3.35, 1.0], [3.9, 1.02], [4.4, 1.08], [5, 1.08]]);
    const y = keys(t, [[0, 0.56], [1, 0.5], [2.35, 0.5], [3.35, 0.52], [5, 0.48]]);
    return view(x, y, zoom);
  }

  /* Feuerplatz: fest in der Welt, aus dem Ausschnitt am Ende berechnet */
  function firePlace() {
    const v = cam(5);
    return { x: v.l + v.w * (narrow() ? 0.42 : 0.6), y: v.b + v.h * (narrow() ? 0.2 : 0.14), s: v.h };
  }

  /* Felskante (rechts im Bild): Oberkante je Welt-x aus dem Bild abgelesen */
  const LEDGE = { x: 2.02, y: 0.47 };

  const clock0 = performance.now();

  function render() {
    const t = clamp(getTime(), 0, 5);
    const now = (performance.now() - clock0) / 1000;
    const v = cam(t);
    camera.left = v.l; camera.right = v.r; camera.bottom = v.b; camera.top = v.t;
    camera.updateProjectionMatrix();
    const px = H / v.h; /* Pixel (CSS) pro Welteinheit */

    /* Tageszeit: Nacht → Morgen → Mittag → Abend → Nacht */
    const toDawn = seg(t, 0.05, 0.9);
    const toNoon = seg(t, 1.85, 2.35);
    const toSunset = seg(t, 2.9, 3.35);
    const toNight = seg(t, 3.75, 4.3);
    let wN = 1 - toDawn;
    let wD = toDawn * (1 - toNoon);
    let wM = toNoon * (1 - toSunset);
    let wS = toSunset * (1 - toNight);
    wN += toNight;
    plateU.w.value.set(wN, wD, wM, wS);

    /* Parallax: je weiter die Kamera von der Mitte weg ist, desto mehr wandert der Vordergrund */
    plateU.par.value.set(-(v.x - 1.2) * 0.22 / A, -(v.y - 0.5) * 0.12);
    plateU.dolly.value.set(v.x / A, v.y, (1 / v.h - 1) * 0.12);

    /* Sonne: geht im Morgengrauen auf, steht mittags hoch, geht abends unter */
    const sx = keys(t, [[0, 0.4], [1.9, 0.42], [2.35, 0.55], [2.9, 0.55], [3.2, 0.284], [5, 0.284]]);
    const sy = keys(t, [[0, 0.44], [0.9, 0.53], [1.9, 0.56], [2.35, 1.05], [2.9, 1.05], [3.2, 0.56], [3.85, 0.5], [5, 0.45]]);
    const sa = keys(t, [[0, 0], [0.9, 0.85], [1.9, 0.75], [2.35, 0.45], [2.9, 0.45], [3.25, 0.9], [3.75, 0.5], [4.1, 0], [5, 0]]);
    plateU.sun.value.set(sx, sy, sa);
    plateU.sunCol.value.setRGB(1.0, lerp(0.55, 0.85, toNoon * (1 - toSunset)), lerp(0.25, 0.6, toNoon * (1 - toSunset)));

    /* Schwebender Staub im Licht (Szene 1–4) */
    const mu = motes.material.uniforms;
    mu.time.value = now;
    mu.scale.value = px * dpr;
    mu.origin.value.set(v.x, v.b);
    mu.spread.value.set(v.w * 1.1, v.h * 0.9);
    mu.opacity.value = 0.55 * seg(t, 0.4, 1.0) * (1 - seg(t, 3.7, 4.2));
    motes.visible = mu.opacity.value > 0.001;

    /* --- Szene 2: Joe läuft ------------------------------------------------- */
    const jH = (narrow() ? 0.4 : 0.47) * v.h;
    const enter = seg(t, 1.0, 1.45);
    const sxJoe = narrow() ? lerp(-0.35, 0.42, enter) : lerp(-0.12, 0.34, enter);
    const jx = v.l + v.w * sxJoe + v.w * 0.04 * seg(t, 1.45, 2.0);
    const jy = v.b + v.h * (narrow() ? 0.1 : 0.055);
    const wOp = seg(t, 1.0, 1.06) * (1 - seg(t, 2.08, 2.2));
    walk.visible = wOp > 0.001;
    walkShadow.visible = walk.visible;
    puffs.visible = walk.visible;
    if (walk.visible) {
      const frames = meta.count;
      const f = Math.floor(((t - 1.0) * 4.6 * frames) % frames + frames) % frames;
      const col = f % meta.cols;
      const row = Math.floor(f / meta.cols);
      const cw = 1 / meta.cols;
      const ch = 1 / meta.rows;
      const u = walk.material.uniforms;
      u.cell.value.set(col * cw, 1 - (row + 1) * ch, cw, ch);
      walk.scale.set(jH * walk.userData.aspect, jH, 1);
      walk.position.set(jx, jy, 0);
      u.opacity.value = wOp;
      /* Morgenlicht von hinten links: Figur abdunkeln, warme Kante */
      const day = toNoon;
      u.shade.value.setRGB(lerp(0.66, 1.0, day), lerp(0.56, 0.95, day), lerp(0.52, 0.88, day));
      u.rimCol.value.setRGB(0.95, 0.55, 0.22).multiplyScalar(0.55 * (1 - day));
      u.rimDir.value.set(-0.006 * cw * 8, 0.002);
      u.lift.value = 0.04;
      u.liftCol.value.setRGB(0.55, 0.38, 0.3);
      walkShadow.scale.set(jH * 0.42, jH * 0.05, 1);
      walkShadow.position.set(jx + jH * 0.02, jy + jH * 0.005, 0);
      walkShadow.material.uniforms.opacity.value = 0.45 * wOp;

      /* Staubwolken: bei jedem Auftreten (zwei pro Zyklus) */
      const cyclesPerT = 4.6;
      for (let s = 0; s < STEPS; s++) {
        const ts = 1.0 + (s + 0.25) / (cyclesPerT * 2);
        for (let k = 0; k < PER; k++) {
          const i = (s * PER + k) * 4;
          if (!puffSeeds[i + 3]) {
            puffSeeds[i + 2] = Math.random();
            puffSeeds[i + 3] = 0.01 + Math.random() * 0.99;
          }
          puffSeeds[i] = ts + k * 0.008;
          /* Welt-x der Füße zum Zeitpunkt des Schritts (Figur ist an den Ausschnitt gebunden) */
          const vs = cam(ts);
          const e = seg(ts, 1.0, 1.45);
          const sxs = narrow() ? lerp(-0.35, 0.42, e) : lerp(-0.12, 0.34, e);
          puffSeeds[i + 1] = vs.l + vs.w * sxs + vs.w * 0.04 * seg(ts, 1.45, 2.0) + (s % 2 ? 0.02 : -0.03) * jH * 2;
        }
      }
      puffGeo.attributes.seed.needsUpdate = true;
      puffU.t.value = t;
      puffU.scale.value = px * dpr;
      puffU.footY.value = jy + jH * 0.02;
    }

    /* --- Szene 4: Joe auf der Felskante ------------------------------------- */
    const lOp = seg(t, 3.25, 3.45) * (1 - seg(t, 4.0, 4.15));
    ledge.visible = lOp > 0.001;
    if (ledge.visible) {
      const lh = 0.2;
      const u = ledge.material.uniforms;
      ledge.scale.set(lh * ledge.userData.aspect, lh, 1);
      ledge.position.set(LEDGE.x, LEDGE.y - 0.004 + (1 - seg(t, 3.25, 3.5)) * -0.02, 0);
      u.opacity.value = lOp;
      /* Gegenlicht: fast Silhouette, die Abendsonne zeichnet eine Kante */
      const dusk = seg(t, 3.6, 4.1);
      u.shade.value.setRGB(lerp(0.42, 0.18, dusk), lerp(0.3, 0.16, dusk), lerp(0.28, 0.2, dusk));
      u.rimCol.value.setRGB(1.0, 0.5, 0.18).multiplyScalar(0.7 * (1 - dusk));
      u.rimDir.value.set(-0.006, 0.0);
      u.lift.value = 0;
    }

    /* --- Szene 5: Lagerfeuer -------------------------------------------------- */
    const fp = firePlace();
    const fOn = seg(t, 4.3, 4.6);
    const flick = 0.85 + 0.15 * Math.sin(now * 13.0) * Math.sin(now * 7.3 + 1.0) + 0.06 * Math.sin(now * 31.0);
    plateU.fire.value.set(fp.x / A, fp.y, fOn * 0.9 * flick);
    const fScale = fp.s; /* Feuergröße am Ausschnitt ausrichten */
    [flames, sparks].forEach((m) => {
      const u = m.material.uniforms;
      u.time.value = now;
      u.scale.value = px * dpr;
      u.origin.value.set(fp.x, fp.y);
      u.opacity.value = fOn;
      m.visible = fOn > 0.001;
    });
    flames.material.uniforms.spread.value.set(0.05 * fScale, 0.12 * fScale);
    sparks.material.uniforms.spread.value.set(0.05 * fScale, 0.32 * fScale);
    fireJoe.visible = fOn > 0.001;
    fireShadow.visible = fireJoe.visible;
    if (fireJoe.visible) {
      const fh = (narrow() ? 0.3 : 0.36) * fScale;
      const u = fireJoe.material.uniforms;
      fireJoe.scale.set(fh * fireJoe.userData.aspect, fh, 1);
      fireJoe.position.set(fp.x + fh * fireJoe.userData.aspect * 0.62, fp.y - fh * 0.06, 0);
      u.opacity.value = seg(t, 4.4, 4.65);
      u.shade.value.setRGB(0.8 + 0.2 * flick, 0.62 + 0.14 * flick, 0.52 + 0.08 * flick);
      u.rimCol.value.setRGB(1.0, 0.45, 0.12).multiplyScalar(0.4 * flick);
      u.rimDir.value.set(-0.005, -0.002);
      u.lift.value = 0;
      fireShadow.scale.set(fh * 1.1, fh * 0.08, 1);
      fireShadow.position.set(fireJoe.position.x, fp.y - fh * 0.05, 0);
      fireShadow.material.uniforms.opacity.value = 0.5 * u.opacity.value;
    }

    /* Rendern: Szene → Textur → Nachbearbeitung */
    postU.time.value = now;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  }

  /* Nur rendern, wenn die Story sichtbar ist (Akku) */
  function loop() {
    requestAnimationFrame(loop);
    const r = stage.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) render();
  }
  loop();

  return { render };
}
