# Übergabe: JOE&PS Website

Stand: 13.10.2026. Dieses Dokument reicht, um das Projekt in einer neuen Sitzung ohne Vorwissen weiterzuführen.

## 1. Projekt in einem Absatz

Statische Website (GitHub Pages, kein Build) für das Creator-Duo **JOE&PS** aus Bremen: **Joe Laredo** (Instagram/TikTok `@joelaredeo_`) und **PSGOTRICH** (`@psgotrich_`). Positionierung: **EPK / Press Kit für öffentliche Personen** (Presse, Brands, Events), nicht nur Clubs. Booking-Mail: `con.joe-laredo@outlook.de`.

- Repo: `infoyngkid-creator/Joe-PS`, Branch `main` (Push auf `main` = live nach ca. 1 Minute)
- Live: https://infoyngkid-creator.github.io/Joe-PS/ · `/joe-laredo/` · `/psgotrich/`

## 2. Feste Regeln des Kunden (nicht verhandelbar)

- Keine Fakten über das Duo erfinden. Fehlende Daten = sichtbarer Platzhalter.
- Kein Tracking, keine externen Requests. Einzige Ausnahme: GSAP + ScrollTrigger von jsDelivr mit SRI (steht in `datenschutz.html`).
- `noindex` bleibt auf allen Seiten, bis das Impressum echte Daten hat.
- Niemals nach Passwörtern oder Tokens im Chat fragen. Keine Tokens oder privaten Daten ins Repo.
- Der Kunde will nach Design-Arbeit **Screenshots sehen** (Desktop + Handy).
- Antworten kurz und direkt („Caveman Mode“), auf Deutsch.
- Higgsfield-Credits sind knapp (**250**). Vor jeder Generierung Preis nennen, nur nach Freigabe generieren.

## 3. Aufbau

```
index.html              Hub: zwei Hälften Joe Laredo / PSGOTRICH, Socials, Mail
joe-laredo/index.html   Scroll-Story „Ride Into Town“ + geparkter Rohinhalt in <template id="rohinhalt"> (nicht löschen)
psgotrich/index.html    PS-Seite: Porträt + 3D-Chrom-Name (three.js, assets/js/names3d.js)
impressum.html, datenschutz.html (Platzhalter in [ECKIGEN KLAMMERN]), 404.html
assets/css/base.css     Tokens, Fonts, Buttons, Kassette, Nav, Footer
assets/css/hub.css      nur Hub
assets/css/story.css    nur Story
assets/js/story/        story.js (Steuerung) + landscape.js, dust.js, scene1-sunrise.js, scene2.js … scene5.js
assets/img/land/        gemalte Mesa-Ebenen (scripts/landschaft.py) + grain.png
content/*.json          Termine, Follower, Musik (Pages CMS, .pages.yml)
scripts/                freistellen.py (rembg birefnet-portrait), landschaft.py, mesa-formen.svg, update-followers.mjs
vendor/three/           three.js 0.170 (lokal)
fonts/                  Basement Grotesque (Headlines), Figtree (Text)
```

**CSP:** Jede Seite hat eine CSP per Meta-Tag. Inline-Script nur per sha256-Hash (`document.documentElement.classList.add('js')`). `/joe-laredo/` erlaubt zusätzlich `https://cdn.jsdelivr.net`.

**Palette:** Asphalt `#141210` · Bone `#E8DFCC` · Camel Gold `#E6A92B` · Oxblood `#7C241D` · Dusk Blue `#33465F` · Faded Khaki `#9A8863`.

## 4. Scroll-Story Joe („Ride Into Town“), aktueller Stand

Eine gepinnte Sektion, Scroll = Zeit, 5 Szenen à 1 Timeline-Einheit. Szenen-Vertrag: `export default { name, build(tl, t0, ctx), destroy() }`, `ctx = { root, stage, small, view }`.

**Tempolimit:** In `story.js` folgt die Timeline dem Scroll weich mit maximal `MAX_SPEED = 0.38` Szenen/Sekunde (kein ScrollTrigger-scrub mehr).

| Szene | Inhalt |
|---|---|
| 1 Sunrise | Sonne geht auf, Name „Joe Laredo“ zerfällt zu Staub |
| 2 The Ride | Western-Silhouette mit Gelenk-Gangzyklus läuft ein, Parallax, Staub, Bio-Satz, Tumbleweed |
| 3 High Noon | Sandstein-Licht, Foto von Joe (Platzhalter), Steckbrief „Wanted“ (Platzhalter, Kunde liefert echten Mugshot) |
| 4 Sundown | Oxblood → Dusk Blue, Silhouette auf Felskante, MUSIC + Player (`content/musik.json`) |
| 5 Campfire | Nacht, Sterne, Lagerfeuer, Booking-Button, Socials, „Zurück zum Start“ |

