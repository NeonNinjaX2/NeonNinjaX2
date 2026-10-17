# Handoff: Slam Dunk Delivery and the NeonNinjaX2 Arcade

This document hands the project over from a Claude Code cloud session to a Claude.ai Project. It summarises what was built, the decisions behind it, the code that matters most, and a starting prompt for a new Claude.

---

## 1. Core project goal

Build **browser games** in plain HTML5 Canvas and JavaScript, and host them on a small **arcade website** that people can visit and play from.

- **Game 1, Slam Dunk Delivery (done).** A delivery truck drives along a street. The player launches the driver out of the sunroof to dunk a package into each house's target. It must work on **iPad with touch** as well as desktop, and it should look **realistic**.
- **The arcade site (done, first version).** A homepage that features the game, with empty slots ready for future games.

### Hard constraints (from the original brief)

- Each game is **one self-contained HTML file** with its CSS and plain JavaScript inline. No frameworks and no build step.
- **No external images or audio files.** Everything is drawn with Canvas shapes, gradients and particles, and sound effects are generated with the Web Audio API.
- The on-screen display shows **Score**, **High Score** and a **"Press Space to Dunk"** prompt, which reads "Tap to dunk" on touch devices.
- Controls respond instantly and the physics feel snappy and arcade-like.

---

## 2. Where everything lives

| Item | Location |
|---|---|
| Repository | `NeonNinjaX2/NeonNinjaX2` on GitHub |
| Working branch | `ccr-7a9465b3-0mrpzn`. It is pushed but **not merged** into the default branch, and no pull request has been opened. |
| The game | `slam-dunk-delivery.html` (about 80 KB, a single file) |
| Arcade homepage | `index.html`. The game screenshot is embedded in it as a base64 JPEG. |
| Published arcade (private Claude artifact) | https://claude.ai/artifact/GdqK3vaM2RQApY7U78Vtmd. The artifact copy of the game links back with `href="./"`; the repository copy uses `href="index.html"`. |
| This handoff | `HANDOFF.md` |

### Commit history

1. `38fbbac` Add Slam Dunk Delivery: single-file canvas game with keyboard and iPad touch controls
2. `ced0d98` Give Slam Dunk Delivery a realistic look
3. `69c5f40` Add settings panel to adjust speed and trajectory
4. `404b457` Add arcade homepage for the games

### How the project evolved, request by request

1. **Original brief:** build the game. Partway through, the user added "but for iPad as well".
2. **"I want it to look realistic":** the art was fully redrawn, with cartoon shapes replaced by textured, shaded illustration.
3. **"I want to adjust the speed and the trajectory":** an in-game settings panel with sliders was added.
4. **A website where people can play the games:** the arcade homepage was built and published.

---

## 3. Key architectural decisions

### 3.1 Rendering and scaling

- **Fixed logical height of 540, variable width.** `W = clamp(700…1300, 540 × screen aspect)`, so an iPad in landscape fills the whole screen. Other aspect ratios get thin bars at the edges.
- **Sharp on Retina screens.** The canvas backing store is `css size × devicePixelRatio`, with DPR capped at 2. Each frame starts with `ctx.setTransform(scale*dpr, …)`, so all game code works in logical units.
- **Expensive art is drawn once and reused.** Each house is painted once into its own offscreen canvas (`renderHouse` stores the result in `h.sprite`). The truck body, tree sprites, cloud sprites, distant hill strips, the ground tile and the soft particle sprites are pre-rendered by `buildStatic()`. Every frame is then mostly `drawImage` calls, which keeps iPad performance acceptable. The pixel ratio for these sprites is `RS = scale*dpr`; when it changes, `buildStatic()` runs again and all house sprites are cleared.
- Background layers are rendered at a capped resolution (`RSB = min(RS, 1.5)`) to save memory on iPad.
- **Seeded random numbers** (`rng(seed)`, an xorshift generator) make each house's bricks, shingles and bushes come out the same every time that house is redrawn.

### 3.2 World and camera

