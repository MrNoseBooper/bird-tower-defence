// Headless checks of the game rules, plus a balance check: a bot plays the whole campaign.
// Run: node tests/sim.test.mjs
import assert from 'node:assert/strict';
import { TOWERS, REPTILES, MAPS } from '../public/js/data.js';
import * as sim from '../public/js/sim.js';
import { normalize } from '../public/js/save.js';
import { spots, closest, play, roost } from './bot.mjs';

const profile = (xp = 9999) => ({ feathers: 0, xp, beaten: 0, best: {}, wins: {}, roost: {} });

// ---- rules

// Waves are well formed and the same every time.
for (const map of MAPS) for (let r = 1; r <= map.rounds + 45; r++) {
  const w = sim.makeWave(map, r);
  assert(w.length && w.every(x => REPTILES[x.id]), `${map.id} round ${r}`);
  assert.deepEqual(w, sim.makeWave(map, r));
  assert(w.filter(x => REPTILES[x.id].rare).length <= 1, 'rare reptiles come alone');
}
for (const map of MAPS) assert(sim.makeWave(map, map.rounds).some(x => x.id === map.boss), `${map.id} ends with its boss`);
for (const map of MAPS) for (const [id] of map.pool) assert(REPTILES[id], `${map.id} pool has ${id}`);

// Every map has room to build.
for (const [i, map] of MAPS.entries()) assert(spots(sim.newGame(i, 'campaign', profile())).length > 100, `${map.id} has building space`);

// Placement, the one-path-to-tier-3 rule, selling, XP locks.
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
  const fresh = sim.newGame(0, 'campaign', profile(0));
  assert(!sim.canPlace(fresh, 'bomber', spot.x, spot.y) && sim.canPlace(fresh, 'hawker', spot.x, spot.y), 'towers unlock with XP');
}

// Clearing a round earns XP and announces what it unlocks.
{
  const p = profile(13), s = sim.newGame(1, 'campaign', p);
  sim.startRound(s);
  s.queue = [];
  sim.step(s);
  assert.equal(p.xp, 15, 'swamp rounds give 2 XP');
  assert(s.events.some(e => e.type === 'unlock' && e.kind === 'bomber'), 'reaching 15 XP unlocks the Berry Bomber');
}

// Old saves get XP for the rounds they already reached.
assert.equal(normalize({ profile: { best: { meadow: 29, swamp: 3 } } }).profile.xp, 35);
assert.equal(normalize({ profile: { xp: 7, best: { meadow: 29 } } }).profile.xp, 7);

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
  const devil = sim.spawn(s, 'thorny', 0, 250);
  sim.hit(s, devil, 4, { kind: 'peck' });
  assert.equal(devil.hp, 7, 'beaks do half damage to thorny devils');
  const chuck = sim.spawn(s, 'chuckwalla', 0, 260);
  sim.hit(s, chuck, 5, {});
  sim.hit(s, chuck, 5, {});
  assert.equal(chuck.hp, 40, 'a chuckwalla puffs up after a hit');
  const worm = sim.spawn(s, 'worm', 0, 270);
  worm.hidden = true;
  sim.hit(s, worm, 5, { cracks: true });
  assert.equal(worm.hp, 18, 'buried reptiles cannot be hit');
}

// Horned lizards stun nearby towers when they die; frilled lizards slow their reloading.
{
  const s = sim.newGame(0, 'campaign', profile());
  const [spot] = spots(s), t = sim.placeTower(s, 'hawker', spot.x, spot.y);
  s.active = true;
  const horned = sim.spawn(s, 'horned', 0, 0);
  Object.assign(horned, { x: t.x + 10, y: t.y });
  sim.hit(s, horned, 99, {});
  assert(t.stun > 1, 'horned lizard squirt stuns the tower');
}

// Camouflage needs detection.
{
  const s = sim.newGame(0, 'campaign', profile());
  const [spot] = spots(s);
  const t = sim.placeTower(s, 'hawker', spot.x, spot.y);
  s.active = true;
  const cham = sim.spawn(s, 'chameleon', 0, closest(s, t.x, t.y));
  cham.def = { ...cham.def, speed: 0 };
  for (let i = 0; i < 120; i++) sim.step(s);
  assert.equal(cham.hp, 5, 'plain towers cannot see camouflage');
  s.cash = 1e6;
  sim.upgrade(s, t, 1);
  sim.upgrade(s, t, 1); // Long Sally
  for (let i = 0; i < 120; i++) sim.step(s);
  assert(cham.gone || cham.hp < 5, 'Long Sally sees camouflage');
}

