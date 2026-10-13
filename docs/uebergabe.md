# Übergabe: JOE&PS Website

Stand: 13.10.2026. Mit diesem Dokument kann eine neue Sitzung die Website ohne Vorwissen weiterbauen.

## 1. Projekt

Statische Website (GitHub Pages, kein Build) für das Creator-Duo **JOE&PS** aus Bremen: **Joe Laredo** (Instagram/TikTok `@joelaredeo_`) und **PSGOTRICH** (`@psgotrich_`). Positionierung: **EPK / Press Kit für öffentliche Personen** (Presse, Brands, Events), nicht nur Clubs. Booking-Mail: `con.joe-laredo@outlook.de`.

- Repo `infoyngkid-creator/Joe-PS`, Branch `main`. Ein Push ist nach ca. 1 Minute live.
- Live-Adressen:
  - https://infoyngkid-creator.github.io/Joe-PS/
  - …/joe-laredo/
  - …/psgotrich/

## 2. Regeln des Kunden

- Keine Fakten über das Duo erfinden. Fehlende Daten werden als sichtbarer Platzhalter gezeigt.
- Kein Tracking, keine externen Requests. Einzige Ausnahme: GSAP + ScrollTrigger 3.13 von jsDelivr mit SRI (steht in `datenschutz.html`).
- `noindex` bleibt auf allen Seiten, bis das Impressum echte Daten hat.
- Nie nach Passwörtern oder Tokens fragen. Keine Tokens, privaten Daten oder Referenzfotos ins Repo (das Repo ist öffentlich).
- Antworten auf Deutsch, kurz und direkt („Caveman Mode“).
- Nach Design-Arbeit **Screenshots zeigen** (Desktop + Handy).
- Der Kunde will **professionell, „richtig 3D“, krass**. Die aktuelle 2D/SVG-Optik findet er nicht gut genug (Zitat: „Konzept perfekt, sieht aber scheiße aus“).

## 3. Aufbau

```
index.html              Hub: zwei Hälften Joe Laredo / PSGOTRICH, Socials, Mail
joe-laredo/index.html   Scroll-Story „Ride Into Town“ + geparkter Rohinhalt in <template id="rohinhalt"> (nicht löschen)
psgotrich/index.html    PS-Seite: Porträt + 3D-Chrom-Name (three.js, assets/js/names3d.js)
impressum.html, datenschutz.html (Platzhalter in [ECKIGEN KLAMMERN]), 404.html
assets/css/             base.css (Tokens, Fonts, Buttons, Kassette), hub.css, story.css
assets/js/story/        story.js (Steuerung) + landscape.js, dust.js, scene1-sunrise.js, scene2.js … scene5.js
assets/img/land/        gemalte Mesa-Ebenen (scripts/landschaft.py) + grain.png
assets/gen/joe/         (kommt) KI-Material aus Higgsfield, siehe Abschnitt 6
content/*.json          Termine, Follower, Musik – im Pages CMS editierbar (.pages.yml)
scripts/                freistellen.py (rembg birefnet-portrait), landschaft.py, mesa-formen.svg, update-followers.mjs
tools/story-shots.js    Screenshots der Story für die Abnahme
vendor/three/           three.js 0.170 (lokal) + Basement-Grotesque-Typeface
fonts/                  Basement Grotesque (Headlines), Figtree (Text)
```

**CSP:** Jede Seite hat eine CSP als Meta-Tag. Inline-Script ist nur per sha256-Hash erlaubt (`document.documentElement.classList.add('js')` → `sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw=`). `/joe-laredo/` erlaubt zusätzlich `https://cdn.jsdelivr.net`. Wenn eine neue Quelle dazukommt, die CSP anpassen.

**GSAP-SRI:**

| Datei | Prüfsumme |
|---|---|
| `gsap.min.js` | `sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc` |
| `ScrollTrigger.min.js` | `sha384-P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh` |

**Palette:** Asphalt `#141210` · Bone `#E8DFCC` · Camel Gold `#E6A92B` · Oxblood `#7C241D` · Dusk Blue `#33465F` · Faded Khaki `#9A8863`.

