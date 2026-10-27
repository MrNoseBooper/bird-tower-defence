// Draws the board. The background is painted once per map; everything else every frame.
import { TOWERS, THEMES } from './data.js';
import { W, H, PATH_HALF, TOWER_R, layout, segDist, rng, stats, canPlace, price } from './sim.js';
import { canvas, rect, px, towerLayers, reptileFrames, DECOR } from './sprites.js';

const backgrounds = new Map();
export function background(map) {
  if (backgrounds.has(map.id)) return backgrounds.get(map.id);
  const L = layout(map), th = THEMES[map.theme], c = canvas(W, H), g = c.getContext('2d'), r = rng(map.seed + 1);
  const at = n => Math.floor(r() * n);
  rect(g, 0, 0, W, H, th.grass[0]);
  for (let i = 0; i < 2200; i++) rect(g, at(W), at(H), 1, r() < 0.35 ? 2 : 1, th.grass[r() < 0.6 ? 1 : 2]);
  for (const [x, y, w, h] of L.blocked) {
    // water gets a thin rim and ripples; mesas get a dark cliff face along the bottom
    rect(g, x, y, w, h, th.blocked[1]);
    rect(g, x + 1, y + 1, w - 2, h - (th.water ? 2 : 6), th.blocked[0]);
    for (let i = 0; i < w * h / 60; i++) rect(g, x + 3 + at(w - 8), y + 3 + at(h - 10), th.water ? 3 : 1, 1, th.blocked[2]);
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
  for (const [shift, col] of [[1, '#1a1a1a'], [0, color]]) [...text].forEach((ch, i) => {
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

function drawTower(g, kind, x, y, crowned, left, bx = 0, by = 0) {
  const L = towerLayers(kind, crowned, left), ox = Math.round(x - 12), oy = Math.round(y - 21);
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
  drawTower(g, t.kind, t.x, t.y, Math.max(...t.tiers) >= 3, t.face < 0, bx, by);
  if (t.stun > 0) for (let i = 0; i < 2; i++) {
    const a = s.time * 8 + i * Math.PI;
    px(g, Math.round(t.x + Math.cos(a) * 5), Math.round(t.y - 22 + Math.sin(a) * 2), '#ffe14a');
  }
}

function reptile(g, s, e) {
  const set = reptileFrames(e.id), img = (e.dir < 0 ? set.l : set.r)[Math.floor(s.time * 6 + e.uid * 0.37) % 2];
  const x = Math.round(e.x - img.width / 2), y = Math.round(e.y - img.height + 3);
  rect(g, Math.round(e.x - img.width / 3), Math.round(e.y + 2), Math.round(img.width * 2 / 3), 2, 'rgba(0,0,0,0.22)');
  g.globalAlpha = e.def.camo ? 0.45 : 1;
  if (e.dead > 0) { // playing dead: belly up
    g.save();
    g.translate(x, y + img.height);
    g.scale(1, -1);
    g.drawImage(img, 0, 0);
    g.restore();
  } else g.drawImage(img, x, y);
  g.globalAlpha = 1;
  if (!e.def.boss && e.hp < e.max && e.max >= 5) {
    const w = Math.min(14, img.width), bx = Math.round(e.x - w / 2);
    rect(g, bx, y - 3, w, 2, '#5a1010');
    rect(g, bx, y - 3, Math.max(1, Math.round(w * e.hp / e.max)), 2, '#5fd35a');
  }
  if (e.shaded || e.jamT > 0) px(g, Math.round(e.x), y - 5, '#9fd8ff');
}

function nest(g, s) {
  const { x, y } = s.layout.nest, eggs = Math.ceil(5 * Math.min(1, s.eggs / s.startEggs));
  rect(g, x - 10, y - 3, 20, 4, '#5e3b1a');
  for (let i = 0; i < eggs; i++) { rect(g, x - 7 + i * 3, y - 6, 3, 4, '#f4f1e6'); px(g, x - 6 + i * 3, y - 5, '#a07850'); }
  rect(g, x - 11, y - 1, 22, 4, '#8b5a2b');
  rect(g, x - 9, y + 3, 18, 1, '#5e3b1a');
  for (let i = 0; i < 6; i++) px(g, x - 9 + i * 4, y, '#b07a3e');
}

function effect(g, f) {
  const p = 1 - f.t / f.T, x = Math.round(f.x), y = Math.round(f.y);
  switch (f.type) {
    case 'peck': for (const [dx, dy] of [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) px(g, x + dx, y + dy, '#ffffff'); break;
    case 'line':
      g.strokeStyle = `rgba(255,255,255,${1 - p})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(f.x0 + 0.5, f.y0 + 0.5);
      g.lineTo(f.x1 + 0.5, f.y1 + 0.5);
      g.stroke();
      break;
    case 'boom':
      ring(g, f.x, f.y, f.r * (0.4 + 0.6 * p), `rgba(155,79,209,${0.35 * (1 - p)})`, `rgba(211,155,232,${1 - p})`);
      break;
    case 'ring': ring(g, f.x, f.y, Math.max(1, f.r * p), 'rgba(0,0,0,0)', `rgba(235,210,140,${1 - p})`); break;
    case 'clink': px(g, x, y, '#ffffff'); px(g, x - 1, y - 1, '#c7cad3'); px(g, x + 1, y - 1, '#c7cad3'); break;
    case 'poof':
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.7;
        px(g, Math.round(f.x + Math.cos(a) * 5 * p), Math.round(f.y - 2 + Math.sin(a) * 3 * p), `rgba(240,236,220,${1 - p})`);
      }
      break;
    case 'heal': number(g, '+', x - 1, Math.round(y - p * 6), '#7dff7a'); break;
    case 'text': number(g, f.n, Math.round(x - f.n.length * 2), Math.round(y - p * 8), f.c || '#ffd84a'); break;
  }
}

export function draw(g, s, ui) {
  g.drawImage(background(s.map), 0, 0);
  for (const t of s.shades) ring(g, t.x, t.y, t.s.aura, 'rgba(10,40,10,0.16)', 'rgba(10,40,10,0.2)');
  const sel = ui.sel, r = sel && reach(sel.s);
  if (r && isFinite(r)) ring(g, sel.x, sel.y, r, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.6)');
  nest(g, s);
  // painter's order so lower things overlap higher ones
  const things = [...s.enemies.map(e => [e.y, e, reptile]), ...s.towers.map(t => [t.y, t, tower])].sort((a, b) => a[0] - b[0]);
  for (const [, o, fn] of things) fn(g, s, o);
  for (const b of s.shots) {
    // berries fly in an arc
    const left = Math.hypot(b.tx - b.x, b.ty - b.y), x = Math.round(b.x), y = Math.round(b.y - Math.sin(Math.PI * (1 - Math.min(1, left / b.d0))) * 12);
    rect(g, x - 1, y - 1, 3, 3, '#7b3fa0');
    px(g, x - 1, y - 1, '#d39be8');
  }
  for (const f of s.fx) effect(g, f);
  if (ui.placing && ui.hover) {
    const ok = canPlace(s, ui.placing, ui.mx, ui.my) && s.cash >= price(s, TOWERS[ui.placing].cost);
    const rr = reach(stats({ kind: ui.placing, tiers: [0, 0] }, s.profile));
    ring(g, ui.mx, ui.my, rr && isFinite(rr) ? rr : TOWER_R + 2, ok ? 'rgba(255,255,255,0.16)' : 'rgba(255,60,60,0.22)', ok ? 'rgba(255,255,255,0.7)' : 'rgba(255,90,90,0.9)');
    g.globalAlpha = 0.75;
    drawTower(g, ui.placing, ui.mx, ui.my, false, false);
    g.globalAlpha = 1;
  }
}
