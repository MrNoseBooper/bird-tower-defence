// Game rules. No DOM in here, so the whole game can run headless in tests.
import { TOWERS, REPTILES, MAPS, THEMES, DECOR_R, START, BOSSES, ENDLESS_POOL } from './data.js';

export const W = 480, H = 270, DT = 1 / 60, PATH_HALF = 9, TOWER_R = 8;
export const TARGETS = ['first', 'last', 'strong', 'close'];
export const xpPerRound = mapIndex => 1 + mapIndex; // later maps teach faster

// Seeded random numbers (mulberry32) so maps and waves come out the same every time.
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function segDist(x, y, s) {
  const dx = s.x1 - s.x0, dy = s.y1 - s.y0;
  const t = Math.max(0, Math.min(1, ((x - s.x0) * dx + (y - s.y0) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - s.x0 - dx * t, y - s.y0 - dy * t);
}

// [x, y, horizontal direction] at distance d along a path.
export function posAt(path, d) {
  const s = path.segs.find(s => d <= s.at + s.l) || path.segs.at(-1);
  const f = Math.min(1, (d - s.at) / s.l);
  return [s.x0 + (s.x1 - s.x0) * f, s.y0 + (s.y1 - s.y0) * f, Math.sign(s.x1 - s.x0)];
}

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

function blockedAt(L, x, y, r, towers) {
  if (L.paths.some(p => p.segs.some(s => segDist(x, y, s) < PATH_HALF + r))) return true;
  if (L.blocked.some(([bx, by, bw, bh]) => x > bx - r && x < bx + bw + r && y > by - r && y < by + bh + r)) return true;
  if (Math.hypot(x - L.nest.x, y - L.nest.y) < 14 + r) return true;
  return [...L.decor, ...towers].some(o => o.r !== 0 && Math.hypot(x - o.x, y - o.y) < (o.r ?? TOWER_R) + r);
}

const layouts = new Map();
export function layout(map) {
  if (!layouts.has(map.id)) {
    const paths = map.paths.map(pts => {
      let at = 0;
      const segs = pts.slice(1).map(([x1, y1], i) => {
        const [x0, y0] = pts[i], l = Math.hypot(x1 - x0, y1 - y0), s = { x0, y0, x1, y1, l, at };
        at += l;
        return s;
      });
      return { segs, len: at };
    });
    const [nx, ny] = map.paths[0].at(-1);
    const L = { paths, blocked: map.blocked, nest: { x: nx, y: ny }, decor: [] };
    const r = rng(map.seed), types = THEMES[map.theme].decor;
    for (let i = 0; i < 3000 && L.decor.length < map.decor; i++) {
      const type = types[Math.floor(r() * types.length)], rad = DECOR_R[type];
      const x = 10 + Math.floor(r() * (W - 20)), y = 18 + Math.floor(r() * (H - 24));
      // also check above the base, where tall decor like trees draws its top
      if (!blockedAt(L, x, y, rad + 3, []) && !blockedAt(L, x, y - 10, rad, [])) L.decor.push({ type, x, y, r: rad });
    }
    layouts.set(map.id, L);
  }
  return layouts.get(map.id);
}

export function newGame(mapIndex, mode, profile) {
  const map = MAPS[mapIndex];
  const s = {
    mapIndex, map, mode, profile, layout: layout(map),
    round: 0, active: false, over: null, time: 0, speed: 1, rainT: 0,
    cash: START.cash + 100 * (profile.roost.cash || 0), eggs: START.eggs + 3 * (profile.roost.eggs || 0),
    towers: [], enemies: [], shots: [], fx: [], events: [], queue: [], qt: 0,
    nextId: 1, spawned: 0, seen: {}, paid: 0, discount: 0, flat: 0, shades: [], spotters: [], scavs: [],
  };
  s.startEggs = s.eggs;
  return s;
}

// ---- towers

export function stats(t, profile) {
  const def = TOWERS[t.kind], st = { ...def.base, econ: 1 };
  def.paths.forEach((path, i) => path.slice(0, t.tiers[i]).forEach(u => {
    for (const [k, v] of Object.entries(u.fx)) st[k] = v === true ? true : k === 'rate' ? st[k] * v : (st[k] || 0) + v;
  }));
  const rank = profile.roost[t.kind] || 0;
  if (def.role === 'attack') { st.rate /= 1 + 0.06 * rank; st.range *= 1 + 0.03 * rank; }
  else if (def.role === 'support') { if (st.aura) st.aura *= 1 + 0.08 * rank; else st.rate /= 1 + 0.08 * rank; }
  else st.econ = 1 + 0.1 * rank;
  return st;
}

// Recompute every tower's stats and the support/financial effects; call after anything changes.
export function refresh(s) {
  for (const t of s.towers) t.s = stats(t, s.profile);
  const of = kind => s.towers.filter(t => t.s.kind === kind);
  const lookouts = of('lookout');
  s.shades = of('shade');
  s.scavs = of('scavenger');
  s.spotters = lookouts.filter(t => t.s.spot);
  s.discount = Math.max(0, ...of('orchard').map(t => t.s.discount || 0));
  s.flat = Math.max(0, ...s.scavs.map(t => Math.round(t.s.flat * t.s.econ)));
  for (const t of s.towers) {
    if (TOWERS[t.kind].role !== 'attack') continue;
    // overlapping lookouts don't stack: each buff takes the best one in range
    let range = 0, rate = 0, dmg = 0, camo = false;
    for (const l of lookouts) if (dist2(l, t) <= l.s.aura ** 2) {
      range = Math.max(range, l.s.rangeBuff);
      rate = Math.max(rate, l.s.rateBuff || 0);
      dmg = Math.max(dmg, l.s.dmgBuff || 0);
      camo ||= !!l.s.camoBuff;
    }
    t.s.range *= 1 + range;
    t.s.rate /= 1 + rate;
    t.s.dmg += dmg;
    t.s.camo ||= camo;
  }
}

export const price = (s, cost) => Math.round(cost * (1 - s.discount) / 5) * 5;
export const unlocked = (s, kind) => TOWERS[kind].unlock <= (s.profile.xp || 0);
export const canPlace = (s, kind, x, y) =>
  unlocked(s, kind) && x >= 8 && x <= W - 8 && y >= 18 && y <= H - 6 && !blockedAt(s.layout, x, y, TOWER_R, s.towers);

function newTower(s, kind, x, y, saved = {}) {
  if (!TOWERS[kind]) throw new Error(`unknown tower ${kind}`);
  // drops: 4 means an orchard built mid-round starts paying next round
  return { id: s.nextId++, kind, x, y, tiers: [...(saved.tiers || [0, 0])], target: saved.target || 'first', spent: saved.spent || 0,
    age: saved.age || 0, cd: 0, stun: 0, anim: 0, face: 1, drops: 4, dropT: 0 };
}

export function placeTower(s, kind, x, y) {
  const cost = price(s, TOWERS[kind].cost);
  if (s.over || s.cash < cost || !canPlace(s, kind, x, y)) return null;
  const t = newTower(s, kind, x, y, { spent: cost });
  t.born = s.time;
  s.cash -= cost;
  s.towers.push(t);
  s.fx.push({ type: 'drop', x, y, t: 0.4, T: 0.4 });
  refresh(s);
  return t;
}

export function upgradeInfo(s, t, p) {
  const tier = t.tiers[p], up = TOWERS[t.kind].paths[p][tier];
  if (!up) return { maxed: true };
  return { up, price: price(s, up.cost), locked: tier === 2 && t.tiers[1 - p] === 3 };
}

export function upgrade(s, t, p) {
  const u = upgradeInfo(s, t, p);
  if (!u.up || u.locked || s.over || s.cash < u.price) return false;
  s.cash -= u.price;
  t.spent += u.price;
  t.tiers[p]++;
  s.fx.push({ type: 'sparkle', x: t.x, y: t.y - 10, t: 0.6, T: 0.6 });
  refresh(s);
  return true;
}

export const sellValue = t => Math.floor(t.spent * 0.7);
export function sell(s, t) {
  s.cash += sellValue(t);
  s.towers = s.towers.filter(o => o !== t);
  refresh(s);
}

// ---- rounds

// Health budget of a round; the main difficulty curve.
export const budget = round => 12 + 4 * round + 0.6 * round * round;
const endlessBoss = round => {
  const i = Math.max(0, round / 10 - 2), n = BOSSES.length;
  return BOSSES[i < n ? i : n - 3 + (i - n) % 3]; // after the strongest, keep cycling the top three
};

export function makeWave(map, round) {
  const r = rng(map.seed * 7919 + round), endless = round > map.rounds;
  const entries = endless ? ENDLESS_POOL : map.pool, from = Object.fromEntries(entries);
  const pool = entries.filter(([, f]) => f <= round).map(([id]) => id);
  const boss = round === map.rounds ? map.boss : endless && round % 10 === 0 ? endlessBoss(round) : null;
  const total = budget(round) * map.pressure * (boss ? 0.5 : 1), ids = [], used = {};
  // reptiles that need specific counters get at most 30% of a round
  const special = id => { const d = REPTILES[id]; return d.shell || d.camo || d.puff || d.dive; };
  let specialLeft = total * 0.3;
  for (let left = total; left > 0;) {
    // a group of one reptile type that fits the remaining health budget, favouring tougher ones;
    // a reptile's first round is one small group and the next two keep groups small, so new threats ramp up; rare ones come alone
    const fits = pool.filter(id => REPTILES[id].hp <= (special(id) ? Math.min(left, specialLeft) : left) && !((from[id] === round || REPTILES[id].rare) && used[id]));
    const opts = fits.length ? fits : [pool[0]];
    const weight = id => Math.sqrt(REPTILES[id].hp) * (REPTILES[id].rare ? 0.1 : 1);
    let roll = r() * opts.reduce((a, id) => a + weight(id), 0), id = opts[0];
    for (const o of opts) if ((roll -= weight(o)) <= 0) { id = o; break; }
    const hp = REPTILES[id].hp, cap = REPTILES[id].rare ? 1 : from[id] === round ? 4 : round - from[id] < 3 ? 6 : 3 + Math.floor(r() * 10);
    const n = Math.max(1, Math.min(Math.ceil(left / hp), cap, special(id) ? Math.floor(specialLeft / hp) : Infinity));
    for (let i = 0; i < n; i++) ids.push(id);
    used[id] = true;
    left -= n * hp;
    if (special(id)) specialLeft -= n * hp;
  }
  // spread them out so health arrives at a steady rate over the round
  const length = 18 + 1.2 * round, sum = ids.reduce((a, id) => a + REPTILES[id].hp, 0);
  let t = 0;
  const out = ids.map(id => {
    const e = { t, id };
    t += Math.max(0.15, length * REPTILES[id].hp / sum);
    return e;
  });
  if (boss) out.push({ t: t + 2, id: boss });
  return out;
}

export function startRound(s) {
  if (s.active || s.over) return false;
  s.round++;
  s.active = true;
  s.qt = 0;
  s.queue = makeWave(s.map, s.round);
  for (const t of s.towers) if (t.s.kind === 'orchard') { t.drops = 0; t.dropT = 1.5; }
  return true;
}

export function spawn(s, id, pi, d) {
  const def = REPTILES[id], hp = def.hp * (1 + Math.max(0, s.round - 40) * 0.05); // endless gets tougher past round 40
  const [x, y, dir] = posAt(s.layout.paths[pi], d);
  const e = { uid: s.nextId++, id, def, pi, d, x, y, dir: dir || 1, hp, max: hp, jam: 0, jamT: 0, sprint: 0, dead: 0,
    stunT: 0, scareT: 0, puffT: 0, dv: 0, gl: 0, lay: 0, rt: def.rattle?.[2] ?? 0, sp: def.spit?.[2] ?? 0 };
  s.enemies.push(e);
  if (!s.seen[id]) { s.seen[id] = true; s.events.push({ type: 'new', id }); }
  return e;
}

// Bug Ranches add growth for every round they have been kept.
const orchardDrop = t => Math.round((t.s.income + (t.s.growth || 0) * Math.min(t.age, t.s.grow || 0)) * t.s.econ / 4);
function pay(s, t, n) {
  s.cash += n;
  t.anim = 0.3; // flaps its wings
  s.fx.push({ type: 'text', icon: true, x: t.x, y: t.y - 24, n: `+${n}`, t: 0.9, T: 0.9 });
}

function endRound(s) {
  s.active = false;
  s.shots = [];
  for (const t of s.towers) if (t.s.kind === 'orchard') while (t.drops < 4) { t.drops++; pay(s, t, orchardDrop(t)); }
  const savings = s.cash;
  let interest = 0, eggs = 0;
  for (const t of s.towers) {
    t.age++;
    if (t.s.kind !== 'nestegg') continue;
    const n = Math.floor(Math.min(t.s.cap, savings * t.s.interest) * t.s.econ);
    if (n) pay(s, t, n);
    interest += n;
    eggs += t.s.eggs;
  }
  const bonus = 80 + s.round;
  s.cash += bonus;
  s.eggs += eggs;
  s.events.push({ type: 'round', round: s.round, bonus, interest, eggs });
  // every cleared round earns XP, which unlocks new towers
  const xp = s.profile.xp || 0;
  s.profile.xp = xp + xpPerRound(s.mapIndex);
  for (const [kind, def] of Object.entries(TOWERS)) if (def.unlock > xp && def.unlock <= s.profile.xp) s.events.push({ type: 'unlock', kind });
  if (s.mode === 'campaign' && s.round >= s.map.rounds) { s.over = 'win'; s.events.push({ type: 'win' }); }
}

// ---- combat

const onMap = e => e.x >= 0 && e.x <= W && e.y >= 0 && e.y <= H;
const targetable = (e, st) => !e.gone && !(e.dead > 0) && !e.hidden && onMap(e) && (!e.def.camo || st.camo);

function pickTarget(s, t) {
  let best = null, score = -Infinity;
  const r2 = t.s.range ** 2;
  for (const e of s.enemies) {
    const d2 = dist2(e, t);
    if (d2 > r2 || !targetable(e, t.s)) continue;
    const left = s.layout.paths[e.pi].len - e.d;
    const v = t.target === 'last' ? left : t.target === 'strong' ? e.hp : t.target === 'close' ? -d2 : -left;
    if (v > score) { score = v; best = e; }
  }
  return best;
}

function nearby(s, e, st, n, r) {
  if (n <= 0) return [];
  return s.enemies.filter(o => o !== e && targetable(o, st) && dist2(o, e) <= r * r)
    .sort((a, b) => dist2(a, e) - dist2(b, e)).slice(0, n);
}

export function hit(s, e, dmg, st) {
  if (e.gone || e.dead > 0 || e.hidden) return;
  if ((e.def.shell || e.puffT > 0) && !st.cracks) { s.fx.push({ type: 'clink', x: e.x, y: e.y - 4, t: 0.15, T: 0.15 }); return; }
  if (e.def.big) dmg *= 1 + (st.bigMul || 0);
  if (e.def.spiky && (st.kind === 'peck' || st.kind === 'pulse')) dmg /= 2;
  if (e.scareT > 0) dmg *= 1 + (e.fear || 0);
  const spot = s.spotters.find(t => dist2(t, e) <= t.s.aura ** 2);
  if (spot) dmg *= 1 + spot.s.spot;
  e.hp -= dmg;
  e.hitAt = s.time;
  if (e.def.puff && !(e.puffT > 0)) e.puffT = e.def.puff;
  if (st.stun && !e.def.boss) e.stunT = Math.max(e.stunT, st.stun);
  if (e.def.sprint) e.sprint = 0.6;
  if (e.def.fatTail && !e.healed && e.hp > 0 && e.hp < e.max / 2) {
    e.healed = true;
    e.hp += e.max * 0.35;
    s.fx.push({ type: 'heal', x: e.x, y: e.y - 8, t: 0.6, T: 0.6 });
  }
  if (e.hp <= 0) kill(s, e);
}

function stunTowers(s, x, y, r, secs) {
  for (const t of s.towers) if ((t.x - x) ** 2 + (t.y - y) ** 2 <= r * r) t.stun = Math.max(t.stun, secs);
}

function kill(s, e) {
  if (e.def.playDead && !e.revived) { e.revived = true; e.dead = 1.5; e.hp = e.max / 2; return; }
  e.gone = true;
  let bonus = 0;
  for (const t of s.scavs) if (dist2(t, e) <= t.s.aura ** 2) bonus = Math.max(bonus, t.s.bonus * t.s.econ);
  const gain = Math.round(e.def.bounty * (1 + bonus)) + s.flat;
  s.cash += gain;
  s.fx.push({ type: 'corpse', id: e.id, dir: e.dir, x: e.x, y: e.y, t: 0.35, T: 0.35 });
  s.fx.push({ type: 'poof', id: e.id, big: e.def.big, x: e.x, y: e.y, t: 0.45, T: 0.45 });
  s.fx.push({ type: 'text', icon: true, x: e.x, y: e.y - 10, n: `+${gain}`, t: 0.7, T: 0.7 });
  s.events.push({ type: 'kill', big: !!e.def.big, boss: !!e.def.boss });
  if (e.def.squirt) {
    stunTowers(s, e.x, e.y, ...e.def.squirt);
    s.fx.push({ type: 'squirt', x: e.x, y: e.y, r: e.def.squirt[0], t: 0.4, T: 0.4 });
  }
  for (const [id, n] of e.def.spawns || []) for (let i = 0; i < n; i++) spawn(s, id, e.pi, Math.max(0, e.d - i * 5));
}

function leak(s, e) {
  s.eggs = Math.max(0, s.eggs - e.def.eggs);
  s.fx.push({ type: 'text', x: s.layout.nest.x, y: s.layout.nest.y - 12, n: `-${Math.min(e.def.eggs, 99)}`, c: '#ff6b5e', t: 1, T: 1 });
  if (!s.eggs) { s.over = 'lose'; s.active = false; s.events.push({ type: 'lose' }); }
}

function explode(s, b) {
  const { st } = b;
  for (const e of [...s.enemies]) if (!e.gone && (e.x - b.tx) ** 2 + (e.y - b.ty) ** 2 <= st.splash ** 2) {
    hit(s, e, st.dmg, st);
    if (st.slow) { e.jam = Math.max(e.jam, st.slow); e.jamT = 1.5; }
  }
  s.fx.push({ type: 'boom', x: b.tx, y: b.ty, r: st.splash, t: 0.25, T: 0.25 });
}

function moveReptiles(s) {
  const fast = 1 + Math.min(0.5, Math.max(0, s.round - 40) * 0.01);
  for (const e of s.enemies) {
    const def = e.def;
    if (e.dead > 0) { e.dead -= DT; continue; }
    if (e.stunT > 0) { e.stunT -= DT; continue; }
    if (def.dive) { const [up, down] = def.dive; e.dv += DT; e.hidden = e.dv % (up + down) > up; }
    e.puffT -= DT;
    let slow = e.jamT > 0 ? e.jam : 0;
    e.jamT -= DT;
    e.shaded = false;
    for (const t of s.shades) if (dist2(t, e) <= t.s.aura ** 2) { e.shaded = true; slow = Math.max(slow, t.s.slow); }
    if (def.steady) slow = 0;
    else if (def.boss) slow /= 2;
    if (def.regen && !e.shaded) e.hp = Math.min(e.max, e.hp + def.regen * DT);
    if (def.rattle && (e.rt -= DT) <= 0) {
      const [r, stun, every] = def.rattle;
      e.rt = every;
      stunTowers(s, e.x, e.y, r, stun);
      s.fx.push({ type: 'ring', x: e.x, y: e.y, r, t: 0.4, T: 0.4 });
    }
    if (def.spit && (e.sp -= DT) <= 0) {
      const [r, stun, every] = def.spit;
      e.sp = every;
      const t = s.towers.filter(t => dist2(t, e) <= r * r).sort((a, b) => dist2(a, e) - dist2(b, e))[0];
      if (t) {
        t.stun = Math.max(t.stun, stun);
        s.fx.push({ type: 'spit', x0: e.x, y0: e.y - 3, x1: t.x, y1: t.y - 12, t: 0.3, T: 0.3 });
      }
    }
    if (def.lays && (e.lay += DT) >= def.lays[2]) {
      e.lay = 0;
      for (let i = 0; i < def.lays[1]; i++) spawn(s, def.lays[0], e.pi, Math.max(0, e.d - 6 - i * 5));
    }
    if (def.glide && !e.hidden && (e.gl += DT) >= def.glide[0]) {
      e.gl = 0;
      s.fx.push({ type: 'glide', x: e.x, y: e.y - 4, t: 0.3, T: 0.3 });
      e.d += def.glide[1];
    }
    // scared reptiles back away along the trail
    const back = e.scareT > 0;
    e.scareT -= DT;
    e.sprint -= DT;
    e.d = Math.max(0, e.d + def.speed * fast * (1 - slow) * (e.sprint > 0 ? 2 : 1) * (back ? -0.7 : 1) * DT);
    const path = s.layout.paths[e.pi];
    if (e.d >= path.len) { e.gone = true; leak(s, e); if (s.over) return; continue; }
    const [x, y, dir] = posAt(path, e.d);
    e.x = x;
    e.y = y;
    if (dir) e.dir = back ? -dir : dir;
  }
}

// Area attacks return false when nothing was in reach, so they stay ready.
function mob(s, t) {
  const hits = s.enemies.filter(e => targetable(e, t.s) && dist2(e, t) <= t.s.range ** 2);
  for (const e of hits) hit(s, e, t.s.dmg, t.s);
  if (hits.length) s.fx.push({ type: 'mob', x: t.x, y: t.y - 6, r: t.s.range, t: 0.35, T: 0.35 });
  return hits.length > 0;
}

function flash(s, t) {
  const scared = s.enemies.filter(e => !e.gone && !e.hidden && (!e.def.boss || t.s.royal) && dist2(e, t) <= t.s.aura ** 2);
  for (const e of scared) {
    e.scareT = Math.max(e.scareT, t.s.scare);
    e.fear = Math.max(e.fear || 0, t.s.fear || 0);
  }
  if (scared.length) s.fx.push({ type: 'flash', x: t.x, y: t.y - 14, r: t.s.aura, t: 0.4, T: 0.4 });
  return scared.length > 0;
}

function storm(s, t) {
  if (!s.enemies.length) return false;
  s.rainT = Math.max(s.rainT, t.s.wet);
  for (const e of [...s.enemies]) {
    e.jam = Math.max(e.jamT > 0 ? e.jam : 0, t.s.slow);
    e.jamT = Math.max(e.jamT, t.s.wet);
    if (t.s.dmg) hit(s, e, t.s.dmg, t.s);
  }
  return true;
}

function taxes(s, t) {
  for (const e of s.enemies) {
    if (e.gone || e.hidden || dist2(e, t) > t.s.aura ** 2 || (e.taxed ??= new Set()).has(t.id)) continue;
    e.taxed.add(t.id);
    s.cash += Math.round(t.s.toll * t.s.econ);
    if (t.s.stop && !e.def.boss) e.stunT = Math.max(e.stunT, t.s.stop);
    s.fx.push({ type: 'coin', x: e.x, y: e.y - 8, t: 0.5, T: 0.5 });
  }
}

function towersAct(s) {
  for (const t of s.shades) if (t.s.thorns && (t.tick = (t.tick ?? 0) - DT) <= 0) {
    t.tick = 0.5;
    for (const e of [...s.enemies]) if (dist2(t, e) <= t.s.aura ** 2) hit(s, e, t.s.thorns / 2, t.s);
  }
  const frills = s.enemies.filter(e => e.def.frill && !e.gone && !e.hidden);
  for (const t of s.towers) {
    const st = t.s;
    if (t.stun > 0) continue;
    if (st.kind === 'toll') { taxes(s, t); continue; }
    // frilled lizards nearby make towers reload slower
    const scared = frills.some(e => dist2(e, t) <= e.def.frill ** 2);
    if (!st.rate || (t.cd -= scared ? DT * 0.6 : DT) > 0) continue;
    if (st.kind === 'pulse' || st.kind === 'flash' || st.kind === 'rain') {
      if ((st.kind === 'pulse' ? mob : st.kind === 'flash' ? flash : storm)(s, t)) { t.cd = st.rate; t.anim = 0.35; t.shotAt = s.time; }
      continue;
    }
    const e = pickTarget(s, t);
    if (!e) continue;
    t.cd = st.rate;
    t.face = e.x < t.x ? -1 : 1;
    t.anim = 0.15;
    t.shotAt = s.time; // lets the bird settle into idle habits once things go quiet
    t.ax = e.x;
    t.ay = e.y;
    if (st.kind === 'bomb') {
      s.shots.push({ x: t.x, y: t.y - 10, e, tx: e.x, ty: e.y, d0: Math.max(1, Math.hypot(e.x - t.x, e.y - t.y + 10)), st });
      continue;
    }
    if (st.kind === 'chain') {
      // the screech leaps to the nearest reptile it has not hit yet
      const victims = [e];
      while (victims.length < st.chain) {
        const last = victims.at(-1), next = s.enemies.filter(o => !victims.includes(o) && targetable(o, st) && dist2(o, last) <= 32 * 32)
          .sort((a, b) => dist2(a, last) - dist2(b, last))[0];
        if (!next) break;
        victims.push(next);
      }
      s.fx.push({ type: 'zap', pts: [[t.x, t.y - 13], ...victims.map(v => [v.x, v.y - 3])], t: 0.2, T: 0.2 });
      for (const v of victims) hit(s, v, st.dmg, st);
      continue;
    }
    for (const v of [e, ...nearby(s, e, st, st.pierce - 1, st.kind === 'peck' ? 14 : 20)]) hit(s, v, st.dmg, st);
    s.fx.push(st.kind === 'snipe'
      ? { type: 'line', x0: t.x, y0: t.y - 13, x1: e.x, y1: e.y - 2, t: 0.12, T: 0.12 }
      : { type: 'peck', x: e.x, y: e.y - 2, t: 0.15, T: 0.15 });
  }
  for (const b of s.shots) {
    if (!b.e.gone && !(b.e.dead > 0)) { b.tx = b.e.x; b.ty = b.e.y; }
    const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), v = 220 * DT;
    if (d <= v) { b.gone = true; explode(s, b); }
    else { b.x += dx / d * v; b.y += dy / d * v; }
  }
  s.shots = s.shots.filter(b => !b.gone);
}

// Advance the game by one fixed tick (DT seconds).
export function step(s) {
  s.time += DT;
  for (const f of s.fx) f.t -= DT;
  s.fx = s.fx.filter(f => f.t > 0);
  s.rainT = Math.max(0, s.rainT - DT);
  // animation timers keep running between rounds
  for (const t of s.towers) {
    t.anim = Math.max(0, t.anim - DT);
    t.stun = Math.max(0, t.stun - DT);
  }
  if (s.over || !s.active) return;
  s.qt += DT;
  while (s.queue.length && s.queue[0].t <= s.qt) spawn(s, s.queue.shift().id, s.spawned++ % s.layout.paths.length, 0);
  for (const t of s.towers) if (t.s.kind === 'orchard' && (t.dropT -= DT) <= 0 && t.drops < 4) {
    t.dropT = 2.5;
    t.drops++;
    pay(s, t, orchardDrop(t));
  }
  moveReptiles(s);
  if (!s.over) towersAct(s);
  s.enemies = s.enemies.filter(e => !e.gone);
  if (!s.over && !s.queue.length && !s.enemies.length) endRound(s);
}

// ---- progress

// Feathers for rounds played since the last payout, plus a bonus for winning.
export function feathers(s, won) {
  const n = Math.floor((s.round - s.paid) / 2) + (won ? 10 + 5 * s.mapIndex : 0);
  s.paid = s.round;
  return n;
}

export function snapshot(s) {
  const { mapIndex, mode, round, cash, eggs, startEggs, paid, seen } = s;
  return { mapIndex, mode, round, cash, eggs, startEggs, paid, seen,
    towers: s.towers.map(({ kind, x, y, tiers, target, spent, age }) => ({ kind, x, y, tiers, target, spent, age })) };
}

export function restore(snap, profile) {
  if (!MAPS[snap?.mapIndex] || !Array.isArray(snap.towers)) throw new Error('bad saved game');
  const s = newGame(snap.mapIndex, snap.mode === 'endless' ? 'endless' : 'campaign', profile);
  for (const k of ['round', 'cash', 'eggs', 'startEggs', 'paid']) if (Number.isFinite(snap[k])) s[k] = snap[k];
  s.seen = { ...snap.seen };
  s.towers = snap.towers.map(t => newTower(s, t.kind, t.x, t.y, t));
  refresh(s);
  return s;
}
