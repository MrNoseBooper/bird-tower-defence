// Headless checks of the game rules. Run: node tests/sim.test.mjs
import assert from 'node:assert/strict';
import { TOWERS, REPTILES, MAPS } from '../public/js/data.js';
import * as sim from '../public/js/sim.js';

const profile = () => ({ feathers: 0, beaten: 9, best: {}, wins: {}, roost: {} });

// Free building spots, best view of the trail first.
function spots(s, kind = 'hawker') {
  const pts = s.layout.paths.flatMap(p => Array.from({ length: Math.ceil(p.len / 6) }, (_, i) => sim.posAt(p, i * 6)));
  const out = [];
  for (let y = 18; y <= sim.H - 6; y += 6) for (let x = 8; x <= sim.W - 8; x += 6)
    if (sim.canPlace(s, kind, x, y)) out.push({ x, y, near: pts.filter(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 46 * 46).length });
  return out.sort((a, b) => b.near - a.near);
}

// A deliberately simple player: follows a fixed build order, saving up for each step.
// 'up' buys the cheapest next upgrade, with each tower upgraded in a guide-like order (path indexes).
const PLAN = ['hawker', 'hawker', 'up', 'up', 'quill', 'up', 'up', 'orchard', 'hawker', 'up', 'up', 'lookout', 'up', 'quill', 'up', 'up',
  'scavenger', 'hawker', 'up', 'quill', 'up', 'bomber', 'up', 'up', 'shade', 'up', 'hawker', 'quill', 'up', 'bomber'];
const ORDER = { hawker: [1, 0, 1, 0, 0], quill: [0, 0, 1, 1, 0], bomber: [0, 1, 0, 1, 0], lookout: [0, 0, 1, 1, 0],
  shade: [0, 1, 0, 1, 0], orchard: [0, 0, 1, 1, 0], nestegg: [0, 0, 1, 1, 0], scavenger: [0, 1, 0, 1, 0] };
function nextPath(t) {
  const done = [0, 0];
  for (const p of ORDER[t.kind]) { if (done[p] < t.tiers[p]) { done[p]++; continue; } return p; }
  return -1;
}
function spend(s) {
  for (s.plan ??= 0; ;) {
    const want = PLAN[s.plan] || 'up';
    if (want === 'up') {
      const [best] = s.towers.map(t => ({ t, p: nextPath(t) })).filter(({ p }) => p >= 0)
        .map(({ t, p }) => ({ t, p, u: sim.upgradeInfo(s, t, p) })).sort((a, b) => a.u.price - b.u.price);
      if (!best || !sim.upgrade(s, best.t, best.p)) return;
    } else {
      const list = spots(s, want), spot = want === 'orchard' ? list.at(-1) : list[0];
      if (!spot || !sim.placeTower(s, want, spot.x, spot.y)) return;
    }
    s.plan++;
  }
}

function play(mapIndex, mode = 'campaign', untilRound = Infinity, eggs = 0) {
  const s = sim.newGame(mapIndex, mode, profile());
  if (eggs) s.eggs = s.startEggs = eggs;
  while (!s.over && s.round < untilRound) {
    spend(s);
    sim.startRound(s);
    for (let i = 0; s.active && i < 60 * 600; i++) sim.step(s);
    assert(!s.active, `round ${s.round} never ended`);
  }
  return s;
}

// Waves are well formed and the same every time.
for (const map of MAPS) for (let r = 1; r <= map.rounds + 25; r++) {
  const w = sim.makeWave(map, r);
  assert(w.length && w.every(x => REPTILES[x.id]), `${map.id} round ${r}`);
  assert.deepEqual(w, sim.makeWave(map, r));
}
for (const map of MAPS) assert(sim.makeWave(map, map.rounds).some(x => x.id === map.boss), `${map.id} ends with its boss`);

// Every map has room to build.
for (const [i, map] of MAPS.entries()) assert(spots(sim.newGame(i, 'campaign', profile())).length > 100, `${map.id} has building space`);

