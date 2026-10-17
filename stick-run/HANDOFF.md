# Stick Run: project handoff

This summarizes everything built so far, so a new Claude chat (for example in
a Claude.ai Project) can continue without the original conversation.

## 1. Project goal

The owner is NeonNinjaX2 on GitHub. They are learning to code and want to make
games. The goal is a browser game in the style of stick-figure YouTube
animations: a **white stick figure on a black background**. It started as a
simple platformer and grew to include:

- iPad / touch support (the owner plays on an iPad)
- enemies and stick-fight combat
- moving platforms and checkpoints
- an arena (wave survival) mode
- a level editor with share codes
- double jump
- 14 story levels

The owner's next idea is **a website where people can visit and play their
games**. The answers to the two questions that came up about that are in
section 10.

## 2. Where everything is

| What | Where |
|---|---|
| Repo | `NeonNinjaX2/NeonNinjaX2` on GitHub. This is the owner's profile repo; its root `README.md` is their GitHub profile page, so don't touch it. |
| Branch | `claude/stick-figure-platformer-49vetk` (not merged to `main` yet; no pull request opened) |
| The whole game | `stick-run/index.html`: one self-contained file, about 3,200 lines, with no dependencies, build step or images |
| Player docs | `stick-run/README.md` (controls, enemies, editor, map symbols) |
| Level checker | `stick-run/tools/solve-level.mjs` (Node, see section 8) |
| Playable copy | https://claude.ai/artifact/RTk7REc4WHuBagBra6UENG (private to the owner unless shared). It's the same game with the `<html>/<head>/<body>` wrapper removed, because the artifact host adds its own. |

Commits so far:

1. `e0531a6` Add Stick Run: a stick-figure platformer (5 levels)
2. `41182e6` iPad support, combat, enemies, moving platforms, checkpoints, arena and level editor (8 levels)
3. `c338a06` Double jump and six new levels (14 levels)
4. This handoff and the level checker

## 3. Key decisions (and why)

1. **One HTML file, plain JavaScript, Canvas 2D, no libraries.** Anyone can
   open it in a browser (including Safari on iPad). It can be hosted anywhere,
   for example on GitHub Pages, and it's easy for a beginner to read. Keep it
   this way unless there's a strong reason not to.
2. **Fixed 60 Hz simulation, render every frame.** `frame()` collects
   elapsed time and calls `step()` in 1/60 s ticks. All physics values are
   "pixels per frame at 60 fps".
3. **Simulation is separated from rendering.** `simStep()` advances
   the world one frame with no drawing. The world is in `world` (plain JSON
   data: player, enemies, platforms, shots, coins, checks). The static tiles are
   in `level`. This let us **snapshot the world with `JSON.stringify`** and
   automatically check that every level is beatable (section 8). Keep game logic
   deterministic: use no `Math.random()` inside `simStep` for story levels.
   Arena spawning is the one exception.
4. **Levels are text maps** (arrays of strings, one character per 32 px
   tile). The editor and the share codes use the same format.
5. **The stick figure is drawn from joint angles, not from images.** A
   pose is `{ lean, l: [[thigh, shin] ×2], a: [[upper, fore] ×2] }`, with
   angles measured from straight down and positive meaning toward the facing
   direction. Every animation (run cycle, jump, wall slide, punches, the
   double-jump flip) is a target pose. The current pose eases toward the target
   with `lerpPose`. Death breaks the skeleton into separate line pieces
   (`shatterStick`).
6. **Look:** pure black background, white line art, **red (`#ff3355`) only
   for enemies and danger**, and a Courier-style monospace font. Blocks are
   white outlines drawn only on exposed edges.
7. **One-hit death in story mode** (like Celeste), with checkpoints. **Hit
   points in Arena** (5, plus 1 back per wave cleared).
8. **The double jump unlocks at story level 5** ("Double Jump"). The levels
   before it have `noDouble: true` so they still teach dashing. Arena and the
   editor always have it.
9. **Touch controls are drawn on the canvas.** On-screen ◀ ▶ / JUMP / HIT /
   DASH buttons are drawn on the canvas, and menus and the editor use normal
   HTML buttons (easier to tap). Safe-area insets are measured from a probe
   `<div>` so buttons avoid the iPad home bar.
10. **Saving uses `localStorage`** with the `stickrun.` prefix (`progress`,
    `arenaBest`, `custom`, `muted`). It's wrapped in try/catch so the game
    still works where storage is blocked.

## 4. Code map (`stick-run/index.html`)

Top to bottom, the `<script>` contains:

