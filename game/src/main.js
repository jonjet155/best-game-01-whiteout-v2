// WHITEOUT — boot, main loop, click/key dispatch. The canvas is fixed at
// 1280x720 internally and letterboxed by CSS; all hit tests use that space.
import { BUILD, DIFFICULTIES, H, SEED, W } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_DRAFT, SCREEN_LOSE, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE,
  SCREEN_WIN, buildItem, createWorld, pickDraft,
  pushDeath, pushEye, releaseSlope, rescueBuried, ringHorn, scareWolf, startGame,
  stokeHouse, update,
} from './world.js';
import { hitTest, render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || SEED);

const world = createWorld(seed);
world.audioMuted = false;
// v2: debug handle for live playtests (read state / force scenarios).
window.__world = world;
const input = createInput(canvas);
const audio = createAudio();
world.best = Number(localStorage.getItem('whiteout-best') || 0);

const ASSETS = {
  play: 'assets/media-generation-bg-play-0-984cd999-6cae-4c39-a8cc-3e0bf7003da1.jpg',
  title: 'assets/title-bg-dramatic.jpg',
  giant: 'assets/media-generation-giant-0-50ee0913-52e6-45d8-898b-8ad96da51765.jpg',
  wolves: 'assets/media-generation-wolves-0-282187e4-a255-41ee-85f9-daedc9aad7c7.jpg',
  logo: 'assets/logo-title.png',
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function doClick(x, y) {
  const hit = hitTest(world, x, y);
  switch (hit.kind) {
    case 'difficulty': {
      // v2: pick a difficulty / endless on the title screen.
      const d = DIFFICULTIES[hit.index];
      world.difficulty = d.id;
      world.endless = d.id === 'endless';
      audio.click();
      break;
    }
    case 'play':
      audio.click();
      startGame(world);
      setStatus('Blizzard 1 of 7. Click a slope to release its snow.');
      break;
    case 'menu':
      audio.click();
      world.screen = SCREEN_TITLE;
      break;
    case 'resume':
      world.screen = SCREEN_PLAY;
      break;
    case 'draft':
      pickDraft(world, world.draftChoices[hit.index], audio);
      break;
    case 'eye':
      pushEye(world, audio);
      break;
    case 'death':
      pushDeath(world, audio);
      break;
    case 'wolf':
      scareWolf(world, hit.wolf, audio);
      break;
    case 'buried':
      rescueBuried(world, hit.buried, audio);
      break;
    case 'house':
      stokeHouse(world, hit.house, audio);
      break;
    case 'build':
      buildItem(world, BUILD[hit.index], audio);
      break;
    case 'mute':
      world.audioMuted = audio.toggle();
      break;
    case 'slope':
      world.selectedSlope = hit.slope.i;
      releaseSlope(world, hit.slope, audio);
      break;
    default:
      break;
  }
}

function doKey(key) {
  if (key === 'Enter') {
    if (world.screen === SCREEN_TITLE) { audio.click(); startGame(world); }
    else if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) { audio.click(); startGame(world); }
    else if (world.screen === SCREEN_PAUSE) world.screen = SCREEN_PLAY;
    return;
  }
  if (key === 'm' || key === 'M') {
    world.audioMuted = audio.toggle();
    return;
  }
  if (key === 'Escape' || key === 'p' || key === 'P') {
    if (world.screen === SCREEN_PLAY) world.screen = SCREEN_PAUSE;
    else if (world.screen === SCREEN_PAUSE) world.screen = SCREEN_PLAY;
    else if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) world.screen = SCREEN_TITLE;
    return;
  }
  if (world.screen === SCREEN_DRAFT) {
    const i = ['1', '2', '3'].indexOf(key);
    if (i >= 0 && world.draftChoices[i]) pickDraft(world, world.draftChoices[i], audio);
    return;
  }
  if (world.screen !== SCREEN_PLAY) return;
  if (key === ' ') { ringHorn(world, audio); return; }
  if (key === 'h' || key === 'H') {
    const cold = world.houses.filter((h) => !h.dead).sort((a, b) => a.warm - b.warm)[0];
    if (cold) stokeHouse(world, cold, audio);
    return;
  }
  if (key === 'r' || key === 'R') {
    if (world.buried.length > 0) rescueBuried(world, world.buried[0], audio);
    return;
  }
  const bi = ['1', '2', '3', '4', '5'].indexOf(key);
  if (bi >= 0) buildItem(world, BUILD[bi], audio);
}

let last = performance.now();
let shotPaints = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (const c of input.clicks) doClick(c.x, c.y);
  input.clicks.length = 0;
  for (const k of input.keys) doKey(k);
  input.keys.length = 0;
  if (!shot) update(world, dt, audio);
  else if (shotPaints < 2) update(world, 0, audio);
  render(ctx, world);
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSE) {
    const best = Math.max(world.best, world.score);
    if (String(best) !== localStorage.getItem('whiteout-best')) {
      localStorage.setItem('whiteout-best', String(best));
    }
  }
  if (shot) {
    shotPaints += 1;
    if (shotPaints === 2) {
      document.body.setAttribute('data-ready', '1');
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(frame);
}

Promise.all([
  loadImage(ASSETS.play),
  loadImage(ASSETS.title),
  loadImage(ASSETS.giant),
  loadImage(ASSETS.wolves),
  loadImage(ASSETS.logo),
  document.fonts ? document.fonts.load('16px "Lilita One"').catch(() => {}) : Promise.resolve(),
  document.fonts ? document.fonts.load('16px "Bungee"').catch(() => {}) : Promise.resolve(),
]).then(([play, title, giant, wolves, logo]) => {
  world.assets = { play, title, giant, wolves, logo };
  if (shot) stageShot(shot, world);
  requestAnimationFrame(frame);
});
