// WHITEOUT — tuning, layout and content tables. One place for every number
// the judge can see on screen, so the game stays balanced by editing here.
export const W = 1280;
export const H = 720;
export const CX = 640;
export const CY = 360;
export const MOUNTAIN_R = 248; // playfield: the circular mountain
export const RING_R = 288; // storm ring: clock-face gauge around it
export const VILLAGE_R = 96; // houses live inside this radius
export const SEED = 20261117;
export const BLIZZARDS = 7;
export const LOSE_LOST = 15;

export const SLOPE_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
// angle 0 = east, -90 = north; slope i sits at this angle.
export const SLOPE_ANGLES = [-90, -45, 0, 45, 90, 135, 180, 225];

export const PHASES = [
  { id: 'calm', name: 'CALM', dur: 8, packRate: -1.6, warmRate: -0.15, snow: 14 },
  { id: 'snowfall', name: 'SNOWFALL', dur: 14, packRate: 2.1, warmRate: -0.7, snow: 60 },
  { id: 'whiteout', name: 'WHITEOUT', dur: 10, packRate: 3.4, warmRate: -1.4, snow: 130 },
  { id: 'clear', name: 'CLEAR', dur: 8, packRate: -2.6, warmRate: -0.1, snow: 8 },
];
export const BLIZZARD_TIME = PHASES.reduce((a, p) => a + p.dur, 0); // 40 s

// --- v2: the seven named storms -------------------------------------------
// One entry per blizzard. `phases` is that blizzard's own sequence of
// phase ids (durations override the library's where given); the old
// global PHASES list above is now only the phase library. Fields:
//   pack  — multiplier on snowpack growth
//   warm  — multiplier on hearth drain (warmRate is negative)
//   wind  — true: the wind angle shifts every few seconds (storm 2)
//   wolfMult — multiplier on wolf speed
//   wolfPack — fixed wolf-pack size spawned at each whiteout (0 = none)
//   icefall — seconds between icefall spikes (0 = none)
//   fog   — whiteout fog strength multiplier
export const STORMS = [
  {
    id: 'first-flakes', name: 'FIRST FLAKES', tagline: 'THE SNOW IS COMING',
    phases: [{ id: 'calm' }, { id: 'snowfall' }, { id: 'snowfall' }, { id: 'clear' }],
    pack: 0.8, warm: 1, wind: false, wolfMult: 1, wolfPack: 0, icefall: 0, fog: 1,
  },
  {
    id: 'howling-pass', name: 'HOWLING PASS', tagline: 'THE WIND TURNS',
    phases: [{ id: 'snowfall' }, { id: 'whiteout' }, { id: 'snowfall' }, { id: 'clear' }],
    pack: 1, warm: 1, wind: true, wolfMult: 1, wolfPack: 0, icefall: 0, fog: 1,
  },
  {
    id: 'wolf-moon', name: 'WOLF MOON', tagline: 'THE PACK HUNTS',
    phases: [{ id: 'snowfall' }, { id: 'whiteout' }, { id: 'whiteout' }, { id: 'snowfall' }, { id: 'clear' }],
    pack: 1, warm: 1, wind: false, wolfMult: 1.3, wolfPack: 4, icefall: 0, fog: 1.1,
  },
  {
    id: 'icefall', name: 'ICEFALL', tagline: 'THE MOUNTAIN CRACKS',
    phases: [{ id: 'snowfall' }, { id: 'whiteout' }, { id: 'snowfall' }, { id: 'clear' }],
    pack: 1, warm: 1, wind: false, wolfMult: 1, wolfPack: 0, icefall: 8, fog: 1,
  },
  {
    id: 'deep-freeze', name: 'DEEP FREEZE', tagline: 'THE COLD BITES DEEP',
    phases: [{ id: 'calm', dur: 4 }, { id: 'snowfall' }, { id: 'whiteout' }, { id: 'clear' }],
    pack: 1, warm: 2, wind: false, wolfMult: 1, wolfPack: 0, icefall: 0, fog: 1,
  },
  {
    id: 'whiteout-wall', name: 'WHITEOUT WALL', tagline: 'YOU CANNOT SEE THE SKY',
    phases: [{ id: 'snowfall' }, { id: 'whiteout' }, { id: 'whiteout' }, { id: 'whiteout' }, { id: 'snowfall' }],
    pack: 1.15, warm: 1, wind: false, wolfMult: 1, wolfPack: 3, icefall: 0, fog: 1.6,
  },
  {
    id: 'white-death', name: 'WHITE DEATH', tagline: 'HE WALKS THE RING',
    phases: [{ id: 'snowfall' }, { id: 'whiteout' }, { id: 'snowfall' }, { id: 'whiteout' }],
    pack: 1.2, warm: 1.3, wind: false, wolfMult: 1.2, wolfPack: 3, icefall: 10, fog: 1.3,
  },
];

