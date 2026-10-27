// Draws the board. The background is painted once per map; everything else every frame.
import { TOWERS, REPTILES, THEMES } from './data.js';
import { W, H, PATH_HALF, TOWER_R, layout, segDist, rng, stats, canPlace, price } from './sim.js';
import { canvas, rect, px, towerParts, reptileFrames, white, bodyColor, DECOR } from './sprites.js';

const backgrounds = new Map();
export function background(map) {
  if (backgrounds.has(map.id)) return backgrounds.get(map.id);
  const L = layout(map), th = THEMES[map.theme], c = canvas(W, H), g = c.getContext('2d'), r = rng(map.seed + 1);
  const at = n => Math.floor(r() * n);
  rect(g, 0, 0, W, H, th.grass[0]);
  // dithered light and dark patches, then speckles and tiny flowers
  for (let i = 0; i < 30; i++) {
    const cx = at(W), cy = at(H), rx = 8 + at(12), ry = Math.ceil(rx / 2), col = th.grass[i % 3 ? 2 : 1];
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1 && (x + y) % 2 === 0) px(g, cx + x, cy + y, col);
  }
  for (let i = 0; i < 1600; i++) rect(g, at(W), at(H), 1, r() < 0.4 ? 2 : 1, th.grass[r() < 0.5 ? 1 : 2]);
  for (let i = 0; i < 160; i++) px(g, at(W), at(H), th.sprinkle[at(th.sprinkle.length)]);
  for (const [x, y, w, h] of L.blocked) {
    // water gets a thin rim; mesas get a dark cliff face along the bottom
    rect(g, x, y, w, h, th.blocked[1]);
    rect(g, x + 1, y + 1, w - 2, h - (th.water ? 2 : 6), th.blocked[0]);
    for (let i = 0; i < w * h / 90; i++) rect(g, x + 3 + at(w - 8), y + 3 + at(h - 10), th.water ? 2 : 1, 1, th.blocked[2]);
  }
  for (const [half, col] of [[PATH_HALF + 1, th.path[1]], [PATH_HALF - 1, th.path[0]]])
    for (const p of L.paths) for (const s of p.segs)
      rect(g, Math.min(s.x0, s.x1) - half, Math.min(s.y0, s.y1) - half, Math.abs(s.x1 - s.x0) + half * 2, Math.abs(s.y1 - s.y0) + half * 2, col);
  for (let i = 0; i < 900; i++) {
    const x = at(W), y = at(H);
    if (L.paths.some(p => p.segs.some(s => segDist(x, y, s) < PATH_HALF - 2))) px(g, x, y, th.path[r() < 0.5 ? 1 : 2]);
  }
  for (const d of [...L.decor].sort((a, b) => a.y - b.y)) DECOR[d.type](g, d.x, d.y, th);
  backgrounds.set(map.id, c);
  return c;
}

// 3x5 digits for floating numbers, so they stay as crisp as the rest of the pixels.
const DIGITS = {
  0: '111101101101111', 1: '110010010010111', 2: '111001111100111', 3: '111001011001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  '+': '000010111010000', '-': '000000111000000',
};
function number(g, text, x, y, color) {
  for (const [shift, col] of [[1, '#2a1c12'], [0, color]]) [...text].forEach((ch, i) => {
    const bits = DIGITS[ch] || '';
    for (let k = 0; k < bits.length; k++) if (bits[k] === '1') px(g, x + i * 4 + (k % 3) + shift, y + Math.floor(k / 3) + shift, col);
  });
}

function ring(g, x, y, r, fill, stroke) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 1;
  g.stroke();
}
const reach = st => st.range ?? st.aura;
const shadow = (g, x, y, w) => {
  x = Math.round(x); y = Math.round(y); w = Math.max(2, Math.round(w));
  rect(g, x - w, y, w * 2, 1, 'rgba(0,0,0,0.18)');
  rect(g, x - w + 1, y + 1, w * 2 - 2, 1, 'rgba(0,0,0,0.12)');
};
// A little plus-shaped spark.
function star(g, x, y, r, core, arm) {
  for (let i = 1; i <= r; i++) for (const [dx, dy] of [[i, 0], [-i, 0], [0, i], [0, -i]]) px(g, x + dx, y + dy, arm);
  px(g, x, y, core);
}
// Bits flying out from a point and falling, for kills and splashes.
function burst(g, f, n, color, dist, p) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + f.x % 1.7;
    px(g, Math.round(f.x + Math.cos(a) * dist * p), Math.round(f.y - 3 + Math.sin(a) * dist * 0.6 * p + p * p * 6), color);
  }
}

