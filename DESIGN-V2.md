# WHITEOUT v2 — "Tujuh Badai" — Design Note

Built on commit `3e36217` (Phase 1 looks already applied and verified).
Competition: make.fun best-game-01, BUNDLE flow (normal git edits fine).
Standing entry (DO NOT TOUCH): submission `01a1e8fc`, claim
`AF-3M69T-ZCCHD-XN7AP-VDK7X`.

## What already existed (NOT new — do not re-claim as v2 work)

- 8 slopes with snowpack that avalanches at 100; controlled releases
  (click a slope, score + combo).
- 5 hazards shown as threat rows: avalanche / blizzard / icefall /
  whiteout / wolves (icefall was a label only — no icefall mechanic).
- 5 build tools: fence / wall / tunnel / bell / heater (keys 1–5).
- 9 draft upgrades between blizzards (Deep Roots, Warm Hearth, …).
- Villagers (evacuated / protected / at-risk / lost); buried villagers
  with rescue clicks; rescue teams that walk out and dig.
- Hearth warmth (houses lose warmth, go cold, die); stoking (H / click).
- Wolves that stalk the village and steal food; horn (Space) and bell.
- The White Giant storm eye on blizzard 7: rides the ring, click to push
  back 3×, then FINAL STAND / WIN.
- 4 weather phases (calm / snowfall / whiteout / clear, 40 s per blizzard,
  identical every blizzard); grade / score / combo.
- Phase 1 looks: dramatic title key art, navy/ice panels, Bungee logo,
  realistic cabins/pines, staged screenshots (title/play/draft/win/lose).

## What is NEW in v2 (checkable list)

### Step 1 — 7 named storms (`STORMS` table, config.js + world.js)
- One named storm per blizzard; each has its own phase sequence,
  pack/warmth rates, wind behaviour, hazard mix, duration, visibility.
  The old single global `PHASES` list is now only the phase *library*;
  `world.phaseSeq` (per-blizzard sequence) drives `update()`.
- 1. **First Flakes** — gentle intro: mostly calm + snowfall, pack ×0.8,
  no wolves.
- 2. **Howling Pass** — wind: wind angle shifts every ~4 s; the windward
  slope (within 45° of the wind) fills ×1.6, leeward ×0.7; gusts
  announced in the log/banner.
- 3. **Wolf Moon** — longer whiteout phases, wolf packs of 3–4 spawn at
  once, wolves +30% faster.
- 4. **Icefall** — NEW hazard: every ~8 s a random slope spikes +25 pack
  with a warning flash + log (`ICE CRACKS on the N slope`).
- 5. **Deep Freeze** — hearth drain ×2, shorter calm phase.
- 6. **Whiteout Wall** — whiteout dominates (long phases), heavy fog,
  pack ×1.15, wolves in the murk.
- 7. **White Death** — boss night (Step 3): all hazards at once, no clear
  phase.
- Storm name + one-line effect visible to the player: banner at blizzard
  start (`BLIZZARD 2 — HOWLING PASS · THE WIND TURNS`) and the weather
  tablet phase line shows the storm name.

### Step 2 — Ski-patrol rescue missions (world.js + render.js)
- One active mission per blizzard from blizzard 2 on, picked from a pool
  (seeded by `rng`). `world.mission = {id, name, desc, target, progress,
  timer, state}`.
- Implemented types (all 4):
  - **DIG OUT 3 BURIED** — rescue 3 buried villagers in 45 s;
    reward +15 wood +150 score; fail: 2 villagers lost.
  - **HOLD THE SLOPE** — keep a named slope's pack below 60 for 20 s
    (consecutive; resets if it hits 60); reward +10 food +150;
    fail: that slope avalanches immediately.
  - **KEEP EVERY HEARTH LIT** — all standing houses warm ≥ 40 for 25 s
    (consecutive); reward +20 warmth to every house +150;
    fail: coldest house −25 hp.
  - **SCARE 4 WOLVES** — scare 4 wolves before the blizzard ends;
    reward +10 wood +200; fail: wolves steal 6 food.
