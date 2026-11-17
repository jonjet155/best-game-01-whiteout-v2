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
