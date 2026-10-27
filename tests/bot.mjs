// A bot that plays like a fair but unremarkable player, for the balance check in sim.test.mjs.
import assert from 'node:assert/strict';
import { TOWERS, REPTILES, ROOST_MAX, roostCost } from '../public/js/data.js';
import * as sim from '../public/js/sim.js';

// Free building spots, best view of the trail first.
export function spots(s, kind = 'hawker') {
  const pts = s.layout.paths.flatMap(p => Array.from({ length: Math.ceil(p.len / 6) }, (_, i) => sim.posAt(p, i * 6)));
  const out = [];
  for (let y = 18; y <= sim.H - 6; y += 6) for (let x = 8; x <= sim.W - 8; x += 6)
    if (sim.canPlace(s, kind, x, y)) out.push({ x, y, near: pts.filter(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 46 * 46).length });
  return out.sort((a, b) => b.near - a.near);
}

// Distance along the first trail closest to a point.
export function closest(s, x, y) {
  const path = s.layout.paths[0], gap = d => Math.hypot(sim.posAt(path, d)[0] - x, sim.posAt(path, d)[1] - y);
  let best = 0;
  for (let d = 0; d < path.len; d += 2) if (gap(d) < gap(best)) best = d;
  return best;
}

// Builds down a list (skipping what is still locked) and upgrades in a guide-like order ('up' = buy an upgrade).
const PLAN = ['hawker', 'hawker', 'up', 'quill', 'up', 'up', 'orchard', 'up', 'lookout', 'up', 'hawker', 'up', 'scavenger', 'up',
  'bomber', 'up', 'up', 'mobber', 'up', 'quill', 'up', 'shade', 'up', 'up', 'taxman', 'up', 'hawker', 'up', 'screecher', 'up',
  'flasher', 'up', 'nestegg', 'up', 'ranch', 'up', 'bomber', 'up', 'rain', 'up', 'mobber', 'up', 'quill', 'up', 'screecher', 'up'];
const ORDER = { hawker: [1, 0, 1, 0, 0], quill: [0, 0, 1, 1, 0] }; // everything else: [0, 1, 0, 1, 0]
const FAR = ['orchard', 'nestegg', 'ranch', 'rain']; // these work anywhere, so they get the spots nobody else wants

function nextPath(t) {
  const done = [0, 0];
  for (const p of ORDER[t.kind] || [0, 1, 0, 1, 0]) { if (done[p] < t.tiers[p]) { done[p]++; continue; } return p; }
  return -1;
}
// Damage first, building up its strongest attack tower. It saves for that tower's next upgrade once it has half the price,
// or always when the boss is near (but spends everything right before the boss round); otherwise it buys what it can now.
function buyUpgrade(s, bossSoon, lastCall) {
  const support = o => TOWERS[o.t.kind].role !== 'attack';
  const options = s.towers.map(t => ({ t, p: nextPath(t) })).filter(({ p }) => p >= 0)
    .map(o => ({ ...o, u: sim.upgradeInfo(s, o.t, o.p) })).filter(({ u }) => u.up && !u.locked)
    .sort((a, b) => support(a) - support(b) || b.t.spent - a.t.spent || a.u.price - b.u.price);
  if (!options.length || (!lastCall && s.cash < options[0].u.price && (bossSoon || s.cash >= options[0].u.price / 2))) return false;
  const pick = options.find(o => s.cash >= o.u.price);
  return !!pick && sim.upgrade(s, pick.t, pick.p);
}
// Cheapest route to camouflage detection: the next upgrade on a path that leads to it (a map-wide sniper counts triple).
function camoRoute(s) {
  let best = null;
  for (const t of s.towers) for (const p of [0, 1]) {
    const path = TOWERS[t.kind].paths[p], k = path.findIndex((u, i) => i >= t.tiers[p] && (u.fx.camoBuff || (u.fx.camo && TOWERS[t.kind].role === 'attack')));
    if (k < 0) continue;
    const score = path.slice(t.tiers[p], k + 1).reduce((a, u) => a + sim.price(s, u.cost), 0) / (t.s.range === Infinity ? 3 : 1);
    if (!best || score < best.score) best = { t, p, score };
  }
  return best;
}

// Spend between rounds: camouflage detection once it is needed, then the plan; no investing right before the boss.
export function spend(s) {
  s.todo ??= [...PLAN];
  for (;;) {
    const needCamo = Object.keys(s.seen).some(id => REPTILES[id].camo) && !s.towers.some(t => TOWERS[t.kind].role === 'attack' && t.s.camo);
    const route = needCamo && camoRoute(s);
    if (route) { if (sim.upgrade(s, route.t, route.p)) continue; return; }
    const bossSoon = s.mode === 'campaign' && s.round >= s.map.rounds - 4 && s.round < s.map.rounds - 1;
    const i = s.todo.findIndex(k => k === 'up' || (sim.unlocked(s, k) && !(bossSoon && TOWERS[k].role !== 'attack'))), want = i < 0 ? 'up' : s.todo[i];
    let done;
    if (want === 'up') done = buyUpgrade(s, bossSoon, s.mode === 'campaign' && s.round === s.map.rounds - 1);
    else { const list = spots(s, want), spot = FAR.includes(want) ? list.at(-1) : list[0]; done = !!spot && !!sim.placeTower(s, want, spot.x, spot.y); }
    if (!done) return;
    if (i >= 0) s.todo.splice(i, 1);
  }
}

export function play(mapIndex, mode, p, untilRound = Infinity, eggs = 0) {
  const s = sim.newGame(mapIndex, mode, p);
  if (eggs) s.eggs = s.startEggs = eggs;
  while (!s.over && s.round < untilRound) {
    spend(s);
    sim.startRound(s);
    for (let i = 0; s.active && i < 60 * 600; i++) sim.step(s);
    assert(!s.active, `round ${s.round} never ended`);
  }
  return s;
}

// Between games: feathers go into The Roost.
export function roost(p) {
  for (let bought = true; bought;) {
    bought = false;
    for (const k of ['hawker', 'cash', 'quill', 'eggs', 'mobber', 'bomber', 'orchard', 'screecher', 'lookout']) {
      const rank = p.roost[k] || 0, cost = roostCost(rank);
      if (rank < ROOST_MAX && p.feathers >= cost) { p.feathers -= cost; p.roost[k] = rank + 1; bought = true; }
    }
  }
}