| Section | Main names |
|---|---|
| Story levels | `LEVELS` (14 entries), `ARENA_MAP`, `DEFAULT_CUSTOM` |
| Tuning | `GRAVITY`, `RUN_SPEED`, `JUMP_VEL`, … `ATTACKS`, `ENEMY_INFO` |
| Storage | `store.get/set` |
| Screen | `resize()`, `zoom`, `SAFE` (safe-area insets) |
| Input | `KEYMAP`, `keys` (held), `pressed` (this frame), `touchButtons()`, `handleTouches()` |
| Sound | `initAudio()` (resumes on touch for iOS), `sfx()`, `SFX.*` (tiny oscillator synth, no files) |
| World | `buildWorld(rows, mode, meta)`, `tileAt`, `isSolid`, `moveX/moveY` (tile collision), `updatePlatforms` |
| Player | `makePlayer`, `updatePlayer` (run, jump, coyote, buffer, wall jump, double jump, dash, attacks, platform riding), `checkTiles` (spikes, coins, flags, exit), `hurtPlayer`, `killPlayer`, `respawnPlayer` |
| Enemies | `makeEnemy`, `updateEnemy` (walker / flyer / shooter / fighter AI), `hitEnemy`, `killEnemy`, `updateShots`, `playerVsEnemies` (attacks, stomps, dash strikes, punching shots back) |
| Arena | `waveList(n)`, `updateArena()` |
| Frame | `simStep()` |
| Animation | `runPose`, `playerPose`, `enemyPose`, `lerpPose`, `skeleton`, `drawStick`, `shatterStick` |
| Effects | `particles`, `ghosts` (dash trail), `debris`, `popups`, `shake`, `hitstop`, `flash` |
| Camera | `camera`, `updateCamera`, `clampCamera` |
| Scenes | `scene` = `menu / play / paused / trans / win / over / editor`; `startStory`, `startArena`, `startTest`, `finishStoryLevel`, `step()` |
| Drawing | `drawTiles`, `drawWorld`, `drawHUD`, `drawTouchControls`, `drawTitle`, `render()` |
| Editor | `TOOLS`, `editor` state, pointer handlers (one finger paints, two pan), `resizeGrid`, `renderEditor`, `drawGlyph`, `buildPalette`, `encodeLevel/decodeLevel` |
| HTML screens | `showUI`, `showMainMenu`, `showLevelPick`, `pause/resume`, `toast`, `openModal`, `wireUI` |
| Start | `frame()`, `boot()` |

## 5. The finalized code snippets that matter most

### Map legend and a level entry

```
#  block              ^  floor spike       v  ceiling spike
P  player start       E  exit door         *  coin
C  checkpoint flag    =  platform ↔        ~  platform ↕
:  platform stop (invisible; turns moving platforms around)
g  walker             f  flyer             s  shooter        F  fighter
.  empty
```

```js
{
  name: "Double Jump",
  // hint is a string, or { key, touch } for keyboard vs touch wording
  hint: { key: "Press jump again in mid-air to double jump…", touch: "Tap JUMP again in mid-air…" },
  // noDouble: true,   // only on levels 1–4
  map: [
    "................................................",
    "..P......####.......############################",
    "#############.......############################",
  ],
}
```

A run of `=` or `~` becomes one platform, and platforms reverse when they hit a
`#` or a `:`. Past the left and right edges counts as wall. Falling off the
bottom kills you.

### Tuning (pixels and frames at 60 fps)

```js
const T = 32;                 // tile size
const GRAVITY = 0.55, MAX_FALL = 13;
const RUN_SPEED = 4.2, GROUND_ACCEL = 0.9, AIR_ACCEL = 0.55;
const JUMP_VEL = -10.5, JUMP_CUT = 0.45;   // release early → short hop
const COYOTE = 6, JUMP_BUFFER = 8;
const WALL_SLIDE = 2.6, WALL_JUMP_X = 6, WALL_JUMP_Y = -9.8, WALL_LOCK = 12;
const DOUBLE_JUMP_VEL = -9.5, FLIP_TIME = 22;
const DASH_SPEED = 12, DASH_TIME = 10, DASH_COOLDOWN = 18;
const PW = 14, PH = 44;       // player hitbox
const ARENA_HP = 5;
```

**Level design limits**, which come from these numbers:

- **Normal jump:** about 3 tiles up and 5 across.
- **Double jump:** about 5 up and 9 across.
- **Double jump plus dash:** about 13 across.
- **Headroom:** the player is about 1.4 tiles tall, so leave **at least 2
  empty rows** wherever they walk under something.

### Attacks and enemies

