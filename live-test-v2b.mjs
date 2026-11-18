// live-test-v2b.mjs — live playtest of the WHITEOUT v2 mechanics.
// Serves game/ on 127.0.0.1:8083, loads the game, clicks a difficulty pill
// + PLAY, plays ~10s, then drives the real update() loop through
// window.__world to exercise: wind shift (storm 2), icefall spike
// (storm 4), mission success + fail, White Death freeze / click /
// strike, and Endless continuation past blizzard 7.
// Screenshots go to shots-dev/ (never screenshots/). Fails on any
// console/page error or any failed assertion.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/tools/playwright/node_modules/playwright');
const CHROME = '/home/hatch/workspace/tools/playwright/chrome-linux64/chrome';
const ROOT = '/home/hatch/workspace/makefun/best-game-01-whiteout-repo';
const OUT = `${ROOT}/shots-dev`;

async function waitForPort(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const failures = [];
function check(name, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail !== undefined ? ` — ${detail}` : ''}`);
  if (!cond) failures.push(name);
}

const server = spawn('node', ['serve.ts', '--port', '8083'], { cwd: ROOT, stdio: 'ignore' });
try {
  if (!(await waitForPort(8083))) { console.error('SERVER FAILED'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto('http://127.0.0.1:8083/', { waitUntil: 'load' });
    await page.waitForTimeout(1200);

    // Pill centres: replicate difficultyPills() layout with a measure canvas.
    const pills = await page.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d');
      c.font = '13px Bungee, "Lilita One", sans-serif';
      const names = ['EASY', 'NORMAL', 'HARD', 'ENDLESS'];
      const gap = 8;
      const widths = names.map((n) => Math.ceil(c.measureText(n).width) + 28);
      const total = widths.reduce((a, b) => a + b, 0) + gap * 3;
      let x = 302 - total / 2;
      return names.map((n, i) => { const r = { name: n, cx: x + widths[i] / 2, cy: 545 }; x += widths[i] + gap; return r; });
    });
    console.log('pills:', JSON.stringify(pills));
    const endless = pills.find((p) => p.name === 'ENDLESS');
    await page.mouse.click(endless.cx, endless.cy);
    await page.waitForTimeout(300);
    const diff = await page.evaluate(() => ({ d: window.__world.difficulty, e: window.__world.endless }));
    check('difficulty pill selects ENDLESS', diff.d === 'endless' && diff.e === true, JSON.stringify(diff));

    // PLAY
    await page.mouse.click(302, 383);
    await page.waitForTimeout(1500);
    let s = await page.evaluate(() => {
      const w = window.__world;
      return { screen: w.screen, blizzard: w.blizzard, endless: w.endless, wood: w.wood, food: w.food, storm: w.phaseSeq.map((p) => p.id).join('+'), timer: Math.round(w.blizzardTimer) };
    });
    check('PLAY starts endless blizzard 1 (First Flakes)', s.screen === 'play' && s.blizzard === 1 && s.endless && s.storm === 'calm+snowfall+snowfall+clear', JSON.stringify(s));

    // Play ~10s, click the N slope (640,170), score should move.
    await page.waitForTimeout(8000);
    const score0 = await page.evaluate(() => window.__world.score);
    await page.mouse.click(640, 170);
    await page.waitForTimeout(1500);
    const score1 = await page.evaluate(() => window.__world.score);
    check('slope click scores points', score1 > score0, `${score0} -> ${score1}`);
    await page.screenshot({ path: `${OUT}/v2b-live-endless.jpg`, type: 'jpeg', quality: 85 });

    // --- Storm 2 wind shift ---
    await page.evaluate(() => {
      const w = window.__world;
      w.blizzard = 2;
      w.phaseSeq = [{ id: 'snowfall', dur: 14 }, { id: 'whiteout', dur: 10 }, { id: 'snowfall', dur: 14 }, { id: 'clear', dur: 8 }];
      w.windTimer = 0.05;
      w.windAngle = -90;
    });
    await page.waitForTimeout(1500);
    const wind = await page.evaluate(() => {
      const w = window.__world;
      return { angle: Math.round(w.windAngle), log: w.log[0] || '' };
    });
    check('Howling Pass wind shifts + announces', wind.angle !== -90 && /wind turns/i.test(wind.log), JSON.stringify(wind));

    // --- Storm 4 icefall spike ---
    const iceBefore = await page.evaluate(() => {
      const w = window.__world;
      w.blizzard = 4;
      w.icefallTimer = 0.05;
      return w.slopes.map((s) => Math.round(s.pack));
    });
    await page.waitForTimeout(1200);
    const iceAfter = await page.evaluate(() => {
      const w = window.__world;
      return { packs: w.slopes.map((s) => Math.round(s.pack)), log: w.log[0] || '' };
    });
    const iceSpiked = iceAfter.packs.some((p, i) => p >= iceBefore[i] + 20);
    check('Icefall spikes a slope +25 with log', iceSpiked && /ICE CRACKS/.test(iceAfter.log), `before=${iceBefore} after=${iceAfter.packs} log=${iceAfter.log}`);

    // --- Mission SUCCESS (dig) ---
    const mOk = await page.evaluate(() => {
      const w = window.__world;
      const wood0 = w.wood;
      w.mission = { id: 'dig', name: 'DIG OUT 3 BURIED', desc: '', target: 3, progress: 3, timer: 30, state: 'active', slope: -1 };
      return { wood0 };
    });
    await page.waitForTimeout(800);
    const mOkAfter = await page.evaluate(() => {
      const w = window.__world;
      return { state: w.mission.state, wood: w.wood, banner: w.banner };
    });
    check('mission success: reward + banner', mOkAfter.state === 'done' && mOkAfter.wood === mOk.wood0 + 15 && /MISSION COMPLETE/.test(mOkAfter.banner), JSON.stringify(mOkAfter));

    // --- Mission FAIL (dig, timer out) ---
    const mFail = await page.evaluate(() => {
      const w = window.__world;
      const lost0 = w.villagers.lost;
      w.mission = { id: 'dig', name: 'DIG OUT 3 BURIED', desc: '', target: 3, progress: 0, timer: 0.05, state: 'active', slope: -1 };
      return { lost0 };
    });
    await page.waitForTimeout(800);
    const mFailAfter = await page.evaluate(() => {
      const w = window.__world;
      return { state: w.mission.state, lost: w.villagers.lost, banner: w.banner };
    });
    check('mission fail: penalty + banner', mFailAfter.state === 'failed' && mFailAfter.lost === mFail.lost0 + 2 && /MISSION FAILED/.test(mFailAfter.banner), JSON.stringify(mFailAfter));

    // --- White Death: freeze a slope ---
    const deathBefore = await page.evaluate(() => {
      const w = window.__world;
      w.blizzard = 7;
      w.death = { active: true, angle: -90, dist: 200, shrouds: 3, freezeTimer: 0.05 };
      w.bossDefeated = false;
      return { nPack: Math.round(w.slopes[0].pack) };
    });
    await page.waitForTimeout(1000);
    const deathAfter = await page.evaluate(() => {
      const w = window.__world;
      return { nPack: Math.round(w.slopes[0].pack), log: w.log[0] || '', dist: Math.round(w.death.dist) };
    });
    check('White Death freezes nearest slope +30', deathAfter.nPack >= deathBefore.nPack + 25 && /WHITE DEATH FREEZES the N slope/.test(deathAfter.log), `N ${deathBefore.nPack} -> ${deathAfter.nPack}, log=${deathAfter.log}`);

    // --- White Death: click tears a shroud ---
    const deathPos = await page.evaluate(() => {
      const w = window.__world;
      const a = (w.death.angle * Math.PI) / 180;
      return { x: 640 + Math.cos(a) * w.death.dist, y: 360 + Math.sin(a) * w.death.dist };
    });
    const scoreBeforeDeath = await page.evaluate(() => window.__world.score);
    await page.mouse.click(deathPos.x, deathPos.y);
    await page.waitForTimeout(500);
    const deathClick = await page.evaluate(() => {
      const w = window.__world;
      return { shrouds: w.death.shrouds, dist: Math.round(w.death.dist), score: w.score, log: w.log[0] || '' };
    });
    check('clicking Death tears a shroud + pushes back', deathClick.shrouds === 2 && deathClick.dist > 200 && deathClick.score > scoreBeforeDeath && /SHROUD|shroud/.test(deathClick.log), JSON.stringify(deathClick));
    await page.screenshot({ path: `${OUT}/v2b-live-death.jpg`, type: 'jpeg', quality: 85 });

    // --- White Death: strike when it reaches the village ---
    const strikeBefore = await page.evaluate(() => {
      const w = window.__world;
      w.death.dist = 98;
      w.death.freezeTimer = 5;
      w.deathPushCooldown = 0;
      const hps = w.houses.filter((h) => !h.dead).map((h) => Math.round(h.hp));
      return { minHp: Math.min(...hps) };
    });
    await page.waitForTimeout(1500);
    const strikeAfter = await page.evaluate(() => {
      const w = window.__world;
      const hps = w.houses.filter((h) => !h.dead).map((h) => Math.round(h.hp));
      return { minHp: Math.min(...hps), dist: Math.round(w.death.dist), log: w.log[0] || '' };
    });
    check('Death strike: house -25hp, retreats to 260', strikeAfter.minHp <= strikeBefore.minHp - 20 && strikeAfter.dist >= 250 && /REACHES THE VILLAGE/.test(strikeAfter.log), JSON.stringify({ before: strikeBefore, after: strikeAfter }));

    // --- Endless: blizzard 7 ends with boss broken -> draft, not win ---
    await page.evaluate(() => {
      const w = window.__world;
      w.bossDefeated = true;
      w.death.active = false;
      w.finalStand = false;
      w.blizzardTimer = 0.05;
      w.mission = null;
    });
    await page.waitForTimeout(1000);
    const endlessDraft = await page.evaluate(() => {
      const w = window.__world;
      return { screen: w.screen, from: w.draftFromBlizzard, choices: w.draftChoices.length };
    });
    check('endless blizzard 7 end -> draft (no win)', endlessDraft.screen === 'draft' && endlessDraft.from === 7 && endlessDraft.choices === 3, JSON.stringify(endlessDraft));
    // Pick the first draft card -> blizzard 8, storm cycles to First Flakes.
    await page.mouse.click(310, 350);
    await page.waitForTimeout(800);
    const b8 = await page.evaluate(() => {
      const w = window.__world;
      return { screen: w.screen, blizzard: w.blizzard, storm: w.phaseSeq.map((p) => p.id).join('+'), mission: w.mission ? w.mission.id : null };
    });
    check('endless blizzard 8: storm cycles, mission assigned', b8.screen === 'play' && b8.blizzard === 8 && b8.storm === 'calm+snowfall+snowfall+clear' && !!b8.mission, JSON.stringify(b8));
    await page.screenshot({ path: `${OUT}/v2b-live-blizzard8.jpg`, type: 'jpeg', quality: 85 });

    check('0 console/page errors', errors.length === 0, errors.join(' | ') || '(none)');
  } finally { await browser.close(); }
} finally { server.kill('SIGTERM'); }
if (failures.length) { console.error('LIVE TEST FAILED:', failures.join(', ')); process.exit(1); }
console.log('LIVE TEST OK — all mechanics verified');
