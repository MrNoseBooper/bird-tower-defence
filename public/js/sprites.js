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
const cache = new Map();
const cached = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

// A white copy of a sprite, flashed for a moment when it gets hit.
const whites = new WeakMap();
export function white(src) {
  if (!whites.has(src)) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    rect(g, 0, 0, c.width, c.height, '#ffffff');
    whites.set(src, c);
  }
  return whites.get(src);
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
// Wings raised behind the back: the attack pose.
const BIRD_FLAP = [
  '.ll.............',
  '.gll.....kkkk...',
  '.dgll...kkrrkk..',
  '..dggl..kkkkkek.',
  '...dgglkkkkkkkkk',
  '....dggdkkkkkww.',
  '.....dddccccwww.',
  '.....dddcddwwww.',
  '....dddddddwwww.',
  '....dddddddwwws.',
  '...ddddddddwwws.',
  '...kddddddwwwss.',
  ...BIRD.slice(12),
];
// 0 idle, 1 breathing in (head and body up a pixel, feet planted), 2 wings up
const POSES = [BIRD, [...BIRD.slice(1, 13), BIRD[12], ...BIRD.slice(13)], BIRD_FLAP];
const BIRD_PAL = { k: '#16161d', d: '#3c4250', g: '#5d6576', l: '#a3adbf', w: '#ffffff', s: '#cfd6e2', e: '#e9ecf2' };
const SCARF = { hawker: '#ff9a2e', quill: '#3da5ff', bomber: '#b25cff', lookout: '#ffcc33', shade: '#5fd04a', orchard: '#ff7eb6', nestegg: '#f2b520', scavenger: '#d9965a' };
const WOOD = ['#6e4420', '#a46b33', '#d29a55'];
export const LEAF = ['#3a8f3a', '#52b448', '#86dd66'];

// Tower sprites are 24x26 with the bird at (4, 3); the tower's position is pixel (12, 21).
// Props get a frame number (0 or 1) for their own small animations.
function post(g) {
  rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]); px(g, 8, 18, WOOD[2]); px(g, 15, 18, WOOD[2]);
  rect(g, 10, 20, 4, 5, WOOD[1]); rect(g, 13, 20, 1, 5, WOOD[0]); px(g, 11, 22, WOOD[0]);
  rect(g, 8, 25, 8, 1, 'rgba(0,0,0,0.2)');
}
const PROPS = {
  hawker: { back: post },
  quill: {
    back(g) {
      post(g);
      rect(g, 3, 9, 3, 7, '#8a5530'); px(g, 4, 10, '#b77a45');
      for (const [x, y] of [[3, 5], [4, 4], [5, 6]]) { rect(g, x, y, 1, 5, '#ffffff'); px(g, x, y, '#3da5ff'); }
    },
  },
  bomber: {
    back: post,
    front(g) {
      rect(g, 15, 20, 8, 4, '#e0b673'); rect(g, 15, 23, 8, 1, '#a07a45');
      for (let x = 16; x < 23; x += 2) px(g, x, 21, '#a07a45');
      for (const [x, y] of [[16, 18], [18, 17], [20, 18]]) { rect(g, x, y, 2, 2, '#9b45d6'); px(g, x, y, '#e6b8ff'); }
    },
  },
  lookout: {
    back(g, f) {
      rect(g, 2, 3, 1, 16, WOOD[0]);
      // the flag flutters: its tip droops on frame 1
      rect(g, 3, 3, f ? 4 : 5, 3, '#ffcc33'); rect(g, 3, 5, 3, 1, '#e8a317');
      if (f) rect(g, 7, 4, 1, 3, '#ffcc33');
      rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]);
      for (let y = 20; y < 26; y++) { px(g, 8, y, WOOD[1]); px(g, 16, y, WOOD[1]); if (y % 2) rect(g, 9, y, 7, 1, WOOD[0]); }
    },
  },
  shade: {
    back(g, f) {
      blob(g, 12, 7 - f, 11, 6, LEAF); // the canopy sways up and down a pixel
      for (const x of [3, 20]) rect(g, x, 11 - f, 1, 7 + f, '#3c6a1e');
      rect(g, 6, 18, 13, 2, '#6a8f34'); rect(g, 6, 19, 13, 1, '#466a22'); rect(g, 11, 20, 2, 5, '#6a8f34');
    },
  },
  orchard: {
    back(g, f) {
      blob(g, 12, 21, 10, 4, LEAF);
      for (const [x, y] of [[5, 20], [9, 23], [15, 22], [19, 20], [12, 19]]) { rect(g, x, y, 2, 2, '#ff3b4f'); px(g, x + f, y, '#ffb3bb'); }
    },
  },
  nestegg: {
    back(g) { rect(g, 4, 15, 17, 2, WOOD[0]); },
    front(g, f) {
      rect(g, 17, 12, 4, 5, '#ffcc33'); rect(g, 18, 11, 2, 1, '#ffcc33'); px(g, 18, 12, '#fff5b8'); rect(g, 20, 13, 1, 4, '#d9a21e');
      if (f) for (const [x, y] of [[22, 9], [21, 10], [23, 10], [22, 11], [22, 10]]) px(g, x, y, '#ffffff'); // glint
      rect(g, 3, 16, 19, 4, WOOD[1]); rect(g, 4, 20, 17, 1, WOOD[0]);
      for (let x = 4; x < 21; x += 3) { px(g, x, 16, WOOD[2]); px(g, x + 1, 18, WOOD[0]); }
    },
  },
  scavenger: {
    back: post,
    front(g) {
      blob(g, 19, 21, 3, 3, ['#a07a45', '#e0b673', '#f7dca0']);
      rect(g, 18, 17, 3, 1, '#6e4420'); px(g, 19, 21, '#4fd15f'); px(g, 20, 22, '#4fd15f'); px(g, 18, 22, '#36a845');
    },
  },
};

