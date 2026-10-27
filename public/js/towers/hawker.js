import { post } from '../art.js';

// Hawker
export default {
  name: 'Hawker', role: 'attack', cost: 180, unlock: 0,
  desc: 'Darts out from its perch to peck nearby reptiles. Fast, short range.',
  base: { kind: 'peck', range: 42, rate: 0.7, dmg: 1, pierce: 1 },
  paths: [
    [{ name: 'Sharp Beak', cost: 140, desc: '+1 damage', fx: { dmg: 1 } },
     { name: 'Iron Beak', cost: 320, desc: 'Cracks shells, pecks 2 reptiles', fx: { cracks: true, pierce: 1 } },
     { name: 'Giant Slayer', cost: 1400, desc: '+4 damage, triple damage to big reptiles', fx: { dmg: 4, bigMul: 2 } }],
    [{ name: 'Quick Wings', cost: 120, desc: 'Attacks 25% faster', fx: { rate: 0.75 } },
     { name: 'Long Sally', cost: 240, desc: '+14 range, sees camouflage', fx: { range: 14, camo: true } },
     { name: 'Flurry', cost: 1500, desc: 'Attacks 2.5x faster, pecks 2 more', fx: { rate: 0.4, pierce: 2 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#ff9a2e',
  back: post,
};