// New towers: the Mobber hits everything near it, the Screecher leaps, the Crown Flasher scares, the Tax Collector taxes once.
{
  const s = sim.newGame(0, 'campaign', profile());
  const [spot] = spots(s), d = closest(s, spot.x, spot.y);
  const pack = () => [-4, 0, 4].map(k => { const e = sim.spawn(s, 'iguana', 0, d + k); e.def = { ...e.def, speed: 0 }; return e; });
  s.active = true;
  s.cash = 1e6;
  const mobber = sim.placeTower(s, 'mobber', spot.x, spot.y), mobbed = pack();
  sim.step(s);
  assert(mobbed.every(e => e.hp < 22), 'the Mobber hits every reptile in its circle');
  sim.sell(s, mobber);
  s.enemies = [];
  const screecher = sim.placeTower(s, 'screecher', spot.x, spot.y), screeched = pack();
  sim.step(s);
  assert(screeched.every(e => e.hp === 20), 'the screech leaps to all 3 reptiles');
  sim.sell(s, screecher);
  s.enemies = [];
  const flasher = sim.placeTower(s, 'flasher', spot.x, spot.y), scared = pack()[0];
  scared.def = REPTILES.iguana;
  sim.step(s);
  const before = scared.d;
  for (let i = 0; i < 20; i++) sim.step(s);
  assert(scared.d < before, 'scared reptiles back away');
  sim.sell(s, flasher);
  s.enemies = [];
  sim.placeTower(s, 'taxman', spot.x, spot.y);
  const payer = sim.spawn(s, 'iguana', 0, d), cash = s.cash;
  payer.def = { ...payer.def, speed: 0 };
  for (let i = 0; i < 30; i++) sim.step(s);
  assert.equal(s.cash, cash + 1, 'each reptile is taxed once');
}

// Economy: round bonus, Nest Egg interest, Scale Scavenger bonus, Bug Ranch growth.
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
{
  const s = sim.newGame(0, 'campaign', profile()), spot = spots(s).at(-1);
  sim.placeTower(s, 'ranch', spot.x, spot.y);
  const round = () => { const c = s.cash; sim.startRound(s); s.queue = []; sim.step(s); return s.cash - c - (80 + s.round); };
  const paid = [round(), round(), round()];
  assert(paid[0] > 0 && paid[0] < paid[1] && paid[1] < paid[2], `a Bug Ranch pays more every round (${paid})`);
}

// Saved games come back the same.
{
  const s = play(0, 'campaign', profile(), 5);
  const copy = sim.restore(JSON.parse(JSON.stringify(sim.snapshot(s))), profile());
  assert.deepEqual(sim.snapshot(copy), sim.snapshot(s));
  assert.throws(() => sim.restore({ mapIndex: 99, towers: [] }, profile()));
}

// ---- balance: the bot plays the campaign from scratch, retrying lost levels and spending feathers in between

const t0 = performance.now(), p = profile(0), attempts = [];
for (const [i, map] of MAPS.entries()) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const s = play(i, 'campaign', p), won = s.over === 'win';
    p.feathers += sim.feathers(s, won) + (won ? 15 : 0); // the game adds 15 for a level's first win
    roost(p);
    console.log(`${map.name.padEnd(17)} try ${attempt}: ${won ? 'WON ' : 'lost'} round ${String(s.round).padStart(2)}/${map.rounds}, ` +
      `eggs ${String(s.eggs).padStart(2)}/${s.startEggs}, ${s.towers.length} towers, xp ${p.xp}, feathers ${p.feathers}`);
    if (won) { attempts.push(attempt); break; }
  }
}
const endless = play(0, 'endless', p);
console.log(`Endless on Homestead Meadow afterwards: lasted until round ${endless.round}. (${((performance.now() - t0) / 1000).toFixed(1)}s)`);
const locked = Object.keys(TOWERS).filter(k => TOWERS[k].unlock > p.xp);
console.log(`XP after the campaign: ${p.xp}${locked.length ? `, still locked: ${locked.join(', ')}` : ', every tower unlocked'}`);

// Not too hard: every level falls within a few tries. Not too easy: endless eventually wins.
assert.equal(attempts.length, MAPS.length, 'the bot beats every level');
assert(attempts.every(n => n <= 3), `each level takes at most 3 tries (took ${attempts})`);
assert(endless.round >= 35 && endless.round <= 90, `endless gets hard but not instantly (round ${endless.round})`);

console.log('all sim checks passed');