- Everything uses **world coordinates**. The truck moves along the world at `speed`, and the camera follows with `camX = tx - TRUCK_SX`.
- **Two ground levels.** `GROUND = 452` is the lawn line where houses stand and where packages hit the ground. `TRUCK_BASE = GROUND + 54` puts the truck on the road in front of the houses, which gives a sense of depth.
- **Game states:** `title → drive → air → result → drive …`, and `over` after 3 misses. In the title and game-over screens the truck keeps driving slowly past houses as a background demo.

### 3.3 Gameplay rules

- Each house has one of **three target types**, and the same type never appears three times in a row:
  - **chimney:** drop into the opening from above. Scoring checks that the package crosses the top of the chimney while falling, between its inner walls.
  - **window:** an open window cut into the left wall. The package must enter the opening.
  - **hoop:** a basketball hoop in the driveway. The package must cross the rim height while falling, between the rim's ends.
- **Only the package counts for collisions**, using a circle of radius `PR = 11`. The driver's body is never checked.
- **Physics runs 3 steps per frame**, so the package can't pass through thin walls at high speed.
- Anything solid that isn't the target opening (wall, roof, chimney side, backboard, pole, front of the rim, ground) is a **crash**. A crash shows SPLAT, BRICK or MISSED, scatters cardboard pieces and packing peanuts, sends the driver tumbling and costs a life. A house that passes the truck before launch shows **TOO LATE** and also costs a life.
- **Scoring:** a dunk is worth 100. Landing near the centre adds 50 and shows "SWISH". Consecutive dunks multiply the points, up to ×5. The high score is saved in `localStorage` under `slamDunkDeliveryHigh`.
- **Each new house gets slightly faster, and its target opening shrinks:** `open = max(44, 84 - level*3)`.
- **Holding to float:** holding Space or a finger while airborne lowers gravity, giving a higher and longer arc. This is how the player steers.

### 3.4 Speed and trajectory settings

- Every tunable value lives in one `cfg` object, saved in `localStorage` under `slamDunkDeliverySettings`. Physics reads it through small functions (`gravity()`, `launchVX()` and so on), so changes take effect immediately, even mid-game.
- The panel opens with the ⚙ button or the **S** key, and Esc closes it. **The game pauses while the panel is open** and draws the dotted launch arc, so the player sees each change as they drag a slider. Arc dots are spaced by distance along the path, so they stay evenly spaced at any speed.
- The panel is a compact two-column strip along the bottom of the screen. On iPad the arc stays visible above it, and Reset and Done are visible without scrolling.

### 3.5 Input, especially iPad

- **Pointer events on `window`.** A first touch calls `press()` and the last finger lifting calls `release()`. Pointers are tracked in a `Set`, so multi-touch can't get the game stuck in the "holding" state.
- **iOS gestures are blocked** with `preventDefault` on `touchstart`, `touchmove`, `touchend` and the gesture events. This stops page scrolling, pinch zoom, double-tap zoom and the long-press menu. CSS adds `touch-action: none`, `user-select: none` and `-webkit-touch-callout: none`.
- **Buttons and panels are excluded from game input.** Any element with class `ui` (the gear button, the settings panel, the "← Arcade" link) is skipped by those handlers, so sliders and buttons work normally.
- **Audio starts on the first tap.** The Web Audio context is created on the first touch or key press, as Safari requires.
- On window blur or when the tab is hidden, the "holding" state is released. Each frame's time step is capped at 33 ms, so a pause doesn't make the game jump.
- The page carries Apple "web app" meta tags, so it runs full screen when added to the iPad home screen.

### 3.6 Look and feel

- **Visual style:** late-afternoon suburban realism.
  - Sky with a glowing sun, soft shaded clouds, three hazy layers of hills, leafy trees.
  - Grass, a concrete sidewalk with a curb, and textured road with faded lane lines.
  - Houses in siding, brick or stucco, with shingled roofs, trim and gutters, shuttered windows with reflections, panelled doors with porch lights, shrubs and mailboxes.
  - A brown box delivery truck with a hinged sunroof, and a shaded driver in a brown uniform.
  - Slight warm colour tint and darker screen edges.
- **On-screen display:** semi-transparent dark panels in a sports-broadcast style, sized with a CSS variable `--s` that follows the canvas scale.
- **In-game messages** ("SLAM DUNK!", SWISH and others) are bold italic, with a gold or white gradient and a drop shadow.

