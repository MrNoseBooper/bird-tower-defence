import { rect, blob, LEAF } from '../art.js';

// Shade Weaver
export default {
  name: 'Shade Weaver', role: 'support', cost: 350, unlock: 22,
  desc: 'Weaves a leafy canopy. Cold-blooded reptiles in its shade slow down and stop healing.',
  base: { kind: 'shade', aura: 40, slow: 0.25 },
  paths: [
    [{ name: 'Wide Canopy', cost: 220, desc: 'Bigger shade', fx: { aura: 12 } },
     { name: 'Deep Shade', cost: 450, desc: 'Slows 40%', fx: { slow: 0.15 } },
     { name: 'Cold Snap', cost: 1700, desc: 'Slows 60%, even bigger shade', fx: { slow: 0.2, aura: 10 } }],
    [{ name: 'Brambles', cost: 300, desc: 'Thorns deal 1 damage a second in the shade', fx: { thorns: 1 } },
     { name: 'Thick Brambles', cost: 650, desc: '3 damage a second', fx: { thorns: 2 } },
     { name: 'Thornwall', cost: 2200, desc: '8 damage a second, cracks shells', fx: { thorns: 5, cracks: true } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#5fd04a',
  back(g, f) {
    blob(g, 12, 7 - f, 11, 6, LEAF); // the canopy sways up and down a pixel
    for (const x of [3, 20]) rect(g, x, 11 - f, 1, 7 + f, '#3c6a1e');
    rect(g, 6, 18, 13, 2, '#6a8f34'); rect(g, 6, 19, 13, 1, '#466a22'); rect(g, 11, 20, 2, 5, '#6a8f34');
  },
};
