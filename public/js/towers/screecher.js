import { rect, px, post } from '../art.js';

// Screecher
export default {
  name: 'Screecher', role: 'attack', cost: 520, unlock: 105,
  desc: 'A piercing screech that leaps between 3 reptiles.',
  base: { kind: 'chain', range: 70, rate: 1.4, dmg: 2, chain: 3 },
  paths: [
    [{ name: 'Louder', cost: 380, desc: '+2 damage', fx: { dmg: 2 } },
     { name: 'Shatter Shriek', cost: 650, desc: 'Cracks shells, leaps to 1 more', fx: { cracks: true, chain: 1 } },
     { name: 'Thunder Call', cost: 2800, desc: '+6 damage, double damage to big reptiles', fx: { dmg: 6, bigMul: 1 } }],
    [{ name: 'Long Echo', cost: 420, desc: 'Leaps to 2 more reptiles', fx: { chain: 2 } },
     { name: 'Stunning Screech', cost: 750, desc: 'Stuns reptiles for a moment', fx: { stun: 0.35 } },
     { name: 'Storm Song', cost: 2600, desc: 'Screeches 2x as fast, leaps to 2 more', fx: { rate: 0.5, chain: 2 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#2ee6d6',
  back: post,
  front(g, f) {
    // sound waves coming off the beak, pulsing
    for (let k = 0; k <= f; k++) { const x = 20 + k * 2; px(g, x, 5, '#2ee6d6'); rect(g, x + 1, 6, 1, 3, '#2ee6d6'); px(g, x, 9, '#2ee6d6'); }
  },
};