**Feedback des Kunden zum Stand:** „Konzept perfekt, sieht aber scheiße aus.“ Es soll **richtig 3D, professionell, krass** aussehen. Die SVG/2D-Technik ist am Limit, deshalb kommt der Umbau unten.

## 5. Nächstes Ziel: 3D-Umbau mit KI-Bildmaterial

**Technik:** three.js (liegt in `vendor/three/`).
- Hintergrund-Plates aus Higgsfield + selbst erzeugte Tiefenkarten (Depth Anything, lokal) → 2.5D-Kamerafahrt.
- Tageszeiten per Überblendung deckungsgleicher Plates.
- Bloom, Staub- und Feuerpartikel.
- Joe als freigestellte Figuren und als Frame-Sequenz aus einem Lauf-Video, abgespielt per Scroll.
- Qualitätsstufen für schwache Handys.
- Das Tempolimit bleibt.

**Reihenfolge:** Erst Prototyp Joe Szene 1–2 mit Screenshots zur Freigabe, dann Szene 3–5, dann PS.

### 5.1 Joe – freigegebener Look (für alle Higgsfield-Prompts)

**Gesicht** (nach echten Fotos):
- ovales Gesicht mit kantiger Kinnlinie, ca. 21 Jahre
- volle Lippen, betonte Unterlippe
- gerade, mittelbreite Nase mit runder Spitze
- grau-grüne, leicht verhangene Augen
- gerade hellbraune Augenbrauen, oft leicht gerunzelte Stirn
- leichter, lückiger Bart an Kinn und Oberlippe
- helle Haut mit natürlicher Textur

**Haare:** mittelbraun, nass zurückgegelt, hinten bis Kragenlänge.

**Körper:** schlank-athletisch, nicht bullig.

**Outfit** (vom Kunden festgelegt):
- **Oxblood-rote**, gebrauchte Lederjacke mit Hemdkragen und Reißverschluss, bis zur Brustmitte zu
- weißes **Slim-Fit-T-Shirt mit engem Rundhals** (kein Tanktop)
- **kleines silbernes Kreuz** an einer Kugelkette über dem Shirt
- hell gewaschene **Levi's 501**
- braunes Ledergürtel mit Western-Messingschnalle
- hellbraune **Timberland-Style** Wildleder-Boots
- Hände in den Taschen oder in braunen Leder-Arbeitshandschuhen
- Pilotenbrille (Gold, Verlaufsglas) **nur in Szene 2**
- **kein Cowboyhut**

**Wichtig:** Joe hat Tattoos an Brust, Schulter, Armen und auf der Hand. Kleidung und Prompt müssen sie verdecken: hoher Ausschnitt, Ärmel bis übers Handgelenk, Hände verdeckt. Im Prompt immer Marken beschreiben statt nennen, sonst entstehen Logo- und Textfehler.

**Referenzbilder:** Liegen beim Kunden (Desktop-Ordner `ref` + `zusatz`), **nicht im Repo**. Verwenden: echte Fotos (College-Jacke frontal, Cap-Selfie, Spiegel-Selfie nasse Haare, Selfie mit Pilotenbrille) + KI-Sheet ohne Shirt (Körper). Nicht verwenden: KI-Sheet mit offener Jacke (zu massig, zeigt Tattoo). Notiz des Kunden zu den KI-Sheets: Gesicht 70–80 % richtig, Rest 90 %.

### 5.2 Higgsfield-Plan Joe (Preise live geprüft)

Nano Banana Pro: 2 Credits (2K) / 4 Credits (4K). Seedance 2.0, 5 s, 720p, ohne Ton: 22,5 Credits.

| # | Asset | Modell | max. Versuche | Credits max. |
|---|---|---|---|---|
| J0 | Look-Sheet 2×2 (vorne, hinten, Gesicht, Profil), grauer Hintergrund → **Freigabe Kunde** | Nano Banana Pro 2K 1:1 | 3 | 6 |
| L1 | Canyon-Panorama 21:9, Morgengrauen (Tal, Mesas, Felskante rechts, Sandfläche Mitte) → **Freigabe** | Nano Banana Pro 4K | 2 | 8 |
| L2–L4 | dasselbe Bild als Mittag / Sonnenuntergang / Sternennacht (Edit mit L1 als Referenz, deckungsgleich) | Nano Banana Pro 4K | 3 + 3 Reserve | 24 |
| J1 | Ganzkörper seitlich im Schritt, Handschuhe, Pilotenbrille, grauer Hintergrund | Nano Banana Pro 2K | 2 | 4 |
| J2 | Lauf-Video, Kamera fährt seitlich mit, Figur bleibt mittig → **Freigabe** | Seedance 2.0 720p 5 s | 2 | 45 |
| J3 | Felskante: von hinten-seitlich, Hände in Taschen, oranges Gegenlicht | Nano Banana Pro 2K | 2 | 4 |
| J4 | Lagerfeuer: sitzt auf Baumstamm, Handschuhe, warmes Licht von unten | Nano Banana Pro 2K | 2 | 4 |
| — | Mugshot Szene 3 | macht der Kunde selbst | — | 0 |
| | **Joe gesamt (Obergrenze)** | | | **95** |