### 3.7 Arcade site (`index.html`)

- A static page with no build step: a dark "asphalt" background, street-lamp amber accent, and the fonts Big Shoulders Display and Figtree from Google Fonts.
- **Featured game:** a large screenshot card with a description, a controls list and a Play button. Below it, three "Next on the route" placeholder slots, which honestly say "In the workshop".
- **Adding a game:** add another single-file game next to the existing one and replace a placeholder slot with a card that links to it.
- **Free public hosting:** these files work on GitHub Pages as they are. That needs the branch merged into the default branch and Pages enabled in the repository settings; neither has been done yet.

---

## 4. Finalized code snippets

These are excerpts from `slam-dunk-delivery.html`. The full file is the source of truth.

### 4.1 Constants and the adjustable physics config

```js
const H = 540;                    // fixed logical height; width adapts to screen aspect
const GROUND = 452;               // lawn line where houses stand
const TRUCK_BASE = GROUND + 54;   // truck tyres sit on the road in front
const TRUCK_SX = 110;             // truck's screen x
const SUN_OX = 96;                // sunroof offset inside truck
const DRIVER_Y = TRUCK_BASE - 124;
const PK_OX = 12, PK_OY = -44, PR = 11;   // package offset from driver & radius

// ---- Adjustable speed & trajectory (Settings panel, saved per device) ----
const MPH = 6;                    // logical px/s per displayed MPH
const DEFAULTS = { startMph: 38, rampMph: 3, maxMph: 105, power: 100, angle: 70, gravity: 100, float: 45, guide: 'first' };
const cfg = { ...DEFAULTS };
try { Object.assign(cfg, JSON.parse(localStorage.getItem('slamDunkDeliverySettings') || '{}')); } catch (e) {}
const BASE_POWER = 977, BASE_GRAVITY = 1900;
const gravity = () => BASE_GRAVITY * cfg.gravity / 100;
const floatGravity = () => gravity() * (1 - cfg.float / 100);   // while holding: longer/higher arc
const launchVX = () => BASE_POWER * cfg.power / 100 * Math.cos(cfg.angle * Math.PI / 180);
const launchVY = () => -BASE_POWER * cfg.power / 100 * Math.sin(cfg.angle * Math.PI / 180);
const speedFor = lvl => Math.min(Math.max(cfg.maxMph, cfg.startMph) * MPH, (cfg.startMph + lvl * cfg.rampMph) * MPH);
const WALL = 10;
```

Settings slider ranges:

| Setting | Range |
|---|---|
| Starting speed | 15–90 mph |
| Speed-up per house | 0–8 mph |
| Top speed | 30–150 mph |
| Launch power | 60–140% |
| Launch angle | 40–85° |
| Gravity | 50–150% |
| Float strength | 0–75% |
| Aim guide | First 3 houses / Always / Off |

### 4.2 Responsive, Retina-sharp scaling

```js
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  W = Math.round(Math.max(700, Math.min(1300, H * (vw / vh))));
  scale = Math.min(vw / W, vh / H);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  wrap.style.width = cssW + 'px';
  wrap.style.height = cssH + 'px';
  wrap.style.setProperty('--s', Math.max(0.55, scale).toFixed(3));
  const newRS = Math.round(scale * dpr * 100) / 100;
  if (newRS !== RS) { RS = newRS; RSB = Math.min(RS, 1.5); buildStatic(); }
}
```

### 4.3 Launch and the in-air physics step

```js
function launch() {
  state = 'air';
  driver.mode = 'air';
  driver.x = tx + SUN_OX;
  driver.y = DRIVER_Y;
  driver.vx = speed + launchVX();   // inherits the truck's speed
  driver.vy = launchVY();
  driver.rot = 0;
  sfx.launch();
  // ...launch puff particles...
}

// inside update(dt):
} else if (driver.mode === 'air') {
  const steps = 3, h = dt / steps;            // 3 physics steps per frame: no tunnelling
  for (let i = 0; i < steps && driver.mode === 'air'; i++) {
    const ppx = driver.x + PK_OX, ppy = driver.y + PK_OY;
    driver.vy += (holding ? floatGravity() : gravity()) * h;
    driver.x += driver.vx * h; driver.y += driver.vy * h;
    driver.rot = clamp(driver.vy / 2200, -0.35, 0.45);
    checkPackage(ppx, ppy, driver.x + PK_OX, driver.y + PK_OY);
  }
}
```