// Back prop, bird and front prop as separate layers, so the bird can move without its perch.
export function towerParts(kind, { crowned = false, left = false, pose = 0, blink = false, prop = 0 } = {}) {
  const layer = (key, draw) => cached(`${key}${left}`, () => {
    const c = canvas(24, 26);
    draw(c.getContext('2d'));
    return left ? mirror(c) : c;
  });
  const props = PROPS[kind];
  return {
    back: layer(`back${kind}${prop}`, g => props.back?.(g, prop)),
    bird: layer(`bird${kind}${crowned}${pose}${blink}`, g => paint(g, POSES[pose],
      { ...BIRD_PAL, c: SCARF[kind], r: crowned ? '#ff4a2e' : BIRD_PAL.k, e: blink ? BIRD_PAL.k : BIRD_PAL.e }, 4, 3)),
    front: layer(`front${kind}${prop}`, g => props.front?.(g, prop)),
  };
}

export function towerIcon(kind, crowned = false) {
  return cached(`icon${kind}${crowned}`, () => {
    const c = canvas(24, 26), g = c.getContext('2d'), L = towerParts(kind, { crowned });
    for (const part of [L.back, L.bird, L.front]) g.drawImage(part, 0, 0);
    return c.toDataURL();
  });
}

// ---- Reptiles, facing right. 1 body, 2 dark, 3 belly/skin, 4 accent, e eye, w teeth.
// frames: row replacements for each step of the walk cycle (legs apart, passing, apart the other way, passing),
// with the tail wagging up and down on the passing steps.
const SHAPES = {
  lizard: {
    rows: [
      '............111.',
      '.....222222111e1',
      '4444111111111111',
      '....23333333111.',
      '.....2.....2....',
      '....22....22....',
    ],
    frames: [{},
      { 1: '44...222222111e1', 2: '..44111111111111', 4: '.....2....2.....', 5: '.....2....2.....' },
      { 4: '....2.....2.....', 5: '.....22....22...' },
      { 2: '..44111111111111', 3: '44..23333333111.', 4: '.....2....2.....', 5: '.....2....2.....' }],
  },
  biglizard: {
    rows: [
      '........2.2.2.2..1111.',
      '.......222222222111e11',
      '4444411111111111111111',
      '...444111111111133333.',
      '.......333333333......',
      '.......2......2.......',
      '......22.....22.......',
    ],
    frames: [{},
      { 1: '44.....222222222111e11', 2: '..44411111111111111111', 6: '.......2......2.......' },
      { 5: '........2......2......', 6: '........22.....22.....' },
      { 2: '..44411111111111111111', 3: '44.444111111111133333.', 6: '.......2......2.......' }],
  },
  turtle: {
    rows: [
      '....222222....',
      '...21141412...',
      '..2141111412..',
      '..21114411123e',
      '.2222222222233',
      '..3.......3...',
      '.33......33...',
    ],
    frames: [{}, { 6: '..3.......3...' }, { 5: '...3.......3..', 6: '..33......33..' }, { 6: '..3.......3...' }],
  },
  bigturtle: {
    rows: [
      '......22222222......',
      '....221141141122....',
      '...21141111114112...',
      '..2111141141411112..',
      '..21411111111114123e',
      '.2222222222222222233',
      '...33.........33....',
      '..333.........333...',
    ],
    frames: [{}, { 7: '...33.........33....' }, { 6: '....33.........33...', 7: '...333.........333..' }, { 7: '...33.........33....' }],
  },
  hatchling: {
    rows: ['..2222..', '.214412e', '.2222223', '.3...3..'],
    frames: [{}, { 3: '..3...3.' }],
  },
  croc: {
    rows: [
      '.......2.2.2.2.2.2..2e....',
      '.....222222222222222111...',
      '44441111111111111111111111',
      '....1333333333333331w1w1w1',
      '......22.......22..1111111',
      '.....222......222.........',
    ],
    frames: [{},
      { 1: '44...222222222222222111...', 2: '..441111111111111111111111', 5: '......22.......22.........' },
      { 4: '.......22.......22.1111111', 5: '......222......222........' },
      { 2: '..441111111111111111111111', 3: '44..1333333333333331w1w1w1', 5: '......22.......22.........' }],
  },
};
SHAPES.bigcroc = { ...SHAPES.croc, k: 2 };