## 4. Scroll-Story Joe („Ride Into Town“), aktueller Stand

Eine gepinnte Sektion, Scroll = Zeit, 5 Szenen mit je 1 Einheit auf der Master-Timeline.

- **Szenen-Vertrag:** `export default { name, build(tl, t0, ctx), destroy() }` mit `ctx = { root, stage, small (<700px), view }`.
- **`view`:** sichtbarer Ausschnitt der SVG (viewBox 1600×900, `xMidYMax slice`). Am Handy ist nur die Mitte sichtbar.
- **Tempolimit:** Die Timeline ist pausiert. `story.js` führt sie per `gsap.ticker` weich dem Scroll nach, mit höchstens `MAX_SPEED = 0.38` Szenen pro Sekunde.

| Szene | Inhalt | Platzhalter |
|---|---|---|
| 1 Sunrise | Sonne geht auf, „Joe Laredo“ zerfällt zu Staub | – |
| 2 The Ride | Western-Silhouette mit Gelenk-Gangzyklus, Parallax, Staub, Bio-Satz, Tumbleweed | Figur (wird KI-Lauf-Video) |
| 3 High Noon | Sandstein-Licht, Foto von Joe, Steckbrief „Wanted“ | Foto + Steckbrief (Kunde liefert echten Mugshot und Inhalte) |
| 4 Sundown | Oxblood → Dusk Blue, Silhouette auf Felskante, MUSIC + Player (`content/musik.json`) | Silhouette |
| 5 Campfire | Nacht, Sterne, Lagerfeuer, Booking-Button, Socials, „Zurück zum Start“ | Feuer wirkt comichaft |

## 5. Nächstes Ziel: 3D-Umbau der Joe-Story

Das Konzept bleibt, die Technik wird gewechselt:

1. **three.js-Bühne** statt SVG, in einem Canvas hinter den HTML-Texten. Die Scroll-Steuerung (`story.js`, Tempolimit) bleibt und treibt Kamera und Uniforms.
2. **2.5D-Hintergrund:** Landschafts-Plate + Tiefenkarte (Depth Anything V2, lokal per Python erzeugen) als verschobene Plane bzw. Parallax-Shader. So fährt die Kamera echt räumlich.
3. **Tageszeiten:** vier deckungsgleiche Plates (Morgengrauen, Mittag, Sonnenuntergang, Nacht) per Shader überblenden.
4. **Figuren:** freigestellte PNGs als Billboards. Szene 2 nutzt eine Frame-Sequenz aus dem Lauf-Video (ffmpeg → rembg → WebP-Sequenz), abgespielt per Scroll.
5. **Effekte:** Bloom (Sonne, Feuer), Staub- und Funkenpartikel, Partikel-Feuer mit flackerndem Licht, Filmkorn, Vignette.
6. **Qualitätsstufen:** schwache Handys bekommen weniger Partikel und kein Bloom. Mit `prefers-reduced-motion` gibt es statische Bilder.
7. **Reihenfolge:** Erst der Prototyp für Szene 1–2 mit Screenshots zur Freigabe, dann Szene 3–5, dann PS.

**Was jetzt schon ohne KI-Material geht:** Bühne, Shader, Tiefenkarten-Pipeline, Frame-Sequenz-Player und Effekte mit Platzhalter-Bildern bauen. Als Platzhalter dienen die vorhandenen Ebenen in `assets/img/land/` und `fotos/`. Sobald `assets/gen/joe/` gefüllt ist, nur noch die Dateien tauschen.

## 6. KI-Material (Higgsfield)

Die Generierung läuft **getrennt in einer lokalen Claude-Code-Sitzung auf dem Mac des Kunden**. Nur dort sind Higgsfield-CLI, Login und Referenzfotos verfügbar. Cloud-Sitzungen erreichen Higgsfield nicht, deshalb hier **nichts generieren**. Der Auftrag dafür liegt beim Kunden als eigenes Dokument („Higgsfield-Auftrag Joe“).

