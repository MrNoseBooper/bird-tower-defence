// Pixel art, drawn in code: character grids for the animals, small routines for props and scenery.
import { REPTILES } from './data.js';

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
export const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export const px = (g, x, y, c) => rect(g, x, y, 1, 1, c);

function paint(g, rows, pal, ox = 0, oy = 0, k = 1) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) rect(g, ox + x * k, oy + y * k, k, k, pal[ch]); }));
}
function fromRows(rows, pal, k = 1) {
  const c = canvas(rows[0].length * k, rows.length * k);
  paint(c.getContext('2d'), rows, pal, 0, 0, k);
  return c;
}
function mirror(src) {
  const c = canvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

// Shaded oval: dark lower-right rim, light upper-left highlight.
export function blob(g, cx, cy, rx, ry, [dark, mid, light]) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const q = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (q > 1) continue;
    px(g, cx + x, cy + y, q > 0.55 && x + y > 0 ? dark : x + y < -(rx + ry) * 0.35 ? light : mid);
  }
}

// ---- Eastern Kingbird: black head, slate back, white front, white-tipped tail, hidden red crown (r).
const BIRD = [
  '................',
  '.........kkkk...',
  '........kkrrkk..',
  '........kkkkkek.',
  '.......kkkkkkkkk',
  '.......dkkkkkww.',
  '......ddccccwww.',
  '.....dddcgdwwww.',
  '....ddgggldwwww.',
  '....dglglgdwwws.',
  '...ddglglgdwwws.',
  '...kddgggdwwwss.',
  '..kkkddddwwwss..',
  '.kkk....k..k....',
  'kkw.....k..k....',
  'ww..............',
];
const BIRD_PAL = { k: '#16161d', d: '#3a3f4b', g: '#59606e', l: '#8a93a3', w: '#f4f4ef', s: '#c7cad3', e: '#e9ecf2' };
const SCARF = { hawker: '#f08a24', quill: '#3f7fe0', bomber: '#9b4fd1', lookout: '#f2c14e', shade: '#5fbf4a', orchard: '#ff7eb6', nestegg: '#d9a520', scavenger: '#c08a4a' };
const WOOD = ['#5e3b1a', '#8b5a2b', '#b07a3e'];
export const LEAF = ['#2d6a26', '#3f8a32', '#62b04a'];

// Tower sprites are 24x26 with the bird at (4, 3); the tower's position is pixel (12, 21).
function post(g) {
  rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]); px(g, 8, 18, WOOD[2]); px(g, 15, 18, WOOD[2]);
  rect(g, 10, 20, 4, 5, WOOD[1]); rect(g, 13, 20, 1, 5, WOOD[0]); px(g, 11, 22, WOOD[0]);
  rect(g, 8, 25, 8, 1, 'rgba(0,0,0,0.25)');
}
const PROPS = {
  hawker: { back: post },
  quill: {
    back(g) {
      post(g);
      rect(g, 3, 9, 3, 7, '#7a4a2a'); px(g, 4, 10, '#a06a3a');
      for (const [x, y] of [[3, 5], [4, 4], [5, 6]]) { rect(g, x, y, 1, 5, '#f4f4ef'); px(g, x, y, '#8a93a3'); }
    },
  },
  bomber: {
    back: post,
    front(g) {
      rect(g, 15, 20, 8, 4, '#c8a165'); rect(g, 15, 23, 8, 1, '#8d6a3a');
      for (let x = 16; x < 23; x += 2) px(g, x, 21, '#8d6a3a');
      for (const [x, y] of [[16, 18], [18, 17], [20, 18]]) { rect(g, x, y, 2, 2, '#7b3fa0'); px(g, x, y, '#d39be8'); }
    },
  },
  lookout: {
    back(g) {
      rect(g, 2, 3, 1, 16, WOOD[0]); rect(g, 3, 3, 5, 3, '#f2c14e'); rect(g, 3, 5, 3, 1, '#d9a520');
      rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]);
      for (let y = 20; y < 26; y++) { px(g, 8, y, WOOD[1]); px(g, 16, y, WOOD[1]); if (y % 2) rect(g, 9, y, 7, 1, WOOD[0]); }
    },
  },
  shade: {
    back(g) {
      blob(g, 12, 7, 11, 6, LEAF);
      for (const x of [3, 20]) rect(g, x, 11, 1, 7, '#3c5a1e');
      rect(g, 6, 18, 13, 2, '#5a7a2e'); rect(g, 6, 19, 13, 1, '#3c5a1e'); rect(g, 11, 20, 2, 5, '#5a7a2e');
    },
  },
  orchard: {
    back(g) {
      blob(g, 12, 21, 10, 4, LEAF);
      for (const [x, y] of [[5, 20], [9, 23], [15, 22], [19, 20], [12, 19]]) { rect(g, x, y, 2, 2, '#d83a4a'); px(g, x, y, '#ff8a8a'); }
    },
  },
  nestegg: {
    back(g) { rect(g, 4, 15, 17, 2, WOOD[0]); },
    front(g) {
      rect(g, 17, 12, 4, 5, '#f2c14e'); rect(g, 18, 11, 2, 1, '#f2c14e'); px(g, 18, 12, '#fff1a8'); rect(g, 20, 13, 1, 4, '#c79a2a');
      rect(g, 3, 16, 19, 4, WOOD[1]); rect(g, 4, 20, 17, 1, WOOD[0]);
      for (let x = 4; x < 21; x += 3) { px(g, x, 16, WOOD[2]); px(g, x + 1, 18, WOOD[0]); }
    },
  },
  scavenger: {
    back: post,
    front(g) {
      blob(g, 19, 21, 3, 3, ['#8d6a3a', '#c8a165', '#e3c98f']);
      rect(g, 18, 17, 3, 1, '#5e3b1a'); px(g, 19, 21, '#4caf50'); px(g, 20, 22, '#4caf50'); px(g, 18, 22, '#3a8a40');
    },
  },
};

