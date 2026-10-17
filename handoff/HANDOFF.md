# Handoff: NeonNinjaX2 Arcade and Hustle Dave

Written October 2026 when the project moved from a Claude Code cloud session to a Claude.ai Project.

## 1. Who and what

- **Owner:** GitHub user **NeonNinjaX2**, who is learning to code and wants to make games. Explain things simply and avoid jargon.
- **Repo:** `github.com/NeonNinjaX2/NeonNinjaX2` (public; it's also their GitHub profile README repo).
- **Working branch:** `ccr-e2179437-bmf3zg`. All work so far is there and has **not** been merged into `main`.
- **Core goal:** build fun browser games, starting with **Hustle Dave**, and host them on a website anyone can visit.

## 2. How the project evolved

1. **v1: "a game about a guy who makes money."** An idle clicker: click Work, buy 11 businesses, upgrades, lifestyle items that change Dave's look, golden-bill bonuses, a fake stock ("DUCK"), trophies and a prestige reset ("Retire"). This version was fully replaced in step 2.
2. **v2: "make it real."** The owner asked for three things: a **real stock market**, a game that **feels like a real game**, and a **realistic life sim**. Hustle Dave was rewritten as a ten-year life sim driven by real economic data. This is the current version.
3. **Website.** The owner wants people to visit and play their games. An arcade homepage was added at the repo root, ready for GitHub Pages.
4. **Pending, chosen but not built:** "make it like a real life simulator." The owner picked **all four** options:
   - Whole life, birth to death
   - Relationships and family
   - Daily choices and needs
   - Health, crime and luck

## 3. Files

| Path | What it is |
|---|---|
| `index.html` | Arcade homepage "NeonNinjaX2 Arcade". Dark neon look, one card per game, an animated canvas thumbnail for Hustle Dave, and a "Next game: coming soon" slot. |
| `hustle-dave/index.html` | The whole game in one file, about 224 KB: about 108 KB of HTML/CSS/JS plus about 115 KB of embedded real data. |
| `handoff/hustle-dave-code-only.html` | The same game with the data blob replaced by `__GAMEDATA__`. Upload this one to the Project. It won't run on its own. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |
| `README.md` | Profile README with a "Play my games" link and a Hustle Dave description. |

## 4. Key architectural decisions

- **One self-contained HTML file per game.** No build step, no framework, no server. Plain HTML, CSS and vanilla JS inside an IIFE. The only external resources are Google Fonts: Bodoni Moda, Libre Franklin and JetBrains Mono for the game, and Bungee for the arcade.
- **Real data is embedded as JSON** in `<script id="gamedata" type="application/json">`. The game can't fetch data at runtime: artifact pages block it, and offline play stays simple.
- **Data sources:** the public github.com/datasets collection (raw.githubusercontent.com):
  - Monthly, Dec 1999 to Sep 2026: S&P 500 (`s-and-p-500`, Shiller monthly averages), CPI (`cpi-us`), gold (`gold-prices`), Case-Shiller national home price index (`house-prices-us`), 10-year Treasury yield (`bond-yields-us-10y`). Missing trailing months are forward-filled.
  - Daily from 2000-01-01, forward-filled over weekends: WTI oil (`oil-prices`, goes negative on 2020-04-20) and VIX (`finance-vix`, a record 82.69 on 2020-03-16).
  - Compact JSON keys: `m0` = `"1999-12"`, arrays `sp`, `cpi`, `gold`, `house`, `bond`; `d0` = `"2000-01-01"`, arrays `oil`, `vix`.
  - **Individual stocks (Apple, Tesla and so on) are not included.** Yahoo Finance and Stooq were blocked by the old environment's network policy. Add them only from a source you can actually reach.
- **All prices and wages are written in 2016 dollars** and multiplied by `infl(date) = CPI(date) / CPI(Jan 2016)`, so every era gets real inflation.
- **Eras:** the player picks a start of Jan 1 in 2000, 2008 or 2016. The game lasts exactly 10 years, from age 18 to 28. Score = final net worth, also shown in "today's dollars" (latest CPI).
- **Derived (approximate) rates:** savings APY = 10-year yield − 1 (minimum 0.1%). Mortgage rate = 10-year yield + 1.75. Gas price = 0.024 × oil + 1.2 $/gal (minimum $1.60). Median home = $235,000 × home index / index in Jan 2016.
- **Time model:** one game day per `1200 ms / speed`, with speeds Pause/1x/2x/4x/8x (default 2x). A `requestAnimationFrame` loop accumulates time and runs at most 3 `simDay()` calls per frame. The day fraction drives the animated scene. The game pauses while a modal is open or the tab is hidden.
- **Simulation layers:**
  - `simDay()` handles work pay accrual, experience, stress, performance decay, school progress, free-time routine, mood drift, sickness, paydays, unemployment and yearly reviews.
  - `monthly()` closes the statement and pays interest, then charges rent or mortgage, food, phone, car or bus, insurance, gym, fun, dog, tuition, student loan and credit card interest. It also runs the layoff roll and saves.
  - `realNews()` fires dated headlines. `randomEvent()` fires choice modals every 30–75 days.
- **Money rules:** a shortfall comes out of savings first, then goes on a 22% APR credit card (`cover()`). Card limit = $2,000 (inflation-adjusted) + 10% of annual wage. Over the limit for 3 months in a row means bankruptcy and game over. Selling investments at a gain pays a flat 15% capital gains tax.
- **Clicking matters, realistically:** the **Work hard** button (or Space) works only while Dave is at work. Each click raises performance, which sets the yearly raise (inflation × 0.8 + (perf − 50)/10 %), a bonus at 80+, firing risk under 28, and layoff risk.
- **UI rendering:** tab panels are rebuilt from HTML strings, but only when the string changes and never while a pointer is held down on the panel. This keeps clicks from being lost at 8x speed. Actions use `data-act` / `data-arg` with one delegated click handler and an `ACT` map.
- **Scene:** a 2D canvas street. Sky gradient and darkness by hour, sun and moon, stars, clouds, skyline, trees by season, snow in Dec–Feb, rain on random days. Buildings depend on housing, workplace, school and gym. Dave walks or drives along a daily schedule from `plan()` and `daveState()`, wearing a uniform for his job. A dog follows him if adopted. Lit windows and streetlight glow at night.
- **Sound:** WebAudio oscillator SFX (`cash`, `click`, `bad`, `bill`, `goal`, `news`). Audio is created on the first click. A mute toggle is saved.
- **Saving:** `localStorage` keys `hustle-dave-v2` (state, `v: 2`), `hustle-dave-scores` (top 10), `hustle-dave-tab` and `hustle-dave-mute`. Every access is wrapped in try/catch.
- **Theming:** CSS color tokens on `:root` with dark-mode overrides through `prefers-color-scheme` and `[data-theme]`. Layout works at 390px phone width with no horizontal scroll. The arcade page is dark-only on purpose.
- **Artifact copy:** the game was also published as a private claude.ai artifact (`https://claude.ai/artifact/DUtHs8gVfdQrMWqi9wHjse`). The artifact version has no `<!doctype>/<html>/<head>/<body>` wrapper because the artifact host adds one. The repo version has the full wrapper.

## 5. Game content (current values)

- **Jobs (2016 $/hr):** Fast Food Crew 9.5, Grocery Cashier 10, Warehouse 13.5, Delivery Driver 15.5 (car), Office Assistant 15.5 (associate degree), Grocery Supervisor 19 (18 months retail), Truck Driver 20.5 (CDL), Electrician 25.5 (trade school), Store Manager 27 (4 years retail), Junior Web Dev 30 (bootcamp or CS), Accountant 32.5, Registered Nurse 33.5, Master Electrician 34, Nurse Manager 45, Software Developer 48, Finance Manager 58, Senior Software Engineer 68. Each job has `field`, `stress`, `phys`, layoff `risk`, `benefits`, `partOk`, and a `covid` layoff chance.
- **School (full-time units in days; part-time study is about 0.49 per day):** CDL 45 days/$5k, Bootcamp 90/$12k, Trade 270/$10k, Community College 730/$7k, University (Accounting/Nursing/CS) 1460/$38–40k. An associate degree halves university length and cost. Tuition is paid in cash or added to a 5% student loan.
- **Housing (2016 $/mo):** Mom's $0, roommates $700, studio $1,050, one-bedroom $1,350. Landlords need income of 36× rent or a year of rent saved. A house can be bought with 3.5/10/20% down plus 3% closing costs. Lenders need 6 months at a job and a payment under 31% of income. PMI applies under 20% down. Selling costs 6%.
- **Cars:** used $8k (6.5% loan) or new $26k (4.5%), 60-month loans with 10% down. Insurance $110, gas 40 gal × real gas price, upkeep $40. No car means a $65 bus pass.
- **Real events:** about 57 dated headlines from 2000 to 2025, about 15 shown as big "Breaking news" modals. Effects: 2008 stimulus ($300/$600), COVID layoffs by job, $1,200 / $600 / $1,400 checks, plus $600/week (Apr 4 – Jul 31, 2020) and $300/week (Jan 2 – Sep 6, 2021) extra unemployment.
- **Random events:** car breakdown, wedding, phone, overtime, ask for a raise, recruiter, dentist, Mom needs help, vacation, puppy (Biscuit), speeding ticket, found $20, a friend's drone-sock startup, roommate leaves. The same event never fires twice in a row.
- **Goals (14):** get a job, put $1,000 in savings, first investment, move out, buy a car, finish school, $50k/yr, $10k net worth, debt-free with $25k, buy a house, $100k/yr, $100k / $500k / $1M net worth.

## 6. Code snippets worth keeping

Real data access and inflation:

```js
const mIdx = d => (d.getUTCFullYear() - 1999) * 12 + d.getUTCMonth() - 11;
const mval = (k, d) => { const a = DATA[k]; return a[clamp(mIdx(d), 0, a.length - 1)]; };
const dval = (k, d) => { const a = DATA[k]; return a[clamp(Math.round((d.getTime() - D0) / DAY), 0, a.length - 1)]; };
const CPI16 = mval('cpi', new Date(Date.UTC(2016, 0, 15)));
const infl = d => mval('cpi', d) / CPI16;
const savingsApy = d => Math.max(0.1, mval('bond', d) - 1);
const mortgageRate = d => mval('bond', d) + 1.75;
const gasPrice = d => Math.max(1.6, 0.024 * Math.max(10, dval('oil', d)) + 1.2);
```

Simplified taxes (2016 brackets, scaled by inflation):

```js
function annualTax(gross, f) {
  const g = gross / f, taxable = Math.max(0, g - 10350);
  const B = [[9275,.10],[37650,.15],[91150,.25],[190150,.28],[413350,.33],[415050,.35],[Infinity,.396]];
  let fed = 0, prev = 0;
  for (const [cap, r] of B) { if (taxable > prev) fed += (Math.min(taxable, cap) - prev) * r; prev = cap; }
  const fica = Math.min(g, 118500) * 0.062 + g * 0.0145;
  return (fed + fica + taxable * 0.045) * f;
}
```

Layoff risk that rises with the real VIX:

```js
const p = 0.0035 * J.risk * Math.pow(Math.max(12, vix) / 18, 2) * (1.5 - S.perf / 100);
if (rnd() < p) loseJob(vix > 30 ? 'The economy is in trouble and the company is cutting jobs.' : 'The company is cutting costs.');
```

Cash shortfall: savings first, then the credit card:

```js
function cover() {
  if (S.cash >= 0) return;
  const fromSav = Math.min(S.savings, -S.cash);
  S.savings -= fromSav; S.cash += fromSav;
  if (S.cash < 0) { S.card += -S.cash; S.cash = 0; }
}
```

Game loop:

```js
function frame(t) {
  const dt = Math.min(250, t - lastT); lastT = t;
  if (running()) {
    acc += dt; const ms = DAY_MS / S.speed; let n = 0;
    while (acc >= ms && n < 3 && running()) { acc -= ms; simDay(); n++; }
    if (!running()) acc = 0; if (acc > ms) acc = ms;
    frac = clamp(acc / ms, 0, 0.999);
    n ? refresh() : hud();
  }
  drawScene(t); requestAnimationFrame(frame);
}
```

Rebuilding the embedded data (Python; run anywhere that can reach raw.githubusercontent.com):

```python
# Download CSVs from raw.githubusercontent.com/datasets/<repo>/main/data/...
#   s-and-p-500/data.csv (SP500), cpi-us/cpiai.csv (Index), gold-prices/monthly.csv (Price),
#   house-prices-us/national-month.csv (National-US), bond-yields-us-10y/monthly.csv (Rate),
#   oil-prices/wti-daily.csv (Price), finance-vix/vix-daily.csv (CLOSE)
# Monthly series: one value per month from 1999-12, forward-filled.
# Daily series: one value per calendar day from 2000-01-01, forward-filled (back-fill the first days).
# Dump compact JSON {m0, sp, cpi, gold, house, bond, d0, oil, vix} and paste it into
# <script id="gamedata" type="application/json">…</script>
```

## 7. Testing approach used

A Playwright headless browser ran with a fake clock (`page.clock.install()` / `runFor`). A robot player picked a 2016 start, set 8x speed, applied for jobs until hired, clicked Work hard, chose the last (usually cheapest) choice in each modal, saved money, enrolled in community college, invested, moved out, and played all 10 years.

Result: no console errors. Real events fired on their real dates. The run finished as "Comfortable" with about $110k. Pages were also checked at 390px and 1280px in light and dark themes.

## 8. Open items and next steps

1. **Make the website live (owner action).** On GitHub, go to Settings → Pages → Deploy from a branch → `ccr-e2179437-bmf3zg`, `/ (root)`. The site will be at `https://neonninjax2.github.io/NeonNinjaX2/`. Alternatively, merge the branch into `main` (no PR has been opened) and deploy from `main`. The live URL has never been checked.
2. **Build the whole-life simulator upgrade** (all four options chosen):
   - **Whole life, birth to death:** childhood, school grades, adulthood, retirement, aging, death, and an end-of-life score.
   - **Relationships and family:** friends, dating, marriage and divorce, kids who grow up, aging parents, and relationships that fade without time spent.
   - **Daily choices and needs:** eat, sleep, shower, exercise, hang out; hunger and energy meters.
   - **Health, crime and luck:** illness, accidents, doctors, habits, getting arrested, the lottery, random drama.
   - **Open design questions:** real data runs only from 2000 to 2026, so a full lifetime needs a plan. Options: start the life earlier with real data only for the adult years, or move time much faster (for example, a month or a year per turn in a BitLife-style flow). The ten-year realistic-money mode could stay as a separate mode.
3. **Optional later:** individual stocks (needs a reachable data source), more games for the arcade, sharing the artifact link.

## 9. Conventions the owner's setup used

- Commits so far have a short summary line, a body explaining why, and a Claude co-author line at the end.
- Don't open pull requests unless the owner asks.
- Keep the owner informed in plain language and recommend a choice rather than listing many options.
