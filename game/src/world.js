// WHITEOUT — world state and rules. Pure logic over a seeded RNG; render.js
// only draws what is here, and main.js only feeds it clicks and keys.
import {
  BLIZZARDS, BLIZZARD_TIME, BUILD, LOSE_LOST, MOUNTAIN_R, PHASES,
  SLOPE_ANGLES, SLOPE_NAMES, UPGRADES, VILLAGE_R, gradeFor, multFor,
} from './config.js';
import { mulberry32, shuffle } from './random.js';
import { SEED } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DRAFT = 'draft';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

export function createWorld(seed) {
  const rng = mulberry32(seed ?? SEED);
  const world = {
    rng,
    screen: SCREEN_TITLE,
    time: 0,
    score: 0,
    best: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    wood: 30,
    food: 24,
    warmth: 82,
    blizzard: 1,
    blizzardTimer: BLIZZARD_TIME,
    finalStand: false,
    phaseIndex: 0,
    phaseTimer: PHASES[0].dur,
    windAngle: -45,
    selectedSlope: 0,
    slopes: [],
    houses: [],
    trees: [],
    rocks: [],
    villagers: { total: 50, evacuated: 6, protected: 30, atRisk: 14, lost: 0 },
    buried: [], // {x, y, timer, max}
    wolves: [], // {x, y, tx, ty, speed, warn}
    rescues: [], // {x, y, tx, ty, target, digging, digTimer}
    eye: { active: false, angle: -90, dist: 280, pushes: 0 },
    bossDefeated: false,
    eyePushCooldown: 0,
    hornCooldown: 0,
    throwCooldown: 0,
    bellTimer: 0,
    heater: false,
    upgrades: [],
    draftChoices: [],
    floats: [],
    particles: [], // snow + flow, {x,y,vx,vy,r,life,kind}
    log: [],
    banner: '',
    bannerTimer: 0,
    shake: 0,
    stats: { releases: 0, rescues: 0, wolvesScared: 0, avalanches: 0, stokes: 0, horns: 0 },
    // Per-blizzard score deltas, recorded when each blizzard ends (startDraft
    // / endGame). Powers the results screen's SCORE PER BLIZZARD chart with
    // real run data only — never invented.
    blizzardScores: [],
    scoreAtBlizzardStart: 0,
    blizzardRecorded: false,
    result: null,
    loseReason: '',
    draftFromBlizzard: 0,
  };
  for (let i = 0; i < 8; i++) {
    world.slopes.push({ i, name: SLOPE_NAMES[i], angle: SLOPE_ANGLES[i], pack: 20 + rng() * 25, fence: false, cooldown: 0, flash: 0 });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    world.houses.push({
      i, x: 640 + Math.cos(a) * 58, y: 360 + Math.sin(a) * 58,
      angle: a, hp: 100, warm: 80, shield: false, dead: false, smoke: rng() * 10,
    });
  }
  // Deterministic pines + rocks scattered on the mountain (not in the village).
  for (let i = 0; i < 110; i++) {
    const a = rng() * Math.PI * 2;
    const r = VILLAGE_R + 18 + rng() * (MOUNTAIN_R - VILLAGE_R - 26);
    world.trees.push({ x: 640 + Math.cos(a) * r, y: 360 + Math.sin(a) * r, s: 0.7 + rng() * 0.7, shade: rng() });
  }
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2;
    const r = VILLAGE_R + 30 + rng() * (MOUNTAIN_R - VILLAGE_R - 40);
    world.rocks.push({ x: 640 + Math.cos(a) * r, y: 360 + Math.sin(a) * r, s: 2 + rng() * 4 });
  }
  return world;
}

export function startGame(world) {
  const fresh = createWorld(SEED);
  fresh.best = world.best;
  Object.keys(fresh).forEach((k) => { world[k] = fresh[k]; });
  world.screen = SCREEN_PLAY;
  world.banner = 'BLIZZARD 1 OF 7 — THE SNOW IS COMING';
  world.bannerTimer = 3;
  addLog(world, 'The first snow falls on the mountain.');
  addLog(world, 'Click a slope to release it before it fills.');
}