**Lieferung ins Repo** unter `assets/gen/joe/` mit `README.md` (Job-IDs, Modelle, Credits):

| Datei | Inhalt | Verwendung |
|---|---|---|
| `j0-sheet.png` | Look-Sheet Joe (vorne, hinten, Gesicht, Profil) | nur Referenz |
| `l1-dawn.webp` | Canyon 21:9 Morgengrauen: Mesas hinten, Felskante rechts, Sandfläche Mitte/links | Szene 1–2 |
| `l2-noon.webp` | dieselbe Szene, Mittag | Szene 3 |
| `l3-sunset.webp` | dieselbe Szene, Sonnenuntergang | Szene 4 |
| `l4-night.webp` | dieselbe Szene, Sternennacht | Szene 5 |
| `j1-walk.png` | Joe seitlich im Schritt, grauer Hintergrund | Startbild / Fallback Szene 2 |
| `j2-walk.mp4` | 5 s Lauf-Video, Kamera fährt mit, grauer Hintergrund | Frame-Sequenz Szene 2 |
| `j3-ledge.png` | Joe von hinten, Gegenlicht, dunkler Hintergrund | Szene 4 auf der Felskante |
| `j4-campfire.png` | Joe sitzend auf Baumstamm, Licht von unten, schwarzer Hintergrund | Szene 5 am Feuer |

**Status:** noch nicht geliefert. Higgsfield-Guthaben bei Übergabe: 250 Credits.

**Joes Look:** Oxblood-Lederjacke, weißes T-Shirt, kleines Kreuz an Kugelkette, hell gewaschene 501, Western-Gürtel, hellbraune Boots, Handschuhe oder Hände in den Taschen. Pilotenbrille nur in Szene 2.

## 7. PSGOTRICH: Konzept „After Hours“ (nach Joe)

Gegenstück zu Joe: Joe endet nachts am Feuer, PS endet im Morgengrauen über der Stadt. Stimmung: kalt, Chrom, Blitzlicht, Dusk Blue, Iced Silver.

1. **Cold Open:** Blitz, 3D-Chrom-Name PSGOTRICH taucht auf (`names3d.js` wiederverwenden)
2. **Night Drive:** nasse Straße, Laternen, Regen, Bio-Satz
3. **Flash:** Paparazzi-Blitze, Backstage-Pass am Lanyard mit Facts (Gegenstück zum Steckbrief)
4. **Ice:** vereiste Chrom-Kassette/Vinyl, Player + Links
5. **Rooftop:** Bremen bei Nacht → Morgengrauen, Booking in Iced Silver, Socials, Zurück zum Start

## 8. Offen beim Kunden

- **Impressum-Daten.** Danach `noindex` entfernen (Hub, Joe, PS).
- **Mugshot und Steckbrief-Inhalte** für Szene 3.
- Higgsfield-Material Joe (läuft lokal), danach PS.
- Optional: Streaming-Links und Follower-Zahlen über Pages CMS.

## 9. Arbeitsweise und Testen

- **Lokal:** `python3 -m http.server 8000` im Repo.
- **Screenshots:** `npm i --no-save playwright gsap@3.13.0`, dann `node tools/story-shots.js out 0,1.5,2.6,3.6,4.8` (in der Cloud ist Playwright global installiert: `NODE_PATH=$(npm root -g) node tools/story-shots.js …`, dann reicht `npm i --no-save gsap@3.13.0`). Das ergibt Desktop + iPhone und gibt JS-Fehler aus. jsDelivr ist in der Cloud gesperrt, deshalb liefert das Tool GSAP aus `node_modules` aus. In Cloud-Sitzungen ist Chromium vorinstalliert, also kein `playwright install` ausführen.
- **Freistellen:** `pip install "rembg[cpu]" pillow` → `python3 scripts/freistellen.py <bild>`.
- **Landschaft neu malen:** `python3 scripts/landschaft.py` (Formen in `scripts/mesa-formen.svg`).
- **Commits:** auf Deutsch und beschreibend, direkt auf `main`.
