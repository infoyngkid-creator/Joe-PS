(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var small = window.innerWidth < 700;

  /* Ohne reduzierte Bewegung: Scroll-Szenen (Bühnen bleiben stehen, Inhalte drehen sich) */
  root.classList.add(reduce ? 'no-scrolly' : 'scrolly');

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- Text-Decoding (nur im Hero) ---------- */

  var CHARS = '!<>-_\\/[]{}=+*^?#%@01';
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    if (reduce) return;
    var final = el.textContent;
    var frame = 0;
    var total = 18 + final.length * 2;
    (function tick() {
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var settle = (i / final.length) * total * 0.7 + total * 0.3;
        out += frame >= settle || final[i] === ' ' ? final[i] : CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (frame++ < total) requestAnimationFrame(tick);
      else el.textContent = final;
    })();
  });

  /* ---------- Einblenden beim Scrollen ---------- */

  var items = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Porträts: ASCII-Ebene für den Glitch ---------- */

  var RAMP = ' .:-=+*#%@';
  function buildAscii(portrait) {
    var img = portrait.querySelector('img');
    var pre = portrait.querySelector('.ascii-layer');
    if (!img || !pre) return;
    function run() {
      var cols = small ? 38 : 52;
      var w = portrait.clientWidth || 300;
      var fs = w / cols / 0.6;
      var rows = Math.ceil(portrait.clientHeight / fs) || Math.round(cols * 1.25 * 0.6);
      var c = document.createElement('canvas');
      c.width = cols;
      c.height = rows;
      var x = c.getContext('2d');
      try {
        x.drawImage(img, 0, 0, cols, rows);
        var d = x.getImageData(0, 0, cols, rows).data;
      } catch (e) {
        return;
      }
      var out = '';
      for (var y = 0; y < rows; y++) {
        for (var k = 0; k < cols; k++) {
          var p = (y * cols + k) * 4;
          var l = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255;
          out += RAMP[Math.min(RAMP.length - 1, Math.floor(Math.pow(l, 0.8) * RAMP.length))];
        }
        out += '\n';
      }
      pre.textContent = out;
      pre.style.fontSize = fs.toFixed(2) + 'px';
    }
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener('load', run, { once: true });
  }

  function glitch(portrait) {
    if (reduce) return;
    portrait.classList.remove('reveal');
    void portrait.offsetWidth;
    portrait.classList.add('reveal');
  }

  var portraits = document.querySelectorAll('.portrait');
  portraits.forEach(function (p) {
    buildAscii(p);
    p.addEventListener('click', function () { glitch(p); });
  });

  /* ---------- Scroll-Schleife ---------- */

  var progress = document.querySelector('.progress');
  var heroInner = document.querySelector('.hero-inner');
  var wide = document.querySelector('.wide');
  var duo = document.querySelector('.duo-scene');
  var members = duo ? duo.querySelectorAll('[data-member]') : [];
  var tapeScene = document.querySelector('.tape-scene');
  var tape = document.querySelector('.tape');
  var tracks = document.querySelectorAll('.tracks li');

  function sceneProgress(el) {
    var r = el.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  var lastY = window.scrollY;
  var velocity = 0;
  var spin = 0;
  var activeMember = -1;
  var activeTrack = -1;
  var prevT = performance.now();

  function frame(now) {
    var dt = Math.min(0.05, (now - prevT) / 1000);
    prevT = now;
    var vh = window.innerHeight;
    var y = window.scrollY;
    velocity += (y - lastY - velocity) * 0.2;
    lastY = y;

    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }

    if (reduce) return;

    /* Hero schiebt sich langsamer weg */
    if (heroInner && y < vh * 1.2) {
      heroInner.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0)';
      heroInner.style.opacity = String(Math.max(0, 1 - (y / vh) * 1.2));
    }

    /* Großes Bild: Parallax */
    if (wide) {
      var wr = wide.getBoundingClientRect();
      if (wr.bottom > 0 && wr.top < vh) {
        var k = (wr.top + wr.height / 2 - vh / 2) / vh;
        wide.style.setProperty('--py', (k * -70).toFixed(1) + 'px');
        wide.style.setProperty('--ps', (1.06 + Math.abs(k) * 0.05).toFixed(3));
      }
    }

    /* Die zwei: gleiche Regeln wie names3d.js – erster Name startet fertig, letzter endet fertig */
    if (duo && members.length) {
      var p = sceneProgress(duo);
      var n = members.length;
      var current = -1;
      for (var i = 0; i < n; i++) {
        var m = members[i];
        var raw = p * n - i;
        var q = clamp(raw, 0, 1);
        var inRange = raw >= 0 && raw <= 1;
        var fadeIn = i === 0 ? 1 : clamp(q / 0.16, 0, 1);
        var fadeOut = i === n - 1 ? 1 : clamp((1 - q) / 0.16, 0, 1);
        var o = inRange ? Math.min(fadeIn, fadeOut) : 0;
        m.style.setProperty('--o', o.toFixed(3));
        if (o > 0.01) {
          if (current < 0 || o > 0.5) current = i;
          var sIn = i === 0 ? 0 : 1 - ease(clamp(q / 0.42, 0, 1));
          var sOut = i === n - 1 ? 0 : Math.pow(clamp((q - 0.58) / 0.42, 0, 1), 3);
          var sc = Math.max(sIn, sOut);
          m.style.setProperty('--sc', sc.toFixed(3));
          m.querySelector('.portrait').style.setProperty('--s', (1.08 - 0.08 * ease(clamp(q / 0.5, 0, 1))).toFixed(3));
        }
        m.classList.toggle('is-active', o > 0.01);
      }
      if (current !== activeMember) {
        if (current >= 0) {
          glitch(members[current].querySelector('.portrait'));
          duo.dataset.tone = members[current].classList.contains('tone-warm') ? 'warm' : 'cold';
        }
        activeMember = current;
      }
    }

    /* Kassette: dreht sich von Seite A auf Seite B */
    if (tape && tapeScene) {
      var tr = tapeScene.getBoundingClientRect();
      if (tr.bottom > -vh && tr.top < vh * 2) {
        var tp = sceneProgress(tapeScene);
        tape.style.setProperty('--ry', (-32 + tp * 244).toFixed(2) + 'deg');
        tape.style.setProperty('--rx', (16 - tp * 8 + Math.sin(tp * Math.PI) * 10).toFixed(2) + 'deg');
        tape.style.setProperty('--rz', (Math.sin(tp * Math.PI * 2) * 4).toFixed(2) + 'deg');
        tape.style.setProperty('--ty', (Math.sin(now / 900) * 6 - Math.sin(tp * Math.PI) * 14).toFixed(1) + 'px');
        spin += (60 + Math.min(1400, Math.abs(velocity) * 40)) * dt;
        tape.style.setProperty('--spin', (spin % 360).toFixed(1) + 'deg');
        var t = Math.min(tracks.length - 1, Math.floor(tp * tracks.length));
        if (t !== activeTrack) {
          tracks.forEach(function (li, j) { li.classList.toggle('is-on', j === t); });
          activeTrack = t;
        }
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduce) window.addEventListener('scroll', function () { frame(performance.now()); }, { passive: true });

  window.addEventListener('resize', function () {
    clearTimeout(window._rs);
    window._rs = setTimeout(function () { portraits.forEach(buildAscii); }, 250);
  });

  /* ---------- Bio kopieren ---------- */

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.querySelector(btn.getAttribute('data-copy'));
      if (!src || !navigator.clipboard) return;
      navigator.clipboard.writeText(src.textContent.trim()).then(function () {
        var t = btn.textContent;
        btn.textContent = 'Kopiert';
        setTimeout(function () { btn.textContent = t; }, 1600);
      });
    });
  });

  /* ---------- YouTube erst nach Klick laden (Zwei-Klick-Lösung) ---------- */

  document.querySelectorAll('.yt-load').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.video + '?autoplay=1';
      f.title = 'YouTube-Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });
})();