export function phaseOf(world) {
  return PHASES[world.phaseIndex];
}

export function housesAlive(world) {
  return world.houses.filter((h) => !h.dead).length;
}

export function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color: color || '#fef3c7', life: 1.1, maxLife: 1.1 });
  if (world.floats.length > 24) world.floats.shift();
}

export function addLog(world, text) {
  world.log.unshift(text);
  if (world.log.length > 4) world.log.pop();
}

export function addScore(world, base, x, y, label) {
  const mult = multFor(world.combo);
  const pts = Math.round(base * mult);
  world.score += pts;
  if (x !== undefined) addFloat(world, x, y, `+${pts}${label ? ' ' + label : ''}`, mult > 1 ? '#fde68a' : '#fef3c7');
  return pts;
}

export function bumpCombo(world) {
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo || 0, world.combo);
  world.comboTimer = 6;
}

function slopePoint(world, slope, r) {
  const a = (slope.angle * Math.PI) / 180;
  return { x: 640 + Math.cos(a) * r, y: 360 + Math.sin(a) * r };
}

function burstFlow(world, slope) {
  const a = (slope.angle * Math.PI) / 180;
  for (let i = 0; i < 26; i++) {
    const r = 120 + world.rng() * 120;
    const spread = (world.rng() - 0.5) * 0.5;
    world.particles.push({
      x: 640 + Math.cos(a + spread) * r, y: 360 + Math.sin(a + spread) * r,
      vx: Math.cos(a + spread) * (30 + world.rng() * 40), vy: Math.sin(a + spread) * (30 + world.rng() * 40),
      r: 2 + world.rng() * 3, life: 0.9, kind: 'flow',
    });
  }
}

// --- player actions (called from main.js hit tests) -----------------------

export function releaseSlope(world, slope, audio) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (slope.cooldown > 0) { addLog(world, `${slope.name} slope is still settling.`); return false; }
  if (slope.pack < 15) { addLog(world, `${slope.name} slope holds too little snow to release.`); return false; }
  const p = slopePoint(world, slope, 190);
  const charm = world.upgrades.includes('charm');
  const base = Math.round(20 + slope.pack * 0.45) * (charm ? 1.5 : 1);
  addScore(world, base, p.x, p.y, 'RELEASE');
  bumpCombo(world);
  if (charm) bumpCombo(world);
  slope.pack = 0;
  slope.cooldown = 5;
  slope.flash = 0.8;
  world.stats.releases += 1;
  burstFlow(world, slope);
  addLog(world, `Controlled release on the ${slope.name} slope — the gully runs clear.`);
  if (audio) audio.release();
  return true;
}

export function scareWolf(world, wolf, audio) {
  const i = world.wolves.indexOf(wolf);
  if (i < 0) return false;
  world.wolves.splice(i, 1);
  const bonus = world.upgrades.includes('eyes') ? 15 : 0;
  addScore(world, 15 + bonus, wolf.x, wolf.y, 'WOLF OFF');
  bumpCombo(world);
  world.stats.wolvesScared += 1;
  addLog(world, 'A wolf yelps and bolts for the treeline.');
  if (audio) audio.scare();
  return true;
}

export function ringHorn(world, audio) {
  if (world.screen !== SCREEN_PLAY || world.hornCooldown > 0) return false;
  world.hornCooldown = 10;
  const n = world.wolves.length;
  world.wolves.forEach((w) => { addFloat(world, w.x, w.y, 'HORN!', '#bfdbfe'); });
  world.wolves = [];
  if (n > 0) { addScore(world, 10 * n, 640, 200, 'HORN'); bumpCombo(world); }
  world.stats.horns += 1;
  addLog(world, 'The horn rolls across the mountain — every wolf turns tail.');
  if (audio) audio.horn();
  return true;
}

