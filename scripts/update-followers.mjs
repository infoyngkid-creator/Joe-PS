// Holt die Instagram-Follower-Zahlen über die offizielle Instagram Graph API
// (Business Discovery) und schreibt sie nach content/stats.json.
// Läuft nur in GitHub Actions. Zugangsdaten kommen ausschließlich aus GitHub Secrets
// und werden nie ausgegeben oder gespeichert.

import { readFile, writeFile } from 'node:fs/promises';

const HANDLES = ['joelaredeo_', 'psgotrich_'];
const API = 'https://graph.facebook.com/v21.0';
const FILE = 'content/stats.json';

const token = process.env.IG_ACCESS_TOKEN || '';
const userId = process.env.IG_USER_ID || '';

if (!token || !userId) {
  console.log('Keine Zugangsdaten hinterlegt (IG_ACCESS_TOKEN / IG_USER_ID) – übersprungen.');
  process.exit(0);
}
if (!/^\d{5,30}$/.test(userId)) {
  console.error('IG_USER_ID hat ein ungültiges Format.');
  process.exit(1);
}

let previous = { instagram: {} };
try {
  previous = JSON.parse(await readFile(FILE, 'utf8'));
} catch {
  /* noch keine Datei vorhanden */
}

const counts = { ...(previous.instagram || {}) };
let ok = 0;

for (const handle of HANDLES) {
  if (!/^[a-z0-9._]{1,30}$/.test(handle)) continue;
  const params = new URLSearchParams({
    fields: `business_discovery.username(${handle}){followers_count}`,
    access_token: token
  });
  try {
    const res = await fetch(`${API}/${userId}?${params}`, { signal: AbortSignal.timeout(15000) });
    const data = await res.json().catch(() => ({}));
    const n = data && data.business_discovery && data.business_discovery.followers_count;
    if (res.ok && Number.isInteger(n) && n >= 0) {
      counts[handle] = n;
      ok++;
      console.log(`@${handle}: ${n}`);
    } else {
      // Nur Statuscode und Fehlermeldung von Meta ausgeben – niemals URL oder Token
      const msg = data && data.error ? `${data.error.type}: ${data.error.message}` : 'unerwartete Antwort';
      console.error(`@${handle}: Fehler (${res.status}) – ${msg}`);
    }
  } catch (e) {
    console.error(`@${handle}: Netzwerkfehler – ${e.name}`);
  }
}

const changed = JSON.stringify(counts) !== JSON.stringify(previous.instagram || {});
if (changed) {
  const out = { aktualisiert: new Date().toISOString().slice(0, 10), instagram: counts };
  await writeFile(FILE, JSON.stringify(out, null, 2) + '\n');
  console.log('content/stats.json aktualisiert.');
} else {
  console.log('Keine Änderung.');
}

if (ok === 0) process.exit(1);
