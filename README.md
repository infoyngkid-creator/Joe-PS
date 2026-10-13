# JOE x PS – Website

Statische Website (HTML + CSS, kein Build-Schritt), gehostet über GitHub Pages:
https://infoyngkid-creator.github.io/Joe-PS/

## Texte ändern

Datei auf GitHub öffnen → Stift-Symbol → ändern → „Commit changes“. Nach ca. 1 Minute ist die Änderung live.

| Was | Wo |
| --- | --- |
| Duo-Name (aktuell Platzhalter `JOE x PS`) | Überall: in allen `.html`-Dateien per Suchen & Ersetzen `JOE x PS` ersetzen (Titel, Beschreibung, Logo, Hero, JSON-LD, 404) |
| Text „Nachts in Bremen.“ | `index.html`, Abschnitt Duo-Foto |
| Kassette (Titel, Tracks) | `index.html`, Abschnitt „Kassette“: Liste `tracks` und die Etiketten `label-lines` |
| Leistungen Booking | `index.html`, Abschnitt „Booking“ |
| Satz unter dem Namen | `index.html`, `<p class="lead">` |
| Booking-E-Mail (Platzhalter `booking@example.com`) | `index.html`, 3 Stellen – per Suchen & Ersetzen |
| Social-Links | `index.html`: Abschnitt „Die zwei“, Footer und JSON-LD (`sameAs`) |
| Impressum (Platzhalter in `[ECKIGEN KLAMMERN]`) | `impressum.html` und `datenschutz.html` (Abschnitt „Verantwortlicher“) |
| Farben | `style.css`, ganz oben in `:root` (`--joe-…` warm, `--ps-…` kalt) |
| Zeilen pro Person (Look, Fährt, Follower) | `index.html`, Abschnitt „Die zwei“, Liste `spec` |

## Termine eintragen

Datei `content/termine.json` auf GitHub öffnen → Stift-Symbol → Termine eintragen → Commit. Beispiel:

```json
{
  "termine": [
    { "datum": "2026-11-14", "club": "Name des Clubs", "stadt": "Bremen", "link": "https://…" }
  ]
}
```

`link` ist optional und muss mit `https://` anfangen. Vergangene Termine verschwinden automatisch.
Ist die Liste leer, wird der Abschnitt „Termine“ nicht angezeigt.

## Backend / Sicherheit

Der Plan für ein sicheres Backend (Inhalte selbst pflegen, Termine) steht in `docs/backend-plan.md`.

## Ersten YouTube-Vlog einbinden

In `index.html` steht unten ein Kommentar „VLOG-BEREICH“ als Anleitung.
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
- `main.js` – Scroll-Effekte (3D-Namen, Kassette, Parallax, Porträt-Glitch) und YouTube-Klick-zum-Laden
- `fluid.js` – Flüssigkeits-Effekt im Hero (WebGL, reagiert auf Maus/Finger)
- `ascii.js` – ASCII-Darstellung des Pressefotos mit Lupe
- `termine.js` – zeigt Termine aus `content/termine.json` an (sicher, nur als Text)
- `content/` – Inhalte als Dateien (Vorbereitung fürs Backend)
- `docs/backend-plan.md` – Backend-Plan
- `fotos/` – Fotos (ohne Metadaten, als JPG und WebP). Neues Foto: Datei mit gleichem Namen ersetzen
- `fonts/` – Archivo (Überschriften) und Figtree (Text), lokal, WOFF2, Lizenz: SIL Open Font License, siehe `OFL-*.txt`)
- `robots.txt`, `sitemap.xml` – für Suchmaschinen
- `.nojekyll` – GitHub Pages liefert die Dateien unverändert aus