### 4.4 Scoring and collision (package only)

```js
function checkPackage(ppx, ppy, px, py) {
  const h = active;
  // ---- scoring ----
  if (h.type === 'chimney') {
    if (ppy < h.cy && py >= h.cy) {
      const ix = ppx + (px - ppx) * (h.cy - ppy) / (py - ppy);
      if (ix > h.cx + WALL + 2 && ix < h.cx + h.cw - WALL - 2) {
        dunk(ix - (h.cx + h.cw / 2), (h.cw - WALL * 2) / 2, ix, h.cy); return true;
      }
    }
  } else if (h.type === 'window') {
    if (px > h.x + 10 && px < h.x + h.nd && py > h.wy + PR * 0.6 && py < h.wy + h.nh - PR * 0.6) {
      dunk(py - (h.wy + h.nh / 2), h.nh / 2, h.x + 20, h.wy + h.nh / 2); return true;
    }
  } else {
    if (ppy < h.rimY && py >= h.rimY) {
      const ix = ppx + (px - ppx) * (h.rimY - ppy) / (py - ppy);
      if (ix > h.rimL + 2 && ix < h.rimR - 2) {
        dunk(ix - (h.rimL + h.rimR) / 2, (h.rimR - h.rimL) / 2, ix, h.rimY); return true;
      }
    }
  }
  // ---- crashes ----
  for (const hs of houses) {
    for (const s of hs.solids) {
      if (circleRect(px, py, PR, s)) {
        crash(px, py, hs.type === 'hoop' && s.h < 90 && s.w < 10 ? 'BRICK' : 'SPLAT'); return true;
      }
    }
    const ry = roofYAt(hs, px);
    if (ry !== Infinity && py + PR * 0.8 > ry && py < GROUND - hs.wallH + 10) {
      crash(px, py, 'SPLAT'); return true;
    }
  }
  if (py + PR >= GROUND) { crash(px, GROUND - PR, 'MISSED'); return true; }
  return false;
}
```

`makeHouse(x, level)` builds each house's `solids` list of rectangles alongside its target geometry:

- **chimney:** `cx`, `cy`, `cw`, `cBase`
- **window:** `wy`, `nh`, `nd`
- **hoop:** `px`, `bbX`, `rimL`, `rimR`, `rimY`

`roofYAt(h, x)` gives the height of the roof's triangle at any x. **Always keep the drawing and these collision shapes in step.** If you change how a house is drawn, update its `solids` to match.

### 4.5 Input that works on iPad without breaking the settings panel

```js
const onUi = e => e.target && e.target.closest && e.target.closest('.ui');

function press() {
  if (settingsOpen) return;
  unlockAudio();                       // iOS: audio must start from a user gesture
  if (state === 'title') { start(); return; }
  if (state === 'over') { if (overT > 0.8) start(); return; }
  if (state === 'drive') launch();
  holding = true;                      // keep holding = float
}
function release() { holding = false; }

const activePointers = new Set();
window.addEventListener('pointerdown', e => {
  if (onUi(e)) return;
  e.preventDefault();
  const first = activePointers.size === 0;
  activePointers.add(e.pointerId);
  if (first) press();
}, { passive: false });
const up = e => { activePointers.delete(e.pointerId); if (activePointers.size === 0) release(); };
window.addEventListener('pointerup', up);
window.addEventListener('pointercancel', up);
['touchstart', 'touchmove', 'touchend'].forEach(t =>
  window.addEventListener(t, e => { if (!onUi(e)) e.preventDefault(); }, { passive: false }));
['gesturestart', 'gesturechange', 'gestureend', 'contextmenu'].forEach(t =>
  window.addEventListener(t, e => e.preventDefault()));
```

Keyboard controls: Space, Up arrow or Enter launches, and holding floats. **S** opens or closes settings and **Esc** closes them.

