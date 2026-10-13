# JOE&PS – Website

Statische Website (HTML + CSS, kein Build-Schritt), gehostet über GitHub Pages:
https://infoyngkid-creator.github.io/Joe-PS/

## Texte ändern

Datei auf GitHub öffnen → Stift-Symbol → ändern → „Commit changes“. Nach ca. 1 Minute ist die Änderung live.

| Was | Wo |
| --- | --- |
| Duo-Name `JOE&PS` | in HTML als `JOE&amp;PS` geschrieben (Titel, Logo, Kassette, Footer, Rechtstexte, 404), im JSON-LD als `JOE&PS` |
| Text „Zwei aus Bremen.“ | `index.html`, Abschnitt Duo-Foto |
| Kassette (Titel, Tracks) | `index.html`, Abschnitt „Kassette“: Liste `tracks` und die Etiketten `label-lines` |
| Kurz-Bio, Pressefotos | `index.html`, Abschnitt „Press Kit“ |
| Kontakt-Kategorien | `index.html`, Abschnitt „Kontakt“ |
| Satz unter dem Namen | `index.html`, `<p class="lead">` |
| Booking-E-Mail `con.joe-laredo@outlook.de` | `index.html`, 3 Stellen – per Suchen & Ersetzen |
| Social-Links | `index.html`: Abschnitt „Die zwei“, Footer und JSON-LD (`sameAs`) |
| Impressum (Platzhalter in `[ECKIGEN KLAMMERN]`) | `impressum.html` und `datenschutz.html` (Abschnitt „Verantwortlicher“) |
| Farben | `style.css`, ganz oben in `:root` (`--joe-…` warm, `--ps-…` kalt) |
| Zeilen pro Person (Look, Fährt, Follower) | `index.html`, Abschnitt „Die zwei“, Liste `spec` |

## Inhalte pflegen (Pages CMS)

1. <https://app.pagescms.org> öffnen → „Sign in with GitHub“ (mit dem Konto, dem das Repo gehört).
2. Die Pages-CMS-App **nur für das Repository `Joe-PS`** freigeben.
3. Repo `Joe-PS` wählen → links „Termine“ oder „Follower“ → eintragen → Speichern. Nach ca. 1 Minute live.

Freigegeben sind aktuell Termine und Follower (Konfiguration: `.pages.yml`).

## Follower-Zahlen

Werden manuell gepflegt: Pages CMS → „Follower“ (oder `content/stats.json` direkt bearbeiten).
Leeres Feld = Zeile „Follower“ wird nicht angezeigt. Automatischer Abruf optional: `docs/follower-tool.md`.

## Termine eintragen (ohne CMS)

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
- `stats.js` – zeigt Follower aus `content/stats.json`
- `scripts/update-followers.mjs`, `.github/workflows/follower.yml` – Follower-Tool
- `.pages.yml` – Konfiguration Pages CMS
- `termine.js` – zeigt Termine aus `content/termine.json` an (sicher, nur als Text)
- `content/` – Inhalte als Dateien (Vorbereitung fürs Backend)
- `docs/backend-plan.md` – Backend-Plan
- `fotos/` – Fotos (ohne Metadaten, als JPG und WebP). Neues Foto: Datei mit gleichem Namen ersetzen
- `fonts/` – Archivo (Überschriften) und Figtree (Text), lokal, WOFF2, Lizenz: SIL Open Font License, siehe `OFL-*.txt`)
- `robots.txt`, `sitemap.xml` – für Suchmaschinen
- `.nojekyll` – GitHub Pages liefert die Dateien unverändert aus
