// Shared pixel-art helpers and colours, used by sprites.js and the files in towers/ and lizards/.
// No imports here, so tower and reptile files can use it without import loops.

export const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export const px = (g, x, y, c) => rect(g, x, y, 1, 1, c);

// Shaded oval: dark lower-right rim, light upper-left highlight.
export function blob(g, cx, cy, rx, ry, [dark, mid, light]) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const q = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (q > 1) continue;
    px(g, cx + x, cy + y, q > 0.55 && x + y > 0 ? dark : x + y < -(rx + ry) * 0.35 ? light : mid);
  }
}

export const WOOD = ['#6e4420', '#a46b33', '#d29a55'];
export const LEAF = ['#3a8f3a', '#52b448', '#86dd66'];
// k black, d slate, g wing grey, l wing edge, w white, s white shadow, e eye, m mouth
export const BIRD_PAL = { k: '#16161d', d: '#3c4250', g: '#5d6576', l: '#a3adbf', w: '#ffffff', s: '#cfd6e2', e: '#e9ecf2', m: '#e8506a' };

// Tower sprites are 24x26 with the bird at (4, 3); the tower's position is pixel (12, 21).
// The plain wooden perch most kingbirds sit on.
export function post(g) {
  rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]); px(g, 8, 18, WOOD[2]); px(g, 15, 18, WOOD[2]);
  rect(g, 10, 20, 4, 5, WOOD[1]); rect(g, 13, 20, 1, 5, WOOD[0]); px(g, 11, 22, WOOD[0]);
  rect(g, 8, 25, 8, 1, 'rgba(0,0,0,0.2)');
}