```js
// Ground attacks chain jab → cross → kick; frames count from the swing start.
const ATTACKS = {
  jab:   { len: 13, from: 2, to: 6,  reach: 24, y: 8,  h: 16, dmg: 1, kb: 3,   lift: -2, lunge: 1.5 },
  cross: { len: 14, from: 3, to: 7,  reach: 26, y: 8,  h: 16, dmg: 1, kb: 3.5, lift: -2, lunge: 2 },
  kick:  { len: 20, from: 5, to: 11, reach: 32, y: 14, h: 22, dmg: 2, kb: 7,   lift: -5, lunge: 2.5 },
  air:   { len: 18, from: 3, to: 12, reach: 26, y: 18, h: 26, dmg: 1, kb: 5,   lift: -3, lunge: 0 },
};
const ENEMY_INFO = {
  g: { type: "walker",  w: 14, h: 40, hp: 1, points: 100 },
  f: { type: "flyer",   w: 22, h: 22, hp: 1, points: 150 },
  s: { type: "shooter", w: 14, h: 44, hp: 2, points: 200 },
  F: { type: "fighter", w: 14, h: 44, hp: 3, points: 300 },
};
```

- **Fighter states:** `walk → chase → windup (22 frames, flashes "!") → punch
  (9) → recover (26)`. Hitting a fighter stuns it for 18 frames and cancels
  the wind-up.
- **Shooter:** throws a shot every 110 frames when it can see the player.
  Punching a shot turns it into the player's shot.
- **Walker and flyer:** touching them hurts.
- **Dashing:** the player is invulnerable during a dash and damages any
  enemy touched.
- **Refills:** the double jump and the dash refill on landing, on wall
  contact, on a stomp, and on hitting an enemy in the air.

### One simulation frame

```js
function simStep() {
  world.time++;
  if (world.comboT > 0 && --world.comboT === 0) world.combo = 0;
  updatePlatforms();
  const p = world.player;
  if (p.alive) updatePlayer(p);
  for (const e of world.enemies) if (e.alive) updateEnemy(e);
  updateShots();
  playerVsEnemies(p);
  for (const c of world.checks) c.raise = Math.min(1, c.raise + (c.on ? 0.05 : 0));
  if (world.mode === "arena") updateArena();
}
```

`step()` wraps this with scene logic. It handles hit-stop (skip frames),
the respawn countdown, `world.exited` (next level, or back to the editor), and
the arena game-over screen.

### Jump order inside `updatePlayer`

The code tries these in order: ground jump (with coyote time), then wall jump,
then double jump.

```js
if (p.jumpBuf > 0) {
  if (p.coyote > 0)                     { /* ground jump: vy = JUMP_VEL */ }
  else if (p.wallCoyote > 0 && !p.onGround) { /* wall jump away from p.lastWall */ }
  else if (p.airJumps > 0 && !p.onGround && world.doubleJump) {
    p.vy = DOUBLE_JUMP_VEL; p.airJumps--; p.flipT = FLIP_TIME; // + ring() dust, SFX.double()
  }
}
```

### Share codes (editor)

```js
// Run-length encoded rows joined by "/", prefixed "SR1:"
function encodeLevel(grid) {
  return "SR1:" + grid.map((r) => r.join("").replace(/(.)\1*/g, (m) => (m.length > 1 ? m.length : "") + m[0])).join("/");
}
```

`decodeLevel` reverses this and checks the result: only legend characters are
allowed, with 4 to 60 rows and at most 250 columns.

## 6. Things learned the hard way

- `resize()` runs at startup before the editor has a grid, so only refit the
  editor when `scene === "editor"`. This crashed the whole page once (a blank
  screen).
- Level settings like `noDouble` are passed by handing the whole `LEVELS[i]`
  object to `buildWorld` as `meta`. An earlier version passed only
  `{ name, hint }`, which silently dropped `noDouble`.
- Moving-platform landing has to compare against the platform's position
  *before* it moved this frame (`pl.y - pl.dy`). Otherwise riders slip off
  platforms that are moving down.
- On iPad Safari, sound starts only after a touch, which is why `initAudio()`
  is called from the touch and pointer handlers and calls `audio.resume()`.
  Pinch-zoom and double-tap zoom are blocked with `gesturestart` and
  `dblclick` handlers.
- In menus, Space and Enter must reach the focused HTML button, so game keys
  call `preventDefault()` only during play and in the editor.
- When publishing as a Claude artifact, strip `<!DOCTYPE>/<html>/<head>/<body>`
  and keep `<title>`, `<style>` and the body contents.

## 7. Current feature list

- **Story:**
  - 14 levels: First Steps, Mind the Spikes, Wall Jump, Dash, Double Jump,
    Moving Parts, Fight Back, Crossfire, Spike Tower, Sky Bridge, The Pit,
    Ambush, Gauntlet, Final Run.
  - A level-select screen with unlock progress.
  - 44 coins, a death counter and a timer.