Rest ca. 155 Credits für PS. Alle Figuren vor einfarbigem Hintergrund, dann mit `scripts/freistellen.py` freistellen.

**Prompt J0 (wörtlich):**
```
Photorealistic 2x2 character reference sheet of the same young man (age 21), seamless mid-grey studio backdrop, soft even key light, 85mm lens.
Panels: top-left full body front view, top-right full body back view, bottom-left head-and-shoulders front, bottom-right head profile facing left.
Face exactly as reference photos: oval face with defined jawline, full lips with pronounced lower lip, straight medium nose with soft rounded tip, grey-green slightly hooded eyes, straight light-brown eyebrows, slight frown, light patchy stubble on chin and upper lip, fair skin with natural texture and slight blemishes.
Hair: medium brown, wet-look slicked straight back with gel, collar length at the nape, a few loose strands at the sides.
Build: slim athletic, not bulky.
Outfit: dark oxblood-red distressed leather jacket with shirt collar and zipper, zipped to mid-chest; white slim-fit t-shirt with a high tight crew neckline; small silver cross pendant on a silver ball chain over the t-shirt; light stone-wash classic straight-leg 501-style jeans, slightly loose, stacked over the boots; brown leather belt with brass western buckle; wheat-tan nubuck 6-inch lace-up work boots; hands in jacket pockets.
No visible tattoos, no tank top, no open chest, no rolled sleeves, no bare forearms, no visible hands, no cowboy hat, no full beard, no logos, no text.
```

**Status:** Noch **nichts generiert**, 250 Credits vorhanden. Higgsfield-CLI ist auf dem Mac des Kunden eingerichtet (Workspace „Private“). In Cloud-Sitzungen müssen `higgsfield.ai`, `*.higgsfield.ai` und `*.cloudfront.net` in den Netzwerk-Freigaben stehen. Der Claude-Connector „Higgsfield AI“ kann nur lesen, nicht generieren.

### 5.3 PS-Konzept „After Hours“ (nach Joe)

Gegenstück zu Joe: Joe endet nachts am Feuer, PS endet im Morgengrauen über der Stadt. Stimmung kalt, Chrom, Blitzlicht, Dusk Blue, Iced Silver.

1. **Cold Open:** Blitz, 3D-Chrom-Name PSGOTRICH taucht auf
2. **Night Drive:** nasse Straße, Laternen, Regen, Bio-Satz
3. **Flash:** Paparazzi-Blitze, Backstage-Pass am Lanyard mit Facts (Gegenstück zum Steckbrief)
4. **Ice:** vereiste Chrom-Kassette/Vinyl, Player + Links
5. **Rooftop:** Bremen bei Nacht → Morgengrauen, Booking in Iced Silver, Socials, Zurück zum Start

Für PS werden eigene Referenzfotos und ein eigener Look-Plan gebraucht (gleiches Vorgehen wie Joe, Tattoos ebenfalls verdecken).

## 6. Offen beim Kunden

- **Impressum-Daten.** Danach `noindex` entfernen (Hub, Joe, PS).
- **Mugshot** für Szene 3 (macht der Kunde selbst), Inhalte für den Steckbrief.
- **J0-Freigabe**, danach der Rest des Higgsfield-Plans.
- Optional: Streaming-Links und Follower-Zahlen über Pages CMS.

## 7. Arbeitsweise / Testen

- **Lokal:** `python3 -m http.server 8765` im Repo. Achtung: Der Higgsfield-CLI-Login nutzt ebenfalls Port 8765, dann einen anderen Port nehmen.
- **Story-Tests mit Playwright:** jsDelivr ist in der Cloud blockiert. GSAP lokal per `page.route('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/*', …)` aus dem npm-Paket `gsap@3.13.0` ausliefern (gleiche SRI-Prüfsumme). Wegen des Tempolimits nach dem Scrollen 4–6 s warten, bevor der Screenshot kommt.
- **Freistellen:** `pip install "rembg[cpu]" pillow` → `python3 scripts/freistellen.py <bild>` (Modell birefnet-portrait).
- **Commits:** Deutsch, beschreibend. Push direkt auf `main`.
