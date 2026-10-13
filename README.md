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

## Aufbau der Seite

```
index.html              Startseite (Hub): zwei Hälften „Joe Laredo“ / „PSGOTRICH“
joe-laredo/index.html   Scroll-Story „Ride Into Town“ + geparkter Rohinhalt (<template id="rohinhalt">)
psgotrich/index.html    PSGOTRICH: Porträt + 3D-Chrom-Name
impressum.html, datenschutz.html, 404.html
assets/css/base.css     gemeinsames CSS (Farben, Schriften, Animationen, alle Bausteine)
assets/css/hub.css      nur für die Startseite
assets/js/              main.js (Scroll-Effekte), fluid.js, ascii.js, names3d.js (3D),
                        termine.js, stats.js
fotos/                  Fotos (ohne Metadaten, JPG + WebP)
fonts/                  Basement Grotesque (Headlines), Figtree (Text) – SIL Open Font License
vendor/three/           three.js (MIT) + Basement Grotesque als 3D-Schriftdatei
content/                Termine, Follower (für das CMS)
docs/                   Backend-Plan, Follower-Tool
```

Alle Pfade sind relativ, damit alles unter `…github.io/Joe-PS/` funktioniert.
Unterseiten verweisen mit `../` auf `assets/`, `fotos/` usw.

## Scroll-Story „Ride Into Town“ (/joe-laredo/)

- Eine gepinnte Sektion, Scroll = Zeit, 5 Szenen à 1 Bildschirmhöhe Scrollweg.
- GSAP + ScrollTrigger 3.13 vom CDN (jsDelivr) mit SRI-Prüfsumme. In `datenschutz.html` erwähnt.
- Landschaft komplett als SVG in `joe-laredo/index.html` (Himmel, Sterne, Sonne, 3 Mesa-Ebenen).
- Animiert wird nur `transform` und `opacity`.

```
assets/js/story/story.js           Steuerung: Master-Timeline, Pin, Szenen-Reihenfolge
assets/js/story/landscape.js       Parallax der Mesa-Ebenen über die ganze Story
assets/js/story/dust.js            Buchstaben → Staubpartikel (aus der echten Buchstabenform)
assets/js/story/scene1-sunrise.js  Szene 1: Sonnenaufgang, Name zerfällt zu Staub
assets/js/story/scene2.js          Szene 2: The Ride (Läufer, Parallax, Bodenstaub, Bio-Satz, Tumbleweed)
assets/js/story/scene3.js … 5.js   leer, für die nächsten Szenen
assets/css/story.css               Styles der Story
```

Joe als Silhouette (Szene 2): Foto als `assets/img/joe1.jpg` ablegen, dann

```
pip install "rembg[cpu]" pillow
python3 scripts/freistellen.py assets/img/joe1.jpg
```

Das erzeugt `joe1-cutout.webp` (freigestellt) und `joe1-silhouette.webp` (dunkel mit Lichtkante)
und trägt die Silhouette in `joe-laredo/index.html` ein (`data-photo`). Ohne Foto läuft eine Platzhalter-Figur.

Neue Szene bauen: in `sceneN.js` die Funktion `build(tl, t0, ctx)` füllen. `t0` ist der Startzeitpunkt der
Szene auf der Timeline, jede Szene ist 1 Einheit lang.

## Farben

| Name | Wert | Einsatz |
| --- | --- | --- |
| Asphalt | `#141210` | Hintergrund |
| Bone | `#E8DFCC` | Text |
| Camel Gold | `#E6A92B` | Akzent, Joe |
| Oxblood | `#7C241D` | Joe-Stimmung |
| Dusk Blue | `#33465F` | PS-Stimmung |
| Faded Khaki | `#9A8863` | Nebentext |

Definiert ganz oben in `assets/css/base.css` (`:root`).
