# JOE x PS – Website

Statische Website (HTML + CSS, kein Build-Schritt), gehostet über GitHub Pages:
https://infoyngkid-creator.github.io/Joe-PS/

## Texte ändern

Datei auf GitHub öffnen → Stift-Symbol → ändern → „Commit changes“. Nach ca. 1 Minute ist die Änderung live.

| Was | Wo |
| --- | --- |
| Duo-Name (aktuell Platzhalter `JOE x PS`) | Überall: in allen `.html`-Dateien per Suchen & Ersetzen `JOE x PS` ersetzen (Titel, Beschreibung, Logo, Hero, JSON-LD, 404) |
| Satz unter dem Namen | `index.html`, `<p class="hero-lead">` |
| Booking-E-Mail (Platzhalter `booking@example.com`) | `index.html`, Button „Booking anfragen“ |
| Social-Links | `index.html`: Hero, Vlog-Bereich, Footer und JSON-LD (`sameAs`) |
| Impressum (Platzhalter in `[ECKIGEN KLAMMERN]`) | `impressum.html` und `datenschutz.html` (Abschnitt „Verantwortlicher“) |
| Farben | `style.css`, ganz oben in `:root` |

## Ersten YouTube-Vlog einbinden

In `index.html` im Bereich `club_vlogs.mpg` steht eine Schritt-für-Schritt-Anleitung als Kommentar.
Das Video wird erst nach Klick von `youtube-nocookie.com` geladen. Danach in `datenschutz.html`
den YouTube-Abschnitt aktivieren. Wenn ihr einen YouTube-Kanal habt, den Link auch im Footer und im JSON-LD ergänzen.

## Vor dem Indexieren durch Google

In `index.html` steht `<meta name="robots" content="noindex">`. Erst entfernen, wenn alle Platzhalter ersetzt sind.
Impressum, Datenschutz und 404 behalten `noindex`.

## Dateien

- `index.html` – Startseite
- `impressum.html`, `datenschutz.html` – Rechtstexte
- `404.html` – Fehlerseite (Styles inline)
- `style.css` – Design
- `main.js` – Animationen (Einblenden, Timecode) und YouTube-Klick-zum-Laden
- `fonts/` – Unbounded und Figtree (lokal, WOFF2, Lizenz: SIL Open Font License, siehe `OFL-*.txt`)
- `robots.txt`, `sitemap.xml` – für Suchmaschinen
- `.nojekyll` – GitHub Pages liefert die Dateien unverändert aus
