/* Musik-Player: Status-Text und Streaming-Links aus content/musik.json.
   Sicherheit wie bei den Terminen: nur Text (textContent), Links nur https, Längen begrenzt. */
(function () {
  var base = document.currentScript ? document.currentScript.src : location.href;
  var list = document.querySelector('.stream-links');
  var status = document.querySelector('[data-musik-status]');
  if (!list || !window.fetch) return;

  function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
  function safeUrl(v) {
    try {
      var u = new URL(str(v, 300));
      return u.protocol === 'https:' ? u.href : '';
    } catch (e) { return ''; }
  }

  fetch(new URL('../../content/musik.json', base), { cache: 'no-cache', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      var st = str(data.status, 80);
      if (st && status) status.textContent = st;
      var links = Array.isArray(data.links) ? data.links : [];
      links.slice(0, 8).forEach(function (l) {
        var name = str(l && l.plattform, 40);
        var url = safeUrl(l && l.url);
        if (!name || !url) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = url;
        a.rel = 'noopener noreferrer';
        a.textContent = name;
        var arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = ' ↗';
        a.appendChild(arrow);
        li.appendChild(a);
        list.appendChild(li);
      });
      if (list.children.length) list.hidden = false;
    })
    .catch(function () {});
})();