export function rescueBuried(world, buried, audio) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.food < 2) { addLog(world, 'Not enough food to send a rescue team (need 2).'); return false; }
  if (world.rescues.some((r) => r.target === buried)) return false;
  world.food -= 2;
  world.rescues.push({ x: 640, y: 360, tx: buried.x, ty: buried.y, target: buried, digging: false, digTimer: 0, digMax: 3 / (world.upgrades.includes('ropes') ? 2 : 1), speed: world.upgrades.includes('ropes') ? 130 : 65 });
  addLog(world, 'A rescue team sets out with ropes and shovels.');
  if (audio) audio.click();
  return true;
}

export function stokeHouse(world, house, audio) {
  if (world.screen !== SCREEN_PLAY || house.dead) return false;
  if (world.wood < 2) { addLog(world, 'Not enough wood to stoke a hearth (need 2).'); return false; }
  world.wood -= 2;
  house.warm = Math.min(100, house.warm + 35);
  world.stats.stokes += 1;
  addScore(world, 5, house.x, house.y - 14, 'WARM');
  addLog(world, 'You stoke a hearth — lamplight spills onto the snow.');
  if (audio) audio.stoke();
  return true;
}

export function buildItem(world, def, audio) {
  if (world.screen !== SCREEN_PLAY) return false;
  const cost = def.cost;
  if (cost.wood && world.wood < cost.wood) { addLog(world, `Need ${cost.wood} wood for ${def.name}.`); return false; }
  if (cost.food && world.food < cost.food) { addLog(world, `Need ${cost.food} food for ${def.name}.`); return false; }
  if (def.id === 'heater' && world.heater) { addLog(world, 'A heater already warms every hearth.'); return false; }
  if (cost.wood) world.wood -= cost.wood;
  if (cost.food) world.food -= cost.food;
  if (def.id === 'fence') {
    const s = world.slopes[world.selectedSlope];
    if (s.fence) { addLog(world, `The ${s.name} slope already has a fence.`); world.wood += cost.wood; return false; }
    s.fence = true;
    addLog(world, `Snow fence raised on the ${s.name} slope — it fills half as fast.`);
  } else if (def.id === 'wall') {
    const alive = world.houses.filter((h) => !h.dead).sort((a, b) => a.hp - b.hp)[0];
    if (!alive) { addLog(world, 'No house stands to shield.'); world.wood += cost.wood; return false; }
    if (alive.shield) { addLog(world, 'The weakest house already has an ice wall.'); world.wood += cost.wood; return false; }
    alive.shield = true;
    addLog(world, 'An ice wall rises around the weakest house.');
  } else if (def.id === 'tunnel') {
    const n = Math.min(3, world.villagers.atRisk);
    if (n === 0) { addLog(world, 'No one is at risk — the tunnel waits.'); world.food += cost.food; return false; }
    world.villagers.atRisk -= n;
    world.villagers.evacuated += n;
    addLog(world, `${n} villagers slip through the tunnel to the safe hall.`);
  } else if (def.id === 'bell') {
    world.bellTimer = 20;
    world.wolves.forEach((w) => addFloat(world, w.x, w.y, 'BELL!', '#fef3c7'));
    world.wolves = [];
    addLog(world, 'The bell tolls — wolves scatter from the slopes.');
  } else if (def.id === 'heater') {
    world.heater = true;
    addLog(world, 'A great heater is lit — every hearth drains half as fast.');
  }
  addScore(world, 10, 640, 300, 'BUILT');
  if (audio) audio.build();
  return true;
}