- UI: compact mission strip during play, centred below the banner
  (y≈118, w 560, h ≈26, navy/ice style), name + progress bar + timer.
  Success/failure announced via banner + float + log; reward/penalty
  applied in world.js. An unfinished mission resolves (success if
  progress met, else fail) when its blizzard ends.

### Step 3 — Boss "White Death" on night 7 (world.js + render.js + shots.js)
- REPLACES the White Giant eye on blizzard 7. The eye code stays intact
  but never activates on night 7 (`startBlizzard(7)` sets
  `death.active = true`, `eye.active = false`).
- White Death: a tall pale hooded figure that walks the storm ring
  toward the village. Every ~7 s it FREEZES the nearest slope (+30 pack,
  warning float + log + ice visual). It has 3 shrouds (health).
  Clicking it pushes it back (dist +70, max 280) and tears one shroud
  (+150 score, `SHROUD TORN`). If it reaches the village (dist ≤ 96)
  it strikes: a random standing house −25 hp and −20 warmth, screen
  shake, log `WHITE DEATH REACHES THE VILLAGE`, then it retreats to
  dist 260. Break all 3 shrouds to defeat it.
- Win: blizzard 7 ends (or FINAL STAND) with White Death defeated → WIN;
  if the timer ends and Death lives → FINAL STAND until defeated.
- Render: canvas-drawn figure on the ring (white cloak, hollow dark
  eyes, ice-blue rim, freeze aura) + a `WHITE DEATH` boss bar (same
  position as the old Giant bar, top centre) with 3 shroud pips.
  Hit-test radius 30, checked before wolves (like the eye was).
- Staged `play` shot now stages White Death (blizzard 7, 2 shrouds torn,
  a frozen slope) instead of the Giant eye; banner/log text updated.

### Step 4 — 3 difficulties + Endless (config.js + world.js + render.js + main.js)
- `DIFFICULTIES` table: EASY (pack ×0.8, warmth drain ×0.75,
  wolves ×0.6, start wood 40 / food 32, score ×0.8), NORMAL (as now:
  1/1/1, wood 30 / food 24, score ×1), HARD (pack ×1.25, warmth drain
  ×1.3, wolves ×1.5, start wood 24 / food 18, score ×1.25).
- ENDLESS: 4th mode — after blizzard 7 + boss broken, instead of WIN
  the game continues (blizzard 8, 9, …) with storms cycling
  (storm index `(n−1) % 7`) and pack rate +0.08 per extra blizzard;
  it ends only on loss; score keeps accumulating.
- Title screen: difficulty pill row in the empty left-column space below
  the pills (y≈530): four pills EASY / NORMAL / HARD / ENDLESS
  (Bungee 13 px, selected = ice-filled, others outline; NORMAL default).
  Click selects (new hitTest kind `difficulty` + doClick case);
  PLAY / Enter starts with the selection. `world.difficulty` +
  `world.endless` stored; `startGame` applies the modifiers.
- In Endless mode the WIN pill reads `Endless — how long can you hold?`
  and the WIN condition is disabled.
- All new UI follows the SAME approved icy concept (Bungee display,
  Lilita body, ice palette #7DD3FC / #E0F2FE / #BAE6FD, navy panels,
  no gold). Background kept simple.

## Balance notes (Normal)

- Storm pack multipliers are modest (0.8–1.2) so Normal stays winnable;
  the difficulty comes from the new mechanics (wind, icefall spikes,
  wolf packs, missions) rather than raw numbers.
- Icefall +25 and Death freeze +30 can push a slope to 100 — that is
  intended: the player must watch the warned slope and release it.
- Mission fail penalties hurt but never instantly lose the game
  (worst case: an avalanche, or −25 hp on one house, or 2 villagers lost).
