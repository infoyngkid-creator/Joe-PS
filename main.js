(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Text-Decoding: Zeichen laufen durch, bis das Wort steht ---------- */

  var CHARS = '!<>-_\\/[]{}=+*^?#%@01';

  function scramble(el) {
    if (reduce || el.dataset.busy) return;
    var final = el.dataset.text || (el.dataset.text = el.textContent);
    el.dataset.busy = '1';
    var frame = 0;
    var total = 14 + final.length * 1.5;
    (function tick() {
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var settle = (i / final.length) * total * 0.7 + total * 0.3;
        if (frame >= settle || final[i] === ' ') out += final[i];
        else out += CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) requestAnimationFrame(tick);
      else {
        el.textContent = final;
        delete el.dataset.busy;
      }
    })();
  }

  var scrambles = document.querySelectorAll('[data-scramble]');
  scrambles.forEach(function (el) {
    el.dataset.text = el.textContent;
    if (finePointer) el.addEventListener('pointerenter', function () { scramble(el); });
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

    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          scramble(e.target);
          so.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    scrambles.forEach(function (el) { so.observe(el); });
  }

  /* ---------- Scroll: Fortschritt, Hero-Parallax, Laufband ---------- */

  var progress = document.querySelector('.progress');
  var heroInner = document.querySelector('.hero .wrap');
  var track = document.querySelector('.ticker-track');
  var lastY = window.scrollY;
  var velocity = 0;
  var tickerX = 0;
  var dir = 1;

  if (track && !reduce) track.classList.add('js-driven');

  var prevT = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - prevT) / 1000);
    prevT = now;
    var y = window.scrollY;
    var dy = y - lastY;
    lastY = y;
    velocity += (dy - velocity) * 0.2;
    if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }

    if (heroInner && !reduce) {
      var h = window.innerHeight;
      if (y < h * 1.2) {
        var k = y / h;
        heroInner.style.transform = 'translate3d(0,' + (y * 0.35) + 'px,0)';
        heroInner.style.opacity = String(Math.max(0, 1 - k * 1.2));
      }
    }

    if (track && !reduce) {
      var half = track.scrollWidth / 2;
      tickerX -= (40 + Math.min(900, Math.abs(velocity) * 30)) * dt * dir;
      if (tickerX <= -half) tickerX += half;
      if (tickerX > 0) tickerX -= half;
      track.style.transform = 'translate3d(' + tickerX + 'px,0,0)';
      track.style.fontStyle = Math.abs(velocity) > 8 ? 'italic' : 'normal';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Cursor-Ring und magnetische Buttons (nur Desktop) ---------- */

  var cursor = document.querySelector('.cursor');
  if (cursor && finePointer && !reduce) {
    var cx = -100, cy = -100, tx = -100, ty = -100;
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
    });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest && e.target.closest('a, button, .ascii');
      cursor.classList.toggle('is-hot', !!hot);
    });
    (function follow() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(follow);
    })();

    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + mx * 0.25 + 'px,' + my * 0.35 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Lichtkegel im Hero (nur Desktop) ---------- */

  var hero = document.querySelector('.hero');
  if (hero && !reduce && finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- Laufender Timecode im Vlog-Bildschirm ---------- */

  var tc = document.querySelector('.timecode');
  if (tc && !reduce) {
    var start = performance.now();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var tick = function (now) {
      var t = (now - start) / 1000;
      tc.textContent = pad(Math.floor(t / 3600)) + ':' + pad(Math.floor(t / 60) % 60) + ':' + pad(Math.floor(t) % 60) + ':' + pad(Math.floor((t % 1) * 25));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

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
