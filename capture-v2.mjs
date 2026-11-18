// capture-v2.mjs — screenshot the real WHITEOUT v2 game (title/play/draft/win/lose).
// Serves game/ via serve.ts on 127.0.0.1:8081, loads ?shot=<name>&seed=20261117,
// waits for window.__shotReady + fonts, saves JPEG q85 to screenshots/v2-*.jpg.
// Fails if any shot is >256 KiB or any console/page error appears.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/tools/playwright/node_modules/playwright');

const CHROME = '/home/hatch/workspace/tools/playwright/chrome-linux64/chrome';
const MAX_BYTES = 256 * 1024;
const ROOT = resolve('/home/hatch/workspace/makefun/best-game-01-whiteout-repo');
const OUT = join(ROOT, 'screenshots');
mkdirSync(OUT, { recursive: true });

const SHOTS = ['title', 'play', 'draft', 'win', 'lose'];

async function waitForPort(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const server = spawn('node', ['serve.ts', '--port', '8081'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });

let failed = false;
try {
  if (!(await waitForPort(8081))) {
    console.error('SERVER FAILED TO START');
    console.error(serverLog);
    process.exit(1);
  }
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
      '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      await page.goto(`http://127.0.0.1:8081/?shot=${shot}&seed=20261117`, { waitUntil: 'load' });
      try {
        await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
      } catch {
        errors.push('timeout waiting for __shotReady');
      }
      const fonts = await page.evaluate(() => document.fonts.status);
      await page.waitForTimeout(400);
      const outPath = join(OUT, `v2-${shot}.jpg`);
      await page.screenshot({ path: outPath, type: 'jpeg', quality: 85 });
      const size = statSync(outPath).size;
      console.log(`v2-${shot}.jpg: ${size} bytes (${(size / 1024).toFixed(1)} KiB) fonts=${fonts} errors=${errors.length}`);
      if (size > MAX_BYTES) { console.error(`WARNING oversize: v2-${shot}.jpg > 256 KiB`); failed = true; }
      if (errors.length) { console.error(`ERROR v2-${shot}.jpg:`, errors.join(' | ')); failed = true; }
      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill('SIGTERM');
}
if (failed) { console.error('CAPTURE FAILED'); process.exit(1); }
console.log('CAPTURE OK — 0 console/page errors, all ≤256 KiB');