const layers = new Map();
// Back prop, bird and front prop as separate layers, so the bird can lunge without its perch.
export function towerLayers(kind, crowned, left) {
  const key = `${kind}${crowned}${left}`;
  if (!layers.has(key)) {
    const make = draw => {
      const c = canvas(24, 26);
      if (draw) draw(c.getContext('2d'));
      return left ? mirror(c) : c;
    };
    const props = PROPS[kind];
    layers.set(key, {
      back: make(props.back),
      bird: make(g => paint(g, BIRD, { ...BIRD_PAL, c: SCARF[kind], r: crowned ? '#e8462f' : BIRD_PAL.k }, 4, 3)),
      front: make(props.front),
    });
  }
  return layers.get(key);
}

const icons = new Map();
export function towerIcon(kind, crowned = false) {
  const key = kind + crowned;
  if (!icons.has(key)) {
    const c = canvas(24, 26), g = c.getContext('2d'), L = towerLayers(kind, crowned, false);
    for (const part of [L.back, L.bird, L.front]) g.drawImage(part, 0, 0);
    icons.set(key, c.toDataURL());
  }
  return icons.get(key);
}

// ---- Reptiles, facing right. 1 body, 2 dark, 3 belly/skin, 4 accent, e eye, w teeth.
const legs = (rows, alt) => [rows, rows.slice(0, rows.length - alt.length).concat(alt)];
const SHAPES = {
  lizard: legs([
    '............111.',
    '.....222222111e1',
    '4444111111111111',
    '....23333333111.',
    '.....2.....2....',
    '....22....22....',
  ], ['....2.....2.....', '.....22....22...']),
  biglizard: legs([
    '........2.2.2.2..1111.',
    '.......222222222111e11',
    '4444411111111111111111',
    '...444111111111133333.',
    '.......333333333......',
    '.......2......2.......',
    '......22.....22.......',
  ], ['........2......2......', '........22.....22.....']),
  turtle: legs([
    '....222222....',
    '...21141412...',
    '..2141111412..',
    '..21114411123e',
    '.2222222222233',
    '..3.......3...',
    '.33......33...',
  ], ['...3.......3..', '..33......33..']),
  bigturtle: legs([
    '......22222222......',
    '....221141141122....',
    '...21141111114112...',
    '..2111141141411112..',
    '..21411111111114123e',
    '.2222222222222222233',
    '...33.........33....',
    '..333.........333...',
  ], ['....33.........33...', '...333.........333..']),
  hatchling: legs([
    '..2222..',
    '.214412e',
    '.2222223',
    '.3...3..',
  ], ['..3...3.']),
  croc: legs([
    '.......2.2.2.2.2.2..2e....',
    '.....222222222222222111...',
    '44441111111111111111111111',
    '....1333333333333331w1w1w1',
    '......22.......22..1111111',
    '.....222......222.........',
  ], ['.......22.......22.1111111', '......222......222........']),
};
SHAPES.bigcroc = [...SHAPES.croc, 2];

