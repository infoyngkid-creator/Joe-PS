(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Abschnitte beim Scrollen einblenden
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

  // Lichtkegel folgt der Maus im Hero: links warm (Joe), rechts kalt (psg). Nur Desktop.
  var hero = document.querySelector('.hero');
  if (hero && !reduce && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
      hero.style.setProperty('--t', ((e.clientX - r.left) / r.width).toFixed(3));
    });
  }

  // Laufender Timecode im Vlog-Bildschirm
  var tc = document.querySelector('.timecode');
  if (tc && !reduce) {
    var start = performance.now();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var tick = function (now) {
      var t = (now - start) / 1000;
      var f = Math.floor((t % 1) * 25);
      var s = Math.floor(t) % 60;
      var m = Math.floor(t / 60) % 60;
      var h = Math.floor(t / 3600);
      tc.textContent = pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // YouTube erst nach Klick laden (Zwei-Klick-Lösung)
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