### 4.6 Main loop

```js
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!settingsOpen) update(dt);   // paused while tuning, but still rendering the arc preview
  render();
  requestAnimationFrame(frame);
}
```

---

## 5. How it was tested

- In the cloud session, headless Chromium was driven by Playwright with three device profiles: **iPad (gen 7) landscape** with touch, iPad portrait, and a 1280×720 desktop with a keyboard.
- **Gameplay:** the tests tapped at random moments for about 60 rounds. They checked for JavaScript errors (none were found) and confirmed that dunks are possible (scores of 100–200 came up).
- **Settings:** tapping the gear does not start the game, changes to the sliders took effect (the speed reading changed), and settings were still there after a reload.
- **Arcade:** Play opens the game, "← Arcade" comes back, and the page has no sideways scrolling at phone width.
- **Not yet done:** testing on a real iPad, checking frame rate on real hardware, and checking that the links work inside the published Claude artifact.

---

## 6. Open items and ideas

1. **Public hosting.** Merge `ccr-7a9465b3-0mrpzn` into the default branch and enable GitHub Pages. Alternatively, share the Claude artifact from its Share menu, since it is currently private.
2. **Real-device check on iPad:** smoothness, sound after the first tap, and the "Add to Home Screen" full-screen mode.
3. **Game 2 and beyond** for the arcade. Keep the same pattern: one HTML file each, plus a card on `index.html`.
4. **Possible game polish:** a mute button, pausing on tab switch, and a leaderboard. A leaderboard needs a backend, because scores are currently stored only on each device.
5. **Very low launch power or angle settings** can make high chimneys and hoops unreachable. The arc preview shows this, but the game does not prevent it.

---

## 7. Recommended Starting Prompt

Upload `slam-dunk-delivery.html`, `index.html` and this `HANDOFF.md` to the Project's knowledge, then paste this:

```text
You're picking up an existing project: browser games by NeonNinjaX2, hosted on a small arcade website.

Project files (in this Project's knowledge):
- slam-dunk-delivery.html — finished single-file HTML5 Canvas game (the source of truth)
- index.html — the "NeonNinjaX2 Arcade" homepage that links to the game
- HANDOFF.md — full history, architecture decisions and key code. Read it before answering.

Ground rules for all work in this project:
1. Each game is ONE self-contained .html file: inline CSS and plain JavaScript, Canvas API only. No frameworks,
   no build step, no external images or audio files. Draw everything with canvas shapes, gradients and
   particles; make sound with the Web Audio API.
2. Every game must work on iPad with touch AND on desktop with a keyboard. Keep the existing input approach:
   pointer events on window, preventDefault on touch and gesture events to stop iOS scrolling and zoom,
   exempt anything with class "ui", and start audio on the first gesture.
3. Keep the realistic illustrated look: textured, shaded, pre-rendered offscreen sprites at
   RS = scale × devicePixelRatio, a fixed logical height of 540 with variable width, and DPR capped at 2.
4. In Slam Dunk Delivery, physics reads from the cfg object (gravity(), floatGravity(), launchVX(), launchVY(),
   speedFor(level)). New tuning values go into cfg/DEFAULTS and the settings panel, not into hard-coded numbers.
5. Collision uses only the package (radius PR = 11) against each house's `solids` rectangles plus roofYAt().
   If you change how a house looks, update its collision geometry to match.
6. When you change a file, give me the complete updated file (or clearly marked full functions)
   so I can replace it directly. Briefly say what changed and anything you couldn't verify.
7. New games go on the arcade by replacing one of the "In the workshop" placeholder slots in index.html
   with a card that links to the new game file.

Current status: Slam Dunk Delivery is complete (realistic art, iPad touch, adjustable speed and trajectory
via the ⚙ settings panel, saved high score). The arcade homepage is built. The code is on GitHub repo
NeonNinjaX2/NeonNinjaX2, branch ccr-7a9465b3-0mrpzn (not yet merged; GitHub Pages not yet enabled).

Start by confirming in a few lines that you've read HANDOFF.md and the two HTML files, then ask me
what I'd like to work on next.
```