- **Arena:** endless waves, combo scoring, a saved best wave and score.
- **Editor:**
  - 16 tools, with paint, erase and pan.
  - Undo, width and height resize, and zoom.
  - Test play and autosave.
  - Share and Load codes.
- **Controls:**

  | Device | Controls |
  |---|---|
  | Keyboard | arrows or WASD to move, Space / W / ↑ / Z to jump, Shift / X / K to dash, J / C to attack, R to restart, P / Esc to pause, M to mute |
  | Touch | ◀ ▶ JUMP HIT DASH buttons, plus a pause button |

## 8. How changes were tested

- **Level checker:** `node stick-run/tools/solve-level.mjs <index>` loads the
  game's `<script>` into Node with stubbed browser objects. It then runs a
  best-first search over button presses (5-frame chunks of
  left/right/none × jump tap/hold/keep-holding × dash/attack), using the real
  `simStep`. Use `SEG=n` to check one checkpoint-to-checkpoint section, which
  is much faster.
  - **Results:** all 14 levels were confirmed beatable. Most were checked
    section by section; the last section of The Pit was confirmed with a
    scripted run instead.
  - **Dash level:** confirmed to *require* the dash.
  - **If the search can't find a way:** a failed search doesn't prove a level
    is impossible. Check the specific jump with a small scripted run.
- **Browser checks:** Playwright with Chromium at iPad sizes (1180×820
  landscape and 820×1180 portrait, touch on) and at desktop size. It took
  screenshots, checked for no console errors, sent real touch events to the
  ◀ ▶ buttons, placed editor tiles by tapping, and checked that share codes
  load back as the same level.
- **Not done yet:** a test on a real iPad.

## 9. Ideas not built yet

- A games website / portfolio page (see section 10)
- Boss fights, new enemy types, or weapons (a stick or sword pickup)
- A "Play shared level" button on the main menu (right now codes load through
  the editor)
- Save files for several custom levels (right now there's one editor slot)
- Background music, and options such as button size and left-handed layout
- Time-trial medals per level

## 10. The two website questions, answered

1. **What kind of games are they?** Browser games made with plain
   **HTML, CSS and JavaScript** (Canvas 2D). There's no engine or download;
   they run in any modern browser, including Safari on iPad.
2. **Do the games already exist?** Yes, **Stick Run** is finished and
   playable (`stick-run/index.html`). More games may be added later.

**Suggested approach for the website:**

- **Hosting:** use **GitHub Pages**, which is free. Either turn it on for
  this repo, or make a new repo such as `NeonNinjaX2/games`. Then
  `stick-run/index.html` is live at a public URL with no changes needed.
- **Home page:** add a simple `index.html` at the site root that lists each
  game with a title, a screenshot and a "Play" link. It should use the same
  black-and-white look.
- **Adding games:** each new game goes in its own folder, like `stick-run/`.

## 11. Recommended starting prompt

Paste this into the new Project's first chat. Add `stick-run/index.html`,
`stick-run/README.md` and this `HANDOFF.md` to the Project's knowledge files
first.

```text
I'm continuing a game project. Read HANDOFF.md, README.md and index.html in
the project files before answering. Together they are the full context.

Summary: "Stick Run" is a one-file HTML5 canvas game (plain JavaScript, no
libraries). A white stick figure on a black background, styled like stick-figure
YouTube animations. Red is used only for enemies. It has 14 story levels, an
arena wave mode, a level editor with share codes, combat (jab/cross/kick
combo, air kick, stomp, dash strike, punching shots back), 4 enemy types, moving
platforms, checkpoints, wall jump, dash and double jump. It runs on iPad with
on-screen touch buttons. The code is in my GitHub repo NeonNinjaX2/NeonNinjaX2
on the branch claude/stick-figure-platformer-49vetk, in the stick-run/ folder.

Rules for working on it:
- Keep it a single self-contained index.html with no libraries or build step.
  It must work in Safari on iPad (touch) and on desktop (keyboard).
- Keep the look: black background, white line art, red (#ff3355) only for
  enemies and danger.
- Game logic belongs in simStep() and must stay deterministic, with no
  Math.random in story-mode logic. Rendering stays separate.
- New levels use the text-map legend in HANDOFF.md, and must respect the jump
  limits there (normal jump ~3 up / 5 across; double jump ~5 up / 9 across; 2
  rows of headroom). Levels 1–4 keep noDouble: true.
- When you change code, give me the exact edits (or the full updated file if
  the change is large), and tell me what to test on my iPad.
- I'm still learning to code, so explain things simply and briefly.

First task: [write what you want next, e.g. "build a simple website home page
that lists my games, to host on GitHub Pages"]
```
