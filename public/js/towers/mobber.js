import { rect, px, post, BIRD_PAL } from '../art.js';

// Mobber
export default {
  name: 'Mobber', role: 'attack', cost: 380, unlock: 32,
  desc: 'Calls in the flock: every few seconds kingbirds mob every reptile in its circle.',
  base: { kind: 'pulse', range: 34, rate: 1.8, dmg: 1 },
  paths: [
    [{ name: 'Bigger Flock', cost: 260, desc: '+1 damage', fx: { dmg: 1 } },
     { name: 'Iron Beaks', cost: 480, desc: 'Cracks shells, +1 damage', fx: { cracks: true, dmg: 1 } },
     { name: 'Murmuration', cost: 2600, desc: '+3 damage, bigger circle', fx: { dmg: 3, range: 12 } }],
    [{ name: 'Quick Calls', cost: 280, desc: 'Mobs 25% more often', fx: { rate: 0.75 } },
     { name: 'Wide Mob', cost: 500, desc: 'Bigger circle, sees camouflage', fx: { range: 10, camo: true } },
     { name: 'Endless Mob', cost: 2400, desc: 'Mobs 2.5x as often', fx: { rate: 0.4 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#ff6b6b',
  back(g, f) {
    post(g);
    // two young kingbirds riding along, bobbing
    for (const [x, y] of [[5, 15 + f], [19, 16 - f]]) { rect(g, x, y, 2, 1, BIRD_PAL.k); rect(g, x, y + 1, 2, 1, BIRD_PAL.w); px(g, x - 1, y + 1, BIRD_PAL.d); }
  },
};