const PALS = {
  anole: { 1: '#5fc23b', 2: '#2f7d2a', 3: '#b5ec7a', 4: '#5fc23b' },
  skink: { 1: '#8a6a3c', 2: '#5a4224', 3: '#d2b47f', 4: '#3f7fe0' },
  chameleon: { 1: '#8bd650', 2: '#4f9a2e', 3: '#d7f59a', 4: '#e2c341' },
  basilisk: { 1: '#3ea84a', 2: '#1f6e2c', 3: '#a7e08a', 4: '#2f8a3a' },
  iguana: { 1: '#7fa857', 2: '#46682e', 3: '#cfdc93', 4: '#56783a' },
  gila: { 1: '#e9846f', 2: '#2b1d1f', 3: '#f4c1a1', 4: '#2b1d1f' },
  garter: { 1: '#3d6b3a', 2: '#22401f', 3: '#e8d55a', 4: '#e8d55a' },
  hognose: { 1: '#b8894f', 2: '#6e4f2a', 3: '#e3cfa0', 4: '#6e4f2a' },
  rattle: { 1: '#c9a86a', 2: '#6b5232', 3: '#eadbb4', 4: '#6b5232' },
  ratsnake: { 1: '#3b3b3b', 2: '#1c1c1c', 3: '#d9d4c2', 4: '#5a5a5a', e: '#f0d040' },
  anaconda: { 1: '#556b2f', 2: '#2e3b18', 3: '#c8c27a', 4: '#1f2712', e: '#f0d040' },
  boxturtle: { 1: '#a8642c', 2: '#5a3416', 3: '#c99a5b', 4: '#e8b13a' },
  seaturtle: { 1: '#4f8f6a', 2: '#2c5c42', 3: '#9cc5a8', 4: '#a6d48a' },
  tortoise: { 1: '#8a7a5a', 2: '#4e4330', 3: '#9c8f72', 4: '#b8a77a' },
  croc: { 1: '#5a7f3c', 2: '#33502a', 3: '#c2c784', 4: '#5a7f3c', e: '#f0d040' },
  gator: { 1: '#3f4f3c', 2: '#1f2a1f', 3: '#a2a77e', 4: '#3f4f3c', e: '#f0c030' },
};

// Snakes are drawn from a sine wave so slithering frames and boss sizes come for free.
function snake(pal, len, th, amp, phase) {
  const hw = th + 2, c = canvas(len + hw + 1, th + 2 * amp + 2), g = c.getContext('2d');
  // about one and a half waves along the body, flattening out at the tail and neck
  const top = x => amp + 1 + Math.round(amp * Math.sin(Math.PI * x / len) * Math.sin(x * 9 / len + phase));
  for (let x = 0; x < len; x++) {
    const thick = Math.max(1, Math.min(th, Math.round(th * (x + 1) / (len * 0.4))));
    const y0 = top(x) + th - thick;
    for (let k = 0; k < thick; k++) px(g, x, y0 + k, pal[k === thick - 1 && thick > 1 ? 3 : k === 0 && x % 4 === 2 ? 4 : 1]);
  }
  const hy = top(len - 1) - 1;
  for (let y = 0; y <= th; y++) for (let x = 0; x < hw; x++) {
    if (x === hw - 1 && (y === 0 || y === th)) continue; // rounded snout
    px(g, len + x, hy + y, pal[y === th ? 3 : 1]);
  }
  px(g, len + hw - 2, hy + 1, pal.e);
  px(g, len + hw, hy + th, '#e0313b');
  return c;
}

const frames = new Map();
// Two walking frames per reptile, each facing right (r) and left (l).
export function reptileFrames(id) {
  if (!frames.has(id)) {
    const def = REPTILES[id], pal = { e: '#111111', w: '#f4f4ef', ...PALS[def.pal] };
    let right;
    if (def.sprite === 'snake') right = [0, Math.PI].map(p => snake(pal, 12, 2, 1, p));
    else if (def.sprite === 'bigsnake') right = [0, Math.PI].map(p => snake(pal, 36, 6, 3, p));
    else { const [a, b, k = 1] = SHAPES[def.sprite]; right = [a, b].map(rows => fromRows(rows, pal, k)); }
    frames.set(id, { r: right, l: right.map(mirror) });
  }
  return frames.get(id);
}

