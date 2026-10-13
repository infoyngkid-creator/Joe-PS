/* Termine aus content/termine.json anzeigen.
   Sicherheit: Daten werden nur als Text eingefügt (textContent, nie innerHTML),
   Links nur mit https://, alles wird vor der Anzeige geprüft. */
(function () {
  var section = document.getElementById('termine');
  if (!section || !window.fetch) return;
  var list = section.querySelector('.dates');

  function str(v, max) {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  }

  function safeUrl(v) {
    try {
      var u = new URL(str(v, 300));
      return u.protocol === 'https:' ? u.href : '';
    } catch (e) {
      return '';
    }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  fetch('content/termine.json', { cache: 'no-cache', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !Array.isArray(data.termine)) return;
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      var items = data.termine
        .map(function (t) {
          var d = /^\d{4}-\d{2}-\d{2}$/.test(str(t && t.datum, 10)) ? new Date(t.datum + 'T00:00:00') : null;
          return {
            date: d,
            club: str(t && t.club, 80),
            stadt: str(t && t.stadt, 60),
            link: safeUrl(t && t.link)
          };
        })
        .filter(function (t) { return t.date && !isNaN(t.date) && t.club && t.date >= today; })
        .sort(function (a, b) { return a.date - b.date; })
        .slice(0, 12);

      if (!items.length) return;

      items.forEach(function (t) {
        var li = el('li');
        var time = el('time', 'd-date', t.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }));
        time.setAttribute('datetime', t.date.toISOString().slice(0, 10));
        li.appendChild(time);
        li.appendChild(el('span', 'd-club', t.club));
        li.appendChild(el('span', 'd-city', t.stadt));
        if (t.link) {
          var a = el('a', 'd-link', 'Infos');
          a.href = t.link;
          a.rel = 'noopener noreferrer';
          li.appendChild(a);
        }
        list.appendChild(li);
      });
      section.hidden = false;
      section.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); });
    })
    .catch(function () { /* ohne Termine bleibt der Abschnitt einfach unsichtbar */ });
})();
