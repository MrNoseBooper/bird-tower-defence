import { rect, px, post } from '../art.js';

// Quill Sniper
export default {
  name: 'Quill Sniper', role: 'attack', cost: 320, unlock: 0,
  desc: 'Fires quills at any reptile on the map. Slow, but cracks shells.',
  base: { kind: 'snipe', range: Infinity, rate: 1.6, dmg: 2, pierce: 1, cracks: true },
  paths: [
    [{ name: 'Steel Quills', cost: 300, desc: '+2 damage', fx: { dmg: 2 } },
     { name: 'Night Vision', cost: 420, desc: 'Sees camouflage, +2 damage', fx: { camo: true, dmg: 2 } },
     { name: 'Deadly Aim', cost: 2600, desc: '+14 damage, double damage to big reptiles', fx: { dmg: 14, bigMul: 1 } }],
    [{ name: 'Fast Draw', cost: 260, desc: 'Fires 30% faster', fx: { rate: 0.7 } },
     { name: 'Split Quill', cost: 600, desc: 'Each quill hits 2 more reptiles', fx: { pierce: 2 } },
     { name: 'Quill Storm', cost: 2400, desc: 'Fires 2.5x faster', fx: { rate: 0.4 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#3da5ff',
  back(g) {
    post(g);
    rect(g, 3, 9, 3, 7, '#8a5530'); px(g, 4, 10, '#b77a45');
    for (const [x, y] of [[3, 5], [4, 4], [5, 6]]) { rect(g, x, y, 1, 5, '#ffffff'); px(g, x, y, '#3da5ff'); }
  },
};
