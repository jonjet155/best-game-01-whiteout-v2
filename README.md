# WHITEOUT — hold the village through 7 blizzards

The enemy is not monsters that arrive; it is the snow itself. Every mountain
slope has a visible, growing **SNOWPACK DEPTH**. Past its threshold a slope
releases a natural avalanche toward the village. Your job: **MANAGE and
RELEASE** — trigger small controlled avalanches early, channel them into
gullies away from houses, rescue buried villagers, keep the hearth fires lit.

## How to play

- **Click a slope** to trigger a controlled avalanche on it (safe while the
  pack is low; the snow runs down the gully and away from the houses).
  A slope left to fill past 100 releases a **natural avalanche** that smashes
  houses and buries villagers.
- **Click a wolf** to drive it off with a snowball (free, short cooldown).
  Wolves come in the whiteout phase and steal food if they reach the village.
- **Click a buried villager** (or press **R**) to send a rescue team to dig
  them out. Costs 2 food, takes a few seconds — a buried villager left past
  the end of the blizzard is **lost**.
- **Click a house** (or press **H**) to stoke its hearth: costs 2 wood, warms
  the house. Cold houses take damage.
- **Build with keys 1–5** (click a slope first to choose where a fence goes):
  1 Snow Fence (8 wood, that slope fills half as fast), 2 Ice Wall (10 wood,
  shields the weakest house), 3 Tunnel (12 food, evacuates 3 villagers to
  safety), 4 Bell (6 wood, scares nearby wolves), 5 Heater (10 wood, every
  hearth drains half as fast).
- **SPACE — Horn**: rally cry that scares every wolf on the mountain.
  Cooldown 10 s.
- **P / ESC** pause, **M** mute.

Between blizzards, at the thaw, draft **1 of 3 upgrades** (drawn from 9:
deeper fences, warmer hearths, faster rescues, sharper eyes, snow sense,
stockpiles, thick walls, bell choir, avalanche charm).

## The storm

Each blizzard runs through four weather phases: **calm → snowfall →
whiteout** (visibility drops, wolves come) **→ clear**. The storm ring
around the mountain shows which blizzard of 7 is running and which way the
wind blows. On blizzard 7 the **White Giant** wakes: its storm eye circles
the mountain and drifts toward the village — click the eye to push it back.
Push it back 3 times to break it.

## Win / Lose

- **WIN:** survive all 7 blizzards and break the White Giant.
- **LOSE:** every house is destroyed, or 15 villagers are lost.

## Resources

- **Wood** feeds hearths and builds fences, walls, bells and heaters.
  **Food** feeds rescue teams and pays for tunnels. **Warmth** is the
  village's shared hearth-heat: it falls in snowfall and whiteout and rises
  when you stoke hearths.
- **Combo** grows with every clean release, rescue and scare, and pays more
  the longer it runs. One avalanche hitting the village resets it.

## Run it

```
node serve.ts            # then open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the entry in: it copies
`game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library. The game itself is
plain static files under `game/` — Canvas 2D, generated painterly art
embedded locally, synthesized WebAudio, no network, seeded RNG
(seed 20261117) so every run plays the same mountain.

## License

MIT — see LICENSE.
