import { rect, px, WOOD } from '../art.js';

// Lookout
export default {
  name: 'Lookout', role: 'support', cost: 400, unlock: 4,
  desc: 'Keeps watch from a tall post. Attack towers in its circle get +15% range.',
  base: { kind: 'lookout', aura: 55, rangeBuff: 0.15 },
  paths: [
    [{ name: 'Taller Post', cost: 200, desc: 'Bigger circle', fx: { aura: 15 } },
     { name: 'Eagle Eyes', cost: 450, desc: 'Towers in its circle see camouflage', fx: { camoBuff: true } },
     { name: 'Spotter', cost: 1800, desc: 'Reptiles in its circle take 30% more damage', fx: { spot: 0.3 } }],
    [{ name: 'Pep Talk', cost: 300, desc: 'Towers in its circle attack 15% faster', fx: { rateBuff: 0.15 } },
     { name: 'Crown Rally', cost: 800, desc: 'They attack 30% faster', fx: { rateBuff: 0.15 } },
     { name: "Tyrant's Call", cost: 2500, desc: 'They also deal +1 damage', fx: { dmgBuff: 1 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#ffcc33',
  back(g, f) {
    rect(g, 2, 3, 1, 16, WOOD[0]);
    // the flag flutters: its tip droops on frame 1
    rect(g, 3, 3, f ? 4 : 5, 3, '#ffcc33'); rect(g, 3, 5, 3, 1, '#e8a317');
    if (f) rect(g, 7, 4, 1, 3, '#ffcc33');
    rect(g, 6, 18, 13, 2, WOOD[1]); rect(g, 6, 19, 13, 1, WOOD[0]);
    for (let y = 20; y < 26; y++) { px(g, 8, y, WOOD[1]); px(g, 16, y, WOOD[1]); if (y % 2) rect(g, 9, y, 7, 1, WOOD[0]); }
  },
};