const PALS = {
  anole: { 1: '#6fe04a', 2: '#2f8f2a', 3: '#c8ff8a', 4: '#6fe04a' },
  skink: { 1: '#a8803f', 2: '#6a4b22', 3: '#f0d394', 4: '#3da5ff' },
  chameleon: { 1: '#9be65a', 2: '#56a830', 3: '#e2ffab', 4: '#ffd23f' },
  basilisk: { 1: '#3fcf5a', 2: '#1f8a34', 3: '#b4f5a0', 4: '#2fa847' },
  iguana: { 1: '#8fc45e', 2: '#4d7a30', 3: '#e0ee9e', 4: '#5f8c3c' },
  gila: { 1: '#ff8f6b', 2: '#3a2326', 3: '#ffd1b0', 4: '#3a2326' },
  garter: { 1: '#3f8a3a', 2: '#22501f', 3: '#ffe45c', 4: '#ffe45c' },
  hognose: { 1: '#d8a05c', 2: '#7f5a2c', 3: '#f6e2b4', 4: '#7f5a2c' },
  rattle: { 1: '#e2bf78', 2: '#7a5c34', 3: '#fff0c8', 4: '#7a5c34' },
  ratsnake: { 1: '#454552', 2: '#22222a', 3: '#e8e2cf', 4: '#6a6a78', e: '#ffd23f' },
  anaconda: { 1: '#6a8a34', 2: '#36481a', 3: '#e0d98a', 4: '#26300f', e: '#ffd23f' },
  boxturtle: { 1: '#c47432', 2: '#6a3c16', 3: '#e2b06a', 4: '#ffc93c' },
  seaturtle: { 1: '#4fb07a', 2: '#2c6e4c', 3: '#b0e0bf', 4: '#b8f09a' },
  tortoise: { 1: '#a8946a', 2: '#5e5038', 3: '#c0b08a', 4: '#d8c690' },
  croc: { 1: '#6a9a44', 2: '#3a5f2c', 3: '#d8dc94', 4: '#6a9a44', e: '#ffd23f' },
  gator: { 1: '#4a5f46', 2: '#243024', 3: '#b8bd90', 4: '#4a5f46', e: '#ffc030' },
};
export const bodyColor = id => PALS[REPTILES[id].pal][1];

// Snakes are drawn from a sine wave, so slither frames and boss sizes come for free.
function snake(pal, len, th, amp, phase, tongue) {
  const hw = th + 2, c = canvas(len + hw + 2, th + 2 * amp + 2), g = c.getContext('2d');
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
  if (tongue) for (const [x, y] of [[0, th - 1], [1, th - 2], [1, th]]) px(g, len + hw + x, hy + y, '#ff3b4f');
  return c;
}

// Walk-cycle frames for a reptile, facing right (r) and left (l); stride is the pixels walked per frame.
export function reptileFrames(id) {
  return cached(`reptile${id}`, () => {
    const def = REPTILES[id], pal = { e: '#111111', w: '#ffffff', ...PALS[def.pal] };
    let right;
    if (def.sprite === 'snake' || def.sprite === 'bigsnake') {
      const [len, th, amp] = def.sprite === 'snake' ? [12, 2, 1] : [36, 6, 3];
      right = [0, 1, 2, 3].map(i => snake(pal, len, th, amp, i * Math.PI / 2, i % 2 === 0));
    } else {
      const { rows, frames, k = 1 } = SHAPES[def.sprite];
      right = frames.map(swap => fromRows(rows.map((row, i) => swap[i] ?? row), pal, k));
    }
    return { r: right, l: right.map(mirror), stride: right[0].width / 6 };
  });
}

