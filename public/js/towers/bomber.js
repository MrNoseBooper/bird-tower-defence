import { rect, px, post } from '../art.js';

// Berry Bomber
export default {
  name: 'Berry Bomber', role: 'attack', cost: 480, unlock: 15,
  desc: 'Lobs exploding berries that splash whole groups. Cracks shells.',
  base: { kind: 'bomb', range: 62, rate: 1.4, dmg: 1, splash: 16, cracks: true },
  paths: [
    [{ name: 'Big Berries', cost: 320, desc: 'Bigger splash', fx: { splash: 6 } },
     { name: 'Heavy Fruit', cost: 550, desc: '+2 damage', fx: { dmg: 2 } },
     { name: 'Melon Mortar', cost: 3000, desc: '+5 damage, huge splash', fx: { dmg: 5, splash: 10 } }],
    [{ name: 'Sticky Jam', cost: 350, desc: 'Splashed reptiles slow down', fx: { slow: 0.35 } },
     { name: 'Quick Toss', cost: 450, desc: 'Throws 30% faster, +10 range', fx: { rate: 0.7, range: 10 } },
     { name: 'Jam Storm', cost: 2500, desc: 'Throws 2x faster, stickier jam', fx: { rate: 0.5, slow: 0.2 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#b25cff',
  back: post,
  front(g) {
    rect(g, 15, 20, 8, 4, '#e0b673'); rect(g, 15, 23, 8, 1, '#a07a45');
    for (let x = 16; x < 23; x += 2) px(g, x, 21, '#a07a45');
    for (const [x, y] of [[16, 18], [18, 17], [20, 18]]) { rect(g, x, y, 2, 2, '#9b45d6'); px(g, x, y, '#e6b8ff'); }
  },
};
