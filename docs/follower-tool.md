# Follower-Tool einrichten (einmalig, ca. 20 Minuten)

Die Website zeigt bei jedem von euch die Instagram-Follower. Die Zahlen holt einmal am Tag
eine GitHub-Automatisierung (`.github/workflows/follower.yml`) über die **offizielle
Instagram Graph API** und speichert sie in `content/stats.json`. Die Website liest nur diese Datei.

Der Zugangsschlüssel (Token) liegt **nur verschlüsselt in den GitHub Secrets**.
Er steht nie im Code, nie auf der Website und wird nie im Chat geteilt.

Solange kein Token hinterlegt ist, passiert nichts – die Zeile „Follower“ bleibt einfach unsichtbar.

## Voraussetzungen

1. **Beide** Instagram-Konten (`@joelaredeo_`, `@psgotrich_`) auf **Professional** umstellen
   (Instagram → Einstellungen → Kontotyp und Tools → Zu professionellem Konto wechseln → „Creator“).
   Kostenlos. Nur so lassen sich die Zahlen offiziell abfragen.
2. Ein Konto (z. B. Joe) mit einer **Facebook-Seite** verbinden
   (kann eine schlichte Seite „JOE&PS“ sein).

## Token erstellen

1. Auf <https://developers.facebook.com> mit dem Facebook-Konto anmelden → **App erstellen** → Typ „Business“.
2. In der App das Produkt **Instagram** (Instagram Graph API / „API setup with Facebook login“) hinzufügen.
3. **Graph API Explorer** öffnen, eure App wählen, Berechtigungen anhaken:
   `instagram_basic`, `pages_show_list`, `pages_read_engagement` → **Generate Access Token**.
4. Im **Access Token Debugger** den Token verlängern („Extend Access Token“).
5. Im Graph API Explorer abfragen:
   - `me/accounts` → ID eurer Facebook-Seite notieren
   - `<SEITEN-ID>?fields=instagram_business_account` → die angezeigte `id` ist eure **IG_USER_ID**
   - In `me/accounts` steht auch der **Seiten-Token** (`access_token`). Dieser läuft bei einem
     verlängerten Nutzer-Token nicht ab und ist der Wert für **IG_ACCESS_TOKEN**.

## In GitHub hinterlegen

Repository → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Wert |
|---|---|
| `IG_ACCESS_TOKEN` | der Seiten-Token |
| `IG_USER_ID` | die Instagram-Business-ID (nur Ziffern) |

Danach: **Actions → „Follower aktualisieren“ → Run workflow**. Nach ca. 1–2 Minuten stehen die Zahlen auf der Seite.
Ab dann läuft es täglich automatisch.

## Sicherheit

- Token nur in GitHub Secrets, niemals in Dateien, Chats oder Screenshots.
- Die App braucht nur Leserechte (`instagram_basic`, `pages_*`). Keine Rechte zum Posten.
- Token widerrufen: Facebook → Einstellungen → Business-Integrationen → App entfernen.
- Das Skript gibt bei Fehlern nur den Fehlertext von Meta aus, nie den Token.

## Handles ändern

In `scripts/update-followers.mjs` (Liste `HANDLES`) und in `index.html` bei `data-followers="…"`.
