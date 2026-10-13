# Backend-Plan: Inhalte selbst pflegen + Termine

> Positionierung: JOE&PS sind öffentliche Personen. Die Website ist ihr **Press Kit (EPK)** –
> für Presse, Brands/Kooperationen und Events, nicht nur für Clubs.

Stand: Planung. Es läuft noch kein Server. Ziel ist, dass ihr Texte, Fotos, Zahlen und Termine
selbst ändern könnt, ohne Code anzufassen – und dass dabei nichts angreifbar wird.

## Grundprinzip: so wenig Server wie möglich

Der sicherste Server ist der, den es nicht gibt. Die Website bleibt eine **statische Seite auf
GitHub Pages**. Inhalte liegen als **Dateien im Repository** (`content/…`). Ein Redaktions-Tool
(CMS) ändert nur diese Dateien. Dadurch:

- keine Datenbank, die gehackt oder geleakt werden kann
- kein Server, der Updates braucht
- jede Änderung ist in der Git-Historie sichtbar und rückgängig zu machen (= automatisches Backup)
- Besucher der Seite geben keine Daten ab

## Optionen im Vergleich

| | A) Git-basiertes CMS (Empfehlung) | B) Headless CMS mit Datenbank | C) Eigener Server |
|---|---|---|---|
| Beispiel | Pages CMS, Decap CMS | Supabase (EU/Frankfurt), Directus | Hetzner-Server (DE) |
| Login | über GitHub-Konto (mit 2FA) | eigenes Login-System | eigenes Login-System |
| Kosten am Anfang | 0 € | 0 € (Free-Tier) | ab ca. 5 €/Monat |
| Angriffsfläche | sehr klein | mittel (API, Datenbank, Keys) | groß (Server, Updates, Härtung) |
| Pflegeaufwand | kaum | gering | hoch |
| Kann Formulare speichern | nein (dafür Phase 3) | ja | ja |
| DSGVO | keine Besucherdaten | AVV nötig, EU-Region wählen | AVV mit Hoster, alles selbst |

**Empfehlung:** A für Inhalte und Termine. Falls später ein Booking-Formular kommt, dafür eine
einzelne kleine Funktion in der EU (Phase 3) – getrennt vom Rest.

## Phasen

### Phase 0 – erledigt
- `content/termine.json`: Termine als Datei. Leer = Abschnitt unsichtbar.
- `termine.js`: zeigt Termine an. Alles wird **nur als Text** eingefügt (nie als HTML),
  Links nur mit `https://`, Längen begrenzt, alte Termine fallen raus.
- **Content Security Policy** auf allen Seiten: Der Browser führt nur Code von dieser Domain aus.
  Fremde Skripte, Tracker oder eingeschleuster Code werden blockiert.

### Phase 0b – erledigt
- **Follower: Entscheidung = manuell pflegen.** Zahlen stehen in `content/stats.json` und werden
  im Pages CMS unter „Follower“ eingetragen. Ein automatischer Abruf über die offizielle Instagram-API
  ist vorbereitet (`.github/workflows/follower.yml`), aber abgeschaltet. Anleitung: `docs/follower-tool.md`.
- **Pages CMS vorbereitet:** `.pages.yml` gibt nur `content/termine.json` und `content/stats.json` zur Bearbeitung frei.
  Ein Zugang (euer GitHub-Konto). Einrichtung siehe README.

### Phase 1 – Inhalte in Dateien, Build-Schritt
- Alle Texte, Zahlen, Fotos in `content/site.json` (bzw. Markdown) verschieben.
- Kleiner Build (z. B. Eleventy) über **GitHub Actions** baut daraus fertige HTML-Seiten.
  Wichtig für Google: Inhalte stehen dann direkt im HTML, nicht erst per JavaScript.
- GitHub Pages auf „Source: GitHub Actions“ umstellen.

### Phase 2 – Redaktions-Oberfläche
- CMS anbinden (Konfigurationsdatei im Repo, z. B. `.pages.yml` für Pages CMS).
- Felder: Hero-Text, Über-uns, Fakten pro Person, Follower-Zahlen, Fotos, Termine.
- Zugriff nur für eure zwei GitHub-Konten, App-Rechte nur auf dieses eine Repository.

### Phase 3 – optional: Booking-Formular
- Serverlose Funktion in der EU (z. B. Frankfurt), schickt Anfragen per Mail an euch.
- Spam-Schutz ohne Google (z. B. Friendly Captcha, EU), Rate-Limit, Pflichtfelder prüfen.
- Keine Speicherung der Anfragen, nur Weiterleitung. Datenschutzerklärung ergänzen.

## Sicherheits-Checkliste (gilt für alle Phasen)

- [ ] **2-Faktor-Login** für beide GitHub-Konten aktivieren
- [ ] Branch-Schutz für `main` prüfen (kein Löschen, kein Force-Push)
- [ ] GitHub **Secret Scanning** und **Dependabot** im Repo einschalten
- [ ] Keine Passwörter, Tokens oder Keys im Repository – nie
- [x] Inhalte nur als Text ausgeben, Links prüfen
- [x] Content Security Policy
- [ ] CMS-App nur auf dieses Repository beschränken
- [ ] Bei Phase 3: Auftragsverarbeitungsvertrag (AVV) mit dem Anbieter, EU-Region

## Offene Entscheidungen

1. ~~Wer pflegt Inhalte?~~ → ein Zugang
2. ~~Drittanbieter-CMS okay?~~ → ja, Pages CMS
3. Braucht ihr in den nächsten Monaten ein Booking-Formular, oder reicht die E-Mail?