export function stormDuration(storm) {
  return storm.phases.reduce((a, p) => a + (p.dur ?? (PHASES.find((q) => q.id === p.id) || PHASES[0]).dur), 0);
}

// --- v2: difficulties + endless --------------------------------------------
// score — multiplier on points earned. Endless is a mode, not a
// difficulty: same numbers as Normal, but the game never ends in a win.
export const DIFFICULTIES = [
  { id: 'easy', name: 'EASY', pack: 0.8, warm: 0.75, wolf: 0.6, wood: 40, food: 32, score: 0.8 },
  { id: 'normal', name: 'NORMAL', pack: 1, warm: 1, wolf: 1, wood: 30, food: 24, score: 1 },
  { id: 'hard', name: 'HARD', pack: 1.25, warm: 1.3, wolf: 1.5, wood: 24, food: 18, score: 1.25 },
  { id: 'endless', name: 'ENDLESS', pack: 1, warm: 1, wolf: 1, wood: 30, food: 24, score: 1 },
];

// --- v2: ski-patrol rescue missions ----------------------------------------
// One mission per blizzard from blizzard 2 on, picked (seeded) from this
// pool. `target` is filled in when the mission is assigned (a slope index
// for `hold`, a count for `dig`/`scare`, seconds for `hold`/`hearth`).
export const MISSIONS = [
  { id: 'dig', name: 'DIG OUT 3 BURIED', desc: 'Rescue 3 buried villagers before the timer runs out', target: 3, timer: 45, reward: { wood: 15, score: 150 } },
  { id: 'hold', name: 'HOLD THE SLOPE', desc: 'Keep the named slope below 60 pack for 20 seconds', target: 20, timer: 0, reward: { food: 10, score: 150 } },
  { id: 'hearth', name: 'KEEP EVERY HEARTH LIT', desc: 'Every standing house warm 40 or more for 25 seconds', target: 25, timer: 0, reward: { warm: 20, score: 150 } },
  { id: 'scare', name: 'SCARE 4 WOLVES', desc: 'Scare 4 wolves before this blizzard ends', target: 4, timer: 0, reward: { wood: 10, score: 200 } },
];

export const BUILD = [
  { key: '1', id: 'fence', name: 'SNOW FENCE', cost: { wood: 8 }, desc: 'Chosen slope fills HALF as fast' },
  { key: '2', id: 'wall', name: 'ICE WALL', cost: { wood: 10 }, desc: 'Shields the weakest house' },
  { key: '3', id: 'tunnel', name: 'TUNNEL', cost: { food: 12 }, desc: 'Evacuate 3 villagers to safety' },
  { key: '4', id: 'bell', name: 'BELL', cost: { wood: 6 }, desc: 'Scares wolves off the mountain' },
  { key: '5', id: 'heater', name: 'HEATER', cost: { wood: 10 }, desc: 'Hearths drain HALF as fast' },
];

export const UPGRADES = [
  { id: 'roots', name: 'DEEP ROOTS', desc: 'Snow fences also cut pack growth on the two neighbouring slopes.' },
  { id: 'hearth', name: 'WARM HEARTH', desc: 'Warmth +20 now, and every house starts each blizzard 15 warmer.' },
  { id: 'ropes', name: 'LONG ROPES', desc: 'Rescue teams dig twice as fast and walk twice as fast.' },
  { id: 'eyes', name: 'SHARP EYES', desc: 'Scaring a wolf pays +15 more, and wolves show a warning ring sooner.' },
  { id: 'sense', name: 'SNOW SENSE', desc: 'All slopes fill 20% slower. The mountain talks; you listen.' },
  { id: 'stock', name: 'STOCKPILE', desc: '+18 wood and +12 food right now. The storehouse overflows.' },
  { id: 'walls', name: 'THICK WALLS', desc: 'Every standing house gains +30 hull at once.' },
  { id: 'choir', name: 'BELL CHOIR', desc: 'Wolves that enter the storm ring turn back on their own.' },
  { id: 'charm', name: 'AVALANCHE CHARM', desc: 'Controlled releases pay +50% score and +1 combo each.' },
];

export const THREATS = [
  { id: 'avalanche', name: 'Avalanche', icon: '❄' },
  { id: 'blizzard', name: 'Blizzard', icon: '🌨' },
  { id: 'icefall', name: 'Icefall', icon: '🧊' },
  { id: 'whiteout', name: 'Whiteout', icon: '🌫' },
  { id: 'wolves', name: 'Wolves', icon: '🐺' },
];

export function gradeFor(score) {
  if (score >= 12000) return 'S';
  if (score >= 8500) return 'A';
  if (score >= 5500) return 'B';
  if (score >= 3000) return 'C';
  return 'D';
}

export function multFor(combo) {
  return Math.min(3, 1 + Math.floor(combo / 5) * 0.25);
}