// Butterflies drifting over the map, flapping as they go.
const BUGS = ['#ffffff', '#ffd23f', '#ff9f43', '#ff8fb8', '#7ed6ff'];
function insects(g, time, seed, w, h, n = 6) {
  for (let i = 0; i < n; i++) {
    const t = time * (0.25 + 0.04 * i) + seed + i * 7;
    const x = Math.round(w / 2 + Math.sin(t * 0.9 + i) * Math.cos(t * 0.23) * (w / 2 - 16));
    const y = Math.round(h / 2 + Math.sin(t * 1.7 + i * 2) * (h / 2 - 14));
    const up = Math.floor(time * 14 + i * 3) % 2, c = BUGS[(i + seed) % BUGS.length];
    px(g, x, y, '#3a2a1a');
    px(g, x - 1, y - up, c);
    px(g, x + 1, y - up, c);
  }
}

// Light glinting on the water.
function shimmer(g, s, th) {
  for (const [bx, by, bw, bh] of s.layout.blocked) for (let k = 0; k < bw * bh / 140; k++) {
    if (Math.sin(s.time * 1.5 + k * 1.7) < 0.2) continue;
    rect(g, bx + 3 + (k * 37 + Math.floor(s.time * 3)) % (bw - 8), by + 3 + (k * 53) % (bh - 6), 3, 1, th.blocked[2]);
  }
}

// A tower's look this frame: breathing, blinking, wings up while it works, and its prop's own animation.
const PROP_RATE = { lookout: 3, shade: 1.2, orchard: 1.5, nestegg: 0.8, mobber: 2, screecher: 4, rain: 3, taxman: 1, ranch: 2 };
function towerLook(t, time, extra = {}) {
  const clock = time + t.id * 0.77, busy = t.anim > 0, rate = PROP_RATE[t.kind];
  return {
    crowned: Math.max(...t.tiers) >= 3 || (t.kind === 'flasher' && busy),
    // the Lookout looks around; attackers face their target
    left: t.kind === 'lookout' && !busy ? Math.floor(clock / 2.2) % 2 === 1 : t.face < 0,
    pose: busy ? 2 : Math.floor(clock * 1.6) % 2,
    blink: !busy && clock % 3.7 < 0.13,
    prop: rate ? Math.floor(clock * rate) % 2 : 0,
    ...extra,
  };
}

function drawParts(g, L, x, y, bx = 0, by = 0) {
  const ox = Math.round(x - 12), oy = Math.round(y - 21);
  g.drawImage(L.back, ox, oy);
  g.drawImage(L.bird, ox + Math.round(bx), oy + Math.round(by));
  g.drawImage(L.front, ox, oy);
}

function tower(g, s, t) {
  let bx = 0, by = 0;
  if (t.kind === 'hawker' && t.anim > 0) {
    // the Hawker darts out at its target and back
    const d = Math.hypot(t.ax - t.x, t.ay - t.y) || 1, k = 7 * Math.sin(Math.PI * t.anim / 0.15);
    bx = (t.ax - t.x) / d * k;
    by = (t.ay - t.y) / d * k;
  }
  // new towers drop in from above
  const age = s.time - (t.born ?? -1), drop = age < 0.3 ? -12 * (1 - age / 0.3) ** 2 : 0;
  drawParts(g, towerParts(t.kind, towerLook(t, s.time)), t.x, t.y + drop, bx, by);
  if (t.stun > 0) stars(g, t.x, t.y - 22, s.time);
}

function stars(g, x, y, time, r = 6) {
  for (let i = 0; i < 3; i++) {
    const a = time * 8 + i * 2.1;
    px(g, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * 2), '#ffe14a');
  }
}

