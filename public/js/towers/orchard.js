import { rect, px, blob, LEAF } from '../art.js';

// Berry Orchard
export default {
  name: 'Berry Orchard', role: 'financial', cost: 500, unlock: 0,
  desc: 'Grows 80 berries during every round.',
  base: { kind: 'orchard', income: 80 },
  paths: [
    [{ name: 'Bigger Bushes', cost: 300, desc: '+40 berries a round', fx: { income: 40 } },
     { name: 'Berry Baskets', cost: 700, desc: '+80 berries a round', fx: { income: 80 } },
     { name: 'Golden Grove', cost: 3200, desc: '+320 berries a round', fx: { income: 320 } }],
    [{ name: 'Fruit Stand', cost: 400, desc: 'Everything costs 5% less', fx: { discount: 0.05 } },
     { name: 'Market', cost: 900, desc: 'Everything costs 10% less', fx: { discount: 0.05 } },
     { name: 'Trade Hub', cost: 2800, desc: '15% less, +150 berries a round', fx: { discount: 0.05, income: 150 } }],
  ],
  // looks: scarf colour, and props drawn behind (back) and in front of (front) the bird; f is the prop's animation frame
  scarf: '#ff7eb6',
  back(g, f) {
    blob(g, 12, 21, 10, 4, LEAF);
    for (const [x, y] of [[5, 20], [9, 23], [15, 22], [19, 20], [12, 19]]) { rect(g, x, y, 2, 2, '#ff3b4f'); px(g, x + f, y, '#ffb3bb'); }
  },
};
