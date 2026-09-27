/* ASCII-Darstellung des Fotos.
   Das Bild wird in Zeichen zerlegt, flimmert leicht und hat Glitch-Streifen.
   Unter Maus/Finger erscheint das echte Foto (schwarz-weiß). */
(function () {
  var box = document.querySelector('.ascii');
  if (!box) return;
  var img = box.querySelector('img');
  var canvas = box.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAMP = ' .,:-=+*#%@';
  var GLITCH = '!/\\|<>_~^*+#%@01';
  var FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  var dpr, W, H, fs, cw, cols, rows, lum, gray, shift, born;
  var pointer = null;
  var reveal = 0;

  function load() {
    if (img.complete && img.naturalWidth) setup();
    else img.addEventListener('load', setup, { once: true });
  }

  /* Bild so zuschneiden, dass es die Fläche füllt (wie object-fit: cover) */
  function drawCover(c, w, h) {
    var ir = img.naturalWidth / img.naturalHeight, r = w / h;
    var sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (ir > r) { sw = sh * r; sx = (img.naturalWidth - sw) / 2; }
    else { sh = sw / r; sy = (img.naturalHeight - sh) / 2; }
    c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = box.clientWidth;
    H = box.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fs = W < 500 ? 7 : 9;
    ctx.font = fs + 'px ' + FONT;
    cw = ctx.measureText('M').width;
    cols = Math.floor(W / cw);
    rows = Math.floor(H / fs);

    /* Helligkeit pro Zeichenzelle */
    var s = document.createElement('canvas');
    s.width = cols;
    s.height = rows;
    var sc = s.getContext('2d');
    drawCover(sc, cols, rows);
    var d = sc.getImageData(0, 0, cols, rows).data;
    lum = new Float32Array(cols * rows);
    for (var i = 0; i < cols * rows; i++) {
      lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
    }
    /* Tonwerte automatisch strecken (dunkles Clubfoto), dann leicht aufhellen */
    var sorted = Array.prototype.slice.call(lum).sort(function (m, n) { return m - n; });
    var lo = sorted[Math.floor(sorted.length * 0.04)];
    var hi = sorted[Math.floor(sorted.length * 0.985)];
    for (var q = 0; q < lum.length; q++) {
      var v = Math.min(1, Math.max(0, (lum[q] - lo) / (hi - lo || 1)));
      lum[q] = Math.pow(v, 0.75);
    }

    /* Schwarz-Weiß-Version für die Lupe */
    gray = document.createElement('canvas');
    gray.width = canvas.width;
    gray.height = canvas.height;
    var gc = gray.getContext('2d');
    drawCover(gc, gray.width, gray.height);
    var gd = gc.getImageData(0, 0, gray.width, gray.height);
    var p = gd.data;
    for (var j = 0; j < p.length; j += 4) {
      var g = 0.299 * p[j] + 0.587 * p[j + 1] + 0.114 * p[j + 2];
      p[j] = p[j + 1] = p[j + 2] = g;
    }
    gc.putImageData(gd, 0, 0);

    shift = new Float32Array(rows);
    box.classList.add('is-on');
    if (reduce) {
      reveal = rows;
      draw(0);
    } else if (!born) {
      born = true;
      requestAnimationFrame(loop);
    }
  }

  function draw(t) {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, W, H);
    ctx.font = fs + 'px ' + FONT;
    ctx.textBaseline = 'top';

    /* Glitch-Streifen: einzelne Zeilenbänder springen seitlich */
    if (!reduce && Math.random() < 0.06) {
      var start = Math.floor(Math.random() * rows);
      var len = 1 + Math.floor(Math.random() * 6);
      var amt = (Math.random() - 0.5) * 16;
      for (var k = start; k < Math.min(rows, start + len); k++) shift[k] = amt;
    }

    var levels = [[], [], []];
    for (var y = 0; y < rows; y++) {
      var a = '', b = '', c = '';
      var visibleRow = y < reveal;
      for (var x = 0; x < cols; x++) {
        var l = lum[y * cols + x];
        var ch;
        if (!visibleRow) {
          ch = y < reveal + 3 && Math.random() < 0.5 ? GLITCH[(Math.random() * GLITCH.length) | 0] : ' ';
          l = 0.9;
        } else if (!reduce && Math.random() < 0.012) {
          ch = GLITCH[(Math.random() * GLITCH.length) | 0];
        } else {
          ch = RAMP[Math.min(RAMP.length - 1, (l * RAMP.length) | 0)];
        }
        /* auf drei Helligkeitsstufen verteilen */
        if (l > 0.66) { a += ch; b += ' '; c += ' '; }
        else if (l > 0.33) { a += ' '; b += ch; c += ' '; }
        else { a += ' '; b += ' '; c += ch; }
      }
      levels[0][y] = a;
      levels[1][y] = b;
      levels[2][y] = c;
    }

    var tones = ['rgba(240,245,255,1)', 'rgba(195,210,235,0.85)', 'rgba(150,165,195,0.6)'];
    for (var lv = 0; lv < 3; lv++) {
      ctx.fillStyle = tones[lv];
      for (var r = 0; r < rows; r++) {
        ctx.fillText(levels[lv][r], shift[r] * cw, r * fs);
      }
    }

    for (var z = 0; z < rows; z++) shift[z] *= 0.82;

    /* Scanlines */
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (var sy = 0; sy < H; sy += 3) ctx.fillRect(0, sy, W, 1);

    /* Lupe: echtes Foto unter dem Zeiger */
    if (pointer) {
      var R = Math.min(W, H) * 0.2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(gray, 0, 0, W, H);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, R, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  var visible = false;
  var lastT = 0;
  function loop(t) {
    if (visible && !document.hidden && t - lastT > 45) {
      lastT = t;
      if (reveal < rows) reveal += Math.max(1, rows / 40);
      draw(t);
    }
    requestAnimationFrame(loop);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.15 }).observe(box);
  } else {
    visible = true;
  }

  function setPointer(cx, cy) {
    var r = canvas.getBoundingClientRect();
    pointer = { x: cx - r.left, y: cy - r.top };
    if (reduce) draw(0);
  }
  box.addEventListener('pointermove', function (e) { setPointer(e.clientX, e.clientY); });
  box.addEventListener('pointerdown', function (e) { setPointer(e.clientX, e.clientY); });
  box.addEventListener('pointerleave', function () { pointer = null; if (reduce) draw(0); });
  box.addEventListener('touchend', function () { pointer = null; });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (box.clientWidth !== W) setup(); }, 200);
  });

  load();
})();