// ---- Scenery, drawn straight onto the map background at its base point (x, y).
const shadow = (g, x, y, w) => { rect(g, x - w, y, w * 2, 1, 'rgba(0,0,0,0.18)'); rect(g, x - w + 1, y + 1, w * 2 - 2, 1, 'rgba(0,0,0,0.12)'); };
export const DECOR = {
  tree(g, x, y) { shadow(g, x, y, 7); rect(g, x - 1, y - 6, 3, 7, '#7a4b26'); px(g, x + 1, y - 5, '#5a3418'); blob(g, x, y - 11, 7, 6, LEAF); px(g, x - 3, y - 14, '#b8f08a'); },
  cypress(g, x, y) { shadow(g, x, y, 5); rect(g, x - 1, y - 5, 3, 6, '#6a4424'); blob(g, x, y - 13, 4, 9, ['#2c6b3c', '#3f8f4f', '#62b56a']); },
  bush(g, x, y) { shadow(g, x, y, 6); blob(g, x, y - 3, 5, 4, LEAF); px(g, x - 2, y - 4, '#ff3b4f'); px(g, x + 2, y - 2, '#ff3b4f'); },
  rock(g, x, y, th) { shadow(g, x, y, 6); blob(g, x, y - 2, 5, 3, th.rock); },
  flowers(g, x, y) {
    for (const [dx, dy, c] of [[0, 0, '#ffffff'], [3, 1, '#ffe45c'], [-3, 2, '#ff8fb8'], [1, 3, '#c9a0ff']]) { px(g, x + dx, y + dy, c); px(g, x + dx, y + dy + 1, '#3a8f3a'); }
  },
  reeds(g, x, y) {
    for (const dx of [-2, 0, 2]) { const h = 9 - Math.abs(dx); rect(g, x + dx, y - h, 1, h, '#5a9a34'); rect(g, x + dx, y - h - 2, 1, 3, '#8a5530'); }
  },
  log(g, x, y) { shadow(g, x, y, 7); rect(g, x - 6, y - 4, 12, 4, '#7a4b26'); rect(g, x - 6, y - 4, 12, 1, '#a46b33'); rect(g, x + 5, y - 4, 2, 4, '#e0b673'); px(g, x + 5, y - 3, '#a46b33'); },
  cactus(g, x, y) {
    shadow(g, x, y, 4);
    for (const [ax, ay, w, h] of [[-1, -12, 3, 12], [-4, -8, 2, 4], [-2, -5, 1, 1], [3, -10, 2, 5], [2, -6, 1, 1]]) rect(g, x + ax, y + ay, w, h, '#3fa848');
    rect(g, x - 1, y - 12, 1, 12, '#6fd36a');
    px(g, x, y - 13, '#ff7eb6');
  },
  bones(g, x, y) { rect(g, x - 1, y - 2, 3, 2, '#fffbea'); px(g, x - 1, y - 1, '#5a4a3a'); px(g, x + 1, y - 1, '#5a4a3a'); rect(g, x + 3, y, 4, 1, '#fffbea'); },
  palm(g, x, y) {
    shadow(g, x, y, 7);
    for (let i = 0; i < 13; i++) px(g, x + Math.round(Math.sin(i / 4)), y - i, i % 3 ? '#a46b33' : '#6e4420');
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
  berry: [['..g...', '...g..', '.pppp.', 'pqpppp', 'pppppp', '.pppp.'], { g: '#4fd15f', p: '#9b45d6', q: '#e6b8ff' }],
  egg: [['..kk..', '.kwwk.', 'kwwwwk', 'kwnwwk', 'kwwwnk', '.kwwk.', '..kk..'], { w: '#fffbea', n: '#b08560', k: '#2a1c12' }],
  feather: [['....kk', '...kwk', '..kwlk', '..kwk.', '.kwlk.', '.kwk..', 'kwlk..', 'kkk...', 'k.....'], { w: '#ffffff', l: '#b9c6d8', k: '#2a1c12' }],
  cloud: [['.....wwww.......', '...wwwwwwww.ww..', '..wwwwwwwwwwwww.', '.wwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.ssssssssssssss.'], { w: '#ffffff', s: '#d3ecfb' }],
};
export const iconURL = name => fromRows(...ICONS[name]).toDataURL();