// Placement, the one-path-to-tier-3 rule, selling.
{
  const s = sim.newGame(0, 'campaign', profile());
  assert(!sim.canPlace(s, 'hawker', 90, 120), 'cannot build on the trail');
  const [spot] = spots(s);
  const t = sim.placeTower(s, 'hawker', spot.x, spot.y);
  assert(t && s.cash === 650 - 180);
  assert(!sim.canPlace(s, 'hawker', spot.x + 4, spot.y), 'towers cannot overlap');
  s.cash = 1e6;
  for (let i = 0; i < 3; i++) assert(sim.upgrade(s, t, 0));
  assert(sim.upgrade(s, t, 1) && sim.upgrade(s, t, 1));
  assert(!sim.upgrade(s, t, 1) && sim.upgradeInfo(s, t, 1).locked, 'second path stops at tier 2');
  const value = sim.sellValue(t), cash = s.cash;
  sim.sell(s, t);
  assert.equal(s.cash, cash + value);
  assert(!sim.canPlace(sim.newGame(0, 'campaign', { ...profile(), beaten: 0 }), 'bomber', spot.x, spot.y), 'locked towers cannot be built');
}

// Reptile abilities.
{
  const s = sim.newGame(0, 'campaign', profile());
  s.active = true;
  const turtle = sim.spawn(s, 'boxturtle', 0, 200);
  sim.hit(s, turtle, 5, { dmg: 5 });
  assert.equal(turtle.hp, 8, 'plain attacks bounce off shells');
  sim.hit(s, turtle, 5, { cracks: true });
  assert.equal(turtle.hp, 3, 'shell crackers hurt');
  const hog = sim.spawn(s, 'hognose', 0, 100);
  sim.hit(s, hog, 99, {});
  assert(!hog.gone && hog.dead > 0, 'hognose plays dead the first time');
  hog.dead = 0;
  sim.hit(s, hog, 99, {});
  assert(hog.gone, 'and really goes down the second time');
  sim.hit(s, sim.spawn(s, 'seaturtle', 0, 300), 99, {});
  assert.equal(s.enemies.filter(e => e.id === 'hatchling').length, 4, 'sea turtles release hatchlings');
}

// Camouflage needs detection.
{
  const s = sim.newGame(0, 'campaign', profile());
  const [spot] = spots(s);
  const t = sim.placeTower(s, 'hawker', spot.x, spot.y), path = s.layout.paths[0];
  let d = 0;
  while (Math.hypot(sim.posAt(path, d)[0] - t.x, sim.posAt(path, d)[1] - t.y) > 30) d += 2;
  s.active = true;
  const cham = sim.spawn(s, 'chameleon', 0, d);
  cham.def = { ...cham.def, speed: 0 };
  for (let i = 0; i < 120; i++) sim.step(s);
  assert.equal(cham.hp, 5, 'plain towers cannot see camouflage');
  s.cash = 1e6;
  sim.upgrade(s, t, 1);
  sim.upgrade(s, t, 1); // Long Sally
  for (let i = 0; i < 120; i++) sim.step(s);
  assert(cham.gone || cham.hp < 5, 'Long Sally sees camouflage');
}

// Economy: round bonus, Nest Egg interest, Scale Scavenger bonus.
{
  const s = sim.newGame(0, 'campaign', profile());
  s.cash = 2000;
  const far = spots(s).at(-1);
  sim.placeTower(s, 'nestegg', far.x, far.y);
  sim.startRound(s);
  s.queue = [];
  sim.step(s);
  assert.equal(s.cash, 1450 + 81 + 72, 'round bonus plus 5% interest');
  const near = spots(s)[0], sc = sim.placeTower(s, 'scavenger', near.x, near.y), cash = s.cash;
  s.active = true;
  const e = sim.spawn(s, 'iguana', 0, 0);
  Object.assign(e, { x: sc.x, y: sc.y });
  sim.hit(s, e, 99, {});
  assert.equal(s.cash - cash, Math.round(12 * 1.25), 'scavenger adds 25%');
}

// Saved games come back the same.
{
  const s = play(0, 'campaign', 5);
  const copy = sim.restore(JSON.parse(JSON.stringify(sim.snapshot(s))), profile());
  assert.deepEqual(sim.snapshot(copy), sim.snapshot(s));
  assert.throws(() => sim.restore({ mapIndex: 99, towers: [] }, profile()));
}

// Whole games with the bot. The first level must be beatable by a simple strategy.
for (const [i, map] of MAPS.entries()) {
  const s = play(i);
  console.log(`${map.name}: ${s.over} at round ${s.round}/${map.rounds} with ${s.towers.length} towers, ${s.eggs} eggs left`);
  if (i === 0) assert.equal(s.over, 'win', 'the bot beats the first level');
}

// Endless keeps working well past the campaign.
{
  const t0 = performance.now();
  const s = play(0, 'endless', 60, 1e9);
  assert(Number.isFinite(s.cash) && s.round === 60 && !s.over);
  console.log(`endless to round 60 in ${((performance.now() - t0) / 1000).toFixed(1)}s`);
}

console.log('all sim checks passed');
