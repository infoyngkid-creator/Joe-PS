/* Echte 3D-Namen (WebGL / three.js, lokal eingebunden).
   - Jeder Buchstabe ist ein eigenes 3D-Modell mit abgerundeten Kanten.
   - JOELAREDO: Messing (warm), PSGOTRICH: Chrom (kalt), Studio-Licht mit Spiegelungen.
   - Zustand wird zu 100 % aus der Scroll-Position berechnet (keine hängenden Reste).
   - three.js wird erst geladen, wenn man in die Nähe des Abschnitts scrollt.
   - Ohne WebGL oder bei „Bewegung reduzieren“ bleibt die normale Schrift stehen. */

const scene3d = document.querySelector('.duo-scene');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

if (scene3d && !reduce && hasWebGL() && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      start().catch(() => document.documentElement.classList.remove('gl-names'));
    }
  }, { rootMargin: '150% 0px' });
  io.observe(scene3d);
}

async function start() {
  const THREE = await import('./vendor/three/three.module.min.js');
  const { FontLoader } = await import('./vendor/three/FontLoader.js');
  const { TextGeometry } = await import('./vendor/three/TextGeometry.js');
    const fontData = await (await fetch('vendor/three/archivo-black.typeface.json')).json();
  const font = new FontLoader().parse(fontData);

  const stage = scene3d.querySelector('.stage');
  const members = [...scene3d.querySelectorAll('[data-member]')];
  const small = window.innerWidth < 700;

  /* ---------- Renderer, Kamera, Licht ---------- */

  const canvas = document.createElement('canvas');
  canvas.className = 'names-gl';
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);

  /* Studio-Umgebung: dunkler Raum mit hellen Lichtstreifen (Softboxen).
     Erzeugt die harten, sauberen Spiegelkanten auf Chrom und Messing. */
  function studio() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x060607);
    const panel = (w, h, x, y, z, k) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    panel(14, 2.2, 0, 9, 3, 2.4);    // Deckenstreifen
    panel(1.4, 10, -8, 1, 4, 1.8);   // Streifen links
    panel(1.2, 10, 8, 0, -1, 1.2);   // Streifen rechts
    panel(10, 1, 0, -4, 9, 0.8);     // flaches Licht von vorn unten
    panel(16, 5, 0, 2, -10, 0.25);   // weiche Rückwand

    /* Große Fläche hinter der Kamera mit Verlauf und Horizont:
       spiegelt sich in den Vorderseiten (klassischer Chrom-Look) */
    const g = new THREE.PlaneGeometry(36, 24, 1, 24);
    const pos = g.attributes.position;
    const col = [];
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + 12) / 24;         // 0 unten … 1 oben
      let k;
      if (t > 0.52) k = 0.35 + Math.pow((t - 0.52) / 0.48, 1.4) * 1.9;   // Himmel: hell nach oben
      else if (t > 0.47) k = 2.2;                                        // Horizontlinie
      else k = 0.02 + t * 0.12;                                          // Boden: fast schwarz
      col.push(k, k, k);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const sky = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    sky.position.set(0, 0, 14);
    sky.lookAt(0, 0, 0);
    env.add(sky);
    return pmrem.fromScene(env, 0.02).texture;
  }
  scene.environment = studio();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.set(0, 0, 20);

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(8, -2, -6);
  scene.add(rim);

  const materials = {
    warm: new THREE.MeshPhysicalMaterial({ color: 0xd9b27c, metalness: 0.92, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.25 }),
    cold: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fb, metalness: 1, roughness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.04 })
  };
  const rimColors = { warm: new THREE.Color(0xffb46b), cold: new THREE.Color(0x9cc4ff) };

  /* ---------- Buchstaben bauen ---------- */

  const DEPTH = 0.3;
  const groups = members.map((m) => {
    const h = m.querySelector('.name3d');
    const text = (h.getAttribute('aria-label') || h.textContent).trim();
    const tone = m.classList.contains('tone-warm') ? 'warm' : 'cold';
    const group = new THREE.Group();
    const letters = [];
    let x = 0;
    let maxH = 0;
    [...text].forEach((ch, idx) => {
      const glyph = fontData.glyphs[ch];
      const adv = (glyph ? glyph.ha : 500) / fontData.resolution;
      if (ch !== ' ') {
        const geo = new TextGeometry(ch, {
          font, size: 1, depth: DEPTH, curveSegments: small ? 5 : 8,
          bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.018, bevelSegments: small ? 2 : 4
        });
        geo.computeBoundingBox();
        const c = new THREE.Vector3();
        geo.boundingBox.getCenter(c);
        geo.translate(-c.x, -c.y, -c.z);
        maxH = Math.max(maxH, geo.boundingBox.max.y - geo.boundingBox.min.y);
        const mesh = new THREE.Mesh(geo, materials[tone]);
        mesh.userData.home = new THREE.Vector3(x + c.x, c.y, 0);
        letters.push({ mesh, idx });
        group.add(mesh);
      }
      x += adv;
    });
    const width = x;
    const mid = (letters.length - 1) / 2;
    letters.forEach((l, i) => {
      l.mesh.userData.home.x -= width / 2;
      l.mesh.userData.home.y -= 0.36; /* optische Mitte der Großbuchstaben */
      const side = mid ? (i - mid) / mid : 0;
      const up = Math.random() < 0.5 ? -1 : 1;
      l.fly = new THREE.Vector3(side * (5 + Math.random() * 3) + (Math.random() - 0.5) * 2, up * (3.5 + Math.random() * 3), -4 + Math.random() * 6);
      l.spin = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 3);
      l.mesh.position.copy(l.mesh.userData.home);
    });
    scene.add(group);
    group.visible = false;
    return { el: h, group, letters, tone, width };
  });

  document.documentElement.classList.add('gl-names');

  /* ---------- Größe und Position an das HTML koppeln ---------- */

  let W = 1, H = 1, worldPerPx = 1;
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / H;
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  function place(g) {
    /* Name dort platzieren, wo die (unsichtbare) HTML-Überschrift steht */
    const sr = stage.getBoundingClientRect();
    const r = g.el.getBoundingClientRect();
    const fontPx = parseFloat(getComputedStyle(g.el).fontSize) || 120;
    const scale = fontPx * worldPerPx * 0.98;
    const cx = (r.left + r.width / 2 - sr.left - W / 2) * worldPerPx;
    const cy = -(r.top + r.height / 2 - sr.top - H / 2) * worldPerPx;
    g.group.scale.setScalar(scale);
    g.group.position.set(cx, cy, 0);
  }

  /* ---------- Maus-Neigung (nur Desktop) ---------- */

  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * 0.25;
      tilt.ty = (e.clientY / window.innerHeight - 0.5) * 0.15;
    });
  }

  /* ---------- Scroll-Zustand ---------- */

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  function progress() {
    const r = scene3d.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  let slow = 0;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const r = scene3d.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      groups.forEach((g) => { g.group.visible = false; });
      return;
    }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    /* Qualität runterregeln, wenn das Gerät nicht hinterherkommt */
    if (dt > 0.034) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 40 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
      slow = 0;
    }

    tilt.x += (tilt.tx - tilt.x) * 0.06;
    tilt.y += (tilt.ty - tilt.y) * 0.06;

    const p = progress();
    const n = groups.length;
    groups.forEach((g, i) => {
      const raw = p * n - i;
      const q = clamp(raw, 0, 1);
      const inRange = raw >= 0 && raw <= 1;
      /* Erster Name startet fertig, letzter endet fertig – zerlegt wird nur beim Wechsel */
      const sIn = i === 0 ? 0 : 1 - ease(clamp(q / 0.42, 0, 1));
      const sOut = i === n - 1 ? 0 : easeIn(clamp((q - 0.58) / 0.42, 0, 1));
      const s = Math.max(sIn, sOut);
      g.group.visible = inRange && s < 0.999;
      if (!g.group.visible) return;

      place(g);
      const x = q * 2 - 1;
      g.group.rotation.set(-x * 0.1 + tilt.y, x * 0.22 + tilt.x + Math.sin(now / 2400) * 0.03, 0);
      g.letters.forEach((l) => {
        const m = l.mesh;
        m.position.set(
          m.userData.home.x + l.fly.x * s,
          m.userData.home.y + l.fly.y * s,
          m.userData.home.z + l.fly.z * s
        );
        m.rotation.set(l.spin.x * s, l.spin.y * s, l.spin.z * s);
      });
      rim.color.copy(rimColors[g.tone]);
    });

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