function reptile(g, s, e) {
  const set = reptileFrames(e.id), frames = e.dir < 0 ? set.l : set.r, f = Math.floor(e.d / set.stride) % frames.length;
  // feet keep pace with the ground: the frame comes from distance walked, and the body bobs on passing steps
  let img = frames[f];
  const x = Math.round(e.x - img.width / 2), y = Math.round(e.y - img.height + 3 - (e.dead > 0 ? 0 : f % 2));
  if (e.hidden) {
    // burrowers show a moving mound of dirt; divers just a ripple and their eyes
    const hx = Math.round(e.x), hy = Math.round(e.y);
    if (e.def.burrow) { rect(g, hx - 3, hy, 7, 1, '#7a4b26'); rect(g, hx - 2, hy - 1, 5, 1, '#a46b33'); px(g, hx - 1 + f % 3, hy - 2, '#a46b33'); }
    else { rect(g, hx - 5, hy, 11, 1, 'rgba(255,255,255,0.5)'); px(g, hx - 2, hy - 1, '#ffd23f'); px(g, hx + 2, hy - 1, '#ffd23f'); }
    return;
  }
  shadow(g, e.x, e.y + 2, img.width * 0.35);
  if (s.time - e.hitAt < 0.06) img = white(img);
  g.globalAlpha = e.def.camo ? 0.4 + 0.15 * Math.sin(s.time * 4 + e.uid) : 1;
  if (e.dead > 0) { // playing dead: belly up
    g.save();
    g.translate(x, y + img.height);
    g.scale(1, -1);
    g.drawImage(img, 0, 0);
    g.restore();
  } else g.drawImage(img, x, y);
  g.globalAlpha = 1;
  if (!e.def.boss && e.hp < e.max && e.max >= 5) {
    const w = Math.min(14, img.width), hx = Math.round(e.x - w / 2);
    rect(g, hx - 1, y - 4, w + 2, 4, '#2a1c12');
    rect(g, hx, y - 3, w, 2, '#ff5b3c');
    rect(g, hx, y - 3, Math.max(1, Math.round(w * e.hp / e.max)), 2, '#7dff5a');
  }
  if (e.shaded) { px(g, x + img.width - 1, y - 2, '#3a8f3a'); px(g, x + img.width, y - 3, '#86dd66'); }
  if (e.jamT > 0) { px(g, x - 1, y - 2, '#b25cff'); px(g, x - 1, y - 1, '#e6b8ff'); }
  if (e.puffT > 0) { rect(g, x + 1, y - 2, 3, 1, '#b9c6d8'); px(g, x + 2, y - 3, '#ffffff'); }
  if (e.scareT > 0) { rect(g, Math.round(e.x), y - 7, 1, 3, '#ff2e63'); px(g, Math.round(e.x), y - 3, '#ff2e63'); }
  if (e.stunT > 0) stars(g, e.x, y - 3, s.time, 4);
}

function nest(g, s) {
  const { x, y } = s.layout.nest, eggs = Math.ceil(5 * Math.min(1, s.eggs / s.startEggs));
  // the eggs tremble when a reptile gets close
  const danger = s.enemies.some(e => (e.x - x) ** 2 + (e.y - y) ** 2 < 60 * 60);
  shadow(g, x, y + 4, 12);
  rect(g, x - 10, y - 3, 20, 4, '#6e4420');
  for (let i = 0; i < eggs; i++) {
    const ex = x - 7 + i * 3 + (danger ? Math.round(Math.sin(s.time * 30 + i * 2)) : 0);
    rect(g, ex, y - 6, 3, 4, '#fffbea');
    px(g, ex + 1, y - 5, '#b08560');
  }
  rect(g, x - 11, y - 1, 22, 4, '#a46b33');
  rect(g, x - 9, y + 3, 18, 1, '#6e4420');
  for (let i = 0; i < 6; i++) px(g, x - 9 + i * 4, y, '#d29a55');
}

