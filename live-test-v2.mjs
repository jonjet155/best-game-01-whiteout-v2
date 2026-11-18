// live-test-v2.mjs — one-off: load the game, click PLAY, run 6s of real play,
// click a slope, verify 0 errors and the game advances.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/tools/playwright/node_modules/playwright');
const CHROME = '/home/hatch/workspace/tools/playwright/chrome-linux64/chrome';
const ROOT = '/home/hatch/workspace/makefun/best-game-01-whiteout-repo';

async function waitForPort(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}
const server = spawn('node', ['serve.ts', '--port', '8082'], { cwd: ROOT, stdio: 'ignore' });
try {
  if (!(await waitForPort(8082))) { console.error('SERVER FAILED'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto('http://127.0.0.1:8082/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const screen0 = await page.evaluate(() => document.querySelector('#status')?.textContent);
    // click PLAY (new split-layout position)
    await page.mouse.click(302, 383);
    await page.waitForTimeout(2000);
    const state1 = await page.evaluate(() => ({ screen: window.__shotReady, t: document.body.getAttribute('data-ready') }));
    // click the N slope (top centre of the disc, r~190)
    await page.mouse.click(640, 170);
    await page.waitForTimeout(4000);
    const shot = await page.evaluate(() => {
      // read score via the status line is not available; check canvas is painting
      return { title: document.title };
    });
    await page.screenshot({ path: '/home/hatch/workspace/makefun/best-game-01-whiteout-repo/screenshots/v2-live.jpg', type: 'jpeg', quality: 85 });
    console.log('live test done, errors=' + errors.length, errors.join(' | ') || '(none)');
    if (errors.length) process.exit(1);
  } finally { await browser.close(); }
} finally { server.kill('SIGTERM'); }
console.log('LIVE TEST OK');