export function pushEye(world, audio) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (!world.eye.active || world.bossDefeated) return false;
  if (world.eyePushCooldown > 0) return false;
  world.eyePushCooldown = 1;
  world.eye.dist = Math.min(280, world.eye.dist + 70);
  world.eye.angle += 35;
  world.eye.pushes += 1;
  const p = { x: 640 + Math.cos((world.eye.angle * Math.PI) / 180) * world.eye.dist, y: 360 + Math.sin((world.eye.angle * Math.PI) / 180) * world.eye.dist };
  addScore(world, 100, p.x, p.y, 'GIANT PUSHED');
  bumpCombo(world);
  addLog(world, `The White Giant reels — its eye is driven back (${world.eye.pushes}/3).`);
  if (audio) audio.horn();
  if (world.eye.pushes >= 3) {
    world.bossDefeated = true;
    addScore(world, 500, 640, 240, 'GIANT BROKEN');
    world.banner = 'THE WHITE GIANT BREAKS — HOLD UNTIL THE STORM ENDS';
    world.bannerTimer = 4;
    addLog(world, 'The White Giant breaks apart into harmless snow!');
    if (audio) audio.win();
  }
  return true;
}

export function recordBlizzardScore(world) {
  if (world.blizzardRecorded) return;
  world.blizzardScores.push(world.score - (world.scoreAtBlizzardStart || 0));
  world.scoreAtBlizzardStart = world.score;
  world.blizzardRecorded = true;
}

export function startDraft(world) {
  recordBlizzardScore(world);
  world.draftFromBlizzard = world.blizzard;
  const pool = shuffle(world.rng, UPGRADES.filter((u) => !world.upgrades.includes(u.id)));
  world.draftChoices = pool.slice(0, 3);
  world.screen = SCREEN_DRAFT;
  world.banner = '';
}

export function pickDraft(world, choice, audio) {
  if (world.screen !== SCREEN_DRAFT) return false;
  world.upgrades.push(choice.id);
  if (choice.id === 'hearth') { world.houses.forEach((h) => { h.warm = Math.min(100, h.warm + 15); }); }
  if (choice.id === 'stock') { world.wood += 18; world.food += 12; }
  if (choice.id === 'walls') { world.houses.forEach((h) => { if (!h.dead) h.hp = Math.min(100, h.hp + 30); }); }
  addLog(world, `Drafted ${choice.name} — ${choice.desc}`);
  if (audio) audio.draft();
  startBlizzard(world, world.blizzard + 1);
  return true;
}

export function startBlizzard(world, n) {
  world.blizzard = n;
  world.scoreAtBlizzardStart = world.score;
  world.blizzardRecorded = false;
  world.blizzardTimer = BLIZZARD_TIME;
  world.finalStand = false;
  world.phaseIndex = 0;
  world.phaseTimer = PHASES[0].dur;
  world.windAngle = -90 + world.rng() * 360;
  world.wood += 8 + n;
  world.food += 6;
  world.screen = SCREEN_PLAY;
  world.banner = n === BLIZZARDS ? 'BLIZZARD 7 OF 7 — THE WHITE GIANT WAKES' : `BLIZZARD ${n} OF 7 — THE SNOW DEEPENS`;
  world.bannerTimer = 3;
  if (n === BLIZZARDS) {
    world.eye.active = true;
    world.eye.angle = -90;
    world.eye.dist = 280;
    world.eye.pushes = 0;
    world.eyePushCooldown = 0;
  }
  addLog(world, `Blizzard ${n} begins. Wood +${8 + n}, food +6 from the storehouse.`);
}

