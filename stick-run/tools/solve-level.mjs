// Checks that a story level can be beaten, using the game's own physics.
// Usage: node tools/solve-level.mjs <levelIndex...>   (0-based)
// Env: SEG=n  check the section from checkpoint n (0 = level start) to the next
//      checkpoint or the exit.  CAP=nodes  search budget (default 600000).

import fs from 'fs'; import vm from 'vm';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let src = html.split('<script>')[1].split('</script>')[0];
src = src.replace(/\nboot\(\);\s*$/, '\n');
const stub = () => new Proxy(function(){}, { get: (t,k) => k === Symbol.toPrimitive ? () => 0 : stub(), apply: () => stub(), construct: () => stub(), set: () => true });
const sandbox = { window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener(){}, matchMedia: () => ({ matches: false }) },
  document: stub(), performance, requestAnimationFrame(){}, getComputedStyle: () => ({}), localStorage: { getItem: () => null, setItem(){} },
  navigator: {}, Math, JSON, console, setTimeout, clearTimeout };
sandbox.SEG = +(process.env.SEG||0); vm.createContext(sandbox);
const noDash = process.env.NODASH === '1', noAtk = process.env.NOATK === '1';
vm.runInContext(src + `
;globalThis.solve = function(li, cap){
  const ACTS = [];
  for (const dir of [-1,0,1]) for (const jm of [0,1,2,3]) for (const x of ${noDash ? "[0,2]" : noAtk ? "[0,1]" : "[0,1,2]"}) ACTS.push({dir,jm,x});
  const MACRO = 5;
  const L = LEVELS[li];
  world = buildWorld(L.map, 'story', L);
  const SEG = globalThis.SEG|0; const nC = world.checks.length;
  if (SEG > 0) { const c = world.checks[SEG-1]; for (let i = 0; i < SEG; i++) world.checks[i].on = true; world.respawn = { x: c.x + T/2, y: c.y + T }; world.player = makePlayer(world.respawn, 0); }
  const goal = SEG < nC ? world.checks[SEG] : null;
  const snap = () => JSON.stringify(world);
  const restore = s => { particles.length=0; ghosts.length=0; debris.length=0; popups.length=0; world = JSON.parse(s); hitstop = 0; };
  const key = w => { const p = w.player; return [Math.round(p.x/8), Math.round(p.y/8), Math.round(p.vx), Math.round(p.vy/3), p.canDash?1:0, p.onGround?1:0, p.dashT>0?1:0, p.wallCoyote>0?1:0, p.airJumps, p.ride, p.atk?1:0,
     w.enemies.map(e => e.alive ? e.hp + ':' + (e.type === 'flyer' ? '' : Math.round(e.x/24)) : 'x').join('.'), w.platforms.map(q => Math.round(q.x/16)+','+Math.round(q.y/16)).join(';'), w.respawn.x].join(','); };
  const tg = goal || world.exit; const ex = tg.x + T/2, ey = tg.y + T;
  const h = w => Math.hypot(w.player.x + PW/2 - ex, w.player.y + PH - ey) + w.enemies.filter(e=>e.alive).length * 0;
  const heap = []; const push = (n) => { heap.push(n); let i = heap.length-1; while (i>0) { const pi=(i-1)>>1; if (heap[pi].f<=heap[i].f) break; [heap[pi],heap[i]]=[heap[i],heap[pi]]; i=pi; } };
  const pop = () => { const top=heap[0]; const last=heap.pop(); if (heap.length) { heap[0]=last; let i=0; for(;;){ const l=2*i+1,r=l+1; let m=i; if(l<heap.length&&heap[l].f<heap[m].f)m=l; if(r<heap.length&&heap[r].f<heap[m].f)m=r; if(m===i)break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m; } } return top; };
  push({ s: snap(), d: 0, f: h(world), path: '' });
  const seen = new Set([key(world)]);
  let nodes = 0, best = 1e9;
  while (heap.length && nodes < cap) {
    const n = pop();
    for (let ai = 0; ai < ACTS.length; ai++) {
      const a = ACTS[ai]; restore(n.s); nodes++;
      let won = false;
      for (let f = 0; f < MACRO; f++) {
        keys.left = a.dir < 0; keys.right = a.dir > 0;
        keys.jump = a.jm >= 2 || (a.jm === 1 && f === 0);
        pressed.jump = (a.jm === 1 || a.jm === 2) && f === 0; pressed.dash = a.x === 1 && f === 0; pressed.attack = a.x === 2 && f === 0;
        simStep();
        for (const k in pressed) pressed[k] = false;
        if (!world.player.alive) break;
        if (goal ? world.checks[SEG].on : world.exited) { won = true; break; }
      }
      if (won) return { solved: true, seconds: +((n.d+1)*MACRO/60).toFixed(1), nodes, kills: world.kills };
      if (!world.player.alive) continue;
      const k = key(world); if (seen.has(k)) continue; seen.add(k);
      const hv = h(world); best = Math.min(best, hv);
      push({ s: snap(), d: n.d+1, f: hv + (n.d+1)*2 });
    }
  }
  return { solved: false, nodes, closestTiles: (best/T).toFixed(1) };
};`, sandbox);
for (const li of process.argv.slice(2).map(Number)) console.log('level', li+1, 'seg', process.env.SEG||0, LEVELS_NAME(li), JSON.stringify(sandbox.solve(li, +(process.env.CAP||6e5))));
function LEVELS_NAME(i){ return vm.runInContext('LEVELS['+i+'].name', sandbox); }
