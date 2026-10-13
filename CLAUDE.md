# JOE&PS Website – Kurzkontext für Claude

**Zuerst lesen:** `docs/uebergabe.md` (Stand, Regeln, nächste Schritte).

- Statische Website auf GitHub Pages, kein Build. Push auf `main` = live.
- Live: https://infoyngkid-creator.github.io/Joe-PS/ (`/joe-laredo/` = Scroll-Story, `/psgotrich/`)
- Antworten auf Deutsch, kurz und direkt. Nach Design-Arbeit Screenshots (Desktop + Handy) schicken: `tools/story-shots.js`.
- Keine Fakten erfinden, kein Tracking, keine externen Requests (Ausnahme: GSAP von jsDelivr mit SRI), `noindex` bleibt bis zum Impressum.
- Nie nach Passwörtern/Tokens fragen. Keine privaten Daten oder Referenzfotos ins Repo (Repo ist öffentlich).
- CSP per Meta-Tag auf jeder Seite: neue Inline-Scripts brauchen einen sha256-Hash. Externe Quellen in der CSP ergänzen.
- Higgsfield (KI-Bilder/Video) läuft NUR in einer lokalen Mac-Sitzung, nicht hier. Ergebnisse kommen über `assets/gen/joe/` ins Repo.
- Commits auf Deutsch, beschreibend.
