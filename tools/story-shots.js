/* Screenshots der Scroll-Story (Desktop + iPhone) für die Abnahme.
   Voraussetzung: lokaler Server auf PORT (Standard 8000) im Repo-Ordner, Playwright + gsap@3.13.0 als npm-Pakete.

     npm i --no-save playwright gsap@3.13.0
     python3 -m http.server 8000 &
     node tools/story-shots.js out 0,1.5,2.6,3.6,4.8      # Fraktionen = Szene (0–5)

   jsDelivr ist in Cloud-Sitzungen gesperrt: GSAP wird deshalb aus node_modules ausgeliefert
   (gleiche Version wie im HTML, SRI-Prüfsumme bleibt gültig). */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const [outDir = 'shots', fr = '0,1.5,2.6,3.6,4.8', which = 'dm'] = process.argv.slice(2);
const PORT = process.env.PORT || 8000;
const WAIT = +(process.env.WAIT || 5000); /* Tempolimit: Story braucht Zeit, um aufzuholen */
const gsapDir = path.dirname(require.resolve('gsap/package.json')) + '/dist/';

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const sets = [['d', { viewport: { width: 1280, height: 800 } }], ['m', { ...devices['iPhone 13'] }]]
    .filter(([n]) => which.includes(n));
  for (const [name, opt] of sets) {
    delete opt.defaultBrowserType;
    const p = await (await b.newContext(opt)).newPage();
    await p.route('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/*', (r) => r.fulfill({
      status: 200, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' },
      body: fs.readFileSync(gsapDir + r.request().url().split('/').pop())
    }));
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await p.goto(`http://localhost:${PORT}/joe-laredo/`);
    await p.waitForTimeout(1500);
    const total = await p.evaluate(() => window.innerHeight * 5);
    for (const f of fr.split(',').map(Number)) {
      await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(total * f / 5));
      await p.waitForTimeout(WAIT);
      await p.screenshot({ path: `${outDir}/${name}-${String(f).replace('.', '_')}.png` });
    }
    console.log(name, errs.length ? errs : 'keine Fehler');
  }
  await b.close();
})();