function naturalAvalanche(world, slope, audio) {
  world.stats.avalanches += 1;
  world.combo = 0;
  world.comboTimer = 0;
  const a = (slope.angle * Math.PI) / 180;
  const p = slopePoint(world, slope, 200);
  addFloat(world, p.x, p.y - 20, 'AVALANCHE!', '#fca5a5');
  world.shake = 0.6;
  for (const h of world.houses) if (!h.dead) h.warm = Math.max(0, h.warm - 8);
  burstFlow(world, slope);
  // Houses near the slope's sector take the hit.
  const hit = world.houses.filter((h) => {
    if (h.dead) return false;
    let d = Math.abs(((h.angle * 180) / Math.PI - slope.angle + 540) % 360 - 180);
    return d < 55;
  });
  hit.forEach((h) => {
    if (h.shield) { h.shield = false; addFloat(world, h.x, h.y - 12, 'WALL HELD', '#bfdbfe'); return; }
    h.hp -= 25;
    h.warm = Math.max(0, h.warm - 20);
    if (h.hp <= 0) {
      h.dead = true;
      world.villagers.lost += 2;
      world.villagers.atRisk = Math.max(0, world.villagers.atRisk - 2);
      addLog(world, 'A house is buried under the avalanche — 2 villagers lost.');
    }
  });
  // Bury 1-2 villagers where the snow stops.
  const n = 1 + (world.rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const bx = 640 + Math.cos(a) * (110 + world.rng() * 30) + (world.rng() - 0.5) * 40;
    const by = 360 + Math.sin(a) * (110 + world.rng() * 30) + (world.rng() - 0.5) * 40;
    world.buried.push({ x: bx, y: by, timer: 14, max: 14 });
    world.villagers.atRisk = Math.max(0, world.villagers.atRisk - 1);
  }
  slope.pack = 35;
  addLog(world, `NATURAL AVALANCHE on the ${slope.name} slope — click buried villagers to rescue them!`);
  if (audio) audio.avalanche();
}

function spawnWolf(world) {
  const a = world.rng() * Math.PI * 2;
  const r = MOUNTAIN_R + 30 + world.rng() * 40;
  world.wolves.push({
    x: 640 + Math.cos(a) * r, y: 360 + Math.sin(a) * r,
    speed: 26 + world.rng() * 10 + world.blizzard * 1.5, warn: 0,
  });
}

function checkEnd(world, audio) {
  if (world.screen !== SCREEN_PLAY) return;
  if (housesAlive(world) === 0) return endGame(world, false, 'EVERY HOUSE WAS DESTROYED', audio);
  if (world.villagers.lost >= LOSE_LOST) return endGame(world, false, `${LOSE_LOST} VILLAGERS LOST`, audio);
  if (world.warmth <= 0 && world.houses.every((h) => h.dead || h.warm <= 0)) {
    return endGame(world, false, 'THE HEARTHS WENT COLD', audio);
  }
}

export function endGame(world, won, reason, audio) {
  recordBlizzardScore(world);
  world.screen = won ? SCREEN_WIN : SCREEN_LOSE;
  world.loseReason = won ? '' : reason;
  world.result = {
    score: world.score,
    best: Math.max(world.best, world.score),
    newBest: world.score > world.best && world.score > 0,
    grade: gradeFor(world.score),
    blizzard: world.blizzard,
    releases: world.stats.releases,
    rescues: world.stats.rescues,
    wolves: world.stats.wolvesScared,
    avalanches: world.stats.avalanches,
    houses: housesAlive(world),
    lost: world.villagers.lost,
    blizzardScores: [...world.blizzardScores],
  };
  world.best = world.result.best;
  if (audio) { if (won) audio.win(); else audio.lose(); }
}