function effect(g, f) {
  const p = 1 - f.t / f.T, x = Math.round(f.x), y = Math.round(f.y);
  g.globalAlpha = Math.min(1, (1 - p) * 2.5);
  switch (f.type) {
    case 'peck': star(g, x, y, 1 + Math.round(p * 2), '#ffffff', '#ffe14a'); break;
    case 'line':
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(f.x0 + 0.5, f.y0 + 0.5);
      g.lineTo(f.x1 + 0.5, f.y1 + 0.5);
      g.stroke();
      star(g, Math.round(f.x1), Math.round(f.y1), 2, '#ffffff', '#7fd0ff');
      break;
    case 'boom':
      ring(g, f.x, f.y, f.r * (0.4 + 0.6 * p), 'rgba(178,92,255,0.25)', '#e6b8ff');
      burst(g, f, 10, '#b25cff', f.r * 0.9, p);
      break;
    case 'ring': ring(g, f.x, f.y, Math.max(1, f.r * p), 'rgba(0,0,0,0)', '#ffe9a8'); break;
    case 'clink': star(g, x, y, 1, '#ffffff', '#b9c6d8'); break;
    case 'poof':
      burst(g, f, 8, bodyColor(f.id), 8, p);
      burst(g, { x: f.x + 0.9, y: f.y }, 6, '#ffffff', 5, p);
      break;
    case 'drop': burst(g, { x: f.x + 0.4, y: f.y + 5 }, 8, '#f3e3c3', 9, p); break;
    case 'sparkle':
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + p * 2;
        star(g, Math.round(f.x + Math.cos(a) * 12 * p), Math.round(f.y + Math.sin(a) * 9 * p), i % 2 ? 1 : 2, '#ffffff', '#ffcc33');
      }
      break;
    case 'mob':
      ring(g, f.x, f.y, f.r * (0.5 + 0.5 * p), 'rgba(255,107,107,0.12)', '#ff9a8a');
      for (let i = 0; i < 4; i++) {
        // little kingbirds swooping out
        const a = i * Math.PI / 2 + p * 2, bx = Math.round(f.x + Math.cos(a) * f.r * p), by = Math.round(f.y + Math.sin(a) * f.r * 0.6 * p);
        rect(g, bx, by, 2, 1, '#16161d');
        px(g, bx, by + 1, '#ffffff');
      }
      break;
    case 'zap':
      g.strokeStyle = '#2ee6d6';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(Math.round(f.pts[0][0]) + 0.5, Math.round(f.pts[0][1]) + 0.5);
      // a jagged line: every other corner nudged sideways
      f.pts.slice(1).forEach(([zx, zy], i) => g.lineTo(Math.round(zx) + 0.5 + (i % 2 ? 1 : -1), Math.round(zy) + 0.5));
      g.stroke();
      for (const [zx, zy] of f.pts.slice(1)) star(g, Math.round(zx), Math.round(zy), 1, '#ffffff', '#2ee6d6');
      break;
    case 'flash': ring(g, f.x, f.y, Math.max(1, f.r * p), 'rgba(255,46,99,0.15)', '#ff2e63'); star(g, x, y, 2, '#ffffff', '#ff2e63'); break;
    case 'spit':
      for (let i = 0; i < 4; i++) {
        const q = Math.min(1, p * 1.5 + i * 0.08);
        px(g, Math.round(f.x0 + (f.x1 - f.x0) * q), Math.round(f.y0 + (f.y1 - f.y0) * q), '#7dff5a');
      }
      break;
    case 'squirt': burst(g, f, 10, '#ff3b4f', f.r * 0.7, p); break;
    case 'glide': for (let i = 1; i <= 6; i++) px(g, x - i * 2, y + (i % 2), '#ffffff'); break;
    case 'coin': rect(g, x - 1, Math.round(y - p * 6), 2, 2, '#ffcc33'); px(g, x - 1, Math.round(y - p * 6), '#fff5b8'); break;
    case 'heal': number(g, '+', x - 1, Math.round(y - p * 6), '#7dff7a'); break;
    case 'text': {
      const ty = Math.round(y - p * 10), tx = Math.round(x - f.n.length * 2);
      if (f.icon) { rect(g, tx - 5, ty + 1, 3, 3, '#9b45d6'); px(g, tx - 5, ty + 1, '#e6b8ff'); px(g, tx - 4, ty, '#4fd15f'); }
      number(g, f.n, tx, ty, f.c || '#ffe14a');
      break;
    }
  }
  g.globalAlpha = 1;
}