// ---- Scenery, drawn straight onto the map background at its base point (x, y).
const shadow = (g, x, y, w) => rect(g, x - w, y, w * 2, 2, 'rgba(0,0,0,0.2)');
export const DECOR = {
  tree(g, x, y) { shadow(g, x, y, 6); rect(g, x - 1, y - 6, 3, 7, '#6b4423'); px(g, x + 1, y - 5, '#4a2e17'); blob(g, x, y - 11, 7, 6, LEAF); },
  cypress(g, x, y) { shadow(g, x, y, 4); rect(g, x - 1, y - 5, 3, 6, '#5a3d22'); blob(g, x, y - 13, 4, 9, ['#22472a', '#2f6236', '#478447']); },
  bush(g, x, y) { shadow(g, x, y, 5); blob(g, x, y - 3, 5, 4, LEAF); px(g, x - 2, y - 4, '#d83a4a'); px(g, x + 2, y - 2, '#d83a4a'); },
  rock(g, x, y, th) { shadow(g, x, y, 5); blob(g, x, y - 2, 5, 3, th.rock); },
  flowers(g, x, y) {
    for (const [dx, dy, c] of [[0, 0, '#ffffff'], [3, 1, '#f2d33c'], [-3, 2, '#ff7eb6'], [1, 3, '#c48be0']]) { px(g, x + dx, y + dy, c); px(g, x + dx, y + dy + 1, '#3f8a32'); }
  },
  reeds(g, x, y) {
    for (const dx of [-2, 0, 2]) { const h = 9 - Math.abs(dx); rect(g, x + dx, y - h, 1, h, '#4c7a2e'); rect(g, x + dx, y - h - 2, 1, 3, '#6b4423'); }
  },
  log(g, x, y) { shadow(g, x, y, 7); rect(g, x - 6, y - 4, 12, 4, '#6b4423'); rect(g, x - 6, y - 4, 12, 1, '#8b5a2b'); rect(g, x + 5, y - 4, 2, 4, '#c8a165'); px(g, x + 5, y - 3, '#8b5a2b'); },
  cactus(g, x, y) {
    shadow(g, x, y, 4);
    for (const [ax, ay, w, h] of [[-1, -12, 3, 12], [-4, -8, 2, 4], [-2, -5, 1, 1], [3, -10, 2, 5], [2, -6, 1, 1]]) rect(g, x + ax, y + ay, w, h, '#3f8a32');
    rect(g, x - 1, y - 12, 1, 12, '#5aad3e');
  },
  bones(g, x, y) { rect(g, x - 1, y - 2, 3, 2, '#eeeadf'); px(g, x - 1, y - 1, '#4a3a2a'); px(g, x + 1, y - 1, '#4a3a2a'); rect(g, x + 3, y, 4, 1, '#eeeadf'); },
  palm(g, x, y) {
    shadow(g, x, y, 6);
    for (let i = 0; i < 13; i++) px(g, x + Math.round(Math.sin(i / 4)), y - i, i % 3 ? '#8b5a2b' : '#5e3b1a');
    for (const dir of [-1, 1]) for (let k = 1; k <= 7; k++) {
      px(g, x + dir * k, y - 13 + Math.round(k * k / 12), LEAF[1]);
      px(g, x + dir * k, y - 12 + Math.round(k * k / 12), LEAF[0]);
      if (k <= 4) px(g, x + dir * Math.round(k * 0.6), y - 13 - k + Math.round(k * k / 6), LEAF[2]);
    }
  },
  fern(g, x, y) { rect(g, x, y - 5, 1, 5, LEAF[0]); for (let k = 1; k < 5; k++) for (const dx of [-1, 1]) px(g, x + dx * k, y - 5 + Math.round(k * k / 4), LEAF[1 + (k % 2)]); },
};

// ---- Small UI icons
const ICONS = {
  berry: [['..g...', '...g..', '.pppp.', 'pqpppp', 'pppppp', '.pppp.'], { g: '#4caf50', p: '#8e44ad', q: '#d39be8' }],
  egg: [['.ww.', 'wwww', 'wnww', 'wwww', '.ww.'], { w: '#f4f1e6', n: '#a07850' }],
  feather: [['....w', '...wl', '..wwl', '..wl.', '.wwl.', '.wl..', 'wl...', 'k....'], { w: '#f4f4ef', l: '#c7cad3', k: '#3a3f4b' }],
};
export const iconURL = name => fromRows(...ICONS[name]).toDataURL();