export function update(world, dt, audio) {
  world.time += dt;
  // Ambient snow always drifts.
  const phase = phaseOf(world);
  const targetSnow = world.screen === SCREEN_PLAY ? phase.snow : world.screen === SCREEN_TITLE ? 40 : 18;
  while (world.particles.filter((p) => p.kind === 'snow').length < targetSnow) {
    world.particles.push({
      x: world.rng() * 1280, y: -10, vx: -12 + world.rng() * 24, vy: 30 + world.rng() * 50,
      r: 1 + world.rng() * 2.4, life: 99, kind: 'snow',
    });
  }
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'flow') p.life -= dt;
    if (p.y > 730) { p.y = -10; p.x = world.rng() * 1280; }
    if (p.x < -10) p.x = 1290;
    if (p.x > 1290) p.x = -10;
  }
  world.particles = world.particles.filter((p) => p.kind === 'snow' || p.life > 0);
  for (const f of world.floats) { f.y -= 26 * dt; f.life -= dt; }
  world.floats = world.floats.filter((f) => f.life > 0);
  for (const s of world.slopes) { if (s.cooldown > 0) s.cooldown -= dt; if (s.flash > 0) s.flash -= dt; }
  if (world.bannerTimer > 0) world.bannerTimer -= dt;
  if (world.shake > 0) world.shake -= dt;
  if (world.hornCooldown > 0) world.hornCooldown -= dt;
  if (world.throwCooldown > 0) world.throwCooldown -= dt;
  if (world.eyePushCooldown > 0) world.eyePushCooldown -= dt;
  if (world.bellTimer > 0) world.bellTimer -= dt;

  if (world.screen !== SCREEN_PLAY) return;

  // Combo only decays while playing — frozen in draft/pause/title.
  if (world.comboTimer > 0) { world.comboTimer -= dt; if (world.comboTimer <= 0) world.combo = 0; }

  // --- weather phases ---
  world.phaseTimer -= dt;
  if (world.phaseTimer <= 0) {
    world.phaseIndex = (world.phaseIndex + 1) % PHASES.length;
    world.phaseTimer = PHASES[world.phaseIndex].dur;
    const np = phaseOf(world);
    if (np.id === 'whiteout') {
      const n = 2 + Math.min(3, world.blizzard);
      for (let i = 0; i < n; i++) spawnWolf(world);
      addLog(world, 'WHITEOUT — visibility drops. Wolves slip out of the trees!');
      world.banner = 'WHITEOUT — WOLVES IN THE SNOW';
      world.bannerTimer = 2.5;
    } else if (np.id === 'snowfall') {
      addLog(world, 'Snowfall thickens on every slope.');
    } else if (np.id === 'clear') {
      world.wolves.forEach((w) => addFloat(world, w.x, w.y, 'FLED', '#e2e8f0'));
      world.wolves = [];
      addLog(world, 'The sky clears. The mountain breathes.');
    }
  }

  // --- snowpack grows / melts ---
  const sense = world.upgrades.includes('sense') ? 0.8 : 1;
  for (const s of world.slopes) {
    let rate = phase.packRate * sense;
    if (s.fence && rate > 0) rate *= 0.5;
    if (s.fence && world.upgrades.includes('roots')) {
      // deep roots: neighbours of a fenced slope also slow (handled below via flag)
    }
    s.pack = Math.max(0, Math.min(100, s.pack + rate * dt));
    if (s.pack >= 100) naturalAvalanche(world, s, audio);
  }
  if (world.upgrades.includes('roots')) {
    for (const s of world.slopes) {
      if (s.fence) {
        for (const d of [-1, 1]) {
          const n = world.slopes[(s.i + d + 8) % 8];
          if (phase.packRate > 0 && !n.fence) n.pack = Math.max(0, n.pack - phase.packRate * 0.25 * dt);
        }
      }
    }
  }

  // --- hearths ---
  const drain = phase.warmRate * (world.heater ? 0.5 : 1);
  for (const h of world.houses) {
    if (h.dead) continue;
    h.warm = Math.max(0, Math.min(100, h.warm + drain * dt));
    if (h.warm <= 20) h.hp -= (h.warm <= 0 ? 3 : 1) * dt;
    if (h.hp <= 0) {
      h.hp = 0; h.dead = true;
      world.villagers.lost += 2;
      world.villagers.atRisk = Math.max(0, world.villagers.atRisk - 2);
      addLog(world, 'A house goes cold and dark — 2 villagers lost.');
      if (audio) audio.hurt();
    }
  }
  const aliveHouses = world.houses.filter((h) => !h.dead);
  world.warmth = aliveHouses.length
    ? aliveHouses.reduce((a, h) => a + h.warm, 0) / aliveHouses.length
    : 0;

  // --- buried villagers ---
  for (const b of world.buried) {
    b.timer -= dt;
    if (b.timer <= 0) {
      world.villagers.lost += 1;
      addLog(world, 'A buried villager was not reached in time.');
      if (audio) audio.hurt();
    }
  }
  world.buried = world.buried.filter((b) => b.timer > 0);

  // --- rescue teams ---
  const digSpeed = world.upgrades.includes('ropes') ? 2 : 1;
  for (const r of world.rescues) {
    if (!world.buried.includes(r.target)) { r.done = true; continue; }
    const dx = r.target.x - r.x;
    const dy = r.target.y - r.y;
    const d = Math.hypot(dx, dy);
    if (!r.digging) {
      if (d < 8) { r.digging = true; r.digTimer = 3 / digSpeed; }
      else { r.x += (dx / d) * r.speed * dt; r.y += (dy / d) * r.speed * dt; }
    } else {
      r.digTimer -= dt;
      if (r.digTimer <= 0) {
        r.done = true;
        const i = world.buried.indexOf(r.target);
        if (i >= 0) world.buried.splice(i, 1);
        world.villagers.protected += 1;
        world.stats.rescues += 1;
        addScore(world, 50, r.target.x, r.target.y - 10, 'RESCUED');
        bumpCombo(world);
        addLog(world, 'Dug out alive! The villager stumbles to the warm hall.');
        if (audio) audio.rescue();
      }
    }
  }
  world.rescues = world.rescues.filter((r) => !r.done);

  // --- wolves ---
  for (const w of world.wolves) {
    const dx = 640 - w.x;
    const dy = 360 - w.y;
    const d = Math.hypot(dx, dy);
    w.warn = Math.max(0, w.warn - dt);
    if (d > 108) { w.x += (dx / d) * w.speed * dt; w.y += (dy / d) * w.speed * dt; }
    else {
      world.food = Math.max(0, world.food - 3);
      addLog(world, 'A wolf snatches food from the storehouse and flees!');
      addFloat(world, w.x, w.y, '-3 FOOD', '#fca5a5');
      w.done = true;
      if (audio) audio.hurt();
    }
    if (world.bellTimer > 0 && d < 320) { w.done = true; addFloat(world, w.x, w.y, 'BELL!', '#fef3c7'); }
    if (world.upgrades.includes('choir') && d < 288) { w.done = true; }
  }
  world.wolves = world.wolves.filter((w) => !w.done);

  // --- the White Giant's storm eye (blizzard 7) ---
  if (world.eye.active && !world.bossDefeated) {
    world.eye.angle += 14 * dt;
    world.eye.dist = Math.max(96, world.eye.dist - 5.5 * dt);
    if (world.eye.dist <= 96) {
      world.eye.dist = 260;
      world.shake = 0.8;
      for (const h of world.houses) if (!h.dead) h.hp -= 15;
      for (const h of world.houses) if (!h.dead) h.warm = Math.max(0, h.warm - 10);
      addLog(world, 'THE STORM EYE SWEEPS THE VILLAGE — houses reel, fires gutter!');
      addFloat(world, 640, 240, 'STORM EYE!', '#c7d2fe');
      if (audio) audio.avalanche();
    }
  }

  // B1: breaking the Giant during FINAL STAND wins at once — the only
  // win call used to sit inside `if (!world.finalStand)`, so a late
  // break could never reach WIN.
  if (world.finalStand && world.bossDefeated) endGame(world, true, '', audio);

  // S6: end conditions are checked before the blizzard clock, so a loss
  // on the same frame can never grant a free draft.
  checkEnd(world, audio);
  if (world.screen !== SCREEN_PLAY) return;

  // --- blizzard clock ---
  if (!world.finalStand) {
    world.blizzardTimer -= dt;
    if (world.blizzardTimer <= 0) {
      if (world.blizzard < BLIZZARDS) {
        startDraft(world);
      } else if (world.bossDefeated) {
        endGame(world, true, '', audio);
      } else {
        world.finalStand = true;
        world.banner = 'FINAL STAND — BREAK THE WHITE GIANT';
        world.bannerTimer = 4;
        addLog(world, 'The seventh blizzard will not end until the Giant breaks.');
      }
    }
  }
}