export function draw(g, s, ui) {
  const th = THEMES[s.map.theme];
  g.drawImage(background(s.map), 0, 0);
  if (th.water) shimmer(g, s, th);
  for (const t of s.shades) ring(g, t.x, t.y, t.s.aura, 'rgba(20,80,20,0.13)', 'rgba(20,80,20,0.22)');
  const sel = ui.sel, r = sel && reach(sel.s);
  if (r && isFinite(r)) ring(g, sel.x, sel.y, r, 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.8)');
  nest(g, s);
  // painter's order so lower things overlap higher ones
  const things = [...s.enemies.map(e => [e.y, e, reptile]), ...s.towers.map(t => [t.y, t, tower])].sort((a, b) => a[0] - b[0]);
  for (const [, o, fn] of things) fn(g, s, o);
  for (const b of s.shots) {
    // berries fly in an arc above their shadow, spinning as they go
    const p = 1 - Math.min(1, Math.hypot(b.tx - b.x, b.ty - b.y) / b.d0), x = Math.round(b.x), y = Math.round(b.y - Math.sin(Math.PI * p) * 12);
    rect(g, x - 1, Math.round(b.y) + 3, 3, 1, 'rgba(0,0,0,0.2)');
    rect(g, x - 1, y - 1, 3, 3, '#9b45d6');
    px(g, x - 1 + Math.floor(s.time * 12) % 3, y - 1, '#e6b8ff');
    px(g, x, y - 2, '#4fd15f');
  }
  for (const f of s.fx) effect(g, f);
  if (s.rainT > 0) {
    // a Rain Caller's shower over the whole map
    rect(g, 0, 0, W, H, 'rgba(60,110,180,0.1)');
    for (let i = 0; i < 70; i++) rect(g, Math.floor((i * 37 + s.time * 30) % W), Math.floor((i * 53 + s.time * 170) % H), 1, 3, 'rgba(200,230,255,0.75)');
  }
  insects(g, s.time, s.map.seed, W, H);
  if (ui.placing && ui.hover) {
    const ok = canPlace(s, ui.placing, ui.mx, ui.my) && s.cash >= price(s, TOWERS[ui.placing].cost);
    const rr = reach(stats({ kind: ui.placing, tiers: [0, 0] }, s.profile));
    ring(g, ui.mx, ui.my, rr && isFinite(rr) ? rr : TOWER_R + 2, ok ? 'rgba(255,255,255,0.2)' : 'rgba(255,60,60,0.25)', ok ? '#ffffff' : '#ff5b3c');
    g.globalAlpha = 0.8;
    drawParts(g, towerParts(ui.placing, { pose: Math.floor(s.time * 1.6) % 2 }), ui.mx, ui.my);
    g.globalAlpha = 1;
  }
}

// The title screen's strip: reptiles marching past a kingbird on its post.
const PARADE = ['anole', 'boxturtle', 'skink', 'garter', 'chameleon', 'iguana', 'hognose', 'croc'];
export function drawParade(g, time) {
  const w = g.canvas.width, h = g.canvas.height, road = h - 14;
  rect(g, 0, 0, w, h, '#6dc94b');
  for (let x = 0; x < w; x += 2) for (let y = (x / 2) % 2; y < road - 8; y += 4) if ((x * 7 + y * 13) % 11 < 2) px(g, x, y, '#8fdd66');
  rect(g, 0, road - 7, w, 14, '#b88446');
  rect(g, 0, road - 6, w, 12, '#f0d08e');
  for (const [i, id] of PARADE.entries()) {
    const set = reptileFrames(id), d = time * (8 + REPTILES[id].speed * 0.5) + i * 52, f = Math.floor(d / set.stride) % set.r.length;
    const img = set.r[f], x = (d % (w + 70)) - 35;
    shadow(g, x, road + 2, img.width * 0.35);
    g.drawImage(img, Math.round(x - img.width / 2), Math.round(road - img.height + 3 - f % 2));
  }
  const bird = { id: 3, kind: 'hawker', tiers: [3, 0], face: -1, anim: time % 2.4 < 0.25 ? 1 : 0 };
  drawParts(g, towerParts('hawker', towerLook(bird, time, { left: true })), w - 24, road - 9);
  insects(g, time, 2, w, h - 16, 3);
}
