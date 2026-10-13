/* Follower-Zahlen aus content/stats.json anzeigen (wird täglich automatisch aktualisiert).
   Nur Zahlen werden übernommen, alles andere wird ignoriert. */
(function () {
  var base = document.currentScript ? document.currentScript.src : location.href;
  if (!window.fetch) return;
  fetch(new URL('../../content/stats.json', base), { cache: 'no-cache', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var ig = data && data.instagram;
      if (!ig || typeof ig !== 'object') return;
      document.querySelectorAll('[data-followers]').forEach(function (row) {
        var n = ig[row.getAttribute('data-followers')];
        if (typeof n !== 'number' || !isFinite(n) || n < 0) return;
        row.querySelector('dd').textContent = Math.round(n).toLocaleString('de-DE');
        row.hidden = false;
      });
    })
    .catch(function () {});
})();
